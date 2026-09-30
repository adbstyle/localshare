import { Prisma } from '@prisma/client';
import { shownVisibilityWhere, visibleListingWhere } from '../access/access.where';
import { FilterListingsDto } from './dto';

export const DEFAULT_PAGE_SIZE = 30;

export const creatorSummary = { select: { id: true, firstName: true, lastName: true } } as const;
const imageOrder: Prisma.ListingImageOrderByWithRelationInput[] = [
  { isCover: 'desc' },
  { orderIndex: 'asc' },
];

/** Feed filters are ANDed onto the visibility rule, so no filter can widen it. */
export function listingFeedWhere(userId: string, filters: FilterListingsDto): Prisma.ListingWhereInput {
  const conditions: Prisma.ListingWhereInput[] = [visibleListingWhere(userId)];

  if (filters.myListings) conditions.push({ creatorId: userId });
  if (filters.bookmarked) conditions.push({ bookmarks: { some: { userId } } });
  if (filters.types?.length) conditions.push({ type: { in: filters.types } });
  if (filters.categories?.length) conditions.push({ category: { in: filters.categories } });
  if (filters.search) {
    conditions.push({
      OR: [
        { title: { contains: filters.search, mode: 'insensitive' } },
        { description: { contains: filters.search, mode: 'insensitive' } },
      ],
    });
  }

  return { AND: conditions };
}

export function listingCardInclude(userId: string) {
  return {
    creator: creatorSummary,
    images: { orderBy: imageOrder, take: 1 },
    bookmarks: { where: { userId }, select: { id: true } },
  } satisfies Prisma.ListingInclude;
}

export function listingDetailInclude(userId: string) {
  return {
    creator: {
      select: { id: true, firstName: true, lastName: true, email: true, homeAddress: true, phoneNumber: true },
    },
    images: { orderBy: imageOrder },
    visibility: {
      where: shownVisibilityWhere(userId),
      include: { community: { select: { id: true, name: true, parentId: true } } },
    },
    bookmarks: { where: { userId }, select: { id: true } },
  } satisfies Prisma.ListingInclude;
}

export function visibilityRows(communityIds: string[]): Prisma.ListingVisibilityCreateManyListingInput[] {
  return communityIds.map((communityId) => ({ communityId }));
}
