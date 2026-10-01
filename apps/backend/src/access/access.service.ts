import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { memberOfCommunity, visibleListingWhere } from './access.where';

// Guards for single resources. Rule everywhere: not visible to the user -> 404
// (existence stays hidden), visible but action not allowed -> 403.

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
      select: { id: true, ownerId: true, name: true, parentId: true },
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

  /** Dedupes the ids; every target must be a community or group the user belongs to. */
  async assertShareTargets(userId: string, communityIds: string[] = []): Promise<string[]> {
    const ids = [...new Set(communityIds)];
    if (ids.length === 0) return ids;

    const count = await this.prisma.community.count({ where: { id: { in: ids }, ...memberOfCommunity(userId) } });
    if (count !== ids.length) {
      throw new ForbiddenException('You can only share with communities and groups you are a member of');
    }
    return ids;
  }
}
