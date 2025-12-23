import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
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
    await this.prisma.group.update({
      where: { id, deletedAt: null },
      data: {
        inviteToken: undefined, // Will trigger default gen_random_uuid()
      },
    });

    // Need to fetch again to get the new token
    const updated = await this.prisma.group.findUnique({
      where: { id },
      select: { inviteToken: true },
    });

    if (!updated) {
      throw new NotFoundException('Group not found');
    }

    return { inviteToken: updated.inviteToken };
  }
}
