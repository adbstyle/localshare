-- CreateEnum
CREATE TYPE "ListingCategory" AS ENUM ('ELECTRONICS', 'FURNITURE', 'SPORTS', 'CLOTHING', 'HOUSEHOLD', 'GARDEN', 'BOOKS', 'TOYS', 'TOOLS', 'FOOD', 'SERVICES', 'VEHICLES', 'OTHER');

-- CreateEnum
CREATE TYPE "ListingType" AS ENUM ('SELL', 'RENT', 'LEND', 'SEARCH');

-- CreateEnum
CREATE TYPE "PriceTimeUnit" AS ENUM ('HOUR', 'DAY', 'WEEK', 'MONTH');

-- CreateEnum
CREATE TYPE "SsoProvider" AS ENUM ('GOOGLE', 'MICROSOFT');

-- CreateEnum
CREATE TYPE "VisibilityType" AS ENUM ('COMMUNITY', 'GROUP');

-- CreateTable
CREATE TABLE "communities" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" VARCHAR(100) NOT NULL,
    "description" TEXT,
    "owner_id" UUID NOT NULL,
    "invite_token" UUID NOT NULL DEFAULT gen_random_uuid(),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,
    "deleted_at" TIMESTAMPTZ(6),

    CONSTRAINT "communities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "community_members" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "community_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "joined_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "community_members_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "group_members" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "group_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "joined_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "group_members_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "groups" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "community_id" UUID NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "description" TEXT,
    "owner_id" UUID NOT NULL,
    "invite_token" UUID NOT NULL DEFAULT gen_random_uuid(),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,
    "deleted_at" TIMESTAMPTZ(6),

    CONSTRAINT "groups_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "listing_bookmarks" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "listing_id" UUID NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "listing_bookmarks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "listing_images" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "listing_id" UUID NOT NULL,
    "filename" TEXT NOT NULL,
    "original_name" TEXT,
    "mime_type" TEXT,
    "size_bytes" INTEGER,
    "order_index" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "is_cover" BOOLEAN NOT NULL DEFAULT false,
    "thumbnail_filename" VARCHAR,

    CONSTRAINT "listing_images_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "listing_visibility" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "listing_id" UUID NOT NULL,
    "visibility_type" "VisibilityType" NOT NULL,
    "community_id" UUID,
    "group_id" UUID,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "listing_visibility_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "listings" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "creator_id" UUID NOT NULL,
    "title" VARCHAR(60) NOT NULL,
    "description" TEXT,
    "type" "ListingType" NOT NULL,
    "price" INTEGER,
    "price_time_unit" "PriceTimeUnit",
    "category" "ListingCategory" NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,
    "deleted_at" TIMESTAMPTZ(6),

    CONSTRAINT "listings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "refresh_tokens" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "token_hash" TEXT NOT NULL,
    "expires_at" TIMESTAMPTZ(6) NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "revoked_at" TIMESTAMPTZ(6),

    CONSTRAINT "refresh_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sso_accounts" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "provider" "SsoProvider" NOT NULL,
    "provider_user_id" TEXT NOT NULL,
    "provider_email" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sso_accounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "email" TEXT NOT NULL,
    "first_name" VARCHAR(50) NOT NULL,
    "last_name" VARCHAR(50) NOT NULL,
    "home_address" TEXT,
    "phone_number" TEXT,
    "preferred_language" VARCHAR(2) NOT NULL DEFAULT 'de',
    "consent_given_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,
    "deleted_at" TIMESTAMPTZ(6),

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "communities_deleted_at_idx" ON "communities"("deleted_at" ASC);

