# Reads apps/backend/.env.supabase-*.local and prints shell exports for DATABASE_URL (transaction pooler),
# DIRECT_URL (session pooler) and the S3_* storage settings. Values are never echoed by the calling scripts.
# Usage: python3 supa-env.py <env-file> -> prints shell exports (DATABASE_URL pooled, DIRECT_URL session, S3_*)
import sys, re, urllib.parse
vals = {}
for line in open(sys.argv[1]):
    m = re.match(r'^([A-Z0-9_]+)=(.*)$', line.strip())
    if m: vals[m[1]] = m[2].strip().strip('"').strip("'")
ref, region, pw = vals['SUPABASE_REF'], vals['SUPABASE_REGION'], urllib.parse.quote(vals['SUPABASE_DB_PASSWORD'], safe='')
host = re.search(r'@([^:/]+):6543', vals['SUPABASE_TRANSACTION_POOLER_URL'])[1]
out = {
  'DATABASE_URL': f'postgresql://postgres.{ref}:{pw}@{host}:6543/postgres?pgbouncer=true&connection_limit=5',
  'DIRECT_URL': f'postgresql://postgres.{ref}:{pw}@{host}:5432/postgres',
  'STORAGE_PROVIDER': 's3',
  'S3_ENDPOINT': f'https://{ref}.storage.supabase.co/storage/v1/s3',
  'S3_REGION': region,
  'S3_BUCKET': 'listing-images',
  'S3_FORCE_PATH_STYLE': 'true',
  'S3_PUBLIC_URL': f'https://{ref}.supabase.co/storage/v1/object/public/listing-images',
  'S3_ACCESS_KEY_ID': vals['S3_ACCESS_KEY_ID'],
  'S3_SECRET_ACCESS_KEY': vals['S3_SECRET_ACCESS_KEY'],
  'SUPABASE_REF': ref,
}
for k, v in out.items():
    print(f"export {k}='{v}'")
