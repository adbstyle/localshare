import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';

@Injectable()
export class GroupMembershipService {
  constructor(private prisma: PrismaService) {}

  async joinGroup(userId: string, inviteToken: string) {
    if (!inviteToken) {
      throw new BadRequestException('Invite token is required');
    }

    const group = await this.prisma.group.findFirst({
      where: {
        inviteToken,
        deletedAt: null,
      },
      include: {
        community: true,
      },
    });

    if (!group) {
      throw new NotFoundException('Invalid or expired invite link');
    }

    // Check if already a member
    const existingGroupMember = await this.prisma.groupMember.findUnique({
      where: {
        groupId_userId: {
          groupId: group.id,
          userId,
        },
      },
    });

    if (existingGroupMember) {
      throw new BadRequestException('You are already a member of this group');
    }

    // Auto-join parent community if not a member
    const existingCommunityMember = await this.prisma.communityMember.findUnique(
      {
        where: {
          communityId_userId: {
            communityId: group.communityId,
            userId,
          },
        },
      },
    );

    if (!existingCommunityMember) {
      await this.prisma.communityMember.create({
        data: {
          communityId: group.communityId,
          userId,
        },
      });
    }

    // Join group
    await this.prisma.groupMember.create({
      data: {
        groupId: group.id,
        userId,
      },
    });

    return {
      message: 'Successfully joined group',
      group: {
        id: group.id,
        name: group.name,
        description: group.description,
      },
      community: {
        id: group.community.id,
        name: group.community.name,
      },
    };
  }

  async leaveGroup(userId: string, groupId: string) {
    const group = await this.prisma.group.findUnique({
      where: { id: groupId, deletedAt: null },
    });

    if (!group) {
      throw new NotFoundException('Group not found');
    }

    if (group.ownerId === userId) {
      throw new ForbiddenException('Owner cannot leave group. Delete it instead.');
    }

    // Check if member
    const membership = await this.prisma.groupMember.findUnique({
      where: {
        groupId_userId: {
          groupId,
          userId,
        },
      },
    });

    if (!membership) {
      throw new BadRequestException('You are not a member of this group');
    }

    // Remove from group
    await this.prisma.groupMember.delete({
      where: {
        groupId_userId: {
          groupId,
          userId,
        },
      },
    });

    // Hide user's listings from this group
    await this.prisma.listingVisibility.deleteMany({
      where: {
        groupId,
        listing: { creatorId: userId },
      },
    });

    return { message: 'Successfully left group' };
  }

  async removeMember(ownerId: string, groupId: string, memberToRemoveId: string) {
    const group = await this.prisma.group.findUnique({
      where: { id: groupId, deletedAt: null },
    });

    if (!group) {
      throw new NotFoundException('Group not found');
    }

    if (group.ownerId !== ownerId) {
      throw new ForbiddenException('Only the owner can remove members');
    }

    if (memberToRemoveId === ownerId) {
      throw new BadRequestException('Owner cannot remove themselves');
    }

    const membership = await this.prisma.groupMember.findUnique({
      where: {
        groupId_userId: {
          groupId,
          userId: memberToRemoveId,
        },
      },
    });

    if (!membership) {
      throw new NotFoundException('Member not found in this group');
    }

    // Remove from group
    await this.prisma.groupMember.delete({
      where: {
        groupId_userId: {
          groupId,
          userId: memberToRemoveId,
        },
      },
    });

    // Hide member's listings from this group
    await this.prisma.listingVisibility.deleteMany({
      where: {
        groupId,
        listing: { creatorId: memberToRemoveId },
      },
    });

    return { message: 'Member removed successfully' };
  }
}
