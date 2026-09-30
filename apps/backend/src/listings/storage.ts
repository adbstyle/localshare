import { Injectable, Logger } from '@nestjs/common';
import * as fs from 'fs/promises';
import * as path from 'path';
import { isS3StorageEnabled } from '../common/utils/storage-provider';

type S3Sdk = typeof import('@aws-sdk/client-s3');

export interface StoredFile {
  key: string;
  body: Buffer;
  contentType: string;
}

/**
 * Where listing images live: an S3-compatible bucket (Supabase Storage) or
 * ./uploads/listings. The AWS SDK is loaded on first use so it stays off the
 * cold start of requests that never touch images.
 */
@Injectable()
export class ImageStorage {
  private readonly logger = new Logger(ImageStorage.name);
  private readonly useS3 = isS3StorageEnabled();
  private readonly uploadDir = path.join(process.cwd(), 'uploads', 'listings');
  private readonly publicBase = this.useS3
    ? (process.env.S3_PUBLIC_URL || '').replace(/\/+$/, '')
    : '/uploads/listings';
  private s3: Promise<{ sdk: S3Sdk; client: InstanceType<S3Sdk['S3Client']> }> | null = null;

  constructor() {
    if (!this.useS3) return;
    const required = ['S3_ENDPOINT', 'S3_BUCKET', 'S3_PUBLIC_URL', 'S3_ACCESS_KEY_ID', 'S3_SECRET_ACCESS_KEY'];
    const missing = required.filter((name) => !process.env[name]);
    if (missing.length > 0) {
      this.logger.warn(`S3 storage not fully configured (missing: ${missing.join(', ')})`);
    }
  }

  publicUrl(key: string): string {
    return `${this.publicBase}/${key}`;
  }

  async put(files: StoredFile[]): Promise<void> {
    if (this.useS3) {
      const { sdk, client } = await this.s3Client();
      await Promise.all(
        files.map((file) =>
          client.send(
            new sdk.PutObjectCommand({
              Bucket: process.env.S3_BUCKET,
              Key: file.key,
              Body: file.body,
              ContentType: file.contentType,
            }),
          ),
        ),
      );
      return;
    }

    await fs.mkdir(this.uploadDir, { recursive: true });
    await Promise.all(files.map((file) => fs.writeFile(path.join(this.uploadDir, file.key), file.body)));
  }

  /** Best effort: a missing object must never block removing its database row. */
  async remove(keys: string[]): Promise<void> {
    if (keys.length === 0) return;

    if (this.useS3) {
      const { sdk, client } = await this.s3Client();
      await Promise.all(
        keys.map((key) =>
          client
            .send(new sdk.DeleteObjectCommand({ Bucket: process.env.S3_BUCKET, Key: key }))
            .catch((error) => this.logger.warn(`Could not delete ${key}: ${error}`)),
        ),
      );
      return;
    }

    await Promise.all(keys.map((key) => fs.unlink(path.join(this.uploadDir, key)).catch(() => undefined)));
  }

  private s3Client() {
    this.s3 ??= import('@aws-sdk/client-s3').then((sdk) => ({
      sdk,
      client: new sdk.S3Client({
        region: process.env.S3_REGION || 'auto',
        endpoint: process.env.S3_ENDPOINT,
        forcePathStyle: process.env.S3_FORCE_PATH_STYLE === 'true',
        credentials: {
          accessKeyId: process.env.S3_ACCESS_KEY_ID || '',
          secretAccessKey: process.env.S3_SECRET_ACCESS_KEY || '',
        },
      }),
    }));
    return this.s3;
  }
}
