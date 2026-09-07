'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import {
  SupportedAudioFormat,
  AudioBitrate,
  AudioChannels,
  AudioSampleRate,
  UseAudioCompressReturn,
} from '@/types/audio';
import {
  validateAudioFile,
  loadAudioMetadata,
  resampleAndMixAudio,
  encodeAudioToMp3,
  encodeAudioToWebmOpus,
  encodeAudioToWav,
} from '@/lib/audio-utils';
import { calculateSavings } from '@/lib/format-utils';

export function useAudioCompress(): UseAudioCompressReturn {
  const [format, setFormat] = useState<SupportedAudioFormat>('mp3');
  const [bitrate, setBitrate] = useState<AudioBitrate>(128);
  const [channels, setChannels] = useState<AudioChannels>('original');
  const [sampleRate, setSampleRate] = useState<AudioSampleRate>('original');

  const [compressedFile, setCompressedFile] = useState<File | null>(null);
  const [originalSize, setOriginalSize] = useState<number | null>(null);
  const [compressedSize, setCompressedSize] = useState<number | null>(null);
  const [savedPercentage, setSavedPercentage] = useState<number | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [isCompressing, setIsCompressing] = useState<boolean>(false);
  const [progress, setProgress] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);

  const currentSourceFileRef = useRef<File | null>(null);
  const previewUrlRef = useRef<string | null>(null);
  const activeSessionIdRef = useRef<number>(0);

  // Unmount cleanup
  useEffect(() => {
    return () => {
      if (previewUrlRef.current) {
        URL.revokeObjectURL(previewUrlRef.current);
        previewUrlRef.current = null;
      }
    };
  }, []);

  const clearPreview = useCallback(() => {
    if (previewUrlRef.current) {
      URL.revokeObjectURL(previewUrlRef.current);
      previewUrlRef.current = null;
    }
  }, []);

  const reset = useCallback(() => {
    activeSessionIdRef.current++;
    clearPreview();
    currentSourceFileRef.current = null;
    setCompressedFile(null);
    setOriginalSize(null);
    setCompressedSize(null);
    setSavedPercentage(null);
    setPreview(null);
    setIsCompressing(false);
    setProgress(0);
    setError(null);
  }, [clearPreview]);

  const performAudioCompression = useCallback(
    async (
      sourceFile: File,
      targetFmt: SupportedAudioFormat,
      targetBitrate: AudioBitrate,
      channelMode: AudioChannels,
      targetRate: AudioSampleRate
    ) => {
      const sessionId = ++activeSessionIdRef.current;

      const validation = validateAudioFile(sourceFile);
      if (!validation.isValid) {
        setError(validation.error || 'Invalid audio file.');
        return;
      }

      setIsCompressing(true);
      setProgress(5);
      setError(null);

      try {
        // 1. Decode audio
        const { audioBuffer } = await loadAudioMetadata(sourceFile);

        if (sessionId !== activeSessionIdRef.current) return;

        setProgress(20);

        // 2. Check resampling and channel mixing requirements
        const origRate = audioBuffer.sampleRate;
        const resolvedSampleRate = targetRate === 'original' ? origRate : targetRate;
        const targetChannelCount: 1 | 2 =
          channelMode === 'mono' ? 1 : (Math.min(2, audioBuffer.numberOfChannels) as 1 | 2);

        let processedBuffer = audioBuffer;
        if (
          resolvedSampleRate !== origRate ||
          targetChannelCount !== audioBuffer.numberOfChannels
        ) {
          processedBuffer = await resampleAndMixAudio(
            audioBuffer,
            resolvedSampleRate,
            targetChannelCount
          );
        }

        if (sessionId !== activeSessionIdRef.current) return;

        setProgress(35);

        // Generate output filename
        const dotIdx = sourceFile.name.lastIndexOf('.');
        const baseName = dotIdx !== -1 ? sourceFile.name.slice(0, dotIdx) : sourceFile.name;
        const ext = targetFmt === 'mp3' ? '.mp3' : targetFmt === 'webm' ? '.webm' : '.wav';
        const outputFilename = `${baseName}_optimized${ext}`;

        // 3. Encode to target format
        let resultFile: File;

        if (targetFmt === 'mp3') {
          resultFile = await encodeAudioToMp3(
            processedBuffer,
            targetBitrate,
            outputFilename,
            (pct) => {
              if (sessionId === activeSessionIdRef.current) {
                setProgress(35 + Math.round((pct / 100) * 60));
              }
            }
          );
        } else if (targetFmt === 'webm') {
          resultFile = await encodeAudioToWebmOpus(
            processedBuffer,
            targetBitrate,
            outputFilename,
            (pct) => {
              if (sessionId === activeSessionIdRef.current) {
                setProgress(35 + Math.round((pct / 100) * 60));
              }
            }
          );
        } else {
          // WAV
          resultFile = encodeAudioToWav(processedBuffer, outputFilename);
          setProgress(95);
        }

        if (sessionId !== activeSessionIdRef.current) return;

        const savings = calculateSavings(sourceFile.size, resultFile.size);
        const resultUrl = URL.createObjectURL(resultFile);

        clearPreview();
        previewUrlRef.current = resultUrl;

        setCompressedFile(resultFile);
        setOriginalSize(sourceFile.size);
        setCompressedSize(resultFile.size);
        setSavedPercentage(savings.savedPercentage);
        setPreview(resultUrl);
        setProgress(100);
      } catch (err) {
        if (sessionId === activeSessionIdRef.current) {
          const message =
            err instanceof Error
              ? err.message
              : 'Failed to compress audio. File format or codec may not be supported by this browser.';
          setError(message);
        }
      } finally {
        if (sessionId === activeSessionIdRef.current) {
          setIsCompressing(false);
        }
      }
    },
    [clearPreview]
  );

  const compress = useCallback(
    async (fileToCompress?: File) => {
      const target = fileToCompress || currentSourceFileRef.current;
      if (!target) return;
      currentSourceFileRef.current = target;
      await performAudioCompression(target, format, bitrate, channels, sampleRate);
    },
    [performAudioCompression, format, bitrate, channels, sampleRate]
  );

  return {
    compress,
    format,
    setFormat,
    bitrate,
    setBitrate,
    channels,
    setChannels,
    sampleRate,
    setSampleRate,
    compressedFile,
    originalSize,
    compressedSize,
    savedPercentage,
    preview,
    isCompressing,
    progress,
    error,
    reset,
  };
}
