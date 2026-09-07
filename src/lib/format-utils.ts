import { SupportedFormat } from '@/types/image';

export interface FormatMeta {
  id: SupportedFormat;
  label: string;
  extension: string;
  mimeType: string;
  description: string;
  badge?: string;
}

export const FORMAT_OPTIONS: readonly FormatMeta[] = [
  {
    id: 'original',
    label: 'Original',
    extension: '',
    mimeType: '',
    description: 'Keep source file format, optimize file size',
  },
  {
    id: 'webp',
    label: 'WebP',
    extension: '.webp',
    mimeType: 'image/webp',
    description: 'Modern standard with high compression & quality',
    badge: 'Recommended',
  },
  {
    id: 'jpeg',
    label: 'JPEG',
    extension: '.jpg',
    mimeType: 'image/jpeg',
    description: 'Universal compatibility for photography',
  },
  {
    id: 'png',
    label: 'PNG',
    extension: '.png',
    mimeType: 'image/png',
    description: 'Lossless format, ideal for diagrams & sharp icons',
  },
  {
    id: 'avif',
    label: 'AVIF',
    extension: '.avif',
    mimeType: 'image/avif',
    description: 'Next-gen format with superior compression efficiency',
    badge: 'Next-Gen',
  },
] as const;

/**
 * Converts raw bytes into human-readable formatted string (e.g. 333.9 KB, 1.2 MB).
 */
export function formatBytes(bytes: number, decimals: number = 1): string {
  if (bytes === 0) return '0 B';
  if (bytes < 0 || isNaN(bytes)) return '0 B';

  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['B', 'KB', 'MB', 'GB'];

  const i = Math.floor(Math.log(bytes) / Math.log(k));
  const safeIndex = Math.min(i, sizes.length - 1);
  const value = parseFloat((bytes / Math.pow(k, safeIndex)).toFixed(dm));

  return `${value} ${sizes[safeIndex]}`;
}

/**
 * Derives output MIME type from target format and original MIME type.
 */
export function getMimeTypeForFormat(format: SupportedFormat, originalMime: string): string {
  if (format === 'original') {
    if (['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/avif'].includes(originalMime)) {
      return originalMime === 'image/jpg' ? 'image/jpeg' : originalMime;
    }
    return 'image/jpeg';
  }

  const option = FORMAT_OPTIONS.find((opt) => opt.id === format);
  return option?.mimeType || 'image/jpeg';
}

/**
 * Returns clean file extension for given format or MIME type.
 */
export function getExtensionForFormat(format: SupportedFormat, originalMime: string): string {
  if (format === 'original') {
    switch (originalMime) {
      case 'image/png':
        return '.png';
      case 'image/webp':
        return '.webp';
      case 'image/avif':
        return '.avif';
      case 'image/jpeg':
      case 'image/jpg':
      default:
        return '.jpg';
    }
  }

  const option = FORMAT_OPTIONS.find((opt) => opt.id === format);
  return option?.extension || '.jpg';
}

/**
 * Updates original filename with new format extension.
 * Example: 'vacation.photo.png' -> 'vacation.photo.webp'
 */
export function getOutputFilename(
  originalName: string,
  format: SupportedFormat,
  originalMime: string
): string {
  const lastDotIndex = originalName.lastIndexOf('.');
  const baseName = lastDotIndex !== -1 ? originalName.slice(0, lastDotIndex) : originalName;
  const newExt = getExtensionForFormat(format, originalMime);

  return `${baseName}${newExt}`;
}

export interface SavingsMetrics {
  savedBytes: number;
  savedPercentage: number;
  compressionRatio: string;
  isExpanded: boolean;
  differencePercentage: number;
}

/**
 * Calculates compression savings statistics including detection for file size expansion.
 */
export function calculateSavings(
  originalSize: number,
  compressedSize: number
): SavingsMetrics {
  if (!originalSize || originalSize <= 0) {
    return {
      savedBytes: 0,
      savedPercentage: 0,
      compressionRatio: '1.0:1',
      isExpanded: false,
      differencePercentage: 0,
    };
  }

  const diff = originalSize - compressedSize;
  const diffPct = parseFloat(((Math.abs(diff) / originalSize) * 100).toFixed(1));
  const isExpanded = compressedSize > originalSize;

  const savedBytes = isExpanded ? 0 : diff;
  const savedPercentage = isExpanded ? 0 : diffPct;

  const ratioValue = compressedSize > 0 ? (originalSize / compressedSize).toFixed(1) : '1.0';
  const compressionRatio = `${ratioValue}:1`;

  return {
    savedBytes,
    savedPercentage,
    compressionRatio,
    isExpanded,
    differencePercentage: diffPct,
  };
}

/**
 * Verifies if the user's browser Canvas implementation can export to a given MIME type.
 */
export async function isFormatSupportedByCanvas(mimeType: string): Promise<boolean> {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return true;
  }

  try {
    const canvas = document.createElement('canvas');
    canvas.width = 1;
    canvas.height = 1;

    return new Promise((resolve) => {
      canvas.toBlob((blob) => {
        if (!blob) {
          resolve(false);
          return;
        }
        resolve(blob.type === mimeType);
      }, mimeType);
    });
  } catch {
    return false;
  }
}
