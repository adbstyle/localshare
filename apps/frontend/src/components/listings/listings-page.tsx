'use client';

import { useMemo, useCallback, Suspense } from 'react';
import { useTranslations } from 'next-intl';
import { useSearchParams } from 'next/navigation';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { useRouter, usePathname, Link } from '@/navigation';
import { FilterListingsDto } from '@localshare/shared';
import { listingQueries } from '@/lib/api/listings';
import { cn } from '@/lib/utils';
import { parseFiltersFromURL, buildURLFromFilters, getPageFromURL } from '@/lib/utils/url-filters';
import { Button } from '@/components/ui/button';
import { ListingCard } from './listing-card';
import { ListingFilters } from './listing-filters';
import { ListingsPagination } from './listings-pagination';

const ITEMS_PER_PAGE = 30;

function ListingsGridSkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {[...Array(6)].map((_, i) => (
        <div key={i} className="h-64 bg-muted animate-pulse rounded-lg" />
      ))}
    </div>
  );
}

function ListingsPageContent() {
  const t = useTranslations();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // The URL is the single source of truth for page and filters
  const page = useMemo(() => getPageFromURL(searchParams), [searchParams]);
  const filters = useMemo(() => parseFiltersFromURL(searchParams, ITEMS_PER_PAGE), [searchParams]);

  // Previous results stay visible while the next filter/page loads; stale requests are aborted
  const { data, isPending, isPlaceholderData } = useQuery({
    ...listingQueries.list(filters),
    placeholderData: keepPreviousData,
  });
  const listings = data?.data ?? [];
  const total = data?.total ?? 0;

  // Filter changes replace the history entry and go back to page 1
  const handleFilterChange = useCallback(
    (newFilters: Partial<FilterListingsDto>) => {
      router.replace(`${pathname}?${buildURLFromFilters({ ...filters, ...newFilters }, 1)}`);
    },
    [filters, pathname, router]
  );

  // Page changes push so browser back/forward works
  const handlePageChange = useCallback(
    (newPage: number) => {
      router.push(`${pathname}?${buildURLFromFilters(filters, newPage)}`);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    },
    [filters, pathname, router]
  );

  return (
    <div className="container py-8">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* Filters Sidebar - Hidden on mobile */}
        <aside className="hidden md:block md:col-span-1 h-fit sticky top-[101px]">
          <ListingFilters filters={filters} onChange={handleFilterChange} />
        </aside>

        <div className="col-span-1 md:col-span-3">
          {isPending ? (
            <ListingsGridSkeleton />
          ) : listings.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground mb-4">{t('listings.empty')}</p>
              <Link href="/listings/create">
                <Button>{t('listings.create')}</Button>
              </Link>
            </div>
          ) : (
            <div
              className={cn(
                'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 transition-opacity',
                isPlaceholderData && 'opacity-60'
              )}
              aria-busy={isPlaceholderData}
            >
              {listings.map((listing, index) => (
                <ListingCard key={listing.id} listing={listing} priority={index < 3} />
              ))}
            </div>
          )}
        </div>
      </div>

      {total > ITEMS_PER_PAGE && !isPending && (
        <ListingsPagination
          page={page}
          pageSize={ITEMS_PER_PAGE}
          total={total}
          onPageChange={handlePageChange}
        />
      )}
    </div>
  );
}

export function ListingsPage() {
  return (
    <Suspense
      fallback={
        <div className="container py-8">
          <ListingsGridSkeleton />
        </div>
      }
    >
      <ListingsPageContent />
    </Suspense>
  );
}
