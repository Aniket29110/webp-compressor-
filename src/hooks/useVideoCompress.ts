'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import {
  SupportedVideoFormat,
  VideoResolution,
  UseVideoCompressReturn,
} from '@/types/image';
import {
  validateVideoFile,
  getBestSupportedVideoMime,
  calculateVideoResolution,
  calculateVideoBitrate,
} from '@/lib/video-utils';
import { calculateSavings } from '@/lib/format-utils';

export function useVideoCompress(): UseVideoCompressReturn {
  const [compressionLevel, setCompressionLevelState] = useState<number>(65);
  const [format, setFormatState] = useState<SupportedVideoFormat>('webm');
  const [resolution, setResolutionState] = useState<VideoResolution>('original');
  const [includeAudio, setIncludeAudioState] = useState<boolean>(true);

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
  const activeVideoElementRef = useRef<HTMLVideoElement | null>(null);

  // Cleanup on unmount
  useEffect(() => {
    const sessionRef = activeSessionIdRef;
    const videoRef = activeVideoElementRef;
    return () => {
      sessionRef.current++;
      if (previewUrlRef.current) {
        URL.revokeObjectURL(previewUrlRef.current);
        previewUrlRef.current = null;
      }
      if (videoRef.current) {
        videoRef.current.pause();
        videoRef.current.src = '';
        videoRef.current = null;
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
    if (activeVideoElementRef.current) {
      activeVideoElementRef.current.pause();
      activeVideoElementRef.current.src = '';
      activeVideoElementRef.current = null;
    }
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

  const performVideoCompression = useCallback(
    async (
      sourceFile: File,
      level: number,
      targetFormat: SupportedVideoFormat,
      targetRes: VideoResolution,
      withAudio: boolean
    ) => {
      const sessionId = ++activeSessionIdRef.current;

      const validation = validateVideoFile(sourceFile);
      if (!validation.isValid) {
        setError(validation.error || 'Invalid video file.');
        return;
      }

      setIsCompressing(true);
      setProgress(0);
      setError(null);

      const videoUrl = URL.createObjectURL(sourceFile);
      const video = document.createElement('video');
      activeVideoElementRef.current = video;

      // CRITICAL FIX 1: Keep muted on DOM to bypass browser Autoplay restrictions completely
      video.muted = true;
      video.src = videoUrl;
      video.preload = 'auto';
      video.playsInline = true;

      let audioContext: AudioContext | null = null;
      let mediaRecorder: MediaRecorder | null = null;
      let intervalTimer: NodeJS.Timeout | null = null;
      let watchdogTimer: NodeJS.Timeout | null = null;

      try {
        await new Promise<void>((resolve, reject) => {
          video.onloadedmetadata = () => resolve();
          video.onerror = () => reject(new Error('Failed to load video stream or unsupported codec.'));
        });

        if (sessionId !== activeSessionIdRef.current) {
          URL.revokeObjectURL(videoUrl);
          return;
        }

        const srcW = video.videoWidth || 1280;
        const srcH = video.videoHeight || 720;
        const duration = video.duration || 1;

        const { width, height } = calculateVideoResolution(srcW, srcH, targetRes);
        const bitrate = calculateVideoBitrate(level, targetRes);
        const { mimeType, extension } = getBestSupportedVideoMime(targetFormat);

        // Setup canvas
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d', { willReadFrequently: false });

        if (!ctx) {
          throw new Error('Unable to create 2D canvas for video processing.');
        }

        // Capture canvas stream at 30 fps
        const canvasStream = canvas.captureStream(30);
        let combinedStream = canvasStream;

        // CRITICAL FIX 2: Capture audio safely via AudioContext without unmuting DOM element
        if (withAudio && typeof window !== 'undefined') {
          try {
            const AudioCtx =
              window.AudioContext ||
              (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;

            if (AudioCtx) {
              audioContext = new AudioCtx();
              // Enable audio processing on the media element
              video.muted = false;
              video.volume = 1.0;

              const sourceNode = audioContext.createMediaElementSource(video);
              const destNode = audioContext.createMediaStreamDestination();
              sourceNode.connect(destNode);

              // Do NOT connect to audioContext.destination (avoids speaker echo)
              const audioTrack = destNode.stream.getAudioTracks()[0];
              if (audioTrack) {
                combinedStream = new MediaStream([
                  ...canvasStream.getVideoTracks(),
                  audioTrack,
                ]);
              }
            }
          } catch {
            // If browser blocks audio capture, gracefully fallback to video stream
            video.muted = true;
            combinedStream = canvasStream;
          }
        }

        mediaRecorder = new MediaRecorder(combinedStream, {
          mimeType,
          videoBitsPerSecond: bitrate,
        });

        const recordedChunks: Blob[] = [];
        mediaRecorder.ondataavailable = (event) => {
          if (event.data && event.data.size > 0) {
            recordedChunks.push(event.data);
          }
        };

        const compressionPromise = new Promise<Blob>((resolve, reject) => {
          mediaRecorder!.onstop = () => {
            if (recordedChunks.length === 0) {
              reject(new Error('MediaRecorder generated 0 bytes. Check format compatibility.'));
              return;
            }
            const finalBlob = new Blob(recordedChunks, { type: mimeType });
            resolve(finalBlob);
          };

          mediaRecorder!.onerror = (e) => {
            reject(new Error(`MediaRecorder encoding error: ${e}`));
          };
        });

        mediaRecorder.start(100);

        // Draw frame routine
        const drawFrame = () => {
          if (sessionId !== activeSessionIdRef.current) return;
          if (!video.paused && !video.ended) {
            ctx.drawImage(video, 0, 0, width, height);
            const currentPct = Math.min(99, Math.round((video.currentTime / duration) * 100));
            setProgress(currentPct);
          }
        };

        // CRITICAL FIX 3: Dual render loop to prevent background tab freezing
        // requestAnimationFrame handles smooth foreground rendering; interval ensures background tabs don't stall
        let animationFrameId: number;
        const rAFCallback = () => {
          if (sessionId !== activeSessionIdRef.current || video.ended || video.paused) return;
          drawFrame();
          animationFrameId = requestAnimationFrame(rAFCallback);
        };

        intervalTimer = setInterval(() => {
          if (document.hidden) {
            drawFrame();
          }
        }, 33); // ~30 fps fallback for inactive/minimized tabs

        const stopRecording = () => {
          cancelAnimationFrame(animationFrameId);
          if (intervalTimer) clearInterval(intervalTimer);
          if (watchdogTimer) clearTimeout(watchdogTimer);

          if (mediaRecorder && mediaRecorder.state !== 'inactive') {
            mediaRecorder.stop();
          }
        };

        video.onended = stopRecording;

        // Watchdog timer: safety kill if duration stalls
        watchdogTimer = setTimeout(() => {
          stopRecording();
        }, (duration + 5) * 1000);

        // Play video
        try {
          await video.play();
        } catch {
          // If unmuted playback failed due to strict browser policy, mute and retry
          video.muted = true;
          await video.play();
        }

        animationFrameId = requestAnimationFrame(rAFCallback);

        const compressedBlob = await compressionPromise;

        // Memory cleanup
        canvas.width = 0;
        canvas.height = 0;
        URL.revokeObjectURL(videoUrl);
        if (audioContext && audioContext.state !== 'closed') {
          audioContext.close();
        }

        if (sessionId !== activeSessionIdRef.current) return;

        const baseName = sourceFile.name.substring(0, sourceFile.name.lastIndexOf('.')) || sourceFile.name;
        const outputFilename = `${baseName}.optimized${extension}`;

        const outputVideoFile = new File([compressedBlob], outputFilename, {
          type: mimeType,
          lastModified: Date.now(),
        });

        clearPreview();
        const newPreviewUrl = URL.createObjectURL(compressedBlob);
        previewUrlRef.current = newPreviewUrl;

        const { savedPercentage: savings } = calculateSavings(
          sourceFile.size,
          outputVideoFile.size
        );

        setCompressedFile(outputVideoFile);
        setOriginalSize(sourceFile.size);
        setCompressedSize(outputVideoFile.size);
        setSavedPercentage(savings);
        setPreview(newPreviewUrl);
        setProgress(100);
      } catch (err: unknown) {
        URL.revokeObjectURL(videoUrl);
        if (sessionId === activeSessionIdRef.current) {
          const msg = err instanceof Error ? err.message : 'Video compression encountered an error.';
          setError(msg);
        }
      } finally {
        if (intervalTimer) clearInterval(intervalTimer);
        if (watchdogTimer) clearTimeout(watchdogTimer);
        if (sessionId === activeSessionIdRef.current) {
          setIsCompressing(false);
        }
      }
    },
    [clearPreview]
  );

  const compress = useCallback(
    async (fileToCompress?: File) => {
      const file = fileToCompress || currentSourceFileRef.current;
      if (!file) {
        setError('No video selected.');
        return;
      }
      currentSourceFileRef.current = file;
      await performVideoCompression(file, compressionLevel, format, resolution, includeAudio);
    },
    [compressionLevel, format, resolution, includeAudio, performVideoCompression]
  );

  const setCompressionLevel = useCallback(
    (level: number) => {
      const clamped = Math.min(100, Math.max(10, level));
      setCompressionLevelState(clamped);
    },
    []
  );

  const setFormat = useCallback((newFormat: SupportedVideoFormat) => {
    setFormatState(newFormat);
  }, []);

  const setResolution = useCallback((newRes: VideoResolution) => {
    setResolutionState(newRes);
  }, []);

  const setIncludeAudio = useCallback((inc: boolean) => {
    setIncludeAudioState(inc);
  }, []);

  return {
    compress,
    setCompressionLevel,
    compressionLevel,
    setFormat,
    format,
    setResolution,
    resolution,
    includeAudio,
    setIncludeAudio,
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
