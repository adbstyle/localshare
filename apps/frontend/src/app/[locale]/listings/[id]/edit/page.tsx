'use client';

import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useParams } from 'next/navigation';
import { useRouter } from '@/navigation';
import { useTranslations } from 'next-intl';
import { useToast } from '@/hooks/use-toast';
import { useErrorToast } from '@/hooks/use-error-toast';
import { api } from '@/lib/api/client';
import { UpdateListingDto } from '@localshare/shared';
import { listingQueries } from '@/lib/api/listings';
import { ListingForm } from '@/components/listings/listing-form';

export default function EditListingPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const t = useTranslations();
  const { toast } = useToast();
  const showError = useErrorToast();
  const { data: listing, isError } = useQuery(listingQueries.detail(params.id));

  // Only the owner may edit; everyone else goes back to the listing (or home)
  useEffect(() => {
    if (isError) {
      toast({ title: t('errors.notFound'), variant: 'destructive' });
      router.push('/');
    } else if (listing && !listing.viewer.canEdit) {
      router.replace(`/listings/${params.id}`);
    }
  }, [isError, listing, params.id, router, t, toast]);

  const handleSubmit = async (data: UpdateListingDto, pendingFiles?: File[]) => {
    try {
      await api.patch(`/listings/${params.id}`, data);
      toast({
        variant: 'success',
        title: t('listings.updated'),
      });
      router.push(`/listings/${params.id}`);
    } catch (error: any) {
      showError(error, 'errors.failedToUpdateListing');
      throw error;
    }
  };

  if (!listing?.viewer.canEdit) {
    return (
      <div className="container max-w-3xl py-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-1/3"></div>
          <div className="h-96 bg-muted rounded"></div>
        </div>
      </div>
    );
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
