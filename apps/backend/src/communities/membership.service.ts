import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { AccessService } from '../access/access.service';
import { isUniqueViolation } from '../common/utils/prisma-errors';
import { revokeMembership } from './membership.cascade';

@Injectable()
export class MembershipService {
  constructor(
    private prisma: PrismaService,
    private access: AccessService,
  ) {}

  /** Joining a group also joins its community if the user is not a member yet. */
  async join(userId: string, inviteToken: string) {
    const community = await this.prisma.community.findFirst({
      where: { inviteToken, deletedAt: null, OR: [{ parentId: null }, { parent: { deletedAt: null } }] },
      select: { id: true, name: true, description: true, parent: { select: { id: true, name: true } } },
    });
    if (!community) throw new NotFoundException('Invalid or expired invite link');

    try {
      await this.prisma.$transaction([
        ...(community.parent
          ? [this.prisma.communityMember.createMany({
              data: [{ communityId: community.parent.id, userId }],
              skipDuplicates: true,
            })]
          : []),
        this.prisma.communityMember.create({ data: { communityId: community.id, userId } }),
      ]);
    } catch (error) {
      if (!isUniqueViolation(error)) throw error;
      throw new ConflictException({
        message: 'You are already a member',
        alreadyMember: true,
        name: community.name,
      });
    }

    return { message: 'Successfully joined', community };
  }

  async leave(userId: string, communityId: string) {
    const community = await this.access.assertCommunityMember(communityId, userId);
    if (community.ownerId === userId) {
      throw new ForbiddenException('Owner cannot leave. Delete it instead.');
    }

    await this.prisma.$transaction((tx) => revokeMembership(tx, community, userId));
    return { message: 'Successfully left' };
  }

  async removeMember(ownerId: string, communityId: string, memberId: string) {
    const community = await this.access.assertCommunityOwner(communityId, ownerId);
    if (memberId === ownerId) {
      throw new BadRequestException('Owner cannot remove themselves');
    }

    const membership = await this.prisma.communityMember.findUnique({
      where: { communityId_userId: { communityId, userId: memberId } },
      select: { id: true },
    });
    if (!membership) throw new NotFoundException('Member not found');

    await this.prisma.$transaction((tx) => revokeMembership(tx, community, memberId));
    return { message: 'Member removed successfully' };
  }
}
