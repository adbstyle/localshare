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

export enum VisibilityType {
  COMMUNITY = 'COMMUNITY',
  GROUP = 'GROUP',
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
  homeAddress?: string;
  phoneNumber?: string;
  preferredLanguage?: string;
}

// Community Types
export interface Community {
  id: string;
  name: string;
  description: string | null;
  ownerId: string;
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
}

export interface CreateCommunityDto {
  name: string;
  description?: string;
}

export interface UpdateCommunityDto {
  name?: string;
  description?: string;
}

// Group Types
export interface Group {
  id: string;
  name: string;
  description: string | null;
  communityId: string;
  community: {
    id: string;
    name: string;
  };
  ownerId: string;
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
}

export interface CreateGroupDto {
  name: string;
  description?: string;
  communityId: string;
}

export interface UpdateGroupDto {
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
}

export interface Listing {
  id: string;
  title: string;
  description: string | null;
  type: ListingType;
  price: number | null;
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
  visibility: Array<{
    type: VisibilityType;
    communityId?: string;
    groupId?: string;
    community?: { id: string; name: string };
    group?: { id: string; name: string };
  }>;
  createdAt: string;
  updatedAt: string;
}

export interface CreateListingDto {
  title: string;
  description?: string;
  type: ListingType;
  price?: number;
  category: ListingCategory;
  communityIds?: string[];
  groupIds?: string[];
}

export interface UpdateListingDto {
  title?: string;
  description?: string;
  type?: ListingType;
  price?: number;
  category?: ListingCategory;
  communityIds?: string[];
  groupIds?: string[];
}

export interface FilterListingsDto {
  myListings?: boolean;
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
