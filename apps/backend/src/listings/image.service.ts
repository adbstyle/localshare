import { Injectable } from '@nestjs/common';
import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import sharp from 'sharp';
import * as fs from 'fs/promises';
import * as path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { PrismaService } from '../database/prisma.service';

@Injectable()
export class ImageService {
  private readonly useR2: boolean;
  private readonly s3Client: S3Client | null = null;
  private readonly bucketName: string;
  private readonly publicUrl: string;
  private readonly uploadDir: string;

  constructor(private prisma: PrismaService) {
    this.useR2 = process.env.STORAGE_PROVIDER === 'r2';
    this.uploadDir = path.join(process.cwd(), 'uploads', 'listings');

    if (this.useR2) {
      if (!process.env.R2_ACCOUNT_ID || !process.env.R2_ACCESS_KEY_ID || !process.env.R2_SECRET_ACCESS_KEY) {
        console.warn('R2 credentials not configured - image uploads will fail');
      }

      this.bucketName = process.env.R2_BUCKET_NAME || 'localshare-images';
      this.publicUrl = process.env.R2_PUBLIC_URL || '';

      this.s3Client = new S3Client({
        region: 'auto',
        endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
        credentials: {
          accessKeyId: process.env.R2_ACCESS_KEY_ID || '',
          secretAccessKey: process.env.R2_SECRET_ACCESS_KEY || '',
        },
      });

      console.log('ImageService: Using R2 storage');
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
    for (const [index, file] of files.entries()) {
      const filename = `${uuidv4()}.webp`;

      // Process image with Sharp - WebP for ~30% smaller files at same quality
      const processedBuffer = await sharp(file.buffer)
        .rotate() // Auto-rotate based on EXIF and strip metadata (privacy)
        .resize(1280, null, {
          fit: 'inside',
          withoutEnlargement: true,
        })
        .webp({ quality: 80 })
        .toBuffer();

      let sizeBytes: number;

      if (this.useR2 && this.s3Client) {
        // Upload to R2
        await this.s3Client.send(
          new PutObjectCommand({
            Bucket: this.bucketName,
            Key: filename,
            Body: processedBuffer,
            ContentType: 'image/webp',
          }),
        );
        sizeBytes = processedBuffer.length;
      } else {
        // Save to local filesystem
        await this.ensureUploadDir();
        const filepath = path.join(this.uploadDir, filename);
        await fs.writeFile(filepath, processedBuffer);
        const stats = await fs.stat(filepath);
        sizeBytes = stats.size;
      }

      // Save metadata to database
      await this.prisma.listingImage.create({
        data: {
          listingId,
          filename,
          originalName: file.originalname,
          mimeType: 'image/webp',
          sizeBytes,
          orderIndex: index,
        },
      });
    }
  }

  async deleteImage(imageId: string): Promise<void> {
    const image = await this.prisma.listingImage.findUnique({
      where: { id: imageId },
    });

    if (image) {
      if (this.useR2 && this.s3Client) {
        // Delete from R2
        await this.s3Client
          .send(
            new DeleteObjectCommand({
              Bucket: this.bucketName,
              Key: image.filename,
            }),
          )
          .catch(() => {}); // Ignore if file doesn't exist
      } else {
        // Delete from local filesystem
        const filepath = path.join(this.uploadDir, image.filename);
        await fs.unlink(filepath).catch(() => {});
      }

      await this.prisma.listingImage.delete({ where: { id: imageId } });
    }
  }

  async deleteAllForListing(listingId: string): Promise<void> {
    const images = await this.prisma.listingImage.findMany({
      where: { listingId },
    });

    if (this.useR2 && this.s3Client) {
      // Delete from R2 in parallel
      await Promise.all(
        images.map((image) =>
          this.s3Client!
            .send(new DeleteObjectCommand({ Bucket: this.bucketName, Key: image.filename }))
            .catch(() => {}),
        ),
      );
    } else {
      // Delete from local filesystem
      for (const image of images) {
        const filepath = path.join(this.uploadDir, image.filename);
        await fs.unlink(filepath).catch(() => {});
      }
    }

    await this.prisma.listingImage.deleteMany({ where: { listingId } });
  }

  getImageUrl(filename: string): string {
    if (this.useR2) {
      return `${this.publicUrl}/${filename}`;
    }
    return `/uploads/listings/${filename}`;
  }
}
