import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';

@Injectable()
export class MembershipService {
  constructor(private prisma: PrismaService) {}

  async joinCommunity(userId: string, inviteToken: string) {
    if (!inviteToken) {
      throw new BadRequestException('Invite token is required');
    }

    const community = await this.prisma.community.findFirst({
      where: {
        inviteToken,
        deletedAt: null,
      },
    });

    if (!community) {
      throw new NotFoundException('Invalid or expired invite link');
    }

    // Check if already a member
    const existingMember = await this.prisma.communityMember.findUnique({
      where: {
        communityId_userId: {
          communityId: community.id,
          userId,
        },
      },
    });

    if (existingMember) {
      throw new BadRequestException('You are already a member of this community');
    }

    await this.prisma.communityMember.create({
      data: {
        communityId: community.id,
        userId,
      },
    });

    return {
      message: 'Successfully joined community',
      community: {
        id: community.id,
        name: community.name,
        description: community.description,
      },
    };
  }

  async leaveCommunity(userId: string, communityId: string) {
    const community = await this.prisma.community.findUnique({
      where: { id: communityId, deletedAt: null },
    });

    if (!community) {
      throw new NotFoundException('Community not found');
    }

    if (community.ownerId === userId) {
      throw new ForbiddenException(
        'Owner cannot leave community. Delete it instead.',
      );
    }

    // Check if member
    const membership = await this.prisma.communityMember.findUnique({
      where: {
        communityId_userId: {
          communityId,
          userId,
        },
      },
    });

    if (!membership) {
      throw new BadRequestException('You are not a member of this community');
    }

    // Remove from community
    await this.prisma.communityMember.delete({
      where: {
        communityId_userId: {
          communityId,
          userId,
        },
      },
    });

    // Remove from all groups in community
    const groups = await this.prisma.group.findMany({
      where: { communityId, deletedAt: null },
      select: { id: true },
    });

    await this.prisma.groupMember.deleteMany({
      where: {
        userId,
        groupId: { in: groups.map((g) => g.id) },
      },
    });

    // Hide user's listings from this community
    await this.prisma.listingVisibility.deleteMany({
      where: {
        communityId,
        listing: { creatorId: userId },
      },
    });

    return { message: 'Successfully left community' };
  }

  async removeMember(ownerId: string, communityId: string, memberToRemoveId: string) {
    const community = await this.prisma.community.findUnique({
      where: { id: communityId, deletedAt: null },
    });

    if (!community) {
      throw new NotFoundException('Community not found');
    }

    if (community.ownerId !== ownerId) {
      throw new ForbiddenException('Only the owner can remove members');
    }

    if (memberToRemoveId === ownerId) {
      throw new BadRequestException('Owner cannot remove themselves');
    }

    const membership = await this.prisma.communityMember.findUnique({
      where: {
        communityId_userId: {
          communityId,
          userId: memberToRemoveId,
        },
      },
    });

    if (!membership) {
      throw new NotFoundException('Member not found in this community');
    }

    // Remove from community
    await this.prisma.communityMember.delete({
      where: {
        communityId_userId: {
          communityId,
          userId: memberToRemoveId,
        },
      },
    });

    // Remove from all groups in community
    const groups = await this.prisma.group.findMany({
      where: { communityId, deletedAt: null },
      select: { id: true },
    });

    await this.prisma.groupMember.deleteMany({
      where: {
        userId: memberToRemoveId,
        groupId: { in: groups.map((g) => g.id) },
      },
    });

    // Hide member's listings from this community
    await this.prisma.listingVisibility.deleteMany({
      where: {
        communityId,
        listing: { creatorId: memberToRemoveId },
      },
    });

    return { message: 'Member removed successfully' };
  }
}
