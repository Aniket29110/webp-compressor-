'use client';

import React, { useState, useRef, DragEvent, ChangeEvent } from 'react';
import { Shield, Music } from 'lucide-react';
import { validateAudioFile, ACCEPTED_AUDIO_INPUT_STRING } from '@/lib/audio-utils';
import { Badge } from './ui/badge';
import { Alert, AlertDescription, AlertTitle } from './ui/alert';

interface AudioUploaderProps {
  onFileSelect: (file: File) => void;
  isProcessing?: boolean;
}

export function AudioUploader({ onFileSelect, isProcessing = false }: AudioUploaderProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dragCounterRef = useRef<number>(0);

  const handleDragEnter = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounterRef.current++;
    if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
      setIsDragOver(true);
    }
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounterRef.current--;
    if (dragCounterRef.current <= 0) {
      dragCounterRef.current = 0;
      setIsDragOver(false);
    }
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const processFile = (file: File) => {
    setUploadError(null);
    const validation = validateAudioFile(file);

    if (!validation.isValid) {
      setUploadError(validation.error || 'Invalid audio file.');
      return;
    }

    onFileSelect(file);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounterRef.current = 0;
    setIsDragOver(false);

    if (isProcessing) return;

    const files = e.dataTransfer.files;
    if (!files || files.length === 0) {
      setUploadError('No files dropped.');
      return;
    }

    processFile(files[0]);
  };

  const handleFileInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    processFile(files[0]);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const triggerPicker = () => {
    if (isProcessing) return;
    fileInputRef.current?.click();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      triggerPicker();
    }
  };

  return (
    <div className="w-full flex flex-col gap-4">
      <input
        ref={fileInputRef}
        type="file"
        accept={ACCEPTED_AUDIO_INPUT_STRING}
        onChange={handleFileInputChange}
        className="sr-only"
        aria-label="Upload audio file"
      />

      <div
        role="button"
        tabIndex={0}
        onClick={triggerPicker}
        onKeyDown={handleKeyDown}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        className={`group relative flex flex-col items-center justify-center p-8 sm:p-12 rounded-3xl border-2 border-dashed transition-all duration-300 cursor-pointer text-center select-none overflow-hidden ${
          isDragOver
            ? 'border-purple-500 bg-purple-500/10 shadow-xl shadow-purple-500/10 scale-[1.01]'
            : 'border-border/80 bg-card hover:border-purple-500/50 hover:bg-accent/40 shadow-sm'
        } ${isProcessing ? 'pointer-events-none opacity-60' : ''}`}
      >
        <div className="absolute inset-0 -z-10 bg-gradient-to-b from-purple-500/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

        <div
          className={`h-16 w-16 sm:h-20 sm:w-20 rounded-2xl flex items-center justify-center mb-6 transition-all duration-300 pointer-events-none ${
            isDragOver
              ? 'bg-purple-500 text-white scale-110 shadow-lg'
              : 'bg-purple-500/10 text-purple-500 group-hover:scale-105 group-hover:bg-purple-500/15'
          }`}
        >
          <Music className="w-8 h-8 sm:w-10 sm:h-10" />
        </div>

        <h3 className="text-xl sm:text-2xl font-bold text-foreground tracking-tight mb-2 pointer-events-none">
          {isDragOver ? 'Drop your audio here' : 'Drag & drop your audio here'}
        </h3>
        <p className="text-sm text-muted-foreground mb-6 pointer-events-none">
          or{' '}
          <span className="text-purple-500 font-semibold underline underline-offset-4 group-hover:text-purple-600">
            browse audio from your computer
          </span>
        </p>

        <div className="flex flex-wrap items-center justify-center gap-2 mb-4 max-w-md pointer-events-none">
          {['MP3', 'WAV', 'OGG', 'M4A', 'AAC', 'FLAC', 'WEBM'].map((fmt) => (
            <Badge
              key={fmt}
              variant="secondary"
              className="text-xs px-2.5 py-1 font-medium bg-muted text-muted-foreground group-hover:bg-card transition-colors"
            >
              {fmt}
            </Badge>
          ))}
        </div>

        <p className="text-xs text-muted-foreground flex items-center gap-1.5 pointer-events-none">
          <Shield className="w-3.5 h-3.5 text-purple-500" />
          100% In-Browser Audio Encoding &bull; Max file size: 100MB
        </p>
      </div>

      {uploadError && (
        <Alert variant="destructive" className="animate-in fade-in slide-in-from-top-2 duration-200">
          <AlertTitle>Upload Issue</AlertTitle>
          <AlertDescription>{uploadError}</AlertDescription>
        </Alert>
      )}
    </div>
  );
}
