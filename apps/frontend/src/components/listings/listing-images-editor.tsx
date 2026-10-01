'use client';

import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { listingQueries, useListingImages } from '@/lib/api/listings';
import { getImageUrl } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { useErrorToast } from '@/hooks/use-error-toast';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { ImagePicker } from './image-picker';
import { ImageTile } from './image-tile';

interface ListingImagesEditorProps {
  listingId: string;
  onBusyChange: (busy: boolean) => void;
}

/** Edit mode: every change is saved immediately and lands in the listing cache. */
export function ListingImagesEditor({ listingId, onBusyChange }: ListingImagesEditorProps) {
  const t = useTranslations();
  const { toast } = useToast();
  const showError = useErrorToast();
  const images = useQuery(listingQueries.detail(listingId)).data?.images ?? [];
  const { upload, remove, setCover } = useListingImages(listingId);
  const [imageToDelete, setImageToDelete] = useState<string | null>(null);

  useEffect(() => onBusyChange(upload.isPending), [upload.isPending, onBusyChange]);

  const success = (key: string) => () => {
    toast({ variant: 'success', title: t(key) });
  };

  const handleUpload = async (files: File[]) => {
    try {
      await upload.mutateAsync(files);
      success('listings.imagesUploaded')();
    } catch (error) {
      showError(error, 'errors.failedToUploadImages');
    }
  };

  const handleDelete = () => {
    if (!imageToDelete) return;
    remove.mutate(imageToDelete, {
      onSuccess: success('listings.imageDeleted'),
      onError: (e) => showError(e, 'errors.failedToDeleteImage'),
      onSettled: () => setImageToDelete(null),
    });
  };

  const handleSetCover = (imageId: string) =>
    setCover.mutate(imageId, {
      onSuccess: success('listings.coverImageSet'),
      onError: (e) => showError(e, 'errors.failedToSetCoverImage'),
    });

  return (
    <div className="space-y-4">
      {images.length > 0 && (
        <div className="grid grid-cols-3 gap-4">
          {images.map((image) => (
            <ImageTile
              key={image.id}
              src={getImageUrl(image.thumbnailUrl || image.url)}
              alt={image.originalName}
              isCover={image.isCover}
              canSetCover={images.length > 1}
              settingCover={setCover.isPending && setCover.variables === image.id}
              disabled={remove.isPending}
              onSetCover={() => handleSetCover(image.id)}
              onRemove={() => setImageToDelete(image.id)}
            />
          ))}
        </div>
      )}

      <ImagePicker count={images.length} busy={upload.isPending} onFiles={handleUpload} />

      <ConfirmDialog
        open={!!imageToDelete}
        onOpenChange={(open) => !open && setImageToDelete(null)}
        title={t('listings.deleteImage')}
        description={t('listings.deleteConfirm')}
        confirmLabel={t('common.delete')}
        onConfirm={handleDelete}
        pending={remove.isPending}
      />
    </div>
  );
}
