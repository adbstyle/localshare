import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { CreateListingDto, UpdateListingDto, FilterListingsDto } from './dto';
import { VisibilityService } from './visibility.service';
import { ImageService } from './image.service';
import { PaginatedResponse } from '../common/types';

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
        priceTimeUnit: dto.priceTimeUnit,
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

  // Note: Using 'any' here because list view returns a subset of Listing fields
  // (no visibility data, limited creator fields). Consider creating a ListingListItem type.
  async findAllPaginated(userId: string, filters: FilterListingsDto): Promise<PaginatedResponse<any>> {
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

    // Parallel queries for performance
    const [listings, total] = await Promise.all([
      this.prisma.listing.findMany({
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
        take: filters.limit || 30,
        skip: filters.offset || 0,
      }),
      this.prisma.listing.count({ where }),
    ]);

    // Map image URLs
    const mappedListings = listings.map((listing) => ({
      ...listing,
      images: listing.images.map((img) => ({
        ...img,
        url: this.imageService.getImageUrl(img.filename),
      })),
    }));

    return {
      data: mappedListings,
      total,
      limit: filters.limit || 30,
      offset: filters.offset || 0,
    };
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

    // Filter visibility based on user membership
    // Exception: Listing owner sees all visibility entries
    let filteredVisibility = listing.visibility;

    if (listing.creatorId !== userId) {
      // Get user's community and group memberships
      const [userCommunities, userGroups] = await Promise.all([
        this.prisma.communityMember.findMany({
          where: { userId },
          select: { communityId: true },
        }),
        this.prisma.groupMember.findMany({
          where: { userId },
          select: { groupId: true },
        }),
      ]);

      const userCommunityIds = new Set(userCommunities.map(m => m.communityId));
      const userGroupIds = new Set(userGroups.map(m => m.groupId));

      // Filter visibility to only show where user is a member
      filteredVisibility = listing.visibility.filter((v) => {
        if (v.communityId && userCommunityIds.has(v.communityId)) return true;
        if (v.groupId && userGroupIds.has(v.groupId)) return true;
        return false;
      });
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
      visibility: filteredVisibility.map((v) => ({
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
        priceTimeUnit: dto.priceTimeUnit,
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
