'use client';

import React from 'react';
import {
  Download,
  RotateCcw,
  TrendingDown,
  HardDrive,
  FileCheck2,
  Sparkles,
  FileCode,
} from 'lucide-react';
import { formatBytes } from '@/lib/format-utils';
import { Button } from './ui/button';
import { Card, CardHeader, CardTitle, CardContent } from './ui/card';
import { Badge } from './ui/badge';

interface VideoResultProps {
  originalUrl: string;
  compressedUrl: string;
  originalSize: number;
  compressedSize: number;
  savedPercentage: number;
  compressionRatio: string;
  outputFormat: string;
  compressedFile: File;
  onReset: () => void;
  isCompressing?: boolean;
}

export function VideoResult({
  originalUrl,
  compressedUrl,
  originalSize,
  compressedSize,
  savedPercentage,
  compressionRatio,
  outputFormat,
  compressedFile,
  onReset,
  isCompressing = false,
}: VideoResultProps) {
  const handleDownload = () => {
    const downloadUrl = URL.createObjectURL(compressedFile);
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = compressedFile.name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setTimeout(() => {
      URL.revokeObjectURL(downloadUrl);
    }, 1000);
  };

  const isSavedPositive = savedPercentage > 0;
  const savedBytes = Math.max(0, originalSize - compressedSize);

  return (
    <Card className="border border-border/80 bg-card shadow-sm overflow-hidden animate-in fade-in-50 duration-300">
      <CardHeader className="pb-4 border-b border-border/60 bg-muted/20">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <FileCheck2 className="w-5 h-5" />
            </div>
            <div>
              <CardTitle className="text-base font-bold">Video Optimized</CardTitle>
              <p className="text-xs text-muted-foreground mt-0.5">
                Saved {formatBytes(savedBytes)} with {outputFormat.toUpperCase()} encoding
              </p>
            </div>
          </div>

          <Badge variant={isSavedPositive ? 'success' : 'secondary'} className="text-xs py-1 px-2.5 font-bold">
            {isSavedPositive ? `-${savedPercentage}% Reduced` : 'Processed'}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="p-5 flex flex-col gap-6">
        {/* Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="p-3.5 rounded-xl bg-muted/40 border border-border/60 flex flex-col justify-between">
            <span className="text-[11px] font-medium text-muted-foreground flex items-center gap-1.5">
              <HardDrive className="w-3.5 h-3.5" /> Original Size
            </span>
            <span className="text-base sm:text-lg font-bold font-mono text-foreground mt-1">
              {formatBytes(originalSize)}
            </span>
          </div>

          <div className="p-3.5 rounded-xl bg-emerald-500/5 border border-emerald-500/20 flex flex-col justify-between">
            <span className="text-[11px] font-medium text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" /> Compressed
            </span>
            <span className="text-base sm:text-lg font-bold font-mono text-emerald-600 dark:text-emerald-400 mt-1">
              {formatBytes(compressedSize)}
            </span>
          </div>

          <div className="p-3.5 rounded-xl bg-primary/5 border border-primary/20 flex flex-col justify-between">
            <span className="text-[11px] font-medium text-primary flex items-center gap-1.5">
              <TrendingDown className="w-3.5 h-3.5" /> Savings
            </span>
            <span className="text-base sm:text-lg font-bold font-mono text-primary mt-1">
              {savedPercentage}%
            </span>
          </div>

          <div className="p-3.5 rounded-xl bg-muted/40 border border-border/60 flex flex-col justify-between">
            <span className="text-[11px] font-medium text-muted-foreground">
              Ratio / Format
            </span>
            <span className="text-sm sm:text-base font-bold font-mono text-foreground mt-1 truncate">
              {compressionRatio} ({outputFormat.toUpperCase()})
            </span>
          </div>
        </div>

        {/* Side-by-Side Video Players */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between px-1">
              <span className="text-xs font-semibold text-muted-foreground">Original Video</span>
              <Badge variant="outline" className="text-[10px] py-0">Before ({formatBytes(originalSize)})</Badge>
            </div>
            <div className="relative aspect-video rounded-xl overflow-hidden bg-black border border-border/70 flex items-center justify-center">
              <video
                src={originalUrl}
                controls
                playsInline
                className="w-full h-full object-contain"
              />
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between px-1">
              <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">Compressed Video</span>
              <Badge variant="success" className="text-[10px] py-0">After ({formatBytes(compressedSize)})</Badge>
            </div>
            <div className="relative aspect-video rounded-xl overflow-hidden bg-black border border-emerald-500/30 flex items-center justify-center">
              <video
                src={compressedUrl}
                controls
                playsInline
                autoPlay
                loop
                muted
                className="w-full h-full object-contain"
              />
            </div>
          </div>
        </div>

        {/* File Metadata info */}
        <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-muted-foreground bg-muted/30 p-3 rounded-xl border border-border/50">
          <span className="flex items-center gap-1.5">
            <FileCode className="w-3.5 h-3.5 text-primary" />
            File: <strong className="text-foreground font-mono">{compressedFile.name}</strong>
          </span>
          <span className="text-[11px] text-muted-foreground">
            Processed 100% in your browser using MediaRecorder API
          </span>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
          <Button
            onClick={handleDownload}
            size="lg"
            className="w-full sm:flex-1 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold shadow-md shadow-emerald-600/20"
          >
            <Download className="w-5 h-5 mr-1" />
            Download {compressedFile.name}
          </Button>

          <Button
            onClick={onReset}
            variant="outline"
            size="lg"
            disabled={isCompressing}
            className="w-full sm:w-auto"
          >
            <RotateCcw className="w-4 h-4 mr-1" />
            Compress Another Video
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
