import { SupportedVideoFormat, VideoResolution } from '@/types/image';

export const ACCEPTED_VIDEO_EXTENSIONS = ['.mp4', '.webm', '.mov', '.ogg', '.mkv'] as const;
export const ACCEPTED_VIDEO_MIMES = [
  'video/mp4',
  'video/webm',
  'video/quicktime',
  'video/ogg',
  'video/x-matroska',
] as const;

export const MAX_ALLOWED_VIDEO_SIZE_BYTES = 200 * 1024 * 1024; // 200MB

/**
 * Validates selected video file
 */
export function validateVideoFile(file: File): { isValid: boolean; error?: string } {
  if (!file) {
    return { isValid: false, error: 'No video file provided.' };
  }

  if (file.size === 0) {
    return { isValid: false, error: 'The selected video file is empty (0 bytes).' };
  }

  if (file.size > MAX_ALLOWED_VIDEO_SIZE_BYTES) {
    return {
      isValid: false,
      error: `Video exceeds the 200MB client-side limit (selected: ${(file.size / (1024 * 1024)).toFixed(1)}MB).`,
    };
  }

  const nameLower = file.name.toLowerCase();
  const hasValidExt = ACCEPTED_VIDEO_EXTENSIONS.some((ext) => nameLower.endsWith(ext));
  const hasValidMime = (ACCEPTED_VIDEO_MIMES as readonly string[]).includes(file.type) || file.type.startsWith('video/');

  if (!hasValidExt && !hasValidMime) {
    return {
      isValid: false,
      error: 'Unsupported video format. Please upload MP4, WebM, MOV, or MKV files.',
    };
  }

  return { isValid: true };
}

/**
 * Formats duration in seconds into MM:SS or HH:MM:SS
 */
export function formatDuration(seconds: number): string {
  if (!seconds || isNaN(seconds) || seconds < 0) return '00:00';
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);

  const pad = (n: number) => n.toString().padStart(2, '0');

  if (hrs > 0) {
    return `${pad(hrs)}:${pad(mins)}:${pad(secs)}`;
  }
  return `${pad(mins)}:${pad(secs)}`;
}

/**
 * Loads video element safely to read dimensions and duration
 */
export function loadVideoMetadata(file: File): Promise<{
  video: HTMLVideoElement;
  width: number;
  height: number;
  duration: number;
  objectUrl: string;
}> {
  return new Promise((resolve, reject) => {
    const objectUrl = URL.createObjectURL(file);
    const video = document.createElement('video');
    video.preload = 'metadata';
    video.src = objectUrl;
    video.muted = true;
    video.playsInline = true;

    video.onloadedmetadata = () => {
      resolve({
        video,
        width: video.videoWidth || 1280,
        height: video.videoHeight || 720,
        duration: video.duration || 0,
        objectUrl,
      });
    };

    video.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error('Failed to load video file. It may be corrupt or an unsupported codec.'));
    };
  });
}

/**
 * Resolves best available MediaRecorder MIME type for target format
 */
export function getBestSupportedVideoMime(format: SupportedVideoFormat): {
  mimeType: string;
  extension: string;
} {
  if (typeof window === 'undefined' || !window.MediaRecorder) {
    return { mimeType: 'video/webm', extension: '.webm' };
  }

  if (format === 'mp4') {
    const mp4Types = [
      'video/mp4;codecs=avc1',
      'video/mp4',
    ];
    for (const t of mp4Types) {
      if (MediaRecorder.isTypeSupported(t)) {
        return { mimeType: t, extension: '.mp4' };
      }
    }
  }

  // WebM fallback / default
  const webmTypes = [
    'video/webm;codecs=vp9,opus',
    'video/webm;codecs=vp9',
    'video/webm;codecs=vp8,opus',
    'video/webm;codecs=vp8',
    'video/webm',
  ];

  for (const t of webmTypes) {
    if (MediaRecorder.isTypeSupported(t)) {
      return { mimeType: t, extension: '.webm' };
    }
  }

  return { mimeType: 'video/webm', extension: '.webm' };
}

/**
 * Calculate target resolution dimensions
 */
export function calculateVideoResolution(
  srcWidth: number,
  srcHeight: number,
  resolution: VideoResolution
): { width: number; height: number } {
  let maxW = srcWidth;
  let maxH = srcHeight;

  if (resolution === '1080p') {
    maxW = 1920;
    maxH = 1080;
  } else if (resolution === '720p') {
    maxW = 1280;
    maxH = 720;
  } else if (resolution === '480p') {
    maxW = 854;
    maxH = 480;
  }

  if (srcWidth <= maxW && srcHeight <= maxH) {
    // MediaRecorder canvas dimensions should be even numbers
    return {
      width: Math.floor(srcWidth / 2) * 2,
      height: Math.floor(srcHeight / 2) * 2,
    };
  }

  const ratio = Math.min(maxW / srcWidth, maxH / srcHeight);
  return {
    width: Math.floor((srcWidth * ratio) / 2) * 2,
    height: Math.floor((srcHeight * ratio) / 2) * 2,
  };
}

/**
 * Calculate target video bitrate in bits per second based on quality level (0 to 100)
 */
export function calculateVideoBitrate(level: number, resolution: VideoResolution): number {
  // Base bitrate range: 400 kbps to 6000 kbps
  let minBps = 350_000;
  let maxBps = 4_500_000;

  if (resolution === '1080p' || resolution === 'original') {
    minBps = 800_000;
    maxBps = 6_000_000;
  } else if (resolution === '480p') {
    minBps = 300_000;
    maxBps = 1_500_000;
  }

  const normalized = level / 100;
  return Math.round(minBps + normalized * (maxBps - minBps));
}
