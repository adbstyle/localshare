import { Injectable } from '@nestjs/common';
import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import sharp from 'sharp';
import * as fs from 'fs/promises';
import * as path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { PrismaService } from '../database/prisma.service';
import { isS3StorageEnabled } from '../common/utils/storage-provider';

@Injectable()
export class ImageService {
  private readonly useS3: boolean;
  private readonly s3Client: S3Client | null = null;
  private readonly bucketName: string;
  private readonly publicUrl: string;
  private readonly uploadDir: string;

  constructor(private prisma: PrismaService) {
    this.useS3 = isS3StorageEnabled();
    this.uploadDir = path.join(process.cwd(), 'uploads', 'listings');

    if (this.useS3) {
      const requiredVars = ['S3_ENDPOINT', 'S3_BUCKET', 'S3_PUBLIC_URL', 'S3_ACCESS_KEY_ID', 'S3_SECRET_ACCESS_KEY'];
      const missingVars = requiredVars.filter((name) => !process.env[name]);
      if (missingVars.length > 0) {
        console.warn(`S3 storage not fully configured (missing: ${missingVars.join(', ')}) - image uploads/URLs will fail`);
      }

      this.bucketName = process.env.S3_BUCKET || '';
      this.publicUrl = (process.env.S3_PUBLIC_URL || '').replace(/\/+$/, '');

      this.s3Client = new S3Client({
        region: process.env.S3_REGION || 'auto',
        endpoint: process.env.S3_ENDPOINT,
        forcePathStyle: process.env.S3_FORCE_PATH_STYLE === 'true',
        credentials: {
          accessKeyId: process.env.S3_ACCESS_KEY_ID || '',
          secretAccessKey: process.env.S3_SECRET_ACCESS_KEY || '',
        },
      });

      console.log('ImageService: Using S3 storage');
    } else {
      this.bucketName = '';
      this.publicUrl = '';
      console.log('ImageService: Using local storage');
    }
  }

  private async ensureUploadDir(): Promise<void> {
    await fs.mkdir(this.uploadDir, { recursive: true });
  }

  async processAndStore(
    listingId: string,
    files: Express.Multer.File[],
  ): Promise<void> {
    // Check if listing already has a cover image
    const existingCover = await this.prisma.listingImage.findFirst({
      where: { listingId, isCover: true },
    });
    const needsCover = !existingCover;

    // Get current max orderIndex for this listing
    const maxOrderResult = await this.prisma.listingImage.aggregate({
      where: { listingId },
      _max: { orderIndex: true },
    });
    const startOrderIndex = (maxOrderResult._max.orderIndex ?? -1) + 1;

    for (const [index, file] of files.entries()) {
      const uuid = uuidv4();
      const filename = `${uuid}.webp`;
      const thumbnailFilename = `${uuid}_thumb.webp`;

      // Process full image and thumbnail in parallel
      const [processedBuffer, thumbnailBuffer] = await Promise.all([
        // Full image: max 1280px width, quality 80
        sharp(file.buffer)
          .rotate() // Auto-rotate based on EXIF and strip metadata (privacy)
          .resize(1280, null, {
            fit: 'inside',
            withoutEnlargement: true,
          })
          .webp({ quality: 80 })
          .toBuffer(),
        // Thumbnail: max 400px width, quality 75 for smaller size
        sharp(file.buffer)
          .rotate()
          .resize(400, null, {
            fit: 'inside',
            withoutEnlargement: true,
          })
          .webp({ quality: 75 })
          .toBuffer(),
      ]);

      let sizeBytes: number;

      if (this.useS3 && this.s3Client) {
        // Upload both images to S3 in parallel
        await Promise.all([
          this.s3Client.send(
            new PutObjectCommand({
              Bucket: this.bucketName,
              Key: filename,
              Body: processedBuffer,
              ContentType: 'image/webp',
            }),
          ),
          this.s3Client.send(
            new PutObjectCommand({
              Bucket: this.bucketName,
              Key: thumbnailFilename,
              Body: thumbnailBuffer,
              ContentType: 'image/webp',
            }),
          ),
        ]);
        sizeBytes = processedBuffer.length;
      } else {
        // Save both images to local filesystem
        await this.ensureUploadDir();
        await Promise.all([
          fs.writeFile(path.join(this.uploadDir, filename), processedBuffer),
          fs.writeFile(path.join(this.uploadDir, thumbnailFilename), thumbnailBuffer),
        ]);
        const stats = await fs.stat(path.join(this.uploadDir, filename));
        sizeBytes = stats.size;
      }

      // Save metadata to database
      // First uploaded image becomes cover if no cover exists
      await this.prisma.listingImage.create({
        data: {
          listingId,
          filename,
          thumbnailFilename,
          originalName: file.originalname,
          mimeType: 'image/webp',
          sizeBytes,
          orderIndex: startOrderIndex + index,
          isCover: needsCover && index === 0,
        },
      });
    }
  }

