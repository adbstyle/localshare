import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class OwnershipGuard implements CanActivate {
  constructor(private prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;
    const resourceId = request.params.id;
    const resourceType = this.getResourceType(request.route.path);

    if (!user || !resourceId) {
      throw new ForbiddenException('Unauthorized access');
    }

    const isOwner = await this.checkOwnership(
      user.id,
      resourceId,
      resourceType,
    );

    if (!isOwner) {
      throw new ForbiddenException(
        'You do not have permission to modify this resource',
      );
    }

    return true;
  }

  private getResourceType(path: string): 'community' | 'group' | 'listing' {
    if (path.includes('/communities/')) return 'community';
    if (path.includes('/groups/')) return 'group';
    if (path.includes('/listings/')) return 'listing';
    throw new Error('Unknown resource type');
  }

  private async checkOwnership(
    userId: string,
    resourceId: string,
    type: string,
  ): Promise<boolean> {
    try {
      switch (type) {
        case 'community':
          const community = await this.prisma.community.findUnique({
            where: { id: resourceId, deletedAt: null },
            select: { ownerId: true },
          });
          if (!community) throw new NotFoundException('Community not found');
          return community.ownerId === userId;

        case 'group':
          const group = await this.prisma.group.findUnique({
            where: { id: resourceId, deletedAt: null },
            select: { ownerId: true },
          });
          if (!group) throw new NotFoundException('Group not found');
          return group.ownerId === userId;

        case 'listing':
          const listing = await this.prisma.listing.findUnique({
            where: { id: resourceId, deletedAt: null },
            select: { creatorId: true },
          });
          if (!listing) throw new NotFoundException('Listing not found');
          return listing.creatorId === userId;

        default:
          return false;
      }
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      return false;
    }
  }
}
