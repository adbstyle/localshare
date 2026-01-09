import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { randomUUID } from 'crypto';
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
    const newToken = randomUUID();

    const updated = await this.prisma.community.update({
      where: { id, deletedAt: null },
      data: { inviteToken: newToken },
      select: { inviteToken: true },
    });

    if (!updated) {
      throw new NotFoundException('Community not found');
    }

    return { inviteToken: updated.inviteToken };
  }

  async getPreviewByToken(token: string) {
    const community = await this.prisma.community.findUnique({
      where: {
        inviteToken: token,
        deletedAt: null,
      },
      select: {
        id: true,
        name: true,
        description: true,
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
          },
        },
      },
    });

    if (!community) {
      throw new NotFoundException('Invalid or expired invite token');
    }

    return community;
  }

  async getMembers(communityId: string, userId: string) {
    // First verify the community exists and user is a member
    const community = await this.prisma.community.findUnique({
      where: { id: communityId, deletedAt: null },
      select: {
        id: true,
        ownerId: true,
        members: {
          where: {
            userId,
          },
        },
      },
    });

    if (!community) {
      throw new NotFoundException('Community not found');
    }

    // Check if user is member
    if (community.members.length === 0) {
      throw new ForbiddenException('You are not a member of this community');
    }

    // Fetch all members with user details
    const members = await this.prisma.communityMember.findMany({
      where: {
        communityId,
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
      orderBy: {
        joinedAt: 'desc',
      },
    });

    // Transform to flat structure with role
    const transformed = members.map((member) => ({
      id: member.user.id,
      firstName: member.user.firstName,
      lastName: member.user.lastName,
      email: member.user.email,
      joinedAt: member.joinedAt,
      role: member.userId === community.ownerId ? 'owner' : 'member',
    }));

    // Sort owner first, preserve joinedAt order for rest
    return transformed.sort((a, b) => {
      if (a.role === 'owner') return -1;
      if (b.role === 'owner') return 1;
      return 0;
    });
  }
}
