import { Mp3Encoder } from '@breezystack/lamejs';
import {
  AudioBitrate,
} from '@/types/audio';

export const ACCEPTED_AUDIO_EXTENSIONS = [
  '.mp3',
  '.wav',
  '.ogg',
  '.m4a',
  '.aac',
  '.flac',
  '.webm',
] as const;

export const ACCEPTED_AUDIO_MIMES = [
  'audio/mpeg',
  'audio/mp3',
  'audio/wav',
  'audio/x-wav',
  'audio/ogg',
  'audio/x-m4a',
  'audio/aac',
  'audio/flac',
  'audio/webm',
] as const;

export const ACCEPTED_AUDIO_INPUT_STRING =
  '.mp3,.wav,.ogg,.m4a,.aac,.flac,.webm,audio/mpeg,audio/mp3,audio/wav,audio/ogg,audio/aac,audio/flac,audio/webm';

export const MAX_ALLOWED_AUDIO_SIZE_BYTES = 100 * 1024 * 1024; // 100MB

/**
 * Validates selected audio file
 */
export function validateAudioFile(file: File): { isValid: boolean; error?: string } {
  if (!file) {
    return { isValid: false, error: 'No audio file provided.' };
  }

  if (file.size === 0) {
    return { isValid: false, error: 'The selected audio file is empty (0 bytes).' };
  }

  if (file.size > MAX_ALLOWED_AUDIO_SIZE_BYTES) {
    return {
      isValid: false,
      error: `Audio exceeds the 100MB in-browser limit (selected: ${(file.size / (1024 * 1024)).toFixed(1)}MB).`,
    };
  }

  const nameLower = file.name.toLowerCase();
  const hasValidExt = ACCEPTED_AUDIO_EXTENSIONS.some((ext) => nameLower.endsWith(ext));
  const hasValidMime =
    (ACCEPTED_AUDIO_MIMES as readonly string[]).includes(file.type) ||
    file.type.startsWith('audio/');

  if (!hasValidExt && !hasValidMime) {
    return {
      isValid: false,
      error: 'Unsupported audio format. Please upload MP3, WAV, OGG, M4A, AAC, FLAC, or WebM.',
    };
  }

  return { isValid: true };
}

/**
 * Loads and decodes audio metadata via Web Audio API
 */
