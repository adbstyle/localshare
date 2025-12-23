import { Injectable } from '@nestjs/common';
import sharp from 'sharp';
import * as fs from 'fs/promises';
import * as path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { PrismaService } from '../database/prisma.service';

@Injectable()
export class ImageService {
  private readonly uploadDir = path.join(process.cwd(), 'uploads', 'listings');

  constructor(private prisma: PrismaService) {}

  async ensureUploadDir() {
    await fs.mkdir(this.uploadDir, { recursive: true });
  }

  async processAndStore(
    listingId: string,
    files: Express.Multer.File[],
  ): Promise<void> {
    await this.ensureUploadDir();

    for (const [index, file] of files.entries()) {
      const filename = `${uuidv4()}.jpg`;
      const filepath = path.join(this.uploadDir, filename);

      // Process image with Sharp
      await sharp(file.buffer)
        .resize(1280, null, {
          fit: 'inside',
          withoutEnlargement: true,
        })
        .jpeg({ quality: 85 })
        .toFile(filepath);

      // Get file size
      const stats = await fs.stat(filepath);

      // Save metadata to database
      await this.prisma.listingImage.create({
        data: {
          listingId,
          filename,
          originalName: file.originalname,
          mimeType: 'image/jpeg',
          sizeBytes: stats.size,
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
      const filepath = path.join(this.uploadDir, image.filename);
      await fs.unlink(filepath).catch(() => {}); // Ignore if file doesn't exist
      await this.prisma.listingImage.delete({ where: { id: imageId } });
    }
  }

  async deleteAllForListing(listingId: string): Promise<void> {
    const images = await this.prisma.listingImage.findMany({
      where: { listingId },
    });

    for (const image of images) {
      const filepath = path.join(this.uploadDir, image.filename);
      await fs.unlink(filepath).catch(() => {});
    }

    await this.prisma.listingImage.deleteMany({ where: { listingId } });
  }

  getImageUrl(filename: string): string {
    return `/uploads/listings/${filename}`;
  }
}
