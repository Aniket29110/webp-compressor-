'use client';

import React, { useState, useRef, DragEvent, ChangeEvent } from 'react';
import { UploadCloud, Shield } from 'lucide-react';
import { validateDocumentFile, ACCEPTED_DOC_INPUT_STRING } from '@/lib/document-utils';
import { Badge } from './ui/badge';
import { Alert, AlertDescription, AlertTitle } from './ui/alert';

interface DocumentUploaderProps {
  onFileSelect: (file: File) => void;
  isProcessing?: boolean;
}

export function DocumentUploader({ onFileSelect, isProcessing = false }: DocumentUploaderProps) {
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
    const validation = validateDocumentFile(file);

    if (!validation.isValid) {
      setUploadError(validation.error || 'Invalid document file.');
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
        accept={ACCEPTED_DOC_INPUT_STRING}
        onChange={handleFileInputChange}
        className="sr-only"
        aria-label="Upload document file"
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
            ? 'border-emerald-500 bg-emerald-500/10 shadow-xl shadow-emerald-500/10 scale-[1.01]'
            : 'border-border/80 bg-card hover:border-emerald-500/50 hover:bg-accent/40 shadow-sm'
        } ${isProcessing ? 'pointer-events-none opacity-60' : ''}`}
      >
        <div className="absolute inset-0 -z-10 bg-gradient-to-b from-emerald-500/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

        <div
          className={`h-16 w-16 sm:h-20 sm:w-20 rounded-2xl flex items-center justify-center mb-6 transition-all duration-300 pointer-events-none ${
            isDragOver
              ? 'bg-emerald-500 text-white scale-110 shadow-lg'
              : 'bg-emerald-500/10 text-emerald-500 group-hover:scale-105 group-hover:bg-emerald-500/15'
          }`}
        >
          <UploadCloud className="w-8 h-8 sm:w-10 sm:h-10" />
        </div>

        <h3 className="text-xl sm:text-2xl font-bold text-foreground tracking-tight mb-2 pointer-events-none">
          {isDragOver ? 'Drop your document here' : 'Drag & drop your document here'}
        </h3>
        <p className="text-sm text-muted-foreground mb-6 pointer-events-none">
          or{' '}
          <span className="text-emerald-500 font-semibold underline underline-offset-4 group-hover:text-emerald-600">
            browse files on your computer
          </span>
        </p>

        <div className="flex flex-wrap items-center justify-center gap-2 mb-4 max-w-md pointer-events-none">
          {['PDF', 'JSON', 'TXT', 'MD', 'CSV', 'XML'].map((fmt) => (
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
          <Shield className="w-3.5 h-3.5 text-emerald-500" />
          100% In-Browser Optimization &bull; Max file size: 75MB
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
