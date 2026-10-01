// Enums
export enum SsoProvider {
  GOOGLE = 'GOOGLE',
  MICROSOFT = 'MICROSOFT',
}

export enum ListingType {
  SELL = 'SELL',
  RENT = 'RENT',
  LEND = 'LEND',
  SEARCH = 'SEARCH',
}

export enum ListingCategory {
  ELECTRONICS = 'ELECTRONICS',
  FURNITURE = 'FURNITURE',
  SPORTS = 'SPORTS',
  CLOTHING = 'CLOTHING',
  HOUSEHOLD = 'HOUSEHOLD',
  GARDEN = 'GARDEN',
  BOOKS = 'BOOKS',
  TOYS = 'TOYS',
  TOOLS = 'TOOLS',
  FOOD = 'FOOD',
  SERVICES = 'SERVICES',
  VEHICLES = 'VEHICLES',
  OTHER = 'OTHER',
}

export enum PriceTimeUnit {
  HOUR = 'HOUR',
  DAY = 'DAY',
  WEEK = 'WEEK',
  MONTH = 'MONTH',
}

// User Types
export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  homeAddress: string | null;
  phoneNumber: string | null;
  preferredLanguage: string;
  createdAt: string;
  updatedAt: string;
}

export interface UpdateUserDto {
  firstName?: string;
  lastName?: string;
  homeAddress?: string | null;
  phoneNumber?: string | null;
  preferredLanguage?: string;
}

// What the current user may do with a resource. Computed by the backend
// (apps/backend/src/access/permissions.ts); never re-derive it from ids.
export interface CommunityViewer {
  role: 'owner' | 'member';
  canEdit: boolean;
  canDelete: boolean;
  canManageMembers: boolean;
  canLeave: boolean;
}

export interface ListingViewer {
  isOwner: boolean;
  canEdit: boolean;
  canBookmark: boolean;
}

// Community Types. A group is a community with a parent (one level deep).
export interface Community {
  id: string;
  name: string;
  description: string | null;
  ownerId: string;
  parentId: string | null;
  parent: { id: string; name: string } | null;
  owner: {
    firstName: string;
    lastName: string;
  };
  inviteToken: string;
  createdAt: string;
  _count: {
    members: number;
    sharedListings: number;
  };
  viewer: CommunityViewer;
}

export interface CommunityMember {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  joinedAt: string;
  role: 'owner' | 'member';
}

export interface CommunityPreview {
  id: string;
  name: string;
  description: string | null;
  parent: { id: string; name: string } | null;
  _count: { members: number };
}

export interface CreateCommunityDto {
  name: string;
  description?: string;
  /** Set to create a group inside this community. */
  parentId?: string;
}

export interface UpdateCommunityDto {
  name?: string;
  description?: string;
}

// Listing Types
export interface ListingImage {
  id: string;
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  url: string;
  thumbnailUrl?: string;
  isCover: boolean;
}

export interface Listing {
  id: string;
  title: string;
  description: string | null;
  type: ListingType;
  price: number | null;
  priceTimeUnit: PriceTimeUnit | null;
  category: ListingCategory;
  creatorId: string;
  creator?: {
    firstName: string;
    lastName: string;
    email: string;
    homeAddress: string | null;
    phoneNumber: string | null;
  };
  images: ListingImage[];
  /** Communities and groups the listing is shared with (as far as the viewer may see). */
  visibility: Array<{
    communityId: string;
    community: { id: string; name: string; parentId: string | null };
  }>;
  isBookmarked?: boolean;
  viewer: ListingViewer;
  createdAt: string;
  updatedAt: string;
}

export interface CreateListingDto {
  title: string;
  description?: string;
  type: ListingType;
  price?: number;
  priceTimeUnit?: PriceTimeUnit;
  category: ListingCategory;
  communityIds?: string[];
}

export interface UpdateListingDto {
  title?: string;
  description?: string;
  type?: ListingType;
  price?: number;
  priceTimeUnit?: PriceTimeUnit;
  category?: ListingCategory;
  communityIds?: string[];
}

export interface FilterListingsDto {
  myListings?: boolean;
  bookmarked?: boolean;
  types?: ListingType[];
  categories?: ListingCategory[];
  search?: string;
  limit?: number;
  offset?: number;
}

// API Response Types
export interface ApiError {
  message: string;
  error?: string;
  statusCode: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  limit: number;
  offset: number;
}
