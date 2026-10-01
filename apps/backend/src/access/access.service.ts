import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { memberOfCommunity, memberOfGroup, visibleListingWhere } from './access.where';

// Guards for single resources. Rule everywhere: not visible to the user -> 404
// (existence stays hidden), visible but action not allowed -> 403.

export interface ShareTargets {
  communityIds: string[];
  groupIds: string[];
}

@Injectable()
export class AccessService {
  constructor(private prisma: PrismaService) {}

  async assertListingVisible(listingId: string, userId: string) {
    const listing = await this.prisma.listing.findFirst({
      where: { id: listingId, ...visibleListingWhere(userId) },
      select: { id: true, creatorId: true, type: true },
    });
    if (!listing) throw new NotFoundException('Listing not found');
    return listing;
  }

  async assertListingOwner(listingId: string, userId: string) {
    const listing = await this.assertListingVisible(listingId, userId);
    if (listing.creatorId !== userId) {
      throw new ForbiddenException('Only the creator can change this listing');
    }
    return listing;
  }

  async assertCommunityMember(communityId: string, userId: string) {
    const community = await this.prisma.community.findFirst({
      where: { id: communityId, ...memberOfCommunity(userId) },
      select: { id: true, ownerId: true, name: true },
    });
    if (!community) throw new NotFoundException('Community not found');
    return community;
  }

  async assertCommunityOwner(communityId: string, userId: string) {
    const community = await this.assertCommunityMember(communityId, userId);
    if (community.ownerId !== userId) {
      throw new ForbiddenException('Only the owner can do this');
    }
    return community;
  }

  async assertGroupMember(groupId: string, userId: string) {
    const group = await this.prisma.group.findFirst({
      where: { id: groupId, ...memberOfGroup(userId) },
      select: { id: true, ownerId: true, communityId: true },
    });
    if (!group) throw new NotFoundException('Group not found');
    return group;
  }

  async assertGroupOwner(groupId: string, userId: string) {
    const group = await this.assertGroupMember(groupId, userId);
    if (group.ownerId !== userId) {
      throw new ForbiddenException('Only the owner can do this');
    }
    return group;
  }

  /** Dedupes the ids; every target must be a community/group the user belongs to. */
  async assertShareTargets(
    userId: string,
    communityIds: string[] = [],
    groupIds: string[] = [],
  ): Promise<ShareTargets> {
    const targets = { communityIds: [...new Set(communityIds)], groupIds: [...new Set(groupIds)] };

    const [communityCount, groupCount] = await Promise.all([
      targets.communityIds.length > 0
        ? this.prisma.community.count({
            where: { id: { in: targets.communityIds }, ...memberOfCommunity(userId) },
          })
        : 0,
      targets.groupIds.length > 0
        ? this.prisma.group.count({ where: { id: { in: targets.groupIds }, ...memberOfGroup(userId) } })
        : 0,
    ]);

    if (communityCount !== targets.communityIds.length || groupCount !== targets.groupIds.length) {
      throw new ForbiddenException(
        'You can only share with communities and groups you are a member of',
      );
    }
    return targets;
  }
}
