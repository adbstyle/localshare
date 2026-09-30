-- Enable Row Level Security on every table in the public schema.
-- On Supabase the public schema is reachable via the Data API with the anon key;
-- RLS without policies denies all access for those roles. The app connects as the
-- table owner (with BYPASSRLS), so Prisma queries are unaffected.
ALTER TABLE "users" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "sso_accounts" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "refresh_tokens" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "communities" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "community_members" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "groups" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "group_members" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "listings" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "listing_images" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "listing_visibility" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "listing_bookmarks" ENABLE ROW LEVEL SECURITY;
-- _prisma_migrations does not exist in Prisma's shadow database (migrate dev)
DO $$
BEGIN
  IF to_regclass('public._prisma_migrations') IS NOT NULL THEN
    ALTER TABLE "_prisma_migrations" ENABLE ROW LEVEL SECURITY;
  END IF;
END $$;
