'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { useRouter } from '@/navigation';
import { useTranslations } from 'next-intl';
import { useToast } from '@/hooks/use-toast';
import { api } from '@/lib/api';
import { Listing, UpdateListingDto } from '@localshare/shared';
import { ListingForm } from '@/components/listings/listing-form';

export default function EditListingPage() {
  const params = useParams();
  const router = useRouter();
  const t = useTranslations();
  const { toast } = useToast();
  const [listing, setListing] = useState<Listing | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchListing();
  }, [params.id]);

  const fetchListing = async () => {
    try {
      const { data } = await api.get<Listing>(`/listings/${params.id}`);
      setListing(data);
    } catch (error) {
      toast({
        title: t('errors.notFound'),
        variant: 'destructive',
      });
      router.push('/');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (data: UpdateListingDto, pendingFiles?: File[]) => {
    try {
      await api.patch(`/listings/${params.id}`, data);
      toast({
        variant: 'success',
        title: t('listings.updated'),
      });
      router.push(`/listings/${params.id}`);
    } catch (error: any) {
      toast({
        title: t('errors.generic'),
        description: error.response?.data?.message || t('errors.failedToUpdateListing'),
        variant: 'destructive',
      });
      throw error;
    }
  };

  if (loading) {
    return (
      <div className="container max-w-3xl py-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-1/3"></div>
          <div className="h-96 bg-muted rounded"></div>
        </div>
      </div>
    );
  }

  if (!listing) {
    return null;
  }

  return (
    <div className="container max-w-3xl py-8">
      <h1 className="text-2xl sm:text-3xl font-bold mb-8">{t('listings.edit')}</h1>
      <ListingForm
        listing={listing}
        onSubmit={handleSubmit}
      />
    </div>
  );
}