-- CreateIndex
CREATE INDEX "communities_invite_token_idx" ON "communities"("invite_token" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "communities_invite_token_key" ON "communities"("invite_token" ASC);

-- CreateIndex
CREATE INDEX "communities_owner_id_idx" ON "communities"("owner_id" ASC);

-- CreateIndex
CREATE INDEX "community_members_community_id_idx" ON "community_members"("community_id" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "community_members_community_id_user_id_key" ON "community_members"("community_id" ASC, "user_id" ASC);

-- CreateIndex
CREATE INDEX "community_members_joined_at_idx" ON "community_members"("joined_at" ASC);

-- CreateIndex
CREATE INDEX "community_members_user_id_idx" ON "community_members"("user_id" ASC);

-- CreateIndex
CREATE INDEX "group_members_group_id_idx" ON "group_members"("group_id" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "group_members_group_id_user_id_key" ON "group_members"("group_id" ASC, "user_id" ASC);

-- CreateIndex
CREATE INDEX "group_members_user_id_idx" ON "group_members"("user_id" ASC);

-- CreateIndex
CREATE INDEX "groups_community_id_idx" ON "groups"("community_id" ASC);

-- CreateIndex
CREATE INDEX "groups_deleted_at_idx" ON "groups"("deleted_at" ASC);

-- CreateIndex
CREATE INDEX "groups_invite_token_idx" ON "groups"("invite_token" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "groups_invite_token_key" ON "groups"("invite_token" ASC);

-- CreateIndex
CREATE INDEX "groups_owner_id_idx" ON "groups"("owner_id" ASC);

-- CreateIndex
CREATE INDEX "listing_bookmarks_listing_id_idx" ON "listing_bookmarks"("listing_id" ASC);

-- CreateIndex
CREATE INDEX "listing_bookmarks_user_id_idx" ON "listing_bookmarks"("user_id" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "listing_bookmarks_user_id_listing_id_key" ON "listing_bookmarks"("user_id" ASC, "listing_id" ASC);

-- CreateIndex
CREATE INDEX "listing_images_listing_id_idx" ON "listing_images"("listing_id" ASC);

-- CreateIndex
CREATE INDEX "listing_visibility_community_id_idx" ON "listing_visibility"("community_id" ASC);

-- CreateIndex
CREATE INDEX "listing_visibility_group_id_idx" ON "listing_visibility"("group_id" ASC);

-- CreateIndex
CREATE INDEX "listing_visibility_listing_id_idx" ON "listing_visibility"("listing_id" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "listing_visibility_listing_id_visibility_type_community_id__key" ON "listing_visibility"("listing_id" ASC, "visibility_type" ASC, "community_id" ASC, "group_id" ASC);

-- CreateIndex
CREATE INDEX "listing_visibility_visibility_type_community_id_idx" ON "listing_visibility"("visibility_type" ASC, "community_id" ASC);

-- CreateIndex
CREATE INDEX "listing_visibility_visibility_type_group_id_idx" ON "listing_visibility"("visibility_type" ASC, "group_id" ASC);

-- CreateIndex
CREATE INDEX "listings_category_idx" ON "listings"("category" ASC);

-- CreateIndex
CREATE INDEX "listings_created_at_idx" ON "listings"("created_at" DESC);

-- CreateIndex
CREATE INDEX "listings_creator_id_idx" ON "listings"("creator_id" ASC);

-- CreateIndex
CREATE INDEX "listings_deleted_at_idx" ON "listings"("deleted_at" ASC);

-- CreateIndex
CREATE INDEX "listings_type_idx" ON "listings"("type" ASC);

-- CreateIndex
CREATE INDEX "refresh_tokens_expires_at_idx" ON "refresh_tokens"("expires_at" ASC);

-- CreateIndex
CREATE INDEX "refresh_tokens_token_hash_idx" ON "refresh_tokens"("token_hash" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "refresh_tokens_token_hash_key" ON "refresh_tokens"("token_hash" ASC);

-- CreateIndex
CREATE INDEX "refresh_tokens_user_id_idx" ON "refresh_tokens"("user_id" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "sso_accounts_provider_provider_user_id_key" ON "sso_accounts"("provider" ASC, "provider_user_id" ASC);

-- CreateIndex
CREATE INDEX "sso_accounts_user_id_idx" ON "sso_accounts"("user_id" ASC);

-- CreateIndex
CREATE INDEX "users_deleted_at_idx" ON "users"("deleted_at" ASC);

-- CreateIndex
CREATE INDEX "users_email_idx" ON "users"("email" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email" ASC);

-- AddForeignKey
ALTER TABLE "communities" ADD CONSTRAINT "communities_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "community_members" ADD CONSTRAINT "community_members_community_id_fkey" FOREIGN KEY ("community_id") REFERENCES "communities"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "community_members" ADD CONSTRAINT "community_members_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "group_members" ADD CONSTRAINT "group_members_group_id_fkey" FOREIGN KEY ("group_id") REFERENCES "groups"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "group_members" ADD CONSTRAINT "group_members_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "groups" ADD CONSTRAINT "groups_community_id_fkey" FOREIGN KEY ("community_id") REFERENCES "communities"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "groups" ADD CONSTRAINT "groups_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "listing_bookmarks" ADD CONSTRAINT "listing_bookmarks_listing_id_fkey" FOREIGN KEY ("listing_id") REFERENCES "listings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "listing_bookmarks" ADD CONSTRAINT "listing_bookmarks_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "listing_images" ADD CONSTRAINT "listing_images_listing_id_fkey" FOREIGN KEY ("listing_id") REFERENCES "listings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "listing_visibility" ADD CONSTRAINT "listing_visibility_community_id_fkey" FOREIGN KEY ("community_id") REFERENCES "communities"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "listing_visibility" ADD CONSTRAINT "listing_visibility_group_id_fkey" FOREIGN KEY ("group_id") REFERENCES "groups"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "listing_visibility" ADD CONSTRAINT "listing_visibility_listing_id_fkey" FOREIGN KEY ("listing_id") REFERENCES "listings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "listings" ADD CONSTRAINT "listings_creator_id_fkey" FOREIGN KEY ("creator_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "refresh_tokens" ADD CONSTRAINT "refresh_tokens_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sso_accounts" ADD CONSTRAINT "sso_accounts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

