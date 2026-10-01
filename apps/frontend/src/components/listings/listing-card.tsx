'use client';

import { Listing } from '@localshare/shared';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useTranslations, useLocale } from 'next-intl';
import { Link } from '@/navigation';
import { formatPrice, formatRelativeDate, getImageUrl, shouldShowPrice } from '@/lib/utils';
import { useToggleBookmark } from '@/lib/api/listings';
import { Bookmark } from 'lucide-react';
import Image from 'next/image';

interface ListingCardProps {
  listing: Listing;
  priority?: boolean;
}

export function ListingCard({ listing, priority }: ListingCardProps) {
  const t = useTranslations();
  const locale = useLocale();
  const toggleBookmark = useToggleBookmark(listing.id);
  const isBookmarked = toggleBookmark.data?.isBookmarked ?? listing.isBookmarked ?? false;

  // Prefer cover image, fallback to first image
  const coverImage = listing.images.find((img) => img.isCover) || listing.images[0];

  const handleBookmarkClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    // Failures stay silent; the icon simply keeps its state
    if (!toggleBookmark.isPending) toggleBookmark.mutate();
  };

  return (
    <Link href={`/listings/${listing.id}`}>
      <Card className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer h-full flex flex-col">
        {/* Image - use thumbnail for faster loading */}
        <div className="relative h-48 bg-muted">
          {coverImage ? (
            <Image
              src={getImageUrl(coverImage.thumbnailUrl || coverImage.url)}
              alt={listing.title}
              fill
              sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw"
              className="object-cover"
              priority={priority}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-muted-foreground">
              {t('listings.noImage')}
            </div>
          )}
          {/* Bookmark button overlay - only for non-owners */}
          {listing.viewer.canBookmark && (
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-2 right-2 h-8 w-8 bg-background/80 hover:bg-background/90 backdrop-blur-sm"
              onClick={handleBookmarkClick}
              disabled={toggleBookmark.isPending}
              aria-label={isBookmarked ? t('listings.bookmarked') : t('listings.bookmark')}
            >
              <Bookmark
                className={`h-4 w-4 transition-colors ${
                  isBookmarked ? 'fill-primary text-primary' : 'text-muted-foreground'
                }`}
              />
            </Button>
          )}
        </div>

        <CardContent className="p-4">
          <h3 className="font-semibold text-lg line-clamp-2 mb-2 break-words">
            {listing.title}
          </h3>

          {listing.description && (
            <p className="text-sm text-muted-foreground line-clamp-3 mb-3 break-words">
              {listing.description}
            </p>
          )}

          {/* Price or Type Indicator */}
          {shouldShowPrice(listing.type) && listing.price !== null ? (
            <p className="text-sm text-muted-foreground">
              {formatPrice(listing.price, listing.priceTimeUnit, t)}
            </p>
          ) : (
            <p className="text-sm text-muted-foreground">
              {t(`listings.types.${listing.type}`)}
            </p>
          )}
        </CardContent>

        <CardFooter className="p-4 pt-0 mt-auto">
          <div className="flex items-center justify-between w-full text-xs text-muted-foreground">
            <span>{listing.creator?.firstName} {listing.creator?.lastName}</span>
            <span>{formatRelativeDate(listing.createdAt, locale)}</span>
          </div>
        </CardFooter>
      </Card>
    </Link>
  );
}
