import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { CreateListingDto, UpdateListingDto, FilterListingsDto } from './dto';
import { VisibilityService } from './visibility.service';
import { ImageService } from './image.service';
import { PaginatedResponse } from '../common/types';
import { ListingType } from '@prisma/client';

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
        priceTimeUnit: dto.type === ListingType.RENT ? dto.priceTimeUnit : null,
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

  async toggleBookmark(listingId: string, userId: string): Promise<{ isBookmarked: boolean }> {
    // Check if listing exists and user can view it
    const listing = await this.prisma.listing.findUnique({
      where: { id: listingId, deletedAt: null },
    });

    if (!listing) {
      throw new NotFoundException('Listing not found');
    }

    const canView = await this.visibilityService.canUserViewListing(userId, listingId);
    if (!canView) {
      throw new ForbiddenException('You do not have access to this listing');
    }

    // Check if bookmark exists
    const existingBookmark = await this.prisma.listingBookmark.findUnique({
      where: {
        userId_listingId: { userId, listingId },
      },
    });

    if (existingBookmark) {
      // Remove bookmark
      await this.prisma.listingBookmark.delete({
        where: { id: existingBookmark.id },
      });
      return { isBookmarked: false };
    } else {
      // Create bookmark
      await this.prisma.listingBookmark.create({
        data: { userId, listingId },
      });
      return { isBookmarked: true };
    }
  }

  async findAll(userId: string, filters: FilterListingsDto) {
    const visibleListingIds = await this.visibilityService.getVisibleListingIds(
      userId,
    );

    // Get user's bookmarked listing IDs
    const userBookmarks = await this.prisma.listingBookmark.findMany({
      where: { userId },
      select: { listingId: true },
    });
    const bookmarkedIds = new Set(userBookmarks.map((b) => b.listingId));

    const where: any = {
      id: { in: visibleListingIds },
      deletedAt: null,
    };

    // Apply filters
    if (filters.myListings) {
      where.creatorId = userId;
    }

    // Filter by bookmarked listings (intersect with visible listings)
    if (filters.bookmarked) {
      const visibleBookmarkedIds = Array.from(bookmarkedIds).filter(id => visibleListingIds.includes(id));
      where.id = { in: visibleBookmarkedIds };
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
          orderBy: [{ isCover: 'desc' }, { orderIndex: 'asc' }],
          take: 1, // Cover image for list view
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

    // Map image URLs and add isBookmarked field
    return listings.map((listing) => ({
      ...listing,
      isBookmarked: bookmarkedIds.has(listing.id),
      images: listing.images.map((img) => ({
        ...img,
        url: this.imageService.getImageUrl(img.filename),
        thumbnailUrl:
          this.imageService.getThumbnailUrl(img.thumbnailFilename) ||
          this.imageService.getImageUrl(img.filename),
      })),
    }));
  }

  // Note: Using 'any' here because list view returns a subset of Listing fields
  // (no visibility data, limited creator fields). Consider creating a ListingListItem type.
  async findAllPaginated(userId: string, filters: FilterListingsDto): Promise<PaginatedResponse<any>> {
    const visibleListingIds = await this.visibilityService.getVisibleListingIds(
      userId,
    );

    // Get user's bookmarked listing IDs
    const userBookmarks = await this.prisma.listingBookmark.findMany({
      where: { userId },
      select: { listingId: true },
    });
    const bookmarkedIds = new Set(userBookmarks.map((b) => b.listingId));

    const where: any = {
      id: { in: visibleListingIds },
      deletedAt: null,
    };

    // Apply filters
    if (filters.myListings) {
      where.creatorId = userId;
    }

    // Filter by bookmarked listings (intersect with visible listings)
    if (filters.bookmarked) {
      const visibleBookmarkedIds = Array.from(bookmarkedIds).filter(id => visibleListingIds.includes(id));
      where.id = { in: visibleBookmarkedIds };
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
            orderBy: [{ isCover: 'desc' }, { orderIndex: 'asc' }],
            take: 1, // Cover image for list view
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

    // Map image URLs and add isBookmarked field
    const mappedListings = listings.map((listing) => ({
      ...listing,
      isBookmarked: bookmarkedIds.has(listing.id),
      images: listing.images.map((img) => ({
        ...img,
        url: this.imageService.getImageUrl(img.filename),
        thumbnailUrl:
          this.imageService.getThumbnailUrl(img.thumbnailFilename) ||
          this.imageService.getImageUrl(img.filename),
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
          orderBy: [{ isCover: 'desc' }, { orderIndex: 'asc' }],
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

    // Check if user has bookmarked this listing
    const bookmark = await this.prisma.listingBookmark.findUnique({
      where: {
        userId_listingId: { userId, listingId: id },
      },
    });

    // Map image URLs and transform visibility to match TypeScript interface
    return {
      ...listing,
      isBookmarked: !!bookmark,
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
        thumbnailUrl:
          this.imageService.getThumbnailUrl(img.thumbnailFilename) ||
          this.imageService.getImageUrl(img.filename),
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

    // Determine effective type: use dto.type if provided, otherwise keep existing
    const effectiveType = dto.type ?? listing.type;

    const updated = await this.prisma.listing.update({
      where: { id },
      data: {
        title: dto.title,
        description: dto.description,
        type: dto.type,
        price: dto.price,
        priceTimeUnit:
          effectiveType === ListingType.RENT ? dto.priceTimeUnit : null,
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
      include: { images: true },
    });

    if (!listing) {
      throw new NotFoundException('Listing not found');
    }

    if (listing.creatorId !== userId) {
      throw new ForbiddenException('You can only delete images from your own listings');
    }

    // Verify image belongs to this listing (security: prevent IDOR)
    const imageExists = listing.images.some((img) => img.id === imageId);
    if (!imageExists) {
      throw new NotFoundException('Image not found in this listing');
    }

    await this.imageService.deleteImage(imageId);

    // Return updated listing with refreshed cover state
    return this.findOne(listingId, userId);
  }

  async setCoverImage(listingId: string, imageId: string, userId: string) {
    const listing = await this.prisma.listing.findUnique({
      where: { id: listingId, deletedAt: null },
      include: { images: true },
    });

    if (!listing) {
      throw new NotFoundException('Listing not found');
    }

    if (listing.creatorId !== userId) {
      throw new ForbiddenException('You can only set cover image for your own listings');
    }

    // Verify image belongs to this listing
    const imageExists = listing.images.some((img) => img.id === imageId);
    if (!imageExists) {
      throw new NotFoundException('Image not found in this listing');
    }

    await this.imageService.setCoverImage(listingId, imageId);

    return this.findOne(listingId, userId);
  }
}
