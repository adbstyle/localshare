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
import { revokeGroupMembership } from '../communities/membership.cascade';

@Injectable()
export class GroupMembershipService {
  constructor(
    private prisma: PrismaService,
    private access: AccessService,
  ) {}

  /** Joining a group also joins its community if the user is not a member yet. */
  async joinGroup(userId: string, inviteToken: string) {
    const group = await this.prisma.group.findFirst({
      where: { inviteToken, deletedAt: null, community: { deletedAt: null } },
      select: { id: true, name: true, description: true, community: { select: { id: true, name: true } } },
    });
    if (!group) throw new NotFoundException('Invalid or expired invite link');

    try {
      await this.prisma.$transaction([
        this.prisma.communityMember.createMany({
          data: [{ communityId: group.community.id, userId }],
          skipDuplicates: true,
        }),
        this.prisma.groupMember.create({ data: { groupId: group.id, userId } }),
      ]);
    } catch (error) {
      if (!isUniqueViolation(error)) throw error;
      throw new ConflictException({
        message: 'You are already a member of this group',
        alreadyMember: true,
        name: group.name,
      });
    }

    const { community, ...joined } = group;
    return { message: 'Successfully joined group', group: joined, community };
  }

  async leaveGroup(userId: string, groupId: string) {
    const group = await this.access.assertGroupMember(groupId, userId);
    if (group.ownerId === userId) {
      throw new ForbiddenException('Owner cannot leave group. Delete it instead.');
    }

    await this.prisma.$transaction((tx) => revokeGroupMembership(tx, groupId, userId));
    return { message: 'Successfully left group' };
  }

  async removeMember(ownerId: string, groupId: string, memberId: string) {
    await this.access.assertGroupOwner(groupId, ownerId);
    if (memberId === ownerId) {
      throw new BadRequestException('Owner cannot remove themselves');
    }

    const membership = await this.prisma.groupMember.findUnique({
      where: { groupId_userId: { groupId, userId: memberId } },
      select: { id: true },
    });
    if (!membership) throw new NotFoundException('Member not found in this group');

    await this.prisma.$transaction((tx) => revokeGroupMembership(tx, groupId, memberId));
    return { message: 'Member removed successfully' };
  }
}