export async function loadAudioMetadata(file: File): Promise<{
  audioBuffer: AudioBuffer;
  duration: number;
  sampleRate: number;
  channels: number;
  previewUrl: string;
}> {
  const previewUrl = URL.createObjectURL(file);
  const arrayBuffer = await file.arrayBuffer();

  const AudioContextClass =
    window.AudioContext ||
    (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
  const audioCtx = new AudioContextClass();

  try {
    const audioBuffer = await audioCtx.decodeAudioData(arrayBuffer);
    return {
      audioBuffer,
      duration: audioBuffer.duration,
      sampleRate: audioBuffer.sampleRate,
      channels: audioBuffer.numberOfChannels,
      previewUrl,
    };
  } finally {
    if (audioCtx.state !== 'closed') {
      await audioCtx.close();
    }
  }
}

/**
 * Resamples and/or downmixes an AudioBuffer via OfflineAudioContext
 */
export async function resampleAndMixAudio(
  sourceBuffer: AudioBuffer,
  targetSampleRate: number,
  targetChannels: 1 | 2
): Promise<AudioBuffer> {
  const sourceDuration = sourceBuffer.duration;
  const length = Math.ceil(sourceDuration * targetSampleRate);

  const OfflineContextClass =
    window.OfflineAudioContext ||
    (window as unknown as { webkitOfflineAudioContext: typeof OfflineAudioContext })
      .webkitOfflineAudioContext;

  const offlineCtx = new OfflineContextClass(targetChannels, length, targetSampleRate);
  const bufferSource = offlineCtx.createBufferSource();
  bufferSource.buffer = sourceBuffer;

  if (targetChannels === 1 && sourceBuffer.numberOfChannels > 1) {
    // Downmix to mono: average stereo channels evenly
    const merger = offlineCtx.createChannelMerger(1);
    bufferSource.connect(merger, 0, 0);
    bufferSource.connect(merger, 1, 0);
    merger.connect(offlineCtx.destination);
  } else {
    bufferSource.connect(offlineCtx.destination);
  }

  bufferSource.start(0);
  return await offlineCtx.startRendering();
}

/**
 * Encodes an AudioBuffer into an MP3 file using lamejs in chunks
 */
export async function encodeAudioToMp3(
  audioBuffer: AudioBuffer,
  bitrateKbps: AudioBitrate,
  outputFilename: string,
  onProgress?: (progress: number) => void
): Promise<File> {
  const channels = audioBuffer.numberOfChannels;
  const sampleRate = audioBuffer.sampleRate;
  const encoder = new Mp3Encoder(channels, sampleRate, bitrateKbps);

  const numSamples = audioBuffer.length;
  const chunkSize = 1152;
  const mp3Data: Uint8Array[] = [];

  // Convert Float32Array (-1.0 to 1.0) to Int16Array (-32768 to 32767)
  const leftFloat = audioBuffer.getChannelData(0);
  const leftInt16 = new Int16Array(numSamples);
  for (let i = 0; i < numSamples; i++) {
    const s = Math.max(-1, Math.min(1, leftFloat[i]));
    leftInt16[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
  }

  let rightInt16: Int16Array | undefined;
  if (channels > 1) {
    const rightFloat = audioBuffer.getChannelData(1);
    rightInt16 = new Int16Array(numSamples);
    for (let i = 0; i < numSamples; i++) {
      const s = Math.max(-1, Math.min(1, rightFloat[i]));
      rightInt16[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
    }
  }

  // Encode in chunks to prevent blocking and report progress
  for (let i = 0; i < numSamples; i += chunkSize) {
    const end = Math.min(i + chunkSize, numSamples);
    const leftChunk = leftInt16.subarray(i, end);

    let mp3buf: Uint8Array;
    if (channels > 1 && rightInt16) {
      const rightChunk = rightInt16.subarray(i, end);
      mp3buf = encoder.encodeBuffer(leftChunk, rightChunk);
    } else {
      mp3buf = encoder.encodeBuffer(leftChunk);
    }

    if (mp3buf.length > 0) {
      mp3Data.push(mp3buf);
    }

    if (onProgress && i % (chunkSize * 30) === 0) {
      const pct = Math.round((i / numSamples) * 90);
      onProgress(pct);
      // Yield to event loop
      await new Promise((resolve) => setTimeout(resolve, 0));
    }
  }

  const flushed = encoder.flush();
  if (flushed.length > 0) {
    mp3Data.push(flushed);
  }

  if (onProgress) {
    onProgress(100);
  }

  const blob = new Blob(mp3Data as BlobPart[], { type: 'audio/mp3' });
  return new File([blob], outputFilename, { type: 'audio/mp3' });
}

/**
 * Encodes an AudioBuffer into a WAV PCM File
 */
export function encodeAudioToWav(
  audioBuffer: AudioBuffer,
  outputFilename: string
): File {
  const numChannels = audioBuffer.numberOfChannels;
  const sampleRate = audioBuffer.sampleRate;
  const format = 1; // PCM
  const bitDepth = 16;

  const numSamples = audioBuffer.length * numChannels;
  const buffer = new ArrayBuffer(44 + numSamples * 2);
  const view = new DataView(buffer);

  // RIFF identifier
  writeString(view, 0, 'RIFF');
  view.setUint32(4, 36 + numSamples * 2, true);
  writeString(view, 8, 'WAVE');

  // FMT sub-chunk
  writeString(view, 12, 'fmt ');
  view.setUint32(16, 16, true); // Subchunk1Size (16 for PCM)
  view.setUint16(20, format, true); // AudioFormat
  view.setUint16(22, numChannels, true); // NumChannels
  view.setUint32(24, sampleRate, true); // SampleRate
  view.setUint32(28, (sampleRate * numChannels * bitDepth) / 8, true); // ByteRate
  view.setUint16(32, (numChannels * bitDepth) / 8, true); // BlockAlign
  view.setUint16(34, bitDepth, true); // BitsPerSample

  // Data sub-chunk
  writeString(view, 36, 'data');
  view.setUint32(40, numSamples * 2, true);

  // Write PCM samples interleaved
  let offset = 44;
  const channels = [];
  for (let c = 0; c < numChannels; c++) {
    channels.push(audioBuffer.getChannelData(c));
  }

  for (let i = 0; i < audioBuffer.length; i++) {
    for (let c = 0; c < numChannels; c++) {
      const sample = Math.max(-1, Math.min(1, channels[c][i]));
      view.setInt16(offset, sample < 0 ? sample * 0x8000 : sample * 0x7fff, true);
      offset += 2;
    }
  }

  const blob = new Blob([view], { type: 'audio/wav' });
  return new File([blob], outputFilename, { type: 'audio/wav' });
}

function writeString(view: DataView, offset: number, string: string) {
  for (let i = 0; i < string.length; i++) {
    view.setUint8(offset + i, string.charCodeAt(i));
  }
}

/**
 * Encodes audio via MediaRecorder to WebM Opus
 */
export async function encodeAudioToWebmOpus(
  audioBuffer: AudioBuffer,
  bitrateKbps: AudioBitrate,
  outputFilename: string,
  onProgress?: (progress: number) => void
): Promise<File> {
  const AudioContextClass =
    window.AudioContext ||
    (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
  const audioCtx = new AudioContextClass({ sampleRate: audioBuffer.sampleRate });

  const bufferSource = audioCtx.createBufferSource();
  bufferSource.buffer = audioBuffer;

  const dest = audioCtx.createMediaStreamDestination();
  bufferSource.connect(dest);

  let mimeType = 'audio/webm;codecs=opus';
  if (!MediaRecorder.isTypeSupported(mimeType)) {
    mimeType = 'audio/webm';
  }

  const recorder = new MediaRecorder(dest.stream, {
    mimeType,
    audioBitsPerSecond: bitrateKbps * 1000,
  });

  const chunks: Blob[] = [];
  recorder.ondataavailable = (e) => {
    if (e.data && e.data.size > 0) {
      chunks.push(e.data);
    }
  };

  return new Promise((resolve, reject) => {
    const totalDuration = audioBuffer.duration;
    const startTime = Date.now();

    const timer = setInterval(() => {
      const elapsed = (Date.now() - startTime) / 1000;
      const pct = Math.min(95, Math.round((elapsed / totalDuration) * 95));
      if (onProgress) onProgress(pct);
    }, 100);

    recorder.onstop = () => {
      clearInterval(timer);
      if (onProgress) onProgress(100);
      audioCtx.close();
      const blob = new Blob(chunks, { type: 'audio/webm' });
      resolve(new File([blob], outputFilename, { type: 'audio/webm' }));
    };

    recorder.onerror = () => {
      clearInterval(timer);
      audioCtx.close();
      reject(new Error('MediaRecorder audio encoding failed.'));
    };

    recorder.start(50);
    bufferSource.start(0);

    bufferSource.onended = () => {
      setTimeout(() => {
        if (recorder.state !== 'inactive') {
          recorder.stop();
        }
      }, 100);
    };
  });
}
