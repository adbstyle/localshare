'use client';

import Image from 'next/image';
import { useTranslations } from 'next-intl';
import { GalleryThumbnails, Loader2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface ImageTileProps {
  src: string;
  alt: string;
  isCover: boolean;
  /** Local previews are data URLs and use a native <img> (Android gallery compatibility). */
  isLocalPreview?: boolean;
  canSetCover: boolean;
  settingCover?: boolean;
  disabled?: boolean;
  onSetCover: () => void;
  onRemove: () => void;
}

const hoverReveal = 'opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity';

export function ImageTile(props: ImageTileProps) {
  const t = useTranslations('listings');
  const { src, alt, isCover, isLocalPreview, canSetCover, settingCover, disabled, onSetCover, onRemove } = props;

  return (
    <div className="relative group">
      <div className={cn('relative h-32 rounded-lg overflow-hidden border-2', isCover ? 'border-secondary' : 'border-transparent')}>
        {!src ? (
          <div className="absolute inset-0 flex items-center justify-center bg-muted">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : isLocalPreview ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={src} alt={alt} className="absolute inset-0 w-full h-full object-cover" />
        ) : (
          <Image src={src} alt={alt} fill sizes="33vw" className="object-cover" />
        )}

        {isCover && (
          <div className="absolute bottom-2 left-2 bg-secondary text-secondary-foreground px-2 py-1 rounded text-xs font-medium flex items-center gap-1">
            <GalleryThumbnails className="h-3 w-3" />
            {t('coverImage')}
          </div>
        )}
        {!isCover && canSetCover && (
          <Button type="button" variant="secondary" size="icon" className={cn('absolute bottom-2 right-2 h-8 w-8', hoverReveal)}
            onClick={onSetCover} disabled={disabled || settingCover} title={t('setCoverImage')}>
            {settingCover ? <Loader2 className="h-4 w-4 animate-spin" /> : <GalleryThumbnails className="h-4 w-4" />}
          </Button>
        )}
      </div>

      <div className={cn('absolute top-2 right-2', hoverReveal)}>
        <Button type="button" variant="destructive" size="icon" className="h-8 w-8" onClick={onRemove}
          disabled={disabled} aria-label={t('deleteImage')}>
          <X className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