  async deleteImage(imageId: string): Promise<void> {
    const image = await this.prisma.listingImage.findUnique({
      where: { id: imageId },
    });

    if (image) {
      const wasCover = image.isCover;
      const listingId = image.listingId;

      if (this.useS3 && this.s3Client) {
        // Delete full image and thumbnail from S3
        const deletePromises = [
          this.s3Client
            .send(new DeleteObjectCommand({ Bucket: this.bucketName, Key: image.filename }))
            .catch(() => {}),
        ];
        if (image.thumbnailFilename) {
          deletePromises.push(
            this.s3Client
              .send(new DeleteObjectCommand({ Bucket: this.bucketName, Key: image.thumbnailFilename }))
              .catch(() => {}),
          );
        }
        await Promise.all(deletePromises);
      } else {
        // Delete full image and thumbnail from local filesystem
        await fs.unlink(path.join(this.uploadDir, image.filename)).catch(() => {});
        if (image.thumbnailFilename) {
          await fs.unlink(path.join(this.uploadDir, image.thumbnailFilename)).catch(() => {});
        }
      }

      await this.prisma.listingImage.delete({ where: { id: imageId } });

      // If deleted image was cover, promote next image by orderIndex
      if (wasCover) {
        const nextImage = await this.prisma.listingImage.findFirst({
          where: { listingId },
          orderBy: { orderIndex: 'asc' },
        });
        if (nextImage) {
          await this.prisma.listingImage.update({
            where: { id: nextImage.id },
            data: { isCover: true },
          });
        }
      }
    }
  }

  async deleteAllForListing(listingId: string): Promise<void> {
    const images = await this.prisma.listingImage.findMany({
      where: { listingId },
    });

    if (this.useS3 && this.s3Client) {
      // Delete full images and thumbnails from S3 in parallel
      const deletePromises = images.flatMap((image) => {
        const promises = [
          this.s3Client!
            .send(new DeleteObjectCommand({ Bucket: this.bucketName, Key: image.filename }))
            .catch(() => {}),
        ];
        if (image.thumbnailFilename) {
          promises.push(
            this.s3Client!
              .send(new DeleteObjectCommand({ Bucket: this.bucketName, Key: image.thumbnailFilename }))
              .catch(() => {}),
          );
        }
        return promises;
      });
      await Promise.all(deletePromises);
    } else {
      // Delete full images and thumbnails from local filesystem
      for (const image of images) {
        await fs.unlink(path.join(this.uploadDir, image.filename)).catch(() => {});
        if (image.thumbnailFilename) {
          await fs.unlink(path.join(this.uploadDir, image.thumbnailFilename)).catch(() => {});
        }
      }
    }

    await this.prisma.listingImage.deleteMany({ where: { listingId } });
  }

  getImageUrl(filename: string): string {
    if (this.useS3) {
      return `${this.publicUrl}/${filename}`;
    }
    return `/uploads/listings/${filename}`;
  }

  getThumbnailUrl(thumbnailFilename: string | null): string | null {
    if (!thumbnailFilename) return null;
    if (this.useS3) {
      return `${this.publicUrl}/${thumbnailFilename}`;
    }
    return `/uploads/listings/${thumbnailFilename}`;
  }

  async setCoverImage(listingId: string, imageId: string): Promise<void> {
    // Use transaction to ensure exactly one cover per listing
    await this.prisma.$transaction([
      // Remove cover from all images of this listing
      this.prisma.listingImage.updateMany({
        where: { listingId },
        data: { isCover: false },
      }),
      // Set the target image as cover (listingId constraint prevents cross-listing bugs)
      this.prisma.listingImage.update({
        where: { id: imageId, listingId },
        data: { isCover: true },
      }),
    ]);
  }
}
