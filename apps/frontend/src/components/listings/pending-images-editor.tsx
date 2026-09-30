'use client';

import { ImagePicker } from './image-picker';
import { ImageTile } from './image-tile';
import { readAsDataUrl } from '@/lib/utils/image-files';

export interface PendingImage {
  file: File;
  previewUrl: string;
}

export interface PendingImages {
  images: PendingImage[];
  coverIndex: number;
}

interface PendingImagesEditorProps {
  value: PendingImages;
  onChange: (value: PendingImages) => void;
}

/** Cover index after removing the image at `removed`. */
function coverAfterRemoval(coverIndex: number, removed: number): number {
  if (removed < coverIndex) return coverIndex - 1;
  return removed === coverIndex ? 0 : coverIndex;
}

/** Create mode: images are kept locally and uploaded after the listing exists. */
export function PendingImagesEditor({ value, onChange }: PendingImagesEditorProps) {
  const { images, coverIndex } = value;

  const add = async (files: File[]) => {
    const added = await Promise.all(files.map(async (file) => ({ file, previewUrl: await readAsDataUrl(file) })));
    onChange({ images: [...images, ...added], coverIndex });
  };

  const remove = (index: number) =>
    onChange({ images: images.filter((_, i) => i !== index), coverIndex: coverAfterRemoval(coverIndex, index) });

  return (
    <div className="space-y-4">
      {images.length > 0 && (
        <div className="grid grid-cols-3 gap-4">
          {images.map((image, index) => (
            <ImageTile
              key={image.previewUrl || index}
              src={image.previewUrl}
              alt={image.file.name}
              isLocalPreview
              isCover={index === coverIndex}
              canSetCover={images.length > 1}
              onSetCover={() => onChange({ images, coverIndex: index })}
              onRemove={() => remove(index)}
            />
          ))}
        </div>
      )}
      <ImagePicker count={images.length} onFiles={add} />
    </div>
  );
}

/** Files in upload order; the backend makes the first uploaded image the cover. */
export function filesCoverFirst({ images, coverIndex }: PendingImages): File[] {
  const files = images.map((image) => image.file);
  const [cover] = files.splice(coverIndex, 1);
  return cover ? [cover, ...files] : files;
}
