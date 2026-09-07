'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useImageCompress } from '@/hooks/useImageCompress';
import { useVideoCompress } from '@/hooks/useVideoCompress';
import { useDocumentCompress } from '@/hooks/useDocumentCompress';
import { useAudioCompress } from '@/hooks/useAudioCompress';

import { ImageUploader } from '@/components/image-uploader';
import { ImagePreview } from '@/components/image-preview';
import { CompressionControls } from '@/components/compression-controls';
import { CompressionResult } from '@/components/compression-result';

import { VideoUploader } from '@/components/video-uploader';
import { VideoPreview } from '@/components/video-preview';
import { VideoControls } from '@/components/video-controls';
import { VideoResult } from '@/components/video-result';

import { DocumentUploader } from '@/components/document-uploader';
import { DocumentPreview } from '@/components/document-preview';
import { DocumentControls } from '@/components/document-controls';
import { DocumentResult } from '@/components/document-result';

import { AudioUploader } from '@/components/audio-uploader';
import { AudioPreview } from '@/components/audio-preview';
import { AudioControls } from '@/components/audio-controls';
import { AudioResult } from '@/components/audio-result';

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { loadImageFromFile } from '@/lib/image-utils';
import { loadVideoMetadata } from '@/lib/video-utils';
import { loadDocumentDetails } from '@/lib/document-utils';
import { loadAudioMetadata } from '@/lib/audio-utils';
import { calculateSavings } from '@/lib/format-utils';
import { DocumentDetails } from '@/types/document';
import { AudioDetails } from '@/types/audio';

import {
  Sparkles,
  ShieldCheck,
  Zap,
  Loader2,
  HardDrive,
  Lock,
  ImageIcon,
  Film,
  FileText,
  Music,
} from 'lucide-react';

