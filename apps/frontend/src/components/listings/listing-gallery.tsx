'use client';

import { useState } from 'react';
import Image from 'next/image';
import { useTranslations } from 'next-intl';
import { ListingImage } from '@localshare/shared';
import { cn, getImageUrl } from '@/lib/utils';

interface ListingGalleryProps {
  title: string;
  images: ListingImage[];
}

export function ListingGallery({ title, images }: ListingGalleryProps) {
  const t = useTranslations('listings');
  const [selected, setSelected] = useState(0);
  if (images.length === 0) return null;

  return (
    <figure aria-label={t('gallery')}>
      <div className="relative h-96 bg-muted rounded-lg overflow-hidden">
        <Image
          src={getImageUrl(images[selected].url)}
          alt={t('imageView', { title, index: selected + 1, total: images.length })}
          fill
          sizes="(min-width: 1024px) 66vw, 100vw"
          className="object-contain"
          priority
        />
      </div>

      {images.length > 1 && (
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2 mt-4">
          {images.map((image, index) => (
            <button
              key={image.id}
              onClick={() => setSelected(index)}
              className={cn(
                'relative h-24 rounded-lg overflow-hidden border-2 transition-all',
                selected === index ? 'border-primary' : 'border-transparent'
              )}
              aria-label={t('showImage', { index: index + 1, total: images.length })}
            >
              <Image
                src={getImageUrl(image.thumbnailUrl || image.url)}
                alt={t('imageThumbnail', { title, index: index + 1 })}
                fill
                sizes="(min-width: 768px) 16vw, 33vw"
                className="object-cover"
              />
            </button>
          ))}
        </div>
      )}
    </figure>
  );
}
