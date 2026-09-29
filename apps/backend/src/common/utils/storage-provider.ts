const S3_STORAGE_PROVIDERS = ['s3', 'r2']; // `r2` = legacy value, same S3 client

/**
 * `s3` (or legacy `r2`) uses the S3-compatible object store configured via
 * S3_* env vars. Anything else, including unset, uses the local filesystem.
 */
export function isS3StorageEnabled(): boolean {
  return S3_STORAGE_PROVIDERS.includes(process.env.STORAGE_PROVIDER ?? '');
}
