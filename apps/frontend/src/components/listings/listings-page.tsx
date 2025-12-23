'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { api } from '@/lib/api';
import { Listing, FilterListingsDto, ListingType, ListingCategory } from '@localshare/shared';
import { ListingCard } from './listing-card';
import { ListingFilters } from './listing-filters';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@/hooks/use-auth';

export function ListingsPage() {
  const t = useTranslations();
  const { user } = useAuth();
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<FilterListingsDto>({
    limit: 20,
    offset: 0,
  });

  useEffect(() => {
    fetchListings();
  }, [filters]);

  const fetchListings = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filters.myListings) params.append('myListings', 'true');
      if (filters.types?.length) {
        filters.types.forEach((type) => params.append('types', type));
      }
      if (filters.categories?.length) {
        filters.categories.forEach((cat) => params.append('categories', cat));
      }
      if (filters.search) params.append('search', filters.search);
      if (filters.limit) params.append('limit', filters.limit.toString());
      if (filters.offset) params.append('offset', filters.offset.toString());

      const { data } = await api.get<Listing[]>(`/listings?${params.toString()}`);
      setListings(data);
    } catch (error) {
      console.error('Failed to fetch listings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (newFilters: Partial<FilterListingsDto>) => {
    setFilters((prev) => ({ ...prev, ...newFilters, offset: 0 }));
  };

  return (
    <div className="container py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">{t('listings.title')}</h1>
        {user && (
          <Link href="/listings/create">
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              {t('listings.create')}
            </Button>
          </Link>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* Filters Sidebar */}
        <aside className="md:col-span-1">
          <ListingFilters filters={filters} onChange={handleFilterChange} />
        </aside>

        {/* Listings Grid */}
        <div className="md:col-span-3">
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
              {listings.map((listing) => (
                <ListingCard key={listing.id} listing={listing} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
