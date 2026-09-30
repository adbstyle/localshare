'use client';

import { useTranslations } from 'next-intl';
import { CreateListingDto } from '@localshare/shared';
import { useRouter } from '@/navigation';
import { useCreateListing } from '@/lib/api/listings';
import { useToast } from '@/hooks/use-toast';
import { useErrorToast } from '@/hooks/use-error-toast';
import { ListingForm } from '@/components/listings/listing-form';

export default function CreateListingPage() {
  const router = useRouter();
  const t = useTranslations();
  const { toast } = useToast();
  const showError = useErrorToast();
  const createListing = useCreateListing();

  const handleSubmit = async (dto: CreateListingDto, files: File[]) => {
    try {
      const { listing, imagesFailed } = await createListing.mutateAsync({ dto, files });
      toast(
        imagesFailed
          ? { variant: 'warning', title: t('listings.created'), description: t('listings.imageUploadFailed') }
          : { variant: 'success', title: t('listings.created') }
      );
      router.push(`/listings/${listing.id}`);
    } catch (error) {
      showError(error, 'errors.failedToCreateListing');
    }
  };

  return (
    <div className="container max-w-3xl py-8">
      <h1 className="text-2xl sm:text-3xl font-bold mb-8">{t('listings.create')}</h1>
      <ListingForm onSubmit={handleSubmit} />
    </div>
  );
}
