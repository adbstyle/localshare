#!/usr/bin/env bash
# Copies all listing images from the Railway environment's S3 bucket (Cloudflare R2) to Supabase Storage.
# Idempotent (skips identical keys), so it doubles as the delta sync at cutover.
# Usage: scripts/supabase-migration/copy-images.sh <railway-env: staging|production> <apps/backend/.env.supabase-*.local>
set -euo pipefail
here=$(cd "$(dirname "$0")" && pwd)
J=$(railway variables -s backend -e "$1" --json)
export SRC_ENDPOINT=$(jq -r .S3_ENDPOINT <<<"$J") SRC_REGION=$(jq -r .S3_REGION <<<"$J") SRC_BUCKET=$(jq -r .S3_BUCKET <<<"$J") SRC_KEY=$(jq -r .S3_ACCESS_KEY_ID <<<"$J") SRC_SECRET=$(jq -r .S3_SECRET_ACCESS_KEY <<<"$J")
unset J
eval "$(python3 "$here/supa-env.py" "$2")"
export DST_ENDPOINT=$S3_ENDPOINT DST_REGION=$S3_REGION DST_BUCKET=$S3_BUCKET DST_KEY=$S3_ACCESS_KEY_ID DST_SECRET=$S3_SECRET_ACCESS_KEY
node "$here/copy-images.js"
