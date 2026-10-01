-- Groups become communities with a parent (#191). Ids and invite tokens are
-- kept, so existing group links, invites and shares keep working. Runs in one
-- transaction: on any error the database stays unchanged.
BEGIN;

-- Guard: group ids / invite tokens must not collide with community ones.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM "groups" g
    JOIN "communities" c ON c."id" = g."id" OR c."invite_token" = g."invite_token"
  ) THEN
    RAISE EXCEPTION 'group id or invite token collides with a community';
  END IF;
END $$;

-- 1. Groups -> communities with parent_id
ALTER TABLE "communities" ADD COLUMN "parent_id" UUID;

INSERT INTO "communities"
  ("id", "name", "description", "owner_id", "parent_id", "invite_token", "created_at", "updated_at", "deleted_at")
SELECT "id", "name", "description", "owner_id", "community_id", "invite_token", "created_at", "updated_at", "deleted_at"
FROM "groups";

-- 2. Group memberships -> community memberships
INSERT INTO "community_members" ("id", "community_id", "user_id", "joined_at")
SELECT gen_random_uuid(), "group_id", "user_id", "joined_at"
FROM "group_members"
ON CONFLICT ("community_id", "user_id") DO NOTHING;

-- 3. Shares with a group now point at the group's community row
ALTER TABLE "listing_visibility" DROP CONSTRAINT "listing_visibility_group_id_fkey";
UPDATE "listing_visibility" SET "community_id" = "group_id" WHERE "group_id" IS NOT NULL;
DELETE FROM "listing_visibility" WHERE "community_id" IS NULL;
DELETE FROM "listing_visibility" a
USING "listing_visibility" b
WHERE a."listing_id" = b."listing_id" AND a."community_id" = b."community_id" AND a."id" > b."id";

DROP INDEX "listing_visibility_group_id_idx";
DROP INDEX "listing_visibility_visibility_type_community_id_idx";
DROP INDEX "listing_visibility_visibility_type_group_id_idx";
DROP INDEX "listing_visibility_listing_id_visibility_type_community_id__key";

ALTER TABLE "listing_visibility"
  DROP COLUMN "group_id",
  DROP COLUMN "visibility_type",
  ALTER COLUMN "community_id" SET NOT NULL;

CREATE UNIQUE INDEX "listing_visibility_listing_id_community_id_key"
  ON "listing_visibility"("listing_id", "community_id");

-- 4. Parent relation
CREATE INDEX "communities_parent_id_idx" ON "communities"("parent_id");
ALTER TABLE "communities" ADD CONSTRAINT "communities_parent_id_fkey"
  FOREIGN KEY ("parent_id") REFERENCES "communities"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- 5. Drop the group tables (their RLS goes with them)
DROP TABLE "group_members";
DROP TABLE "groups";
DROP TYPE "VisibilityType";

-- 6. Contract step of #189: refresh tokens are deleted, no longer revoked.
--    Revoked rows must go first, or they would become valid again.
DELETE FROM "refresh_tokens" WHERE "revoked_at" IS NOT NULL;
ALTER TABLE "refresh_tokens" DROP COLUMN "revoked_at";

COMMIT;
