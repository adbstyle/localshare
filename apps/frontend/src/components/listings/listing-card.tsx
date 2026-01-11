'use client';

import { Listing } from '@localshare/shared';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { useTranslations, useLocale } from 'next-intl';
import Link from 'next/link';
import { formatPrice, formatRelativeDate, shouldShowPrice } from '@/lib/utils';
import Image from 'next/image';

interface ListingCardProps {
  listing: Listing;
}

export function ListingCard({ listing }: ListingCardProps) {
  const t = useTranslations();
  const locale = useLocale();
  const firstImage = listing.images[0];
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

  const getImageUrl = (url: string) => {
    if (url.startsWith('http')) return url;
    return `${apiUrl}${url}`;
  };

  return (
    <Link href={`/listings/${listing.id}`}>
      <Card className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer h-full flex flex-col">
        {/* Image */}
        <div className="relative h-48 bg-muted">
          {firstImage ? (
            <Image
              src={getImageUrl(firstImage.url)}
              alt={listing.title}
              fill
              className="object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-muted-foreground">
              {t('listings.noImage')}
            </div>
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
