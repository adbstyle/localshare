'use client';

import { useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Camera, ImageIcon, Loader2, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { downscaleImage } from '@/lib/image-resize';
import { MAX_IMAGES_PER_LISTING, validateImageFiles } from '@/lib/utils/image-files';

interface ImagePickerProps {
  count: number;
  busy?: boolean;
  /** Receives validated, downscaled files. */
  onFiles: (files: File[]) => Promise<void> | void;
}

// Sequential on purpose: decoding several full-size photos at once can exhaust mobile memory
async function downscaleAll(files: File[]): Promise<File[]> {
  const result: File[] = [];
  for (const file of files) result.push(await downscaleImage(file));
  return result;
}

/** Camera + gallery buttons on mobile, one upload button on desktop. */
export function ImagePicker({ count, busy = false, onFiles }: ImagePickerProps) {
  const t = useTranslations();
  const { toast } = useToast();
  const [processing, setProcessing] = useState(false);
  const cameraRef = useRef<HTMLInputElement>(null);
  const galleryRef = useRef<HTMLInputElement>(null);
  const disabled = busy || processing;

  if (count >= MAX_IMAGES_PER_LISTING) return null;

  const showValidationError = (key: string) =>
    toast({ title: t('errors.validation'), description: t(key), variant: 'destructive' });

  const handleChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const input = event.target;
    const files = Array.from(input.files ?? []);
    if (files.length === 0) return;
    if (validateImageFiles(files, count)) {
      showValidationError('listings.imageLimit');
      input.value = '';
      return;
    }

    setProcessing(true);
    try {
      await onFiles(await downscaleAll(files));
    } catch {
      showValidationError('listings.imageProcessingFailed');
    } finally {
      setProcessing(false);
      input.value = '';
    }
  };

  const icon = (Icon: typeof Camera) =>
    disabled ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Icon className="mr-2 h-4 w-4" />;

  return (
    <>
      <input ref={cameraRef} type="file" accept="image/*" capture="environment" onChange={handleChange}
        className="hidden" disabled={disabled} aria-label={t('listings.takePhoto')} />
      <input ref={galleryRef} type="file" accept="image/*" multiple onChange={handleChange}
        className="hidden" disabled={disabled} aria-label={t('listings.fromGallery')} />

      <div className="flex flex-col gap-2 md:hidden">
        <Button type="button" className="w-full" disabled={disabled} onClick={() => cameraRef.current?.click()}>
          {icon(Camera)}
          {t('listings.takePhoto')}
        </Button>
        <Button type="button" variant="outline" className="w-full" disabled={disabled}
          onClick={() => galleryRef.current?.click()}>
          {icon(ImageIcon)}
          {t('listings.fromGallery')}
        </Button>
      </div>

      <div className="hidden md:block">
        <Button type="button" variant="outline" className="w-full" disabled={disabled}
          onClick={() => galleryRef.current?.click()}>
          {icon(Upload)}
          {disabled ? t('common.loading') : `${t('listings.uploadImages')} (${count}/${MAX_IMAGES_PER_LISTING})`}
        </Button>
      </div>
    </>
  );
}
