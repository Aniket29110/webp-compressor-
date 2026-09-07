export type SupportedFormat = 'original' | 'jpeg' | 'png' | 'webp' | 'avif';
export type SupportedVideoFormat = 'original' | 'webm' | 'mp4';
export type VideoResolution = 'original' | '1080p' | '720p' | '480p';

export interface ImageDimensions {
  width: number;
  height: number;
}

export interface ImageDetails {
  file: File;
  name: string;
  size: number;
  type: string;
  width: number;
  height: number;
  previewUrl: string;
}

export interface CompressionResult {
  file: File;
  name: string;
  size: number;
  width: number;
  height: number;
  type: string;
  previewUrl: string;
  savedBytes: number;
  savedPercentage: number;
  compressionRatio: string;
}

export interface CompressionOptions {
  level: number; // 0 to 100
  format: SupportedFormat;
  maxDimension?: number;
}

export interface UseImageCompressReturn {
  compress: (fileToCompress?: File) => Promise<void>;
  setCompressionLevel: (level: number) => void;
  compressionLevel: number;
  setFormat: (format: SupportedFormat) => void;
  format: SupportedFormat;
  compressedFile: File | null;
  originalSize: number | null;
  compressedSize: number | null;
  savedPercentage: number | null;
  preview: string | null;
  isCompressing: boolean;
  error: string | null;
  reset: () => void;
}

export interface VideoDetails {
  file: File;
  name: string;
  size: number;
  type: string;
  width: number;
  height: number;
  duration: number;
  previewUrl: string;
}

export interface VideoCompressionResult {
  file: File;
  name: string;
  size: number;
  width: number;
  height: number;
  duration: number;
  type: string;
  previewUrl: string;
  savedBytes: number;
  savedPercentage: number;
  compressionRatio: string;
}

export interface UseVideoCompressReturn {
  compress: (fileToCompress?: File) => Promise<void>;
  setCompressionLevel: (level: number) => void;
  compressionLevel: number;
  setFormat: (format: SupportedVideoFormat) => void;
  format: SupportedVideoFormat;
  setResolution: (res: VideoResolution) => void;
  resolution: VideoResolution;
  includeAudio: boolean;
  setIncludeAudio: (include: boolean) => void;
  compressedFile: File | null;
  originalSize: number | null;
  compressedSize: number | null;
  savedPercentage: number | null;
  preview: string | null;
  isCompressing: boolean;
  progress: number;
  error: string | null;
  reset: () => void;
}
