export const MAX_IMAGES_PER_LISTING = 3;
export const MAX_IMAGE_SIZE_MB = 10;

/** Why a picked batch cannot be added, or null when it fits the limits. */
export function validateImageFiles(
  files: { size: number }[],
  currentCount: number,
  maxImages = MAX_IMAGES_PER_LISTING,
  maxSizeMB = MAX_IMAGE_SIZE_MB,
): 'tooMany' | 'tooLarge' | null {
  if (currentCount + files.length > maxImages) return 'tooMany';
  if (files.some((file) => file.size > maxSizeMB * 1024 * 1024)) return 'tooLarge';
  return null;
}

/** Reads a file as data URL. Data URLs (not blob URLs) keep Android gallery previews working. */
export function readAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = () => resolve('');
    reader.readAsDataURL(file);
  });
}
