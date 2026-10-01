import { ListingImage, Prisma } from '@prisma/client';
import { listingViewer } from '../access/permissions';
import { listingCardInclude, listingDetailInclude } from './listing-query';

// Prisma rows -> API responses. Image URLs come from the storage config, so the
// caller passes the converter (ImageService.toDto).

type ImageToDto<T> = (img: ListingImage) => T;
type CardRow = Prisma.ListingGetPayload<{ include: ReturnType<typeof listingCardInclude> }>;
type DetailRow = Prisma.ListingGetPayload<{ include: ReturnType<typeof listingDetailInclude> }>;

export function toListingListItem<T>(row: CardRow, userId: string, toImage: ImageToDto<T>) {
  const { bookmarks, images, ...listing } = row;
  return {
    ...listing,
    isBookmarked: bookmarks.length > 0,
    images: images.map(toImage),
    viewer: listingViewer(listing, userId),
  };
}

export function toListingDetail<T>(row: DetailRow, userId: string, toImage: ImageToDto<T>) {
  const { bookmarks, visibility, images, creator, ...listing } = row;
  const viewer = listingViewer(listing, userId);

  return {
    ...listing,
    // Own contact details are pointless on one's own listing
    creator: viewer.isOwner ? { ...creator, email: '', homeAddress: null, phoneNumber: null } : creator,
    isBookmarked: bookmarks.length > 0,
    visibility: visibility.map((v) => ({ communityId: v.communityId, community: v.community })),
    images: images.map(toImage),
    viewer,
  };
}
