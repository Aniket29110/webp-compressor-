import { isFormatSupportedByCanvas } from './format-utils';

export interface LoadedImageData {
  image: CanvasImageSource;
  width: number;
  height: number;
}

export interface CompressedBlobData {
  blob: Blob;
  width: number;
  height: number;
}

export const MAX_ALLOWED_FILE_SIZE_BYTES = 50 * 1024 * 1024; // 50MB
export const DEFAULT_MAX_DIMENSION = 4096; // 4K safeguard to prevent canvas out-of-memory crashes

export const ACCEPTED_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/avif',
] as const;

export const ACCEPTED_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp', '.avif'] as const;

// Combined accept attribute for native file input dialogs
export const ACCEPTED_IMAGE_INPUT_STRING = [
  ...ACCEPTED_MIME_TYPES,
  ...ACCEPTED_EXTENSIONS,
].join(',');

/**
 * Validates uploaded image file against size, empty state, and mime types.
 */
export function validateImageFile(file: File): { isValid: boolean; error?: string } {
  if (!file) {
    return { isValid: false, error: 'No file provided.' };
  }

  if (file.size === 0) {
    return { isValid: false, error: 'The selected file is empty (0 bytes).' };
  }

  if (file.size > MAX_ALLOWED_FILE_SIZE_BYTES) {
    return {
      isValid: false,
      error: `File size exceeds the 50MB limit (selected: ${(file.size / (1024 * 1024)).toFixed(1)}MB).`,
    };
  }

  const nameLower = file.name.toLowerCase();
  const hasValidExt = ACCEPTED_EXTENSIONS.some((ext) => nameLower.endsWith(ext));
  const hasValidMime = (ACCEPTED_MIME_TYPES as readonly string[]).includes(file.type);

  if (!hasValidExt && !hasValidMime) {
    return {
      isValid: false,
      error: 'Unsupported image format. Please upload JPG, PNG, WebP, or AVIF files.',
    };
  }

  return { isValid: true };
}

/**
 * Loads image asynchronously with EXIF orientation correction.
 * Uses createImageBitmap with imageOrientation: 'from-image' if supported,
 * otherwise falls back to HTMLImageElement.
 */
export async function loadImageFromFile(file: File): Promise<LoadedImageData> {
  // 1. Try createImageBitmap with native EXIF orientation handling (modern browsers)
  if (typeof window !== 'undefined' && 'createImageBitmap' in window) {
    try {
      const bitmap = await createImageBitmap(file, {
        imageOrientation: 'from-image',
      });
      return {
        image: bitmap,
        width: bitmap.width,
        height: bitmap.height,
      };
    } catch {
      // Fall through to Image element fallback
    }
  }

  // 2. Fallback using HTMLImageElement
  return new Promise((resolve, reject) => {
    const objectUrl = URL.createObjectURL(file);
    const img = new Image();

    img.onload = () => {
      URL.revokeObjectURL(objectUrl);
      resolve({
        image: img,
        width: img.naturalWidth || img.width,
        height: img.naturalHeight || img.height,
      });
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error('Failed to decode image. The file may be corrupt or an unsupported format.'));
    };

    img.src = objectUrl;
  });
}

/**
 * Calculates target dimensions preserving aspect ratio while obeying max dimension.
 */
export function calculateTargetDimensions(
  srcWidth: number,
  srcHeight: number,
  maxDimension: number = DEFAULT_MAX_DIMENSION
): { width: number; height: number } {
  if (srcWidth <= maxDimension && srcHeight <= maxDimension) {
    return { width: srcWidth, height: srcHeight };
  }

  const ratio = Math.min(maxDimension / srcWidth, maxDimension / srcHeight);
  return {
    width: Math.max(1, Math.round(srcWidth * ratio)),
    height: Math.max(1, Math.round(srcHeight * ratio)),
  };
}

/**
 * Compresses an image in-memory using HTML5 Canvas API with GPU VRAM cleanup.
 */
export async function compressImageOnCanvas(
  imageSource: CanvasImageSource,
  sourceWidth: number,
  sourceHeight: number,
  mimeType: string,
  quality: number,
  maxDimension: number = DEFAULT_MAX_DIMENSION
): Promise<CompressedBlobData> {
  // Check if target format is supported by this browser's canvas
  const isSupported = await isFormatSupportedByCanvas(mimeType);
  if (!isSupported) {
    if (mimeType === 'image/avif') {
      throw new Error(
        'Your browser does not support encoding images to AVIF via Canvas. Please choose WebP or JPEG instead.'
      );
    }
    throw new Error(`Your browser cannot encode images to ${mimeType}.`);
  }

  const { width, height } = calculateTargetDimensions(
    sourceWidth,
    sourceHeight,
    maxDimension
  );

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext('2d', {
    alpha: mimeType !== 'image/jpeg',
    willReadFrequently: false,
  });

  if (!ctx) {
    throw new Error('Unable to initialize HTML5 2D Canvas context.');
  }

  // Handle JPEG transparency fallback: fill with white background so alpha doesn't turn black
  if (mimeType === 'image/jpeg') {
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, width, height);
  }

  // Apply high-quality image smoothing
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';

  // Draw source image onto canvas
  ctx.drawImage(imageSource, 0, 0, width, height);

  // Clamp quality between 0.05 and 1.0
  const clampedQuality = Math.min(1.0, Math.max(0.05, quality));

  try {
    const blob = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob(
        (b) => {
          if (!b) {
            reject(new Error('Canvas compression returned empty data.'));
            return;
          }

          // Verify output MIME type match (defends against silent PNG fallback)
          if (mimeType === 'image/avif' && b.type !== 'image/avif') {
            reject(
              new Error(
                'Your browser does not support AVIF compression. Please choose WebP or JPEG.'
              )
            );
            return;
          }

          resolve(b);
        },
        mimeType,
        clampedQuality
      );
    });

    return {
      blob,
      width,
      height,
    };
  } finally {
    // Senior Dev Fix: Explicitly zero canvas dimensions to release backing GPU VRAM texture immediately
    canvas.width = 0;
    canvas.height = 0;
  }
}
