import { Injectable, NotFoundException } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { PrismaService } from '../database/prisma.service';
import { AccessService } from '../access/access.service';
import { memberOfCommunity } from '../access/access.where';
import { communityViewer, memberRole } from '../access/permissions';
import { CreateCommunityDto, UpdateCommunityDto } from './dto';
import { softDeleteCommunity } from './membership.cascade';

const ownerSummary = { select: { id: true, firstName: true, lastName: true } } as const;

@Injectable()
export class CommunitiesService {
  constructor(
    private prisma: PrismaService,
    private access: AccessService,
  ) {}

  async create(userId: string, dto: CreateCommunityDto) {
    return this.prisma.community.create({
      data: {
        name: dto.name,
        description: dto.description,
        ownerId: userId,
        members: { create: { userId } },
      },
      include: {
        owner: ownerSummary,
        _count: { select: { members: true, groups: true, listingVisibility: true } },
      },
    });
  }

  async findAllForUser(userId: string) {
    const communities = await this.prisma.community.findMany({
      where: memberOfCommunity(userId),
      include: {
        owner: ownerSummary,
        _count: { select: { members: true, listingVisibility: true } },
      },
      orderBy: { name: 'asc' },
    });

    return communities.map((c) => ({ ...c, viewer: communityViewer(c, userId) }));
  }

  async findOne(id: string, userId: string) {
    const community = await this.prisma.community.findFirst({
      where: { id, ...memberOfCommunity(userId) },
      include: {
        owner: ownerSummary,
        _count: { select: { members: true, groups: true, listingVisibility: true } },
      },
    });
    if (!community) throw new NotFoundException('Community not found');

    return { ...community, viewer: communityViewer(community, userId) };
  }

  async update(id: string, userId: string, dto: UpdateCommunityDto) {
    await this.access.assertCommunityOwner(id, userId);
    return this.prisma.community.update({
      where: { id },
      data: dto,
      include: { owner: ownerSummary },
    });
  }

  async delete(id: string, userId: string) {
    await this.access.assertCommunityOwner(id, userId);
    await softDeleteCommunity(this.prisma, id);
  }

  async refreshInviteToken(id: string, userId: string) {
    await this.access.assertCommunityOwner(id, userId);
    return this.prisma.community.update({
      where: { id },
      data: { inviteToken: randomUUID() },
      select: { inviteToken: true },
    });
  }

  async getPreviewByToken(token: string) {
    const community = await this.prisma.community.findUnique({
      where: { inviteToken: token, deletedAt: null },
      select: {
        id: true,
        name: true,
        description: true,
        owner: ownerSummary,
        _count: { select: { members: true } },
      },
    });
    if (!community) throw new NotFoundException('Invalid or expired invite token');

    return community;
  }

  async getMembers(communityId: string, userId: string) {
    const community = await this.access.assertCommunityMember(communityId, userId);
    const members = await this.prisma.communityMember.findMany({
      where: { communityId },
      include: { user: { select: { id: true, firstName: true, lastName: true, email: true } } },
      orderBy: { joinedAt: 'desc' },
    });

    const flat = members.map(({ user, joinedAt }) => ({
      ...user,
      joinedAt,
      role: memberRole(community, user.id),
    }));
    // Owner first, the rest keeps the newest-first order
    return [...flat.filter((m) => m.role === 'owner'), ...flat.filter((m) => m.role !== 'owner')];
  }
}