export default function CompressorPage() {
  // Mode: 'image' | 'video' | 'document' | 'audio'
  const [activeTab, setActiveTab] = useState<'image' | 'video' | 'document' | 'audio'>('image');

  // ==========================================
  // --- 1. IMAGE STATE ---
  // ==========================================
  const [originalImageFile, setOriginalImageFile] = useState<File | null>(null);
  const [originalImageDetails, setOriginalImageDetails] = useState<{
    width: number;
    height: number;
    previewUrl: string;
  } | null>(null);
  const [imageError, setImageError] = useState<string | null>(null);

  const {
    compress: compressImage,
    setCompressionLevel: setImageCompressionLevel,
    compressionLevel: imageCompressionLevel,
    setFormat: setImageFormat,
    format: imageFormat,
    compressedFile: compressedImageFile,
    originalSize: originalImageSize,
    compressedSize: compressedImageSize,
    savedPercentage: imageSavedPercentage,
    preview: compressedImagePreviewUrl,
    isCompressing: isImageCompressing,
    error: imageCompressionHookError,
    reset: resetImageCompression,
  } = useImageCompress();

  const originalImagePreviewUrlRef = useRef<string | null>(null);

  const cleanupImagePreview = () => {
    if (originalImagePreviewUrlRef.current) {
      URL.revokeObjectURL(originalImagePreviewUrlRef.current);
      originalImagePreviewUrlRef.current = null;
    }
  };

  const handleImageFileSelect = async (file: File) => {
    setImageError(null);
    cleanupImagePreview();

    try {
      const { width, height } = await loadImageFromFile(file);
      const previewUrl = URL.createObjectURL(file);
      originalImagePreviewUrlRef.current = previewUrl;

      setOriginalImageFile(file);
      setOriginalImageDetails({
        width,
        height,
        previewUrl,
      });

      await compressImage(file);
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : 'Failed to process selected image.';
      setImageError(message);
    }
  };

  const handleImageReset = () => {
    cleanupImagePreview();
    setOriginalImageFile(null);
    setOriginalImageDetails(null);
    setImageError(null);
    resetImageCompression();
  };

  // ==========================================
  // --- 2. VIDEO STATE ---
  // ==========================================
  const [originalVideoFile, setOriginalVideoFile] = useState<File | null>(null);
  const [originalVideoDetails, setOriginalVideoDetails] = useState<{
    width: number;
    height: number;
    duration: number;
    previewUrl: string;
  } | null>(null);
  const [videoError, setVideoError] = useState<string | null>(null);

  const {
    compress: compressVideo,
    setCompressionLevel: setVideoCompressionLevel,
    compressionLevel: videoCompressionLevel,
    setFormat: setVideoFormat,
    format: videoFormat,
    setResolution: setVideoResolution,
    resolution: videoResolution,
    includeAudio,
    setIncludeAudio,
    compressedFile: compressedVideoFile,
    originalSize: originalVideoSize,
    compressedSize: compressedVideoSize,
    savedPercentage: videoSavedPercentage,
    preview: compressedVideoPreviewUrl,
    isCompressing: isVideoCompressing,
    progress: videoProgress,
    error: videoCompressionHookError,
    reset: resetVideoCompression,
  } = useVideoCompress();

  const originalVideoPreviewUrlRef = useRef<string | null>(null);

  const cleanupVideoPreview = () => {
    if (originalVideoPreviewUrlRef.current) {
      URL.revokeObjectURL(originalVideoPreviewUrlRef.current);
      originalVideoPreviewUrlRef.current = null;
    }
  };

  const handleVideoFileSelect = async (file: File) => {
    setVideoError(null);
    cleanupVideoPreview();

    try {
      const { width, height, duration, objectUrl } = await loadVideoMetadata(file);
      originalVideoPreviewUrlRef.current = objectUrl;

      setOriginalVideoFile(file);
      setOriginalVideoDetails({
        width,
        height,
        duration,
        previewUrl: objectUrl,
      });
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : 'Failed to load video file.';
      setVideoError(message);
    }
  };

  const handleVideoReset = () => {
    cleanupVideoPreview();
    setOriginalVideoFile(null);
    setOriginalVideoDetails(null);
    setVideoError(null);
    resetVideoCompression();
  };

  // ==========================================
  // --- 3. DOCUMENT STATE ---
  // ==========================================
  const [originalDocFile, setOriginalDocFile] = useState<File | null>(null);
  const [originalDocDetails, setOriginalDocDetails] = useState<DocumentDetails | null>(null);
  const [docError, setDocError] = useState<string | null>(null);

  const {
    compress: compressDocument,
    preset: docPreset,
    setPreset: setDocPreset,
    stripMetadata: docStripMetadata,
    setStripMetadata: setDocStripMetadata,
    flattenForms: docFlattenForms,
    setFlattenForms: setDocFlattenForms,
    removeAnnotations: docRemoveAnnotations,
    setRemoveAnnotations: setDocRemoveAnnotations,
    compressedFile: compressedDocFile,
    originalSize: originalDocSize,
    compressedSize: compressedDocSize,
    savedPercentage: docSavedPercentage,
    preview: compressedDocPreviewUrl,
    isCompressing: isDocCompressing,
    progress: docProgress,
    error: docHookError,
    reset: resetDocCompression,
  } = useDocumentCompress();

  const originalDocPreviewUrlRef = useRef<string | null>(null);

  const cleanupDocPreview = () => {
    if (originalDocPreviewUrlRef.current) {
      URL.revokeObjectURL(originalDocPreviewUrlRef.current);
      originalDocPreviewUrlRef.current = null;
    }
  };

  const handleDocFileSelect = async (file: File) => {
    setDocError(null);
    cleanupDocPreview();

    try {
      const details = await loadDocumentDetails(file);
      if (details.previewUrl) {
        originalDocPreviewUrlRef.current = details.previewUrl;
      }

      setOriginalDocFile(file);
      setOriginalDocDetails(details);

      await compressDocument(file);
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : 'Failed to read document file.';
      setDocError(message);
    }
  };

  const handleDocReset = () => {
    cleanupDocPreview();
    setOriginalDocFile(null);
    setOriginalDocDetails(null);
    setDocError(null);
    resetDocCompression();
  };

  // ==========================================
  // --- 4. AUDIO STATE ---
  // ==========================================
  const [originalAudioFile, setOriginalAudioFile] = useState<File | null>(null);
  const [originalAudioDetails, setOriginalAudioDetails] = useState<AudioDetails | null>(null);
  const [audioError, setAudioError] = useState<string | null>(null);

  const {
    compress: compressAudio,
    format: audioFormat,
    setFormat: setAudioFormat,
    bitrate: audioBitrate,
    setBitrate: setAudioBitrate,
    channels: audioChannels,
    setChannels: setAudioChannels,
    sampleRate: audioSampleRate,
    setSampleRate: setAudioSampleRate,
    compressedFile: compressedAudioFile,
    originalSize: originalAudioSize,
    compressedSize: compressedAudioSize,
    savedPercentage: audioSavedPercentage,
    preview: compressedAudioPreviewUrl,
    isCompressing: isAudioCompressing,
    progress: audioProgress,
    error: audioHookError,
    reset: resetAudioCompression,
  } = useAudioCompress();

  const originalAudioPreviewUrlRef = useRef<string | null>(null);

  const cleanupAudioPreview = () => {
    if (originalAudioPreviewUrlRef.current) {
      URL.revokeObjectURL(originalAudioPreviewUrlRef.current);
      originalAudioPreviewUrlRef.current = null;
    }
  };

  const handleAudioFileSelect = async (file: File) => {
    setAudioError(null);
    cleanupAudioPreview();

    try {
      const { duration, sampleRate, channels, previewUrl } = await loadAudioMetadata(file);
      originalAudioPreviewUrlRef.current = previewUrl;

      setOriginalAudioFile(file);
      setOriginalAudioDetails({
        file,
        name: file.name,
        size: file.size,
        type: file.type,
        duration,
        sampleRate,
        channels,
        previewUrl,
      });
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : 'Failed to decode audio file. May be an unsupported codec.';
      setAudioError(message);
    }
  };

  const handleAudioReset = () => {
    cleanupAudioPreview();
    setOriginalAudioFile(null);
    setOriginalAudioDetails(null);
    setAudioError(null);
    resetAudioCompression();
  };

  // Global unmount cleanup
  useEffect(() => {
    return () => {
      cleanupImagePreview();
      cleanupVideoPreview();
      cleanupDocPreview();
      cleanupAudioPreview();
    };
  }, []);

  // Compute active error for whichever tab is selected
  const activeError =
    activeTab === 'image'
      ? imageError || imageCompressionHookError
      : activeTab === 'video'
      ? videoError || videoCompressionHookError
      : activeTab === 'document'
      ? docError || docHookError
      : audioError || audioHookError;

  // Compression ratios
  const imageRatio =
    originalImageSize && compressedImageSize
      ? calculateSavings(originalImageSize, compressedImageSize).compressionRatio
      : '1.0:1';

  const videoRatio =
    originalVideoSize && compressedVideoSize
      ? calculateSavings(originalVideoSize, compressedVideoSize).compressionRatio
      : '1.0:1';

  const docRatio =
    originalDocSize && compressedDocSize
      ? calculateSavings(originalDocSize, compressedDocSize).compressionRatio
      : '1.0:1';

  const audioRatio =
    originalAudioSize && compressedAudioSize
      ? calculateSavings(originalAudioSize, compressedAudioSize).compressionRatio
      : '1.0:1';

  return (
    <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 flex flex-col items-center">
      {/* Hero Header */}
      <div className="text-center max-w-3xl mb-8 sm:mb-10">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold mb-4 border border-primary/20 shadow-xs">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Client-Side In-Browser Media & Document Suite</span>
        </div>

        <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-foreground">
          {activeTab === 'image' && 'Image Compression'}
          {activeTab === 'video' && 'Video Compression'}
          {activeTab === 'document' && 'Document Optimization'}
          {activeTab === 'audio' && 'Audio Compression'}
        </h1>

        <p className="mt-3 text-base sm:text-lg text-muted-foreground leading-relaxed">
          {activeTab === 'image' &&
            'Compress, optimize and convert your images directly in your browser with zero latency.'}
          {activeTab === 'video' &&
            'Downscale resolution and compress video streams directly in your browser using hardware acceleration.'}
          {activeTab === 'document' &&
            'Compress PDFs, strip tracking metadata, flatten forms, and minify text files with complete privacy.'}
          {activeTab === 'audio' &&
            'Encode, resample, downmix and compress audio files into MP3, Opus, or WAV with zero server uploads.'}
        </p>

        {/* Feature Badges */}
        <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-4 mt-5 text-xs text-muted-foreground">
          <span className="flex items-center gap-1.5 bg-card/60 border border-border/80 px-3 py-1 rounded-full shadow-xs">
            <Lock className="w-3.5 h-3.5 text-emerald-500" />
            100% Client-Side (No Uploads)
          </span>
          <span className="flex items-center gap-1.5 bg-card/60 border border-border/80 px-3 py-1 rounded-full shadow-xs">
            <Zap className="w-3.5 h-3.5 text-amber-500" />
            Instant In-Browser Execution
          </span>
          <span className="flex items-center gap-1.5 bg-card/60 border border-border/80 px-3 py-1 rounded-full shadow-xs">
            <HardDrive className="w-3.5 h-3.5 text-primary" />
            {activeTab === 'image' && 'WebP, AVIF, JPEG, PNG'}
            {activeTab === 'video' && 'WebM & MP4'}
            {activeTab === 'document' && 'PDF, JSON, MD, TXT, CSV'}
            {activeTab === 'audio' && 'MP3, WebM Opus, WAV'}
          </span>
        </div>
      </div>

      {/* 4 Mode Navigation Tabs */}
      <div className="flex flex-wrap items-center justify-center gap-1.5 sm:gap-2 p-1.5 rounded-2xl bg-muted/70 border border-border/70 mb-8 shadow-xs">
        {/* Tab 1: Image */}
        <button
          type="button"
          onClick={() => setActiveTab('image')}
          className={`flex items-center gap-2 px-4 sm:px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 cursor-pointer ${
            activeTab === 'image'
              ? 'bg-card text-foreground shadow-sm ring-1 ring-border/80'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <ImageIcon className="w-4 h-4 text-primary" />
          <span>Image</span>
        </button>

        {/* Tab 2: Video */}
        <button
          type="button"
          onClick={() => setActiveTab('video')}
          className={`flex items-center gap-2 px-4 sm:px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 cursor-pointer ${
            activeTab === 'video'
              ? 'bg-card text-foreground shadow-sm ring-1 ring-border/80'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <Film className="w-4 h-4 text-indigo-500" />
          <span>Video</span>
        </button>

        {/* Tab 3: Document */}
        <button
          type="button"
          onClick={() => setActiveTab('document')}
          className={`flex items-center gap-2 px-4 sm:px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 cursor-pointer ${
            activeTab === 'document'
              ? 'bg-card text-foreground shadow-sm ring-1 ring-border/80'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <FileText className="w-4 h-4 text-emerald-500" />
          <span>Document</span>
        </button>

        {/* Tab 4: Audio */}
        <button
          type="button"
          onClick={() => setActiveTab('audio')}
          className={`flex items-center gap-2 px-4 sm:px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 cursor-pointer ${
            activeTab === 'audio'
              ? 'bg-card text-foreground shadow-sm ring-1 ring-border/80'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <Music className="w-4 h-4 text-purple-500" />
          <span>Audio</span>
        </button>
      </div>

      {/* Global Error Banner */}
      {activeError && (
        <div className="w-full max-w-4xl mb-6">
          <Alert variant="destructive">
            <AlertTitle>Compression Alert</AlertTitle>
            <AlertDescription>{activeError}</AlertDescription>
          </Alert>
        </div>
      )}

      {/* ========================================================================= */}
      {/* Tab 1: Image Compression Workspace */}
      {/* ========================================================================= */}
      {activeTab === 'image' && (
        <div className="w-full max-w-5xl">
          {!originalImageFile ? (
            <div className="w-full max-w-2xl mx-auto animate-in fade-in-50 duration-300">
              <ImageUploader onFileSelect={handleImageFileSelect} isProcessing={isImageCompressing} />
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start animate-in fade-in-50 duration-300">
              <div className="lg:col-span-5 flex flex-col gap-6">
                <ImagePreview
                  name={originalImageFile.name}
                  type={originalImageFile.type}
                  size={originalImageFile.size}
                  width={originalImageDetails?.width}
                  height={originalImageDetails?.height}
                  previewUrl={originalImageDetails?.previewUrl || ''}
                  onRemove={handleImageReset}
                  isCompressing={isImageCompressing}
                />

                <CompressionControls
                  compressionLevel={imageCompressionLevel}
                  onCompressionLevelChange={setImageCompressionLevel}
                  format={imageFormat}
                  onFormatChange={setImageFormat}
                  originalName={originalImageFile.name}
                  originalMime={originalImageFile.type}
                  isCompressing={isImageCompressing}
                />
              </div>

              <div className="lg:col-span-7 flex flex-col gap-6">
                {compressedImageFile && compressedImagePreviewUrl && originalImageDetails ? (
                  <CompressionResult
                    originalUrl={originalImageDetails.previewUrl}
                    compressedUrl={compressedImagePreviewUrl}
                    originalSize={originalImageSize || originalImageFile.size}
                    compressedSize={compressedImageSize || compressedImageFile.size}
                    savedPercentage={imageSavedPercentage ?? 0}
                    compressionRatio={imageRatio}
                    outputFormat={
                      imageFormat === 'original'
                        ? originalImageFile.type.replace('image/', '')
                        : imageFormat
                    }
                    outputDimensions={{
                      width: originalImageDetails.width,
                      height: originalImageDetails.height,
                    }}
                    compressedFile={compressedImageFile}
                    onReset={handleImageReset}
                    isCompressing={isImageCompressing}
                  />
                ) : (
                  <div className="p-12 rounded-2xl border border-border/80 bg-card/60 flex flex-col items-center justify-center text-center shadow-xs">
                    <div className="h-14 w-14 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mb-4">
                      <Loader2 className="w-7 h-7 animate-spin" />
                    </div>
                    <h3 className="text-lg font-bold text-foreground mb-1">
                      Optimizing Image...
                    </h3>
                    <p className="text-sm text-muted-foreground max-w-xs">
                      Rendering pixels on HTML5 Canvas and calculating size reductions in real time.
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* Tab 2: Video Compression Workspace */}
      {/* ========================================================================= */}
      {activeTab === 'video' && (
        <div className="w-full max-w-5xl">
          {!originalVideoFile ? (
            <div className="w-full max-w-2xl mx-auto animate-in fade-in-50 duration-300">
              <VideoUploader onFileSelect={handleVideoFileSelect} isProcessing={isVideoCompressing} />
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start animate-in fade-in-50 duration-300">
              <div className="lg:col-span-5 flex flex-col gap-6">
                <VideoPreview
                  name={originalVideoFile.name}
                  type={originalVideoFile.type}
                  size={originalVideoFile.size}
                  width={originalVideoDetails?.width}
                  height={originalVideoDetails?.height}
                  duration={originalVideoDetails?.duration}
                  previewUrl={originalVideoDetails?.previewUrl || ''}
                  onRemove={handleVideoReset}
                  isCompressing={isVideoCompressing}
                />

                <VideoControls
                  compressionLevel={videoCompressionLevel}
                  onCompressionLevelChange={setVideoCompressionLevel}
                  format={videoFormat}
                  onFormatChange={setVideoFormat}
                  resolution={videoResolution}
                  onResolutionChange={setVideoResolution}
                  includeAudio={includeAudio}
                  onIncludeAudioChange={setIncludeAudio}
                  onCompress={() => compressVideo(originalVideoFile)}
                  isCompressing={isVideoCompressing}
                  progress={videoProgress}
                />
              </div>

              <div className="lg:col-span-7 flex flex-col gap-6">
                {compressedVideoFile && compressedVideoPreviewUrl && originalVideoDetails ? (
                  <VideoResult
                    originalUrl={originalVideoDetails.previewUrl}
                    compressedUrl={compressedVideoPreviewUrl}
                    originalSize={originalVideoSize || originalVideoFile.size}
                    compressedSize={compressedVideoSize || compressedVideoFile.size}
                    savedPercentage={videoSavedPercentage ?? 0}
                    compressionRatio={videoRatio}
                    outputFormat={videoFormat}
                    compressedFile={compressedVideoFile}
                    onReset={handleVideoReset}
                    isCompressing={isVideoCompressing}
                  />
                ) : (
                  <div className="p-12 rounded-2xl border border-border/80 bg-card/60 flex flex-col items-center justify-center text-center shadow-xs">
                    <div className="h-14 w-14 rounded-2xl bg-indigo-500/10 text-indigo-500 flex items-center justify-center mb-4">
                      {isVideoCompressing ? (
                        <Loader2 className="w-7 h-7 animate-spin" />
                      ) : (
                        <Film className="w-7 h-7" />
                      )}
                    </div>
                    <h3 className="text-lg font-bold text-foreground mb-1">
                      {isVideoCompressing ? `Compressing Video (${videoProgress}%)...` : 'Ready to Compress'}
                    </h3>
                    <p className="text-sm text-muted-foreground max-w-xs">
                      {isVideoCompressing
                        ? 'Hardware-accelerated frames are streaming through Canvas and MediaRecorder.'
                        : 'Adjust the bitrate, resolution, or audio settings on the left, then click "Start Video Compression".'}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* Tab 3: Document Optimization Workspace */}
      {/* ========================================================================= */}
      {activeTab === 'document' && (
        <div className="w-full max-w-5xl">
          {!originalDocFile ? (
            <div className="w-full max-w-2xl mx-auto animate-in fade-in-50 duration-300">
              <DocumentUploader onFileSelect={handleDocFileSelect} isProcessing={isDocCompressing} />
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start animate-in fade-in-50 duration-300">
              <div className="lg:col-span-5 flex flex-col gap-6">
                {originalDocDetails && (
                  <DocumentPreview
                    name={originalDocFile.name}
                    type={originalDocFile.type}
                    size={originalDocFile.size}
                    docType={originalDocDetails.docType}
                    pageCount={originalDocDetails.pageCount}
                    charCount={originalDocDetails.charCount}
                    lineCount={originalDocDetails.lineCount}
                    previewUrl={originalDocDetails.previewUrl}
                    metadata={originalDocDetails.metadata}
                    onRemove={handleDocReset}
                    isCompressing={isDocCompressing}
                  />
                )}

                {originalDocDetails && (
                  <DocumentControls
                    preset={docPreset}
                    onPresetChange={setDocPreset}
                    stripMetadata={docStripMetadata}
                    onStripMetadataChange={setDocStripMetadata}
                    flattenForms={docFlattenForms}
                    onFlattenFormsChange={setDocFlattenForms}
                    removeAnnotations={docRemoveAnnotations}
                    onRemoveAnnotationsChange={setDocRemoveAnnotations}
                    docType={originalDocDetails.docType}
                    isCompressing={isDocCompressing}
                    onCompress={() => compressDocument(originalDocFile)}
                    progress={docProgress}
                  />
                )}
              </div>

              <div className="lg:col-span-7 flex flex-col gap-6">
                {compressedDocFile && originalDocDetails ? (
                  <DocumentResult
                    originalSize={originalDocSize || originalDocFile.size}
                    compressedSize={compressedDocSize || compressedDocFile.size}
                    savedPercentage={docSavedPercentage ?? 0}
                    compressionRatio={docRatio}
                    compressedFile={compressedDocFile}
                    previewUrl={compressedDocPreviewUrl}
                    docType={originalDocDetails.docType}
                    onReset={handleDocReset}
                    isCompressing={isDocCompressing}
                  />
                ) : (
                  <div className="p-12 rounded-2xl border border-border/80 bg-card/60 flex flex-col items-center justify-center text-center shadow-xs">
                    <div className="h-14 w-14 rounded-2xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center mb-4">
                      {isDocCompressing ? (
                        <Loader2 className="w-7 h-7 animate-spin" />
                      ) : (
                        <FileText className="w-7 h-7" />
                      )}
                    </div>
                    <h3 className="text-lg font-bold text-foreground mb-1">
                      {isDocCompressing ? `Optimizing Document (${docProgress}%)...` : 'Ready to Optimize'}
                    </h3>
                    <p className="text-sm text-muted-foreground max-w-xs">
                      {isDocCompressing
                        ? 'Consolidating object streams and stripping unnecessary tags.'
                        : 'Adjust compression profiles or privacy flags on the left, then click "Re-compress Document".'}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* Tab 4: Audio Compression Workspace */}
      {/* ========================================================================= */}
      {activeTab === 'audio' && (
        <div className="w-full max-w-5xl">
          {!originalAudioFile ? (
            <div className="w-full max-w-2xl mx-auto animate-in fade-in-50 duration-300">
              <AudioUploader onFileSelect={handleAudioFileSelect} isProcessing={isAudioCompressing} />
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start animate-in fade-in-50 duration-300">
              <div className="lg:col-span-5 flex flex-col gap-6">
                {originalAudioDetails && (
                  <AudioPreview
                    name={originalAudioFile.name}
                    type={originalAudioFile.type}
                    size={originalAudioFile.size}
                    duration={originalAudioDetails.duration}
                    sampleRate={originalAudioDetails.sampleRate}
                    channels={originalAudioDetails.channels}
                    previewUrl={originalAudioDetails.previewUrl}
                    onRemove={handleAudioReset}
                    isCompressing={isAudioCompressing}
                  />
                )}

                <AudioControls
                  format={audioFormat}
                  onFormatChange={setAudioFormat}
                  bitrate={audioBitrate}
                  onBitrateChange={setAudioBitrate}
                  channels={audioChannels}
                  onChannelsChange={setAudioChannels}
                  sampleRate={audioSampleRate}
                  onSampleRateChange={setAudioSampleRate}
                  onCompress={() => compressAudio(originalAudioFile)}
                  isCompressing={isAudioCompressing}
                  progress={audioProgress}
                />
              </div>

              <div className="lg:col-span-7 flex flex-col gap-6">
                {compressedAudioFile && compressedAudioPreviewUrl && originalAudioDetails ? (
                  <AudioResult
                    originalUrl={originalAudioDetails.previewUrl}
                    compressedUrl={compressedAudioPreviewUrl}
                    originalSize={originalAudioSize || originalAudioFile.size}
                    compressedSize={compressedAudioSize || compressedAudioFile.size}
                    savedPercentage={audioSavedPercentage ?? 0}
                    compressionRatio={audioRatio}
                    outputFormat={audioFormat}
                    compressedFile={compressedAudioFile}
                    onReset={handleAudioReset}
                    isCompressing={isAudioCompressing}
                  />
                ) : (
                  <div className="p-12 rounded-2xl border border-border/80 bg-card/60 flex flex-col items-center justify-center text-center shadow-xs">
                    <div className="h-14 w-14 rounded-2xl bg-purple-500/10 text-purple-500 flex items-center justify-center mb-4">
                      {isAudioCompressing ? (
                        <Loader2 className="w-7 h-7 animate-spin" />
                      ) : (
                        <Music className="w-7 h-7" />
                      )}
                    </div>
                    <h3 className="text-lg font-bold text-foreground mb-1">
                      {isAudioCompressing ? `Encoding Audio (${audioProgress}%)...` : 'Ready to Compress'}
                    </h3>
                    <p className="text-sm text-muted-foreground max-w-xs">
                      {isAudioCompressing
                        ? 'Resampling buffers and encoding stream into MP3/Opus format in real time.'
                        : 'Adjust bitrate, channel mode, or sample rate on the left, then click "Start Audio Compression".'}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Footer */}
      <footer className="mt-16 sm:mt-24 pt-8 border-t border-border/60 w-full max-w-4xl text-center text-xs text-muted-foreground flex flex-col sm:flex-row items-center justify-between gap-4">
        <p className="flex items-center gap-1.5">
          <ShieldCheck className="w-4 h-4 text-emerald-500" />
          100% Client-Side Suite: Images, Videos, Documents, and Audio are never sent to any server.
        </p>
        <p className="font-mono text-[11px] text-muted-foreground/70">
          Powered by HTML5 Canvas, MediaRecorder, Web Audio & pdf-lib
        </p>
      </footer>
    </main>
  );
}
