import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';

@Injectable()
export class VisibilityService {
  constructor(private prisma: PrismaService) {}

  async canUserViewListing(userId: string, listingId: string): Promise<boolean> {
    // Query 1: Listing + Visibility in single query (Prisma Include)
    const listing = await this.prisma.listing.findUnique({
      where: { id: listingId, deletedAt: null },
      select: {
        creatorId: true,
        visibility: {
          select: { communityId: true, groupId: true },
        },
      },
    });

    if (!listing) return false;
    if (listing.creatorId === userId) return true;

    // Extract IDs (no DB call)
    const communityIds = listing.visibility
      .filter((v) => v.communityId)
      .map((v) => v.communityId!);
    const groupIds = listing.visibility
      .filter((v) => v.groupId)
      .map((v) => v.groupId!);

    // Early return if no visibility rules
    if (communityIds.length === 0 && groupIds.length === 0) return false;

    // Query 2+3: Parallel batch membership check
    const [communityMember, groupMember] = await Promise.all([
      communityIds.length > 0
        ? this.prisma.communityMember.findFirst({
            where: { userId, communityId: { in: communityIds } },
            select: { id: true },
          })
        : null,
      groupIds.length > 0
        ? this.prisma.groupMember.findFirst({
            where: { userId, groupId: { in: groupIds } },
            select: { id: true },
          })
        : null,
    ]);

    return !!communityMember || !!groupMember;
  }

  async getVisibleListingIds(userId: string): Promise<string[]> {
    // Get user's communities
    const communities = await this.prisma.communityMember.findMany({
      where: { userId },
      select: { communityId: true },
    });

    // Get user's groups
    const groups = await this.prisma.groupMember.findMany({
      where: { userId },
      select: { groupId: true },
    });

    // Get listings visible to user
    const visibleListings = await this.prisma.listingVisibility.findMany({
      where: {
        OR: [
          {
            communityId: {
              in: communities.map((c) => c.communityId),
            },
          },
          {
            groupId: {
              in: groups.map((g) => g.groupId),
            },
          },
        ],
      },
      select: { listingId: true },
    });

    // Get user's own listings
    const ownListings = await this.prisma.listing.findMany({
      where: {
        creatorId: userId,
        deletedAt: null,
      },
      select: { id: true },
    });

    const visibleIds = new Set([
      ...visibleListings.map((v) => v.listingId),
      ...ownListings.map((l) => l.id),
    ]);

    return Array.from(visibleIds);
  }

  async setVisibility(
    listingId: string,
    communityIds: string[],
    groupIds: string[],
  ): Promise<void> {
    // Delete existing visibility
    await this.prisma.listingVisibility.deleteMany({
      where: { listingId },
    });

    // Create new visibility records
    const visibilityData: Array<{
      listingId: string;
      visibilityType: 'COMMUNITY' | 'GROUP';
      communityId?: string;
      groupId?: string;
    }> = [];

    for (const communityId of communityIds || []) {
      visibilityData.push({
        listingId,
        visibilityType: 'COMMUNITY' as const,
        communityId,
      });
    }

    for (const groupId of groupIds || []) {
      visibilityData.push({
        listingId,
        visibilityType: 'GROUP' as const,
        groupId,
      });
    }

    if (visibilityData.length > 0) {
      await this.prisma.listingVisibility.createMany({
        data: visibilityData,
      });
    }
  }
}
