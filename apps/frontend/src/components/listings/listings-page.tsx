'use client';

import { useEffect, useState, useMemo, useCallback, Suspense } from 'react';
import { useTranslations } from 'next-intl';
import { useSearchParams } from 'next/navigation';
import { useRouter, usePathname } from '@/navigation';
import { api } from '@/lib/api';
import { Listing, FilterListingsDto, PaginatedResponse } from '@localshare/shared';
import { ListingCard } from './listing-card';
import { ListingFilters } from './listing-filters';
import { Button } from '@/components/ui/button';
import { Link } from '@/navigation';
import { useAuth } from '@/hooks/use-auth';
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';
import { parseFiltersFromURL, buildURLFromFilters, getPageFromURL } from '@/lib/utils/url-filters';

const ITEMS_PER_PAGE = 30;

function ListingsPageContent() {
  const t = useTranslations();
  const { user } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);

  // Derive page from URL (single source of truth)
  const page = useMemo(() => getPageFromURL(searchParams), [searchParams]);

  // Derive filters from URL (single source of truth)
  const filters = useMemo(
    () => parseFiltersFromURL(searchParams, ITEMS_PER_PAGE),
    [searchParams]
  );

  // Fetch listings from API based on current filters
  const fetchListings = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filters.myListings) params.append('myListings', 'true');
      if (filters.bookmarked) params.append('bookmarked', 'true');
      if (filters.types?.length) {
        filters.types.forEach((type) => params.append('types', type));
      }
      if (filters.categories?.length) {
        filters.categories.forEach((cat) => params.append('categories', cat));
      }
      if (filters.search) params.append('search', filters.search);
      if (filters.limit) params.append('limit', filters.limit.toString());
      if (filters.offset !== undefined) params.append('offset', filters.offset.toString());

      const { data } = await api.get<PaginatedResponse<Listing>>(
        `/listings/paginated?${params.toString()}`
      );

      setListings(data.data);
      setTotal(data.total);
    } catch (error) {
      console.error('Failed to fetch listings:', error);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchListings();
  }, [fetchListings]);

  // Handle filter changes - update URL (use replace to avoid history pollution)
  const handleFilterChange = useCallback(
    (newFilters: Partial<FilterListingsDto>) => {
      // Merge current filters with new filters and reset to page 1
      const updatedFilters = { ...filters, ...newFilters };
      const urlString = buildURLFromFilters(updatedFilters, searchParams, 1);

      // Use replace for filter changes (don't add to browser history)
      router.replace(`${pathname}?${urlString}`);
    },
    [filters, searchParams, pathname, router]
  );

  // Handle page changes - update URL (use push to enable browser back/forward)
  const handlePageChange = useCallback(
    (newPage: number) => {
      const totalPages = Math.ceil(total / ITEMS_PER_PAGE);

      // Validate page bounds
      if (newPage < 1) newPage = 1;
      if (newPage > totalPages && totalPages > 0) newPage = totalPages;

      // Build URL with new page number
      const urlString = buildURLFromFilters(filters, searchParams, newPage);

      // Use push for pagination (enable browser back/forward navigation)
      router.push(`${pathname}?${urlString}`);

      // Scroll to top
      window.scrollTo({ top: 0, behavior: 'smooth' });
    },
    [filters, searchParams, pathname, router, total]
  );

  const totalPages = Math.ceil(total / ITEMS_PER_PAGE);
  const showPagination = total > ITEMS_PER_PAGE;

  // Generate page numbers to display
  const getPageNumbers = () => {
    const pages: (number | 'ellipsis')[] = [];
    const showEllipsis = totalPages > 7;

    if (!showEllipsis) {
      // Show all pages if <= 7
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Always show first page
      pages.push(1);

      if (page > 3) {
        pages.push('ellipsis');
      }

      // Show pages around current page
      const start = Math.max(2, page - 1);
      const end = Math.min(totalPages - 1, page + 1);

      for (let i = start; i <= end; i++) {
        pages.push(i);
      }

      if (page < totalPages - 2) {
        pages.push('ellipsis');
      }

      // Always show last page
      if (totalPages > 1) {
        pages.push(totalPages);
      }
    }

    return pages;
  };

  return (
    <div className="container py-8">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* Filters Sidebar - Hidden on mobile */}
        <aside className="hidden md:block md:col-span-1 h-fit sticky top-[101px]">
          <ListingFilters filters={filters} onChange={handleFilterChange} />
        </aside>

        {/* Listings Grid */}
        <div className="col-span-1 md:col-span-3">
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {[...Array(6)].map((_, i) => (
                <div
                  key={i}
                  className="h-64 bg-muted animate-pulse rounded-lg"
                />
              ))}
            </div>
          ) : listings.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground mb-4">{t('listings.empty')}</p>
              {user && (
                <Link href="/listings/create">
                  <Button>{t('listings.create')}</Button>
                </Link>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {listings.map((listing, index) => (
                <ListingCard
                  key={listing.id}
                  listing={listing}
                  priority={index < 9}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Pagination - Full width, outside grid */}
      {showPagination && !loading && (
        <div className="mt-8">
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  previousText={t('common.previous')}
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    if (page > 1) handlePageChange(page - 1);
                  }}
                  className={
                    page === 1
                      ? 'pointer-events-none opacity-50'
                      : 'cursor-pointer'
                  }
                />
              </PaginationItem>

              {getPageNumbers().map((pageNum, idx) => (
                <PaginationItem key={idx}>
                  {pageNum === 'ellipsis' ? (
                    <PaginationEllipsis srText={t('common.morePages')} />
                  ) : (
                    <PaginationLink
                      href="#"
                      onClick={(e) => {
                        e.preventDefault();
                        handlePageChange(pageNum);
                      }}
                      isActive={pageNum === page}
                      className="cursor-pointer"
                    >
                      {pageNum}
                    </PaginationLink>
                  )}
                </PaginationItem>
              ))}

              <PaginationItem>
                <PaginationNext
                  nextText={t('common.next')}
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    if (page < totalPages) handlePageChange(page + 1);
                  }}
                  className={
                    page >= totalPages
                      ? 'pointer-events-none opacity-50'
                      : 'cursor-pointer'
                  }
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>

          {/* Page info */}
          <div className="text-center mt-4 text-sm text-muted-foreground">
            {t('common.showingResults', {
              from: (page - 1) * ITEMS_PER_PAGE + 1,
              to: Math.min(page * ITEMS_PER_PAGE, total),
              total,
            })}
          </div>
        </div>
      )}
    </div>
  );
}

export function ListingsPage() {
  return (
    <Suspense
      fallback={
        <div className="container py-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => (
              <div
                key={i}
                className="h-64 bg-muted animate-pulse rounded-lg"
              />
            ))}
          </div>
        </div>
      }
    >
      <ListingsPageContent />
    </Suspense>
  );
}
