-- Migration to sync ListingCategory enum values with TypeScript definitions
-- This renames the descriptive enum values to short names to match the TypeScript enum

-- Rename enum values to match TypeScript enum
ALTER TYPE "ListingCategory" RENAME VALUE 'SPORTS_LEISURE' TO 'SPORTS';
ALTER TYPE "ListingCategory" RENAME VALUE 'CLOTHING_ACCESSORIES' TO 'CLOTHING';
ALTER TYPE "ListingCategory" RENAME VALUE 'GARDEN_PLANTS' TO 'GARDEN';
ALTER TYPE "ListingCategory" RENAME VALUE 'BOOKS_MEDIA' TO 'BOOKS';
ALTER TYPE "ListingCategory" RENAME VALUE 'TOYS_KIDS' TO 'TOYS';
ALTER TYPE "ListingCategory" RENAME VALUE 'TOOLS_HARDWARE' TO 'TOOLS';
ALTER TYPE "ListingCategory" RENAME VALUE 'FOOD_BEVERAGES' TO 'FOOD';

-- Note: This migration preserves all existing data
-- The RENAME VALUE operation only changes the enum label, not the stored values
