'use client';

import { ListingForm } from '@/components/listings/listing-form';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useToast } from '@/hooks/use-toast';
import { api } from '@/lib/api';
import { CreateListingDto } from '@localshare/shared';

export default function CreateListingPage() {
  const router = useRouter();
  const t = useTranslations();
  const { toast } = useToast();

  const handleSubmit = async (data: CreateListingDto) => {
    try {
      const { data: listing } = await api.post('/listings', data);
      toast({
        title: t('listings.created'),
      });
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
      <h1 className="text-3xl font-bold mb-8">{t('listings.create')}</h1>
      <ListingForm onSubmit={handleSubmit} />
    </div>
  );
}
