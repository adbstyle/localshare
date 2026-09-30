import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { ListingImage, ListingType } from '@prisma/client';
import { PrismaService } from '../database/prisma.service';
import { AccessService } from '../access/access.service';
import { visibleListingWhere } from '../access/access.where';
import { listingViewer } from '../access/permissions';
import { toListingDetail, toListingListItem } from './listing.mapper';
import { isUniqueViolation } from '../common/utils/prisma-errors';
import { PaginatedResponse } from '../common/types';
import { CreateListingDto, UpdateListingDto, FilterListingsDto } from './dto';
import { ImageService } from './image.service';
import {
  creatorSummary,
  DEFAULT_PAGE_SIZE,
  listingCardInclude,
  listingDetailInclude,
  listingFeedWhere,
  visibilityRows,
} from './listing-query';

const MAX_IMAGES_PER_LISTING = 3;

@Injectable()
export class ListingsService {
  constructor(
    private prisma: PrismaService,
    private access: AccessService,
    private imageService: ImageService,
  ) {}

  async create(userId: string, dto: CreateListingDto) {
    const targets = await this.access.assertShareTargets(userId, dto.communityIds, dto.groupIds);

    return this.prisma.listing.create({
      data: {
        creatorId: userId,
        title: dto.title,
        description: dto.description,
        type: dto.type,
        price: dto.price,
        priceTimeUnit: dto.type === ListingType.RENT ? dto.priceTimeUnit : null,
        category: dto.category,
        visibility: { createMany: { data: visibilityRows(targets) } },
      },
      include: { creator: creatorSummary },
    });
  }

  async findAllPaginated(userId: string, filters: FilterListingsDto): Promise<PaginatedResponse<any>> {
    const where = listingFeedWhere(userId, filters);
    const limit = filters.limit ?? DEFAULT_PAGE_SIZE;
    const offset = filters.offset ?? 0;

    const [rows, total] = await Promise.all([
      this.prisma.listing.findMany({
        where,
        include: listingCardInclude(userId),
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
      }),
      this.prisma.listing.count({ where }),
    ]);

    const data = rows.map((row) => toListingListItem(row, userId, this.toImage));

    return { data, total, limit, offset };
  }

  async findOne(id: string, userId: string) {
    const listing = await this.prisma.listing.findFirst({
      where: { id, ...visibleListingWhere(userId) },
      include: listingDetailInclude(userId),
    });
    if (!listing) throw new NotFoundException('Listing not found');

    return toListingDetail(listing, userId, this.toImage);
  }

  async update(id: string, userId: string, dto: UpdateListingDto) {
    const listing = await this.access.assertListingOwner(id, userId);
    const { communityIds, groupIds, ...fields } = dto;
    const replaceVisibility = communityIds !== undefined || groupIds !== undefined;
    const targets = replaceVisibility
      ? await this.access.assertShareTargets(userId, communityIds, groupIds)
      : null;
    const effectiveType = dto.type ?? listing.type;

    const updated = await this.prisma.listing.update({
      where: { id },
      data: {
        ...fields,
        priceTimeUnit: effectiveType === ListingType.RENT ? dto.priceTimeUnit : null,
        visibility: targets
          ? { deleteMany: {}, createMany: { data: visibilityRows(targets) } }
          : undefined,
      },
      include: { images: true },
    });

    return { ...updated, images: updated.images.map(this.toImage) };
  }

  async delete(id: string, userId: string) {
    await this.access.assertListingOwner(id, userId);

    await this.prisma.$transaction([
      this.prisma.listingVisibility.deleteMany({ where: { listingId: id } }),
      this.prisma.listing.update({ where: { id }, data: { deletedAt: new Date() } }),
    ]);
    await this.imageService.deleteAllForListing(id);
  }

  async toggleBookmark(listingId: string, userId: string): Promise<{ isBookmarked: boolean }> {
    const listing = await this.access.assertListingVisible(listingId, userId);
    if (!listingViewer(listing, userId).canBookmark) {
      throw new ForbiddenException('You cannot bookmark your own listing');
    }

    const { count } = await this.prisma.listingBookmark.deleteMany({ where: { userId, listingId } });
    if (count > 0) return { isBookmarked: false };

    try {
      await this.prisma.listingBookmark.create({ data: { userId, listingId } });
    } catch (error) {
      // A concurrent request created it first; the end state is the same.
      if (!isUniqueViolation(error)) throw error;
    }
    return { isBookmarked: true };
  }

  async uploadImages(listingId: string, userId: string, files: Express.Multer.File[]) {
    await this.access.assertListingOwner(listingId, userId);

    const existing = await this.prisma.listingImage.findMany({
      where: { listingId },
      select: { isCover: true, orderIndex: true },
    });
    if (existing.length + files.length > MAX_IMAGES_PER_LISTING) {
      throw new BadRequestException(`Maximum ${MAX_IMAGES_PER_LISTING} images per listing`);
    }

    await this.imageService.processAndStore(listingId, files, existing);
    return this.imagesOf(listingId);
  }

  async deleteImage(listingId: string, imageId: string, userId: string) {
    const image = await this.assertOwnImage(listingId, imageId, userId);
    await this.imageService.deleteImage(image);
    return this.imagesOf(listingId);
  }

  async setCoverImage(listingId: string, imageId: string, userId: string) {
    await this.assertOwnImage(listingId, imageId, userId);
    await this.imageService.setCoverImage(listingId, imageId);
    return this.imagesOf(listingId);
  }

  /** Response of the image endpoints: the listing's current images. */
  private async imagesOf(listingId: string) {
    return { id: listingId, images: await this.imageService.listForListing(listingId) };
  }

  private async assertOwnImage(listingId: string, imageId: string, userId: string) {
    await this.access.assertListingOwner(listingId, userId);
    // The image must belong to this listing (prevents IDOR via a foreign imageId)
    const image = await this.prisma.listingImage.findFirst({ where: { id: imageId, listingId } });
    if (!image) throw new NotFoundException('Image not found in this listing');
    return image;
  }

  private toImage = (img: ListingImage) => this.imageService.toDto(img);
}
