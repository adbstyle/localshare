'use client';

import { useEffect, useLayoutEffect, useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslations } from 'next-intl';
import {
  Listing,
  CreateListingDto,
  ListingType,
  ListingCategory,
  PriceTimeUnit,
} from '@localshare/shared';
import { createListingSchema } from '@localshare/shared';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';
import { ListingImagesEditor } from './listing-images-editor';
import { ListingVisibilityFields } from './listing-visibility-fields';
import { filesCoverFirst, PendingImages, PendingImagesEditor } from './pending-images-editor';

interface ListingFormProps {
  listing?: Listing;
  /** `files` holds the images to upload after creating (cover first); empty when editing. */
  onSubmit: (data: CreateListingDto, files: File[]) => Promise<void>;
}

export function ListingForm({ listing, onSubmit }: ListingFormProps) {
  const t = useTranslations();
  const [loading, setLoading] = useState(false);
  const [pendingImages, setPendingImages] = useState<PendingImages>({ images: [], coverIndex: 0 });
  const [imagesBusy, setImagesBusy] = useState(false);

  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    formState: { errors },
  } = useForm<CreateListingDto>({
    resolver: zodResolver(createListingSchema),
    defaultValues: listing ? {
      title: listing.title,
      description: listing.description || '',
      type: listing.type,
      price: listing.price || undefined,
      priceTimeUnit: listing.priceTimeUnit || undefined,
      category: listing.category,
      communityIds: listing.visibility.map((v) => v.communityId),
    } : {
      title: '',
      description: '',
      type: ListingType.LEND,
      category: ListingCategory.OTHER,
      communityIds: [],
    },
  });

  const selectedType = watch('type');
  const selectedCommunityIds = watch('communityIds') || [];

  const handleFormSubmit = async (data: CreateListingDto) => {
    setLoading(true);
    try {
      await onSubmit(data, listing ? [] : filesCoverFirst(pendingImages));
    } finally {
      setLoading(false);
    }
  };

  const listingTypes = Object.values(ListingType);
  const listingCategories = Object.values(ListingCategory);
  const priceTimeUnits = Object.values(PriceTimeUnit);

  const showPriceField = selectedType === ListingType.SELL || selectedType === ListingType.RENT;
  const showPriceTimeUnit = selectedType === ListingType.RENT;

  // Scroll preservation: prevent mobile viewport desync on type change
  // useLayoutEffect runs synchronously after DOM mutations but before paint
  useLayoutEffect(() => {
    const scrollY = window.scrollY;
    requestAnimationFrame(() => window.scrollTo(0, scrollY));
  }, [selectedType]);

  // Clear price fields when type changes to prevent stale data
  useEffect(() => {
    if (selectedType !== ListingType.SELL && selectedType !== ListingType.RENT) {
      setValue('price', undefined);
    }
    if (selectedType !== ListingType.RENT) {
      setValue('priceTimeUnit', undefined);
    }
  }, [selectedType, setValue]);

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
      {/* Card 1: Type & Category */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-lg">{t('listings.formSections.typeAndCategory')}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Type as button group */}
          <div className="space-y-2">
            <Label>
              {t('listings.type')} <span className="text-destructive">*</span>
            </Label>
            <Controller
              name="type"
              control={control}
              render={({ field }) => (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {listingTypes.map((type) => (
                    <Button
                      key={type}
                      type="button"
                      variant={field.value === type ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => field.onChange(type)}
                      className="w-full"
                    >
                      {t(`listings.types.${type}`)}
                    </Button>
                  ))}
                </div>
              )}
            />
            {errors.type && (
              <p className="text-sm text-destructive">{errors.type.message}</p>
            )}
          </div>

          {/* Category */}
          <div className="space-y-2">
            <Label htmlFor="category">
              {t('listings.category')} <span className="text-destructive">*</span>
            </Label>
            <Controller
              name="category"
              control={control}
              render={({ field }) => (
                <Select
                  value={field.value}
                  onValueChange={field.onChange}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {listingCategories.map((category) => (
                      <SelectItem key={category} value={category}>
                        {t(`listings.categories.${category}`)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            {errors.category && (
              <p className="text-sm text-destructive">{errors.category.message}</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Card 2: Photos */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-lg">{t('listings.formSections.photos')}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">{t('listings.imageLimit')}</p>
            {listing ? (
              <ListingImagesEditor listingId={listing.id} onBusyChange={setImagesBusy} />
            ) : (
              <PendingImagesEditor value={pendingImages} onChange={setPendingImages} />
            )}
          </div>
        </CardContent>
      </Card>

      {/* Card 3: Details */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-lg">{t('listings.formSections.details')}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Title */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <Label htmlFor="title">
                {t('listings.listingTitle')} <span className="text-destructive">*</span>
              </Label>
              <span className="text-xs text-muted-foreground" aria-live="polite" aria-atomic="true">
                {watch('title')?.length || 0}/60
              </span>
            </div>
            <Input
              id="title"
              placeholder={t('listings.titlePlaceholder')}
              maxLength={60}
              {...register('title')}
            />
            {errors.title && (
              <p className="text-sm text-destructive">{errors.title.message}</p>
            )}
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">{t('listings.description')}</Label>
            <Textarea
              id="description"
              placeholder={t('listings.descriptionPlaceholder')}
              rows={4}
              {...register('description')}
            />
            {errors.description && (
              <p className="text-sm text-destructive">{errors.description.message}</p>
            )}
          </div>

          {/* Price - CSS hidden instead of conditional render to prevent mobile layout shifts */}
          <div className={!showPriceField ? 'hidden' : 'space-y-2'}>
            <Label htmlFor="price">
              {t('listings.price')} <span className="text-destructive">*</span>
            </Label>
            <Input
              id="price"
              type="number"
              min="0"
              max="1000000"
              placeholder={t('listings.pricePlaceholder')}
              {...register('price', {
                setValueAs: (v) => (v === '' || Number.isNaN(Number(v)) ? undefined : Number(v)),
              })}
            />
            {errors.price && (
              <p className="text-sm text-destructive">{errors.price.message}</p>
            )}
          </div>

          {/* Price Time Unit - CSS hidden instead of conditional render to prevent mobile layout shifts */}
          <div className={!showPriceTimeUnit ? 'hidden' : 'space-y-2'}>
            <Label htmlFor="priceTimeUnit">
              {t('listings.priceTimeUnit')} <span className="text-destructive">*</span>
            </Label>
            <Controller
              name="priceTimeUnit"
              control={control}
              render={({ field }) => (
                <Select
                  value={field.value}
                  onValueChange={field.onChange}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={t('listings.selectTimeUnit')} />
                  </SelectTrigger>
                  <SelectContent>
                    {priceTimeUnits.map((unit) => (
                      <SelectItem key={unit} value={unit}>
                        {t(`listings.timeUnits.${unit}`)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            {errors.priceTimeUnit && (
              <p className="text-sm text-destructive">{errors.priceTimeUnit.message}</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Card 4: Visibility */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-lg">{t('listings.formSections.visibility')}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            {t('listings.selectCommunities')}
          </p>

          <ListingVisibilityFields
            communityIds={selectedCommunityIds}
            onChange={(ids) => setValue('communityIds', ids)}
          />
        </CardContent>
      </Card>

      {/* Submit Button */}
      <div className="flex justify-end gap-4">
        <Button
          type="submit"
          disabled={loading || imagesBusy}
          size="lg"
        >
          {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {listing ? t('common.save') : t('common.create')}
        </Button>
      </div>
    </form>
  );
}
