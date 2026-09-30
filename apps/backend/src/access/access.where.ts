import { Prisma } from '@prisma/client';

// Single source of truth for "who sees what". Pure Prisma where fragments so
// every read can apply the rule inside its own query instead of re-checking.

export function memberOfCommunity(userId: string): Prisma.CommunityWhereInput {
  return { deletedAt: null, members: { some: { userId } } };
}

export function memberOfGroup(userId: string): Prisma.GroupWhereInput {
  return { deletedAt: null, members: { some: { userId } } };
}

/** Visibility entries pointing at a community or group the user belongs to. */
export function sharedWithUser(userId: string): Prisma.ListingVisibilityWhereInput {
  return {
    OR: [{ community: memberOfCommunity(userId) }, { group: memberOfGroup(userId) }],
  };
}

/** Listings the user may see: own ones plus those shared with one of their memberships. */
export function visibleListingWhere(userId: string): Prisma.ListingWhereInput {
  return {
    deletedAt: null,
    OR: [{ creatorId: userId }, { visibility: { some: sharedWithUser(userId) } }],
  };
}

/** Entries of "shared with" a viewer may see: all for the creator, own memberships for others. */
export function shownVisibilityWhere(userId: string): Prisma.ListingVisibilityWhereInput {
  return { OR: [{ listing: { creatorId: userId } }, sharedWithUser(userId)] };
}
