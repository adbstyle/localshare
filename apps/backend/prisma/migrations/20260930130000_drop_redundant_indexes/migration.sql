-- Indexes already covered by a unique constraint (or its leading column):
-- they only slowed down writes.

-- DropIndex
DROP INDEX "users_email_idx";

-- DropIndex
DROP INDEX "refresh_tokens_token_hash_idx";

-- DropIndex
DROP INDEX "communities_invite_token_idx";

-- DropIndex
DROP INDEX "community_members_community_id_idx";

-- DropIndex
DROP INDEX "listing_visibility_listing_id_idx";

-- DropIndex
DROP INDEX "listing_bookmarks_user_id_idx";

