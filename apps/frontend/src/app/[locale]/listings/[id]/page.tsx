'use client';

import { useEffect } from 'react';
import { useParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { useTranslations, useLocale } from 'next-intl';
import { Bookmark } from 'lucide-react';
import { Listing } from '@localshare/shared';
import { useRouter } from '@/navigation';
import { listingQueries, useToggleBookmark } from '@/lib/api/listings';
import { useToast } from '@/hooks/use-toast';
import { useErrorToast } from '@/hooks/use-error-toast';
import { formatPrice, formatRelativeDate, shouldShowPrice } from '@/lib/utils';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ListingGallery } from '@/components/listings/listing-gallery';
import { ListingOwnerActions } from '@/components/listings/listing-owner-actions';
import { ListingContactCard } from '@/components/listings/listing-contact-card';

function DetailSkeleton() {
  return (
    <div className="container py-8">
      <div className="animate-pulse space-y-4">
        <div className="h-96 bg-muted rounded-lg"></div>
        <div className="h-8 bg-muted rounded w-3/4"></div>
        <div className="h-4 bg-muted rounded w-1/2"></div>
      </div>
    </div>
  );
}

function BookmarkButton({ listing }: { listing: Listing }) {
  const t = useTranslations('listings');
  const showError = useErrorToast();
  const toggleBookmark = useToggleBookmark(listing.id);

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={() => toggleBookmark.mutate(undefined, { onError: (e) => showError(e, 'errors.unexpectedError') })}
      disabled={toggleBookmark.isPending}
      aria-label={listing.isBookmarked ? t('bookmarked') : t('bookmark')}
    >
      <Bookmark
        className={`h-5 w-5 transition-colors ${
          listing.isBookmarked ? 'fill-primary text-primary' : 'text-muted-foreground'
        }`}
      />
    </Button>
  );
}

function ListingHeader({ listing }: { listing: Listing }) {
  const t = useTranslations();
  const price = listing.price !== null && shouldShowPrice(listing.type)
    ? formatPrice(listing.price, listing.priceTimeUnit, t)
    : null;

  return (
    <div className="relative">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2" role="group" aria-label={t('listings.typeAndCategory')}>
          <Badge variant="secondary" className="text-sm">{t(`listings.types.${listing.type}`)}</Badge>
          <Badge variant="outline" className="text-sm">{t(`listings.categories.${listing.category}`)}</Badge>
        </div>
        {listing.viewer.canBookmark && <BookmarkButton listing={listing} />}
      </div>

      <h1 className="text-3xl font-bold leading-tight mb-4 break-words">{listing.title}</h1>

      {price && (
        <p className="text-xl font-semibold text-muted-foreground mb-6" aria-label={t('listings.priceLabel', { price })}>
          {price}
        </p>
      )}

      {listing.viewer.canEdit && <ListingOwnerActions listingId={listing.id} />}
    </div>
  );
}

function ListingMeta({ listing }: { listing: Listing }) {
  const t = useTranslations('listings');
  const locale = useLocale();
  const sharedWith = listing.visibility?.map((v) => v.community.name) ?? [];

  return (
    <dl className="space-y-4">
      <div className="text-sm text-muted-foreground pt-4 border-t">
        <dt className="inline">{t('createdAt')}: </dt>
        <dd className="inline">
          <time dateTime={listing.createdAt}>{formatRelativeDate(listing.createdAt, locale)}</time>
        </dd>
      </div>
      {sharedWith.length > 0 && (
        <div className="text-sm text-muted-foreground">
          <dt className="inline">{t('sharedWith')}: </dt>
          <dd className="inline">{sharedWith.join(', ')}</dd>
        </div>
      )}
    </dl>
  );
}

export default function ListingDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const t = useTranslations();
  const { toast } = useToast();
  const { data: listing, isError } = useQuery(listingQueries.detail(id));

  useEffect(() => {
    if (!isError) return;
    toast({ title: t('errors.notFound'), description: t('listings.notFoundDescription'), variant: 'destructive' });
    router.push('/');
  }, [isError, toast, t, router]);

  if (!listing) return <DetailSkeleton />;


  return (
    <div className="container py-8">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        <div className="lg:col-span-2">
          <article>
            <Card>
              <CardHeader>
                <ListingHeader listing={listing} />
              </CardHeader>
              <CardContent className="space-y-6">
                <ListingGallery title={listing.title} images={listing.images || []} />
                {listing.description && (
                  <section aria-label={t('listings.description')}>
                    <p className="text-base text-muted-foreground leading-relaxed whitespace-pre-wrap break-words">
                      {listing.description}
                    </p>
                  </section>
                )}
                <ListingMeta listing={listing} />
              </CardContent>
            </Card>
          </article>
        </div>

        <div className="lg:col-span-1">
          <ListingContactCard listing={listing} />
        </div>
      </div>
    </div>
  );
}
