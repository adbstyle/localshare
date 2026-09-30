/**
 * `s3` uses the S3-compatible object store (Supabase Storage) configured via
 * S3_* env vars. Anything else, including unset, uses the local filesystem.
 */
export function isS3StorageEnabled(): boolean {
  return process.env.STORAGE_PROVIDER === 's3';
}
