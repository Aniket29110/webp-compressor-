'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { SupportedFormat, UseImageCompressReturn } from '@/types/image';
import {
  getMimeTypeForFormat,
  getOutputFilename,
  calculateSavings,
} from '@/lib/format-utils';
import {
  validateImageFile,
  loadImageFromFile,
  compressImageOnCanvas,
  DEFAULT_MAX_DIMENSION,
} from '@/lib/image-utils';

export function useImageCompress(): UseImageCompressReturn {
  const [compressionLevel, setCompressionLevelState] = useState<number>(75);
  const [format, setFormatState] = useState<SupportedFormat>('webp');
  const [compressedFile, setCompressedFile] = useState<File | null>(null);
  const [originalSize, setOriginalSize] = useState<number | null>(null);
  const [compressedSize, setCompressedSize] = useState<number | null>(null);
  const [savedPercentage, setSavedPercentage] = useState<number | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [isCompressing, setIsCompressing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Active file reference
  const currentSourceFileRef = useRef<File | null>(null);
  // Cached decoded image to prevent double or repeated decoding on slider adjustments
  const cachedImageRef = useRef<{
    file: File;
    image: CanvasImageSource;
    width: number;
    height: number;
  } | null>(null);

  // Previous preview URL to revoke and prevent memory leaks
  const previewUrlRef = useRef<string | null>(null);
  // Session run token to prevent race conditions and zombie state overwrites
  const activeSessionIdRef = useRef<number>(0);
  // Debounce timer ref for rapid slider events
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Clean up object URL and debounce timer on unmount
  useEffect(() => {
    const sessionRef = activeSessionIdRef;
    const timerRef = debounceTimerRef;
    return () => {
      if (previewUrlRef.current) {
        URL.revokeObjectURL(previewUrlRef.current);
        previewUrlRef.current = null;
      }
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
      sessionRef.current++;
    };
  }, []);

  const clearPreviewUrl = useCallback(() => {
    if (previewUrlRef.current) {
      URL.revokeObjectURL(previewUrlRef.current);
      previewUrlRef.current = null;
    }
  }, []);

  const reset = useCallback(() => {
    // Increment session ID to cancel any pending async compression
    activeSessionIdRef.current++;
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
      debounceTimerRef.current = null;
    }
    clearPreviewUrl();
    currentSourceFileRef.current = null;
    cachedImageRef.current = null;
    setCompressedFile(null);
    setOriginalSize(null);
    setCompressedSize(null);
    setSavedPercentage(null);
    setPreview(null);
    setIsCompressing(false);
    setError(null);
  }, [clearPreviewUrl]);

  /**
   * Internal compression engine executing asynchronously with race-condition guards
   */
  const performCompression = useCallback(
    async (
      sourceFile: File,
      targetLevel: number,
      targetFormat: SupportedFormat
    ) => {
      // Increment session ID to invalidate any prior pending runs
      const sessionId = ++activeSessionIdRef.current;

      // 1. Validation
      const validation = validateImageFile(sourceFile);
      if (!validation.isValid) {
        setError(validation.error || 'Invalid image file.');
        return;
      }

      setIsCompressing(true);
      setError(null);

      try {
        // 2. Decode source image or reuse cached decoded image bitmap
        let decoded = cachedImageRef.current;
        if (!decoded || decoded.file !== sourceFile) {
          const loaded = await loadImageFromFile(sourceFile);
          decoded = {
            file: sourceFile,
            image: loaded.image,
            width: loaded.width,
            height: loaded.height,
          };
          cachedImageRef.current = decoded;
        }

        // Bail out if a newer compression request has started
        if (sessionId !== activeSessionIdRef.current) {
          return;
        }

        // 3. Determine target MIME type and quality
        const mimeType = getMimeTypeForFormat(targetFormat, sourceFile.type);
        const quality = 0.05 + (targetLevel / 100) * 0.95;

        // 4. Compress on HTML5 Canvas (with automatic GPU VRAM cleanup)
        const { blob } = await compressImageOnCanvas(
          decoded.image,
          decoded.width,
          decoded.height,
          mimeType,
          quality,
          DEFAULT_MAX_DIMENSION
        );

        // Bail out if user reset or triggered another compression during canvas processing
        if (sessionId !== activeSessionIdRef.current) {
          return;
        }

        // 5. Generate output filename with new extension
        const outputFilename = getOutputFilename(
          sourceFile.name,
          targetFormat,
          sourceFile.type
        );

        // 6. Create production-ready File object
        const newFile = new File([blob], outputFilename, {
          type: blob.type || mimeType,
          lastModified: Date.now(),
        });

        // 7. Manage Object URL cleanup
        clearPreviewUrl();
        const newPreviewUrl = URL.createObjectURL(blob);
        previewUrlRef.current = newPreviewUrl;

        // 8. Calculate statistics
        const savingsMetrics = calculateSavings(sourceFile.size, newFile.size);

        // 9. Update states
        setCompressedFile(newFile);
        setOriginalSize(sourceFile.size);
        setCompressedSize(newFile.size);
        setSavedPercentage(savingsMetrics.savedPercentage);
        setPreview(newPreviewUrl);
      } catch (err: unknown) {
        if (sessionId === activeSessionIdRef.current) {
          const message =
            err instanceof Error
              ? err.message
              : 'An unexpected error occurred during compression.';
          setError(message);
        }
      } finally {
        if (sessionId === activeSessionIdRef.current) {
          setIsCompressing(false);
        }
      }
    },
    [clearPreviewUrl]
  );

  /**
   * Public compress trigger.
   */
  const compress = useCallback(
    async (fileToCompress?: File) => {
      const file = fileToCompress || currentSourceFileRef.current;
      if (!file) {
        setError('No image selected to compress.');
        return;
      }

      currentSourceFileRef.current = file;
      await performCompression(file, compressionLevel, format);
    },
    [compressionLevel, format, performCompression]
  );

  /**
   * Updates compression level with debouncing to prevent CPU thrashing during continuous dragging
   */
  const setCompressionLevel = useCallback(
    (level: number) => {
      const clamped = Math.min(100, Math.max(0, level));
      setCompressionLevelState(clamped);

      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }

      if (currentSourceFileRef.current) {
        debounceTimerRef.current = setTimeout(() => {
          if (currentSourceFileRef.current) {
            performCompression(currentSourceFileRef.current, clamped, format);
          }
        }, 120);
      }
    },
    [format, performCompression]
  );

  /**
   * Updates target output format and triggers immediate re-compression
   */
  const setFormat = useCallback(
    (newFormat: SupportedFormat) => {
      setFormatState(newFormat);

      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }

      if (currentSourceFileRef.current) {
        performCompression(currentSourceFileRef.current, compressionLevel, newFormat);
      }
    },
    [compressionLevel, performCompression]
  );

  return {
    compress,
    setCompressionLevel,
    compressionLevel,
    setFormat,
    format,
    compressedFile,
    originalSize,
    compressedSize,
    savedPercentage,
    preview,
    isCompressing,
    error,
    reset,
  };
}
