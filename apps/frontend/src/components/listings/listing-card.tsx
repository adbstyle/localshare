'use client';

import { Listing } from '@localshare/shared';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { formatPrice, formatDate, shouldShowPrice } from '@/lib/utils';
import Image from 'next/image';
import { MapPin } from 'lucide-react';

interface ListingCardProps {
  listing: Listing;
}

export function ListingCard({ listing }: ListingCardProps) {
  const t = useTranslations();
  const firstImage = listing.images[0];
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

  return (
    <Link href={`/listings/${listing.id}`}>
      <Card className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer h-full">
        {/* Image */}
        <div className="relative h-48 bg-muted">
          {firstImage ? (
            <Image
              src={`${apiUrl}${firstImage.url}`}
              alt={listing.title}
              fill
              className="object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-muted-foreground">
              No image
            </div>
          )}
          {/* Type Badge */}
          <div className="absolute top-2 right-2">
            <Badge variant={listing.type === 'SELL' ? 'default' : 'secondary'}>
              {t(`listings.types.${listing.type}`)}
            </Badge>
          </div>
        </div>

        <CardContent className="p-4">
          <h3 className="font-semibold text-lg line-clamp-2 mb-2">
            {listing.title}
          </h3>

          {listing.price !== null && shouldShowPrice(listing.type) && (
            <p className="text-xl font-bold text-primary mb-2">
              {formatPrice(listing.price)}
            </p>
          )}

          {listing.description && (
            <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
              {listing.description}
            </p>
          )}

          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <MapPin className="h-3 w-3" />
            {listing.creator?.firstName} {listing.creator?.lastName}
          </div>
        </CardContent>

        <CardFooter className="p-4 pt-0">
          <div className="flex items-center justify-between w-full text-xs text-muted-foreground">
            <span>{t(`listings.categories.${listing.category}`)}</span>
            <span>{formatDate(listing.createdAt)}</span>
          </div>
        </CardFooter>
      </Card>
    </Link>
  );
}
