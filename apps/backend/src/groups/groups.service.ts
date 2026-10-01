import { Injectable, NotFoundException } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { PrismaService } from '../database/prisma.service';
import { AccessService } from '../access/access.service';
import { memberOfGroup } from '../access/access.where';
import { communityViewer, memberRole } from '../access/permissions';
import { softDeleteGroup } from '../communities/membership.cascade';
import { CreateGroupDto, UpdateGroupDto } from './dto';

const ownerSummary = { select: { id: true, firstName: true, lastName: true } } as const;
const communitySummary = { select: { id: true, name: true } } as const;

@Injectable()
export class GroupsService {
  constructor(
    private prisma: PrismaService,
    private access: AccessService,
  ) {}

  async create(userId: string, dto: CreateGroupDto) {
    await this.access.assertCommunityMember(dto.communityId, userId);

    return this.prisma.group.create({
      data: {
        communityId: dto.communityId,
        name: dto.name,
        description: dto.description,
        ownerId: userId,
        members: { create: { userId } },
      },
      include: {
        owner: ownerSummary,
        community: communitySummary,
        _count: { select: { members: true } },
      },
    });
  }

  /** The user's groups, optionally limited to one community. */
  async findAllForUser(userId: string, communityId?: string) {
    const groups = await this.prisma.group.findMany({
      where: { ...memberOfGroup(userId), communityId },
      include: {
        owner: ownerSummary,
        community: communitySummary,
        _count: { select: { members: true, listingVisibility: true } },
      },
      orderBy: { name: 'asc' },
    });

    return groups.map((g) => ({ ...g, viewer: communityViewer(g, userId) }));
  }

  async findOne(id: string, userId: string) {
    const group = await this.prisma.group.findFirst({
      where: { id, ...memberOfGroup(userId) },
      include: {
        owner: ownerSummary,
        community: communitySummary,
        _count: { select: { members: true, listingVisibility: true } },
      },
    });
    if (!group) throw new NotFoundException('Group not found');

    return { ...group, viewer: communityViewer(group, userId) };
  }

  async update(id: string, userId: string, dto: UpdateGroupDto) {
    await this.access.assertGroupOwner(id, userId);
    return this.prisma.group.update({
      where: { id },
      data: dto,
      include: { owner: ownerSummary, community: communitySummary },
    });
  }

  async delete(id: string, userId: string) {
    await this.access.assertGroupOwner(id, userId);
    await softDeleteGroup(this.prisma, id);
  }

  async refreshInviteToken(id: string, userId: string) {
    await this.access.assertGroupOwner(id, userId);
    return this.prisma.group.update({
      where: { id },
      data: { inviteToken: randomUUID() },
      select: { inviteToken: true },
    });
  }

  async getPreviewByToken(token: string) {
    const group = await this.prisma.group.findUnique({
      where: { inviteToken: token, deletedAt: null },
      select: {
        id: true,
        name: true,
        description: true,
        community: communitySummary,
        _count: { select: { members: true } },
      },
    });
    if (!group) throw new NotFoundException('Invalid or expired invite token');

    return group;
  }

  async getMembers(groupId: string, userId: string) {
    const group = await this.access.assertGroupMember(groupId, userId);
    const members = await this.prisma.groupMember.findMany({
      where: { groupId },
      include: { user: { select: { id: true, firstName: true, lastName: true, email: true } } },
      orderBy: { joinedAt: 'desc' },
    });

    const flat = members.map(({ user, joinedAt }) => ({
      ...user,
      joinedAt,
      role: memberRole(group, user.id),
    }));
    // Owner first, the rest keeps the newest-first order
    return [...flat.filter((m) => m.role === 'owner'), ...flat.filter((m) => m.role !== 'owner')];
  }
}
