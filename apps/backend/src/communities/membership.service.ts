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
import { revokeCommunityMembership } from './membership.cascade';

@Injectable()
export class MembershipService {
  constructor(
    private prisma: PrismaService,
    private access: AccessService,
  ) {}

  async joinCommunity(userId: string, inviteToken: string) {
    const community = await this.prisma.community.findUnique({
      where: { inviteToken, deletedAt: null },
      select: { id: true, name: true, description: true },
    });
    if (!community) throw new NotFoundException('Invalid or expired invite link');

    try {
      await this.prisma.communityMember.create({ data: { communityId: community.id, userId } });
    } catch (error) {
      if (!isUniqueViolation(error)) throw error;
      throw new ConflictException({
        message: 'You are already a member of this community',
        alreadyMember: true,
        name: community.name,
      });
    }

    return { message: 'Successfully joined community', community };
  }

  async leaveCommunity(userId: string, communityId: string) {
    const community = await this.access.assertCommunityMember(communityId, userId);
    if (community.ownerId === userId) {
      throw new ForbiddenException('Owner cannot leave community. Delete it instead.');
    }

    await this.prisma.$transaction((tx) => revokeCommunityMembership(tx, community, userId));
    return { message: 'Successfully left community' };
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
    if (!membership) throw new NotFoundException('Member not found in this community');

    await this.prisma.$transaction((tx) => revokeCommunityMembership(tx, community, memberId));
    return { message: 'Member removed successfully' };
  }
}
