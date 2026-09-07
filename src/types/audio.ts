export type SupportedAudioFormat = 'mp3' | 'webm' | 'wav';

export type AudioChannels = 'original' | 'mono';

export type AudioSampleRate = 'original' | 44100 | 32000 | 22050 | 16000;

export type AudioBitrate = 64 | 96 | 128 | 192 | 256 | 320;

export interface AudioDetails {
  file: File;
  name: string;
  size: number;
  type: string;
  duration: number;
  sampleRate: number;
  channels: number;
  previewUrl: string;
}

export interface AudioCompressionResult {
  file: File;
  name: string;
  size: number;
  duration: number;
  previewUrl: string;
  format: SupportedAudioFormat;
  savedBytes: number;
  savedPercentage: number;
  compressionRatio: string;
}

export interface UseAudioCompressReturn {
  compress: (fileToCompress?: File) => Promise<void>;
  format: SupportedAudioFormat;
  setFormat: (format: SupportedAudioFormat) => void;
  bitrate: AudioBitrate;
  setBitrate: (bitrate: AudioBitrate) => void;
  channels: AudioChannels;
  setChannels: (channels: AudioChannels) => void;
  sampleRate: AudioSampleRate;
  setSampleRate: (sampleRate: AudioSampleRate) => void;
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
