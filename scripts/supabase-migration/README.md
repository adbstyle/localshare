# Supabase migration helpers (issue #167)

Temporary tools for moving LocalShare from Railway (Postgres + Cloudflare R2) to Supabase.
Delete this folder in step 7 of `docs/supabase-vercel-migration.md`.

Prerequisites: `railway` CLI logged in, `jq`, `python3`, `node`, libpq >= 17 (`brew install libpq`),
and the credentials in `apps/backend/.env.supabase-{staging,prod}.local` (gitignored).

```bash
# Database: dump Railway, restore into Supabase (--clean --if-exists), compare all tables
scripts/supabase-migration/migrate-db.sh staging apps/backend/.env.supabase-staging.local
scripts/supabase-migration/migrate-db.sh production apps/backend/.env.supabase-prod.local

# Images: copy R2 -> Supabase Storage (idempotent, rerun = delta sync)
scripts/supabase-migration/copy-images.sh staging apps/backend/.env.supabase-staging.local
scripts/supabase-migration/copy-images.sh production apps/backend/.env.supabase-prod.local
```
