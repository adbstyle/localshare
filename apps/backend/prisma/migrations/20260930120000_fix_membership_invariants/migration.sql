-- Repairs data left behind by the membership bugs fixed in #185. Idempotent,
-- data only (no schema change).

-- 0. Groups of deleted communities are deleted too (older code could leave
--    them active). Their shares and memberships are cleared by steps 2 and 4.
UPDATE "groups" g
SET "deleted_at" = c."deleted_at", "updated_at" = now()
FROM "communities" c
WHERE g."community_id" = c."id" AND c."deleted_at" IS NOT NULL AND g."deleted_at" IS NULL;

DELETE FROM "group_members" gm
USING "groups" g
WHERE gm."group_id" = g."id" AND g."deleted_at" IS NOT NULL;

-- 1. Groups whose owner is no longer a member of the parent community (bug F:
--    the owner left or was removed) pass to the community owner, if active.
UPDATE "groups" g
SET "owner_id" = c."owner_id", "updated_at" = now()
FROM "communities" c
JOIN "users" u ON u."id" = c."owner_id" AND u."deleted_at" IS NULL
WHERE g."community_id" = c."id"
  AND g."deleted_at" IS NULL
  AND g."owner_id" <> c."owner_id"
  AND NOT EXISTS (
    SELECT 1 FROM "community_members" m
    WHERE m."community_id" = g."community_id" AND m."user_id" = g."owner_id"
  );

-- 2. Group members must be members of the parent community.
DELETE FROM "group_members" gm
USING "groups" g
WHERE gm."group_id" = g."id"
  AND NOT EXISTS (
    SELECT 1 FROM "community_members" m
    WHERE m."community_id" = g."community_id" AND m."user_id" = gm."user_id"
  );

-- 3. Every active group owner is a member of their group.
INSERT INTO "group_members" ("group_id", "user_id")
SELECT g."id", g."owner_id"
FROM "groups" g
JOIN "community_members" m ON m."community_id" = g."community_id" AND m."user_id" = g."owner_id"
WHERE g."deleted_at" IS NULL
ON CONFLICT ("group_id", "user_id") DO NOTHING;

-- 4. Shares of deleted listings, into deleted communities/groups (bug B), and
--    into communities/groups the creator no longer belongs to (bug A and the
--    unchecked share targets fixed in #183).
DELETE FROM "listing_visibility" lv
USING "listings" l
WHERE lv."listing_id" = l."id" AND l."deleted_at" IS NOT NULL;

DELETE FROM "listing_visibility" lv
USING "communities" c
WHERE lv."community_id" = c."id" AND c."deleted_at" IS NOT NULL;

DELETE FROM "listing_visibility" lv
USING "groups" g
WHERE lv."group_id" = g."id" AND g."deleted_at" IS NOT NULL;

DELETE FROM "listing_visibility" lv
USING "listings" l
WHERE lv."listing_id" = l."id"
  AND lv."community_id" IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM "community_members" m
    WHERE m."community_id" = lv."community_id" AND m."user_id" = l."creator_id"
  );

DELETE FROM "listing_visibility" lv
USING "listings" l
WHERE lv."listing_id" = l."id"
  AND lv."group_id" IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM "group_members" m
    WHERE m."group_id" = lv."group_id" AND m."user_id" = l."creator_id"
  );

-- 5. Duplicates: the 4-column unique never fires because one of community_id /
--    group_id is always NULL.
DELETE FROM "listing_visibility" a
USING "listing_visibility" b
WHERE a."listing_id" = b."listing_id"
  AND a."community_id" IS NOT DISTINCT FROM b."community_id"
  AND a."group_id" IS NOT DISTINCT FROM b."group_id"
  AND a."id" > b."id";
