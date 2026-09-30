// Same width the backend stores (apps/backend/src/listings/image.service.ts,
// `resize(1280, null)`), so downscaling in the browser changes nothing visible.
// It is what keeps a 3-image upload (~0.3-1 MB each) below the 4.5 MB request
// limit of serverless hosting (Vercel); the backend's 4 MB per-file limit is only a backstop.
const MAX_WIDTH_PX = 1280;
const JPEG_QUALITY = 0.9;
const BACKEND_MAX_FILE_BYTES = 4 * 1024 * 1024;

type DecodedImage = ImageBitmap | HTMLImageElement;

function loadImageElement(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const objectUrl = URL.createObjectURL(file);
    const image = new window.Image();
    image.onload = () => {
      URL.revokeObjectURL(objectUrl);
      resolve(image);
    };
    image.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error(`Cannot decode ${file.name}`));
    };
    image.src = objectUrl;
  });
}

async function decodeImage(file: File): Promise<DecodedImage> {
  try {
    return await createImageBitmap(file, { imageOrientation: 'from-image' });
  } catch {
    // Older engines (e.g. iOS 15) reject the imageOrientation option; <img> also applies EXIF orientation
    return loadImageElement(file);
  }
}

function encodeJpeg(canvas: HTMLCanvasElement): Promise<Blob | null> {
  return new Promise((resolve) => canvas.toBlob(resolve, 'image/jpeg', JPEG_QUALITY));
}

async function renderDownscaled(image: DecodedImage): Promise<Blob | null> {
  const sourceWidth = image instanceof HTMLImageElement ? image.naturalWidth : image.width;
  const sourceHeight = image instanceof HTMLImageElement ? image.naturalHeight : image.height;
  const scale = Math.min(1, MAX_WIDTH_PX / sourceWidth);

  const canvas = document.createElement('canvas');
  canvas.width = Math.round(sourceWidth * scale);
  canvas.height = Math.round(sourceHeight * scale);
  const context = canvas.getContext('2d');

  try {
    if (!context) return null;
    // JPEG has no alpha channel: without a fill, transparent PNG areas turn black
    context.fillStyle = '#ffffff';
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.drawImage(image, 0, 0, canvas.width, canvas.height);
  } finally {
    if (image instanceof ImageBitmap) image.close();
  }

  return encodeJpeg(canvas);
}

/**
 * Re-encodes an image as JPEG, max 1280 px wide (also strips EXIF metadata).
 * If the browser cannot decode the file (e.g. HEIC outside Safari), the
 * original is returned when the backend would still accept its size.
 * @throws Error when the file can neither be processed nor uploaded as-is
 */
export async function downscaleImage(file: File): Promise<File> {
  const blob = await decodeImage(file).then(renderDownscaled).catch(() => null);

  if (!blob) {
    if (file.size <= BACKEND_MAX_FILE_BYTES) return file;
    throw new Error(`Cannot process ${file.name}`);
  }

  const baseName = file.name.replace(/\.[^.]+$/, '') || 'image';
  return new File([blob], `${baseName}.jpg`, { type: 'image/jpeg', lastModified: Date.now() });
}
