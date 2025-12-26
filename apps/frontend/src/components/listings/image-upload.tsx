'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { api } from '@/lib/api';
import { ListingImage, Listing } from '@localshare/shared';
import { Upload, X, Loader2 } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface ImageUploadProps {
  listingId?: string;
  existingImages?: ListingImage[];
  maxImages?: number;
  maxSizeMB?: number;
  onImagesChange?: (images: ListingImage[]) => void;
  onPendingImagesChange?: (files: File[]) => void;
}

export function ImageUpload({
  listingId,
  existingImages = [],
  maxImages = 3,
  maxSizeMB = 10,
  onImagesChange,
  onPendingImagesChange,
}: ImageUploadProps) {
  const t = useTranslations();
  const { toast } = useToast();
  const [images, setImages] = useState<ListingImage[]>(existingImages);
  const [uploading, setUploading] = useState(false);
  const [imageToDelete, setImageToDelete] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

  // Sync images state when existingImages prop changes
  useEffect(() => {
    setImages(existingImages);
  }, [existingImages]);

  // Cleanup preview URLs on unmount
  useEffect(() => {
    return () => {
      previewUrls.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [previewUrls]);

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    // Check if adding these files would exceed the limit
    const currentCount = listingId ? images.length : pendingFiles.length;
    if (currentCount + files.length > maxImages) {
      toast({
        title: t('errors.validation'),
        description: t('listings.imageLimit'),
        variant: 'destructive',
      });
      return;
    }

    // Validate file sizes
    const maxSizeBytes = maxSizeMB * 1024 * 1024;
    for (let i = 0; i < files.length; i++) {
      if (files[i].size > maxSizeBytes) {
        toast({
          title: t('errors.validation'),
          description: t('listings.imageLimit'),
          variant: 'destructive',
        });
        return;
      }
    }

    // If we have a listingId, upload immediately
    if (listingId) {
      await uploadImages(files);
    } else {
      // Store files temporarily for upload after listing creation
      const newFiles = Array.from(files);
      const updatedFiles = [...pendingFiles, ...newFiles];
      setPendingFiles(updatedFiles);

      // Create preview URLs
      const newPreviewUrls = newFiles.map((file) => URL.createObjectURL(file));
      setPreviewUrls([...previewUrls, ...newPreviewUrls]);

      // Notify parent component
      if (onPendingImagesChange) {
        onPendingImagesChange(updatedFiles);
      }
    }

    // Reset the input
    event.target.value = '';
  };

  const uploadImages = async (files: FileList) => {
    setUploading(true);
    try {
      const formData = new FormData();
      for (let i = 0; i < files.length; i++) {
        formData.append('images', files[i]);
      }

      // Backend returns full Listing object, not just new images
      const { data } = await api.post<Listing>(
        `/listings/${listingId}/images`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      );

      // Extract images array from the listing object
      const updatedImages = data.images || [];
      setImages(updatedImages);
      if (onImagesChange) {
        onImagesChange(updatedImages);
      }

      toast({
        title: t('listings.imagesUploaded'),
      });
    } catch (error: any) {
      toast({
        title: t('errors.generic'),
        description: error.response?.data?.message || 'Failed to upload images',
        variant: 'destructive',
      });
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteImage = async (imageId: string) => {
    if (!listingId) return;

    setDeleting(true);
    try {
      await api.delete(`/listings/${listingId}/images/${imageId}`);

      const newImages = images.filter((img) => img.id !== imageId);
      setImages(newImages);
      if (onImagesChange) {
        onImagesChange(newImages);
      }

      toast({
        title: t('listings.imageDeleted'),
      });
    } catch (error: any) {
      toast({
        title: t('errors.generic'),
        description: error.response?.data?.message || 'Failed to delete image',
        variant: 'destructive',
      });
    } finally {
      setDeleting(false);
      setImageToDelete(null);
    }
  };

  const handleDeletePendingFile = (index: number) => {
    // Revoke the object URL to free memory
    URL.revokeObjectURL(previewUrls[index]);

    // Remove from arrays
    const newFiles = pendingFiles.filter((_, i) => i !== index);
    const newUrls = previewUrls.filter((_, i) => i !== index);

    setPendingFiles(newFiles);
    setPreviewUrls(newUrls);

    // Notify parent component
    if (onPendingImagesChange) {
      onPendingImagesChange(newFiles);
    }
  };

  const currentImageCount = listingId ? images.length : pendingFiles.length;
  const canUploadMore = currentImageCount < maxImages;

  return (
    <div className="space-y-4">
      {/* Existing Images (for edit mode) */}
      {images.length > 0 && listingId && (
        <div className="grid grid-cols-3 gap-4">
          {images.map((image) => (
            <div key={image.id} className="relative group">
              <div className="relative h-32 rounded-lg overflow-hidden border">
                <Image
                  src={`${apiUrl}${image.url}`}
                  alt={image.originalName}
                  fill
                  className="object-cover"
                />
              </div>
              <Button
                type="button"
                variant="destructive"
                size="icon"
                className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8"
                onClick={() => setImageToDelete(image.id)}
                disabled={deleting}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      )}

      {/* Pending Images (for create mode) */}
      {pendingFiles.length > 0 && !listingId && (
        <div className="grid grid-cols-3 gap-4">
          {pendingFiles.map((file, index) => (
            <div key={index} className="relative group">
              <div className="relative h-32 rounded-lg overflow-hidden border">
                <Image
                  src={previewUrls[index]}
                  alt={file.name}
                  fill
                  className="object-cover"
                />
              </div>
              <Button
                type="button"
                variant="destructive"
                size="icon"
                className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8"
                onClick={() => handleDeletePendingFile(index)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      )}

      {/* Upload Button */}
      {canUploadMore && (
        <div>
          <input
            type="file"
            id="image-upload"
            accept="image/*"
            multiple
            onChange={handleFileChange}
            className="hidden"
            disabled={uploading}
          />
          <label htmlFor="image-upload">
            <Button
              type="button"
              variant="outline"
              className="w-full"
              disabled={uploading}
              onClick={(e) => {
                e.preventDefault();
                document.getElementById('image-upload')?.click();
              }}
            >
              {uploading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {t('common.loading')}
                </>
              ) : (
                <>
                  <Upload className="mr-2 h-4 w-4" />
                  {t('listings.uploadImages')} ({currentImageCount}/{maxImages})
                </>
              )}
            </Button>
          </label>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!imageToDelete} onOpenChange={() => setImageToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('listings.deleteImage')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('listings.deleteConfirm')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>
              {t('common.cancel')}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => imageToDelete && handleDeleteImage(imageToDelete)}
              disabled={deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {t('common.delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
