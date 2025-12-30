import { z } from 'zod';
import { ListingType, ListingCategory, PriceTimeUnit } from './types';

// User Schemas
export const updateUserSchema = z.object({
  firstName: z.string().min(1).max(100).optional(),
  lastName: z.string().min(1).max(100).optional(),
  homeAddress: z.string().min(1).max(500).optional(),
  phoneNumber: z
    .string()
    .regex(/^\+[1-9]\d{1,14}$/, {
      message: 'Phone number must be in E.164 format (e.g., +41791234567)',
    })
    .optional()
    .or(z.literal(''))
    .transform((val) => (val === '' ? null : val)),
  preferredLanguage: z.string().length(2).optional(),
});

// Community Schemas
export const createCommunitySchema = z.object({
  name: z.string().min(3).max(100).transform((val) => val.trim()),
  description: z.string().max(500).transform((val) => val.trim()).optional(),
});

export const updateCommunitySchema = z.object({
  name: z.string().min(3).max(100).transform((val) => val.trim()).optional(),
  description: z.string().max(500).transform((val) => val.trim()).optional(),
});

// Group Schemas
export const createGroupSchema = z.object({
  name: z.string().min(3).max(100).transform((val) => val.trim()),
  description: z.string().max(500).transform((val) => val.trim()).optional(),
  communityId: z.string().uuid(),
});

export const updateGroupSchema = z.object({
  name: z.string().min(3).max(100).transform((val) => val.trim()).optional(),
  description: z.string().max(500).transform((val) => val.trim()).optional(),
});

// Listing Schemas
export const createListingSchema = z.object({
  title: z.string().min(5).max(200).transform((val) => val.trim()),
  description: z.string().max(2000).transform((val) => val.trim()).optional(),
  type: z.nativeEnum(ListingType),
  price: z.number().int().min(0).max(1000000).optional(),
  priceTimeUnit: z.nativeEnum(PriceTimeUnit).optional(),
  category: z.nativeEnum(ListingCategory),
  communityIds: z.array(z.string().uuid()).optional(),
  groupIds: z.array(z.string().uuid()).optional(),
}).refine(
  (data) => {
    if (data.type === ListingType.SELL || data.type === ListingType.RENT) {
      return data.price !== undefined;
    }
    return true;
  },
  {
    message: 'Price is required for SELL and RENT listings',
    path: ['price'],
  }
).refine(
  (data) => {
    if (data.type === ListingType.RENT) {
      return data.priceTimeUnit !== undefined;
    }
    return true;
  },
  {
    message: 'Price time unit is required for RENT listings',
    path: ['priceTimeUnit'],
  }
);

export const updateListingSchema = z.object({
  title: z.string().min(5).max(200).transform((val) => val.trim()).optional(),
  description: z.string().max(2000).transform((val) => val.trim()).optional(),
  type: z.nativeEnum(ListingType).optional(),
  price: z.number().int().min(0).max(1000000).optional(),
  priceTimeUnit: z.nativeEnum(PriceTimeUnit).optional(),
  category: z.nativeEnum(ListingCategory).optional(),
  communityIds: z.array(z.string().uuid()).optional(),
  groupIds: z.array(z.string().uuid()).optional(),
});

export const filterListingsSchema = z.object({
  myListings: z.boolean().optional(),
  types: z.array(z.nativeEnum(ListingType)).optional(),
  categories: z.array(z.nativeEnum(ListingCategory)).optional(),
  search: z.string().optional(),
  limit: z.number().int().min(1).max(100).default(20).optional(),
  offset: z.number().int().min(0).default(0).optional(),
});
