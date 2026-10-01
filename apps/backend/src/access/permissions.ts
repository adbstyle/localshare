// What the current user may do with a resource. Returned as `viewer` with every
// response so the frontend never re-derives rules from ids.

export interface ListingViewer {
  isOwner: boolean;
  canEdit: boolean;
  canBookmark: boolean;
}

export type CommunityRole = 'owner' | 'member';

export interface CommunityViewer {
  role: CommunityRole;
  canEdit: boolean;
  canDelete: boolean;
  canManageMembers: boolean;
  canLeave: boolean;
}

export function listingViewer(listing: { creatorId: string }, userId: string): ListingViewer {
  const isOwner = listing.creatorId === userId;
  return { isOwner, canEdit: isOwner, canBookmark: !isOwner };
}

/** Same rules for communities and groups. */
export function communityViewer(community: { ownerId: string }, userId: string): CommunityViewer {
  const role = memberRole(community, userId);
  const isOwner = role === 'owner';
  return {
    role,
    canEdit: isOwner,
    canDelete: isOwner,
    canManageMembers: isOwner,
    canLeave: !isOwner,
  };
}

export function memberRole(community: { ownerId: string }, userId: string): CommunityRole {
  return community.ownerId === userId ? 'owner' : 'member';
}
