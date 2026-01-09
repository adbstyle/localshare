import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { randomUUID } from 'crypto';
import { PrismaService } from '../database/prisma.service';
import { CreateGroupDto, UpdateGroupDto } from './dto';

@Injectable()
export class GroupsService {
  constructor(private prisma: PrismaService) {}

  async create(userId: string, communityId: string, dto: CreateGroupDto) {
    // Verify user is member of community
    const membership = await this.prisma.communityMember.findUnique({
      where: {
        communityId_userId: {
          communityId,
          userId,
        },
      },
    });

    if (!membership) {
      throw new ForbiddenException(
        'You must be a community member to create a group',
      );
    }

    const group = await this.prisma.group.create({
      data: {
        communityId,
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
        community: {
          select: {
            id: true,
            name: true,
          },
        },
        _count: {
          select: {
            members: true,
          },
        },
      },
    });

    return group;
  }

  async findAllForUser(userId: string) {
    const groups = await this.prisma.group.findMany({
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
        community: {
          select: {
            id: true,
            name: true,
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

    return groups;
  }

  async findAllForCommunity(userId: string, communityId: string) {
    const groups = await this.prisma.group.findMany({
      where: {
        deletedAt: null,
        communityId,
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
        community: {
          select: {
            id: true,
            name: true,
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

    return groups;
  }

  async findOne(id: string, userId: string) {
    const group = await this.prisma.group.findUnique({
      where: { id, deletedAt: null },
      include: {
        owner: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        community: {
          select: {
            id: true,
            name: true,
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
            listingVisibility: true,
          },
        },
      },
    });

    if (!group) {
      throw new NotFoundException('Group not found');
    }

    // Check if user is member
    const isMember = group.members.some((m) => m.userId === userId);
    if (!isMember) {
      throw new ForbiddenException('You are not a member of this group');
    }

    return group;
  }

  async update(id: string, dto: UpdateGroupDto) {
    return this.prisma.group.update({
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
        community: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });
  }

  async delete(id: string) {
    // Soft delete group
    await this.prisma.group.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    // Hard delete memberships
    await this.prisma.groupMember.deleteMany({
      where: { groupId: id },
    });

    // Remove visibility for listings
    await this.prisma.listingVisibility.deleteMany({
      where: { groupId: id },
    });
  }

  async refreshInviteToken(id: string) {
    // Generate new UUID for invite token
    const newToken = randomUUID();

    const updated = await this.prisma.group.update({
      where: { id, deletedAt: null },
      data: { inviteToken: newToken },
      select: { inviteToken: true },
    });

    if (!updated) {
      throw new NotFoundException('Group not found');
    }

    return { inviteToken: updated.inviteToken };
  }

  async getPreviewByToken(token: string) {
    const group = await this.prisma.group.findUnique({
      where: {
        inviteToken: token,
        deletedAt: null,
      },
      select: {
        id: true,
        name: true,
        description: true,
        community: {
          select: {
            id: true,
            name: true,
          },
        },
        _count: {
          select: {
            members: true,
          },
        },
      },
    });

    if (!group) {
      throw new NotFoundException('Invalid or expired invite token');
    }

    return group;
  }

  async getMembers(groupId: string, userId: string) {
    // First verify the group exists and user is a member
    const group = await this.prisma.group.findUnique({
      where: { id: groupId, deletedAt: null },
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

    if (!group) {
      throw new NotFoundException('Group not found');
    }

    // Check if user is member
    if (group.members.length === 0) {
      throw new ForbiddenException('You are not a member of this group');
    }

    // Fetch all members with user details
    const members = await this.prisma.groupMember.findMany({
      where: {
        groupId,
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
      role: member.userId === group.ownerId ? 'owner' : 'member',
    }));

    // Sort owner first, preserve joinedAt order for rest
    return transformed.sort((a, b) => {
      if (a.role === 'owner') return -1;
      if (b.role === 'owner') return 1;
      return 0;
    });
  }
}
