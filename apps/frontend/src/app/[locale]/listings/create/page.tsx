'use client';

import { ListingForm } from '@/components/listings/listing-form';
import { useRouter } from '@/navigation';
import { useTranslations } from 'next-intl';
import { useToast } from '@/hooks/use-toast';
import { api } from '@/lib/api';
import { CreateListingDto } from '@localshare/shared';

export default function CreateListingPage() {
  const router = useRouter();
  const t = useTranslations();
  const { toast } = useToast();

  const handleSubmit = async (data: CreateListingDto, pendingFiles?: File[]) => {
    try {
      // Step 1: Create the listing
      const { data: listing } = await api.post('/listings', data);

      // Step 2: Upload images if any
      if (pendingFiles && pendingFiles.length > 0) {
        try {
          const formData = new FormData();
          pendingFiles.forEach((file) => formData.append('images', file));

          await api.post(`/listings/${listing.id}/images`, formData, {
            headers: {
              'Content-Type': 'multipart/form-data',
            },
          });

          toast({
            variant: 'success',
            title: t('listings.created'),
          });
        } catch (imageError: any) {
          // Listing was created but images failed
          toast({
            variant: 'warning',
            title: t('listings.created'),
            description: t('listings.imageUploadFailed'),
          });
        }
      } else {
        toast({
          variant: 'success',
          title: t('listings.created'),
        });
      }

      router.push(`/listings/${listing.id}`);
    } catch (error: any) {
      toast({
        title: t('errors.generic'),
        description: error.response?.data?.message || 'Failed to create listing',
        variant: 'destructive',
      });
      throw error;
    }
  };

  return (
    <div className="container max-w-3xl py-8">
      <h1 className="text-2xl sm:text-3xl font-bold mb-8">{t('listings.create')}</h1>
      <ListingForm onSubmit={handleSubmit} />
    </div>
  );
}
