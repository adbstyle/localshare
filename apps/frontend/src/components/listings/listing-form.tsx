'use client';

import { useEffect, useLayoutEffect, useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslations } from 'next-intl';
import {
  Listing,
  CreateListingDto,
  UpdateListingDto,
  ListingType,
  ListingCategory,
  PriceTimeUnit,
  Community,
  Group,
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
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { api } from '@/lib/api';
import { Loader2 } from 'lucide-react';
import { ImageUpload } from './image-upload';

interface ListingFormProps {
  listing?: Listing;
  onSubmit: (data: any, pendingFiles?: File[]) => Promise<void>;
}

export function ListingForm({ listing, onSubmit }: ListingFormProps) {
  const t = useTranslations();
  const [loading, setLoading] = useState(false);
  const [communities, setCommunities] = useState<Community[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [currentImages, setCurrentImages] = useState(listing?.images || []);
  const [pendingImageFiles, setPendingImageFiles] = useState<File[]>([]);
  const [pendingCoverIndex, setPendingCoverIndex] = useState(0);

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
      communityIds: listing.visibility
        .filter((v) => v.type === 'COMMUNITY')
        .map((v) => v.communityId!)
        .filter(Boolean),
      groupIds: listing.visibility
        .filter((v) => v.type === 'GROUP')
        .map((v) => v.groupId!)
        .filter(Boolean),
    } : {
      title: '',
      description: '',
      type: ListingType.LEND,
      category: ListingCategory.OTHER,
      communityIds: [],
      groupIds: [],
    },
  });

  const selectedType = watch('type');
  const selectedCommunityIds = watch('communityIds') || [];
  const selectedGroupIds = watch('groupIds') || [];

  useEffect(() => {
    fetchCommunitiesAndGroups();
  }, []);

  // Sync currentImages when listing prop changes
  useEffect(() => {
    if (listing?.images) {
      setCurrentImages(listing.images);
    }
  }, [listing?.images]);

  const fetchCommunitiesAndGroups = async () => {
    try {
      const [communitiesRes, groupsRes] = await Promise.all([
        api.get<Community[]>('/communities'),
        api.get<Group[]>('/groups'),
      ]);
      setCommunities(communitiesRes.data);
      setGroups(groupsRes.data);
    } catch (error) {
      console.error('Failed to fetch communities and groups:', error);
    } finally {
      setLoadingData(false);
    }
  };

  const handleFormSubmit = async (data: CreateListingDto) => {
    setLoading(true);
    try {
      // For create mode: reorder files so cover image is at index 0
      // Backend automatically sets first uploaded image as cover
      let filesToUpload = pendingImageFiles;
      if (!listing && pendingImageFiles.length > 0 && pendingCoverIndex > 0) {
        // Move cover image to front
        const reordered = [...pendingImageFiles];
        const [coverFile] = reordered.splice(pendingCoverIndex, 1);
        reordered.unshift(coverFile);
        filesToUpload = reordered;
      }
      await onSubmit(data, listing ? undefined : filesToUpload);
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

  if (loadingData) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

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
            <ImageUpload
              listingId={listing?.id}
              existingImages={currentImages}
              maxImages={3}
              maxSizeMB={10}
              onImagesChange={(images) => {
                setCurrentImages(images);
              }}
              onPendingImagesChange={(files, coverIndex) => {
                setPendingImageFiles(files);
                setPendingCoverIndex(coverIndex);
              }}
            />
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
              {...register('price', { valueAsNumber: true })}
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

          {/* Communities */}
          {communities.length > 0 && (
            <div className="space-y-3">
              <Label className="text-sm font-medium">{t('nav.communities')}</Label>
              <div className="space-y-2">
                {communities.map((community) => (
                  <div key={community.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={`community-${community.id}`}
                      checked={selectedCommunityIds.includes(community.id)}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setValue('communityIds', [...selectedCommunityIds, community.id]);
                        } else {
                          setValue(
                            'communityIds',
                            selectedCommunityIds.filter((id) => id !== community.id)
                          );
                        }
                      }}
                    />
                    <Label
                      htmlFor={`community-${community.id}`}
                      className="text-sm font-normal cursor-pointer"
                    >
                      {community.name}
                    </Label>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Groups */}
          {groups.length > 0 && (
            <div className="space-y-3">
              <Label className="text-sm font-medium">{t('nav.groups')}</Label>
              <div className="space-y-2">
                {groups.map((group) => (
                  <div key={group.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={`group-${group.id}`}
                      checked={selectedGroupIds.includes(group.id)}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setValue('groupIds', [...selectedGroupIds, group.id]);
                        } else {
                          setValue(
                            'groupIds',
                            selectedGroupIds.filter((id) => id !== group.id)
                          );
                        }
                      }}
                    />
                    <Label
                      htmlFor={`group-${group.id}`}
                      className="text-sm font-normal cursor-pointer"
                    >
                      {group.name}
                      <span className="text-muted-foreground text-xs ml-2">
                        ({group.community.name})
                      </span>
                    </Label>
                  </div>
                ))}
              </div>
            </div>
          )}

          {communities.length === 0 && groups.length === 0 && (
            <p className="text-sm text-muted-foreground">
              {t('communities.empty')} {t('communities.emptyAction')}
            </p>
          )}
        </CardContent>
      </Card>

      {/* Submit Button */}
      <div className="flex justify-end gap-4">
        <Button
          type="submit"
          disabled={loading}
          size="lg"
        >
          {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {listing ? t('common.save') : t('common.create')}
        </Button>
      </div>
    </form>
  );
}
