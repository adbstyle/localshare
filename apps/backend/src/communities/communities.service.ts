import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { CreateCommunityDto, UpdateCommunityDto } from './dto';

@Injectable()
export class CommunitiesService {
  constructor(private prisma: PrismaService) {}

  async create(userId: string, dto: CreateCommunityDto) {
    const community = await this.prisma.community.create({
      data: {
        name: dto.name,
        description: dto.description,
        ownerId: userId,
        members: {
          create: {
            userId,
          },
        },
      },
      include: {
        owner: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        _count: {
          select: {
            members: true,
            groups: true,
            listingVisibility: true,
          },
        },
      },
    });

    return community;
  }

  async findAllForUser(userId: string) {
    const communities = await this.prisma.community.findMany({
      where: {
        deletedAt: null,
        members: {
          some: { userId },
        },
      },
      include: {
        owner: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        _count: {
          select: {
            members: true,
            listingVisibility: true,
          },
        },
      },
      orderBy: {
        name: 'asc',
      },
    });

    return communities;
  }

  async findOne(id: string, userId: string) {
    const community = await this.prisma.community.findUnique({
      where: { id, deletedAt: null },
      include: {
        owner: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        members: {
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
              },
            },
          },
          orderBy: {
            joinedAt: 'desc',
          },
        },
        _count: {
          select: {
            members: true,
            groups: true,
            listingVisibility: true,
          },
        },
      },
    });

    if (!community) {
      throw new NotFoundException('Community not found');
    }

    // Check if user is member
    const isMember = community.members.some((m) => m.userId === userId);
    if (!isMember) {
      throw new ForbiddenException('You are not a member of this community');
    }

    return community;
  }

  async update(id: string, dto: UpdateCommunityDto) {
    return this.prisma.community.update({
      where: { id, deletedAt: null },
      data: dto,
      include: {
        owner: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });
  }

  async delete(id: string) {
    // Soft delete community
    await this.prisma.community.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    // Hard delete memberships
    await this.prisma.communityMember.deleteMany({
      where: { communityId: id },
    });

    // Soft delete all groups in community
    await this.prisma.group.updateMany({
      where: { communityId: id },
      data: { deletedAt: new Date() },
    });

    // Hard delete group memberships
    const groups = await this.prisma.group.findMany({
      where: { communityId: id },
      select: { id: true },
    });

    await this.prisma.groupMember.deleteMany({
      where: {
        groupId: { in: groups.map((g) => g.id) },
      },
    });

    // Remove visibility for listings
    await this.prisma.listingVisibility.deleteMany({
      where: { communityId: id },
    });
  }

  async refreshInviteToken(id: string) {
    // Generate new UUID for invite token
    const community = await this.prisma.community.update({
      where: { id, deletedAt: null },
      data: {
        inviteToken: undefined, // Will trigger default gen_random_uuid()
      },
    });

    // Need to fetch again to get the new token
    const updated = await this.prisma.community.findUnique({
      where: { id },
      select: { inviteToken: true },
    });

    if (!updated) {
      throw new NotFoundException('Community not found');
    }

    return { inviteToken: updated.inviteToken };
  }
}
