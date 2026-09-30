import { Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { ListingImage } from '@prisma/client';
import { PrismaService } from '../database/prisma.service';
import { ImageStorage } from './storage';

type StoredImage = Pick<ListingImage, 'filename' | 'thumbnailFilename'>;

interface ProcessedImage {
  filename: string;
  thumbnailFilename: string;
  full: Buffer;
  thumbnail: Buffer;
}

const IMAGE_ORDER = [{ isCover: 'desc' as const }, { orderIndex: 'asc' as const }];

function storageKeys(images: StoredImage[]): string[] {
  return images.flatMap((img) => (img.thumbnailFilename ? [img.filename, img.thumbnailFilename] : [img.filename]));
}

@Injectable()
export class ImageService {
  constructor(
    private prisma: PrismaService,
    private storage: ImageStorage,
  ) {}

  /** Stores new images after the existing ones; the first one becomes cover if there is none. */
  async processAndStore(
    listingId: string,
    files: Express.Multer.File[],
    existing: Pick<ListingImage, 'isCover' | 'orderIndex'>[],
  ): Promise<void> {
    const needsCover = !existing.some((img) => img.isCover);
    const startOrderIndex = Math.max(-1, ...existing.map((img) => img.orderIndex)) + 1;

    const processed = await Promise.all(files.map((file) => this.process(file)));
    await this.storage.put(
      processed.flatMap((p) => [
        { key: p.filename, body: p.full, contentType: 'image/webp' },
        { key: p.thumbnailFilename, body: p.thumbnail, contentType: 'image/webp' },
      ]),
    );

    await this.prisma.listingImage.createMany({
      data: processed.map((p, index) => ({
        listingId,
        filename: p.filename,
        thumbnailFilename: p.thumbnailFilename,
        originalName: files[index].originalname,
        mimeType: 'image/webp',
        sizeBytes: p.full.length,
        orderIndex: startOrderIndex + index,
        isCover: needsCover && index === 0,
      })),
    });
  }

  /** Deletes one image; if it was the cover, the next image by order takes over. */
  async deleteImage(image: Pick<ListingImage, 'id' | 'listingId' | 'isCover'> & StoredImage): Promise<void> {
    await this.storage.remove(storageKeys([image]));
    await this.prisma.$transaction(async (tx) => {
      await tx.listingImage.delete({ where: { id: image.id } });
      if (!image.isCover) return;

      const next = await tx.listingImage.findFirst({
        where: { listingId: image.listingId },
        orderBy: { orderIndex: 'asc' },
        select: { id: true },
      });
      if (next) await tx.listingImage.update({ where: { id: next.id }, data: { isCover: true } });
    });
  }

  async deleteAllForListing(listingId: string): Promise<void> {
    const images = await this.prisma.listingImage.findMany({
      where: { listingId },
      select: { filename: true, thumbnailFilename: true },
    });
    await this.storage.remove(storageKeys(images));
    await this.prisma.listingImage.deleteMany({ where: { listingId } });
  }

  /** Exactly one cover per listing. */
  async setCoverImage(listingId: string, imageId: string): Promise<void> {
    await this.prisma.$transaction([
      this.prisma.listingImage.updateMany({ where: { listingId }, data: { isCover: false } }),
      this.prisma.listingImage.update({ where: { id: imageId, listingId }, data: { isCover: true } }),
    ]);
  }

  async listForListing(listingId: string) {
    const images = await this.prisma.listingImage.findMany({ where: { listingId }, orderBy: IMAGE_ORDER });
    return images.map((img) => this.toDto(img));
  }

  /** Adds public URLs; they are derived from the storage config, never stored. */
  toDto(img: ListingImage) {
    const url = this.storage.publicUrl(img.filename);
    const thumbnailUrl = img.thumbnailFilename ? this.storage.publicUrl(img.thumbnailFilename) : url;
    return { ...img, url, thumbnailUrl };
  }

  private async process(file: Express.Multer.File): Promise<ProcessedImage> {
    // Native module, loaded only when images are actually processed
    const { default: sharp } = await import('sharp');
    const id = randomUUID();
    const [full, thumbnail] = await Promise.all([
      // .rotate() applies EXIF orientation and strips metadata (privacy)
      sharp(file.buffer).rotate().resize(1280, null, { fit: 'inside', withoutEnlargement: true }).webp({ quality: 80 }).toBuffer(),
      sharp(file.buffer).rotate().resize(400, null, { fit: 'inside', withoutEnlargement: true }).webp({ quality: 75 }).toBuffer(),
    ]);
    return { filename: `${id}.webp`, thumbnailFilename: `${id}_thumb.webp`, full, thumbnail };
  }
}
