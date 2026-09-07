'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import {
  DocumentCompressionPreset,
  UseDocumentCompressReturn,
} from '@/types/document';
import {
  validateDocumentFile,
  getDocumentType,
  compressPdf,
  compressTextDocument,
} from '@/lib/document-utils';
import { calculateSavings } from '@/lib/format-utils';

export function useDocumentCompress(): UseDocumentCompressReturn {
  const [preset, setPreset] = useState<DocumentCompressionPreset>('recommended');
  const [stripMetadata, setStripMetadata] = useState<boolean>(true);
  const [flattenForms, setFlattenForms] = useState<boolean>(true);
  const [removeAnnotations, setRemoveAnnotations] = useState<boolean>(false);

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

  const performCompression = useCallback(
    async (
      sourceFile: File,
      currPreset: DocumentCompressionPreset,
      stripMeta: boolean,
      flatForms: boolean,
      rmAnnots: boolean
    ) => {
      const sessionId = ++activeSessionIdRef.current;

      const validation = validateDocumentFile(sourceFile);
      if (!validation.isValid) {
        setError(validation.error || 'Invalid document file.');
        return;
      }

      setIsCompressing(true);
      setProgress(25);
      setError(null);

      try {
        const docType = getDocumentType(sourceFile);
        let resultFile: File;

        setProgress(50);

        if (docType === 'pdf') {
          resultFile = await compressPdf(sourceFile, {
            preset: currPreset,
            stripMetadata: stripMeta,
            flattenForms: flatForms,
            removeAnnotations: rmAnnots,
          });
        } else {
          resultFile = await compressTextDocument(sourceFile);
        }

        if (sessionId !== activeSessionIdRef.current) {
          return;
        }

        setProgress(90);

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
              : 'Failed to compress document. The file might be corrupted or password-protected.';
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
      await performCompression(target, preset, stripMetadata, flattenForms, removeAnnotations);
    },
    [performCompression, preset, stripMetadata, flattenForms, removeAnnotations]
  );

  // Auto-compress when settings change if a source file is loaded
  const handlePresetChange = useCallback(
    (newPreset: DocumentCompressionPreset) => {
      setPreset(newPreset);
      if (currentSourceFileRef.current) {
        performCompression(
          currentSourceFileRef.current,
          newPreset,
          stripMetadata,
          flattenForms,
          removeAnnotations
        );
      }
    },
    [performCompression, stripMetadata, flattenForms, removeAnnotations]
  );

  const handleStripMetadataChange = useCallback(
    (val: boolean) => {
      setStripMetadata(val);
      if (currentSourceFileRef.current) {
        performCompression(
          currentSourceFileRef.current,
          preset,
          val,
          flattenForms,
          removeAnnotations
        );
      }
    },
    [performCompression, preset, flattenForms, removeAnnotations]
  );

  const handleFlattenFormsChange = useCallback(
    (val: boolean) => {
      setFlattenForms(val);
      if (currentSourceFileRef.current) {
        performCompression(
          currentSourceFileRef.current,
          preset,
          stripMetadata,
          val,
          removeAnnotations
        );
      }
    },
    [performCompression, preset, stripMetadata, removeAnnotations]
  );

  const handleRemoveAnnotationsChange = useCallback(
    (val: boolean) => {
      setRemoveAnnotations(val);
      if (currentSourceFileRef.current) {
        performCompression(
          currentSourceFileRef.current,
          preset,
          stripMetadata,
          flattenForms,
          val
        );
      }
    },
    [performCompression, preset, stripMetadata, flattenForms]
  );

  return {
    compress,
    preset,
    setPreset: handlePresetChange,
    stripMetadata,
    setStripMetadata: handleStripMetadataChange,
    flattenForms,
    setFlattenForms: handleFlattenFormsChange,
    removeAnnotations,
    setRemoveAnnotations: handleRemoveAnnotationsChange,
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
