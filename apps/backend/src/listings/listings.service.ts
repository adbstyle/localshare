import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { CreateListingDto, UpdateListingDto, FilterListingsDto } from './dto';
import { VisibilityService } from './visibility.service';
import { ImageService } from './image.service';

@Injectable()
export class ListingsService {
  constructor(
    private prisma: PrismaService,
    private visibilityService: VisibilityService,
    private imageService: ImageService,
  ) {}

  async create(userId: string, dto: CreateListingDto) {
    const listing = await this.prisma.listing.create({
      data: {
        creatorId: userId,
        title: dto.title,
        description: dto.description,
        type: dto.type,
        price: dto.price,
        category: dto.category,
      },
      include: {
        creator: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    // Set visibility
    if (dto.communityIds || dto.groupIds) {
      await this.visibilityService.setVisibility(
        listing.id,
        dto.communityIds || [],
        dto.groupIds || [],
      );
    }

    return listing;
  }

  async findAll(userId: string, filters: FilterListingsDto) {
    const visibleListingIds = await this.visibilityService.getVisibleListingIds(
      userId,
    );

    const where: any = {
      id: { in: visibleListingIds },
      deletedAt: null,
    };

    // Apply filters
    if (filters.myListings) {
      where.creatorId = userId;
    }

    if (filters.types && filters.types.length > 0) {
      where.type = { in: filters.types };
    }

    if (filters.categories && filters.categories.length > 0) {
      where.category = { in: filters.categories };
    }

    if (filters.search) {
      where.OR = [
        { title: { contains: filters.search, mode: 'insensitive' } },
        { description: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    const listings = await this.prisma.listing.findMany({
      where,
      include: {
        creator: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        images: {
          orderBy: { orderIndex: 'asc' },
          take: 1, // Just first image for list view
        },
        _count: {
          select: {
            images: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: filters.limit || 50,
      skip: filters.offset || 0,
    });

    // Map image URLs
    return listings.map((listing) => ({
      ...listing,
      images: listing.images.map((img) => ({
        ...img,
        url: this.imageService.getImageUrl(img.filename),
      })),
    }));
  }

  async findOne(id: string, userId: string) {
    const listing = await this.prisma.listing.findUnique({
      where: { id, deletedAt: null },
      include: {
        creator: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            homeAddress: true,
            phoneNumber: true,
          },
        },
        images: {
          orderBy: { orderIndex: 'asc' },
        },
        visibility: {
          include: {
            community: {
              select: { id: true, name: true },
            },
            group: {
              select: { id: true, name: true },
            },
          },
        },
      },
    });

    if (!listing) {
      throw new NotFoundException('Listing not found');
    }

    // Check if user can view
    const canView = await this.visibilityService.canUserViewListing(
      userId,
      id,
    );

    if (!canView) {
      throw new ForbiddenException('You do not have access to this listing');
    }

    // Hide contact info if user is viewing their own listing
    if (listing.creatorId === userId) {
      listing.creator.email = '';
      listing.creator.homeAddress = null;
      listing.creator.phoneNumber = null;
    }

    // Map image URLs and transform visibility to match TypeScript interface
    return {
      ...listing,
      visibility: listing.visibility.map((v) => ({
        type: v.visibilityType,
        communityId: v.communityId,
        groupId: v.groupId,
        community: v.community,
        group: v.group,
      })),
      images: listing.images.map((img) => ({
        ...img,
        url: this.imageService.getImageUrl(img.filename),
      })),
    };
  }

  async update(id: string, userId: string, dto: UpdateListingDto) {
    const listing = await this.prisma.listing.findUnique({
      where: { id, deletedAt: null },
    });

    if (!listing) {
      throw new NotFoundException('Listing not found');
    }

    if (listing.creatorId !== userId) {
      throw new ForbiddenException('You can only update your own listings');
    }

    const updated = await this.prisma.listing.update({
      where: { id },
      data: {
        title: dto.title,
        description: dto.description,
        type: dto.type,
        price: dto.price,
        category: dto.category,
      },
      include: {
        images: true,
      },
    });

    // Update visibility if provided
    if (dto.communityIds !== undefined || dto.groupIds !== undefined) {
      await this.visibilityService.setVisibility(
        id,
        dto.communityIds || [],
        dto.groupIds || [],
      );
    }

    return updated;
  }

  async delete(id: string, userId: string) {
    const listing = await this.prisma.listing.findUnique({
      where: { id, deletedAt: null },
    });

    if (!listing) {
      throw new NotFoundException('Listing not found');
    }

    if (listing.creatorId !== userId) {
      throw new ForbiddenException('You can only delete your own listings');
    }

    // Delete images
    await this.imageService.deleteAllForListing(id);

    // Soft delete listing
    await this.prisma.listing.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    // Delete visibility
    await this.prisma.listingVisibility.deleteMany({
      where: { listingId: id },
    });
  }

  async uploadImages(listingId: string, userId: string, files: Express.Multer.File[]) {
    const listing = await this.prisma.listing.findUnique({
      where: { id: listingId, deletedAt: null },
      include: {
        images: true,
      },
    });

    if (!listing) {
      throw new NotFoundException('Listing not found');
    }

    if (listing.creatorId !== userId) {
      throw new ForbiddenException('You can only upload images to your own listings');
    }

    const currentImageCount = listing.images.length;
    const newImageCount = files.length;

    if (currentImageCount + newImageCount > 3) {
      throw new ForbiddenException('Maximum 3 images per listing');
    }

    await this.imageService.processAndStore(listingId, files);

    // Return updated listing with images
    return this.findOne(listingId, userId);
  }

  async deleteImage(listingId: string, imageId: string, userId: string) {
    const listing = await this.prisma.listing.findUnique({
      where: { id: listingId, deletedAt: null },
    });

    if (!listing) {
      throw new NotFoundException('Listing not found');
    }

    if (listing.creatorId !== userId) {
      throw new ForbiddenException('You can only delete images from your own listings');
    }

    await this.imageService.deleteImage(imageId);
  }
}
