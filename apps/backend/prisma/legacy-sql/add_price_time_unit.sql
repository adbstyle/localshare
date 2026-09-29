-- Migration to add PriceTimeUnit enum and priceTimeUnit field to listings table
-- Issue #26: Zeiteinheit für Preis bei Kategorie Vermieten

-- Create the PriceTimeUnit enum
CREATE TYPE "PriceTimeUnit" AS ENUM ('HOUR', 'DAY', 'WEEK', 'MONTH');

-- Add priceTimeUnit column to listings table (nullable)
ALTER TABLE "listings" ADD COLUMN "price_time_unit" "PriceTimeUnit";

-- Set default value 'DAY' for existing RENT listings (transition requirement)
UPDATE "listings"
SET "price_time_unit" = 'DAY'
WHERE "type" = 'RENT' AND "price_time_unit" IS NULL;

-- Note: The column remains nullable as it's only required for RENT listings
-- Validation is enforced at the application level (DTO + Zod schema)
