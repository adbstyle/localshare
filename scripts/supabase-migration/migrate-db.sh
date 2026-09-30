#!/usr/bin/env bash
# Copies the Railway Postgres (public schema) into a Supabase project and compares all tables.
# Usage: scripts/supabase-migration/migrate-db.sh <railway-env: staging|production> <apps/backend/.env.supabase-*.local>
# Needs: railway CLI (logged in), jq, python3, libpq >= 17 (brew install libpq).
set -euo pipefail
here=$(cd "$(dirname "$0")" && pwd)
PG=${PG_BIN:-/opt/homebrew/opt/libpq/bin}
work=$(mktemp -d); chmod 700 "$work"; trap 'rm -rf "$work"' EXIT   # dump contains personal data

src=$(railway variables -s Postgres -e "$1" --json | jq -r .DATABASE_PUBLIC_URL)
eval "$(python3 "$here/supa-env.py" "$2")"

"$PG/pg_dump" "$src" -Fc --no-owner --no-privileges --schema=public -f "$work/db.dump"
# Skip the public schema entry itself: with --clean pg_restore would try DROP SCHEMA public (fails on Supabase)
"$PG/pg_restore" -l "$work/db.dump" | grep -vE " SCHEMA - public | COMMENT - SCHEMA public " > "$work/db.toc"
# --clean --if-exists: works for an empty target and for one that already has the schema
"$PG/pg_restore" -d "$DIRECT_URL" --clean --if-exists --no-owner --no-privileges --exit-on-error -L "$work/db.toc" "$work/db.dump"

echo "[railway $1]";  "$PG/psql" "$src" -tA -f "$here/counts.sql"
echo "[supabase $SUPABASE_REF]"; "$PG/psql" "$DIRECT_URL" -tA -f "$here/counts.sql"
