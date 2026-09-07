'use client';

import React from 'react';
import {
  Download,
  RotateCcw,
  TrendingDown,
  TrendingUp,
  HardDrive,
  FileCheck2,
  Sparkles,
  Maximize2,
  FileCode,
  AlertTriangle,
} from 'lucide-react';
import { formatBytes } from '@/lib/format-utils';
import { Button } from './ui/button';
import { Card, CardHeader, CardTitle, CardContent } from './ui/card';
import { Badge } from './ui/badge';
import { ImageComparison } from './image-comparison';

interface CompressionResultProps {
  originalUrl: string;
  compressedUrl: string;
  originalSize: number;
  compressedSize: number;
  savedPercentage: number;
  compressionRatio: string;
  outputFormat: string;
  outputDimensions?: { width: number; height: number };
  compressedFile: File;
  onReset: () => void;
  isCompressing?: boolean;
}

export function CompressionResult({
  originalUrl,
  compressedUrl,
  originalSize,
  compressedSize,
  savedPercentage,
  compressionRatio,
  outputFormat,
  outputDimensions,
  compressedFile,
  onReset,
  isCompressing = false,
}: CompressionResultProps) {
  // Reuse already-existing compressedUrl to prevent duplicate Object URL allocations and premature revocation
  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = compressedUrl;
    link.download = compressedFile.name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const isExpanded = compressedSize > originalSize;
  const isSavedPositive = savedPercentage > 0 && !isExpanded;
  const sizeDiffBytes = Math.abs(originalSize - compressedSize);
  const expansionPercentage = originalSize > 0 ? (((compressedSize - originalSize) / originalSize) * 100).toFixed(1) : '0';

  return (
    <Card className="border border-border/80 bg-card shadow-sm overflow-hidden animate-in fade-in-50 duration-300">
      <CardHeader className="pb-4 border-b border-border/60 bg-muted/20">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className={`p-2 rounded-xl ${isExpanded ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400' : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'}`}>
              <FileCheck2 className="w-5 h-5" />
            </div>
            <div>
              <CardTitle className="text-base font-bold">Optimization Complete</CardTitle>
              <p className="text-xs text-muted-foreground mt-0.5">
                {isExpanded
                  ? `File expanded by ${formatBytes(sizeDiffBytes)} due to ${outputFormat.toUpperCase()} format overhead`
                  : `Saved ${formatBytes(sizeDiffBytes)} with ${outputFormat.toUpperCase()} compression`}
              </p>
            </div>
          </div>

          <Badge
            variant={isExpanded ? 'warning' : isSavedPositive ? 'success' : 'secondary'}
            className="text-xs py-1 px-2.5 font-bold"
          >
            {isExpanded
              ? `+${expansionPercentage}% Expanded`
              : isSavedPositive
              ? `-${savedPercentage}% Reduced`
              : 'Lossless (Same Size)'}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="p-5 flex flex-col gap-6">
        {/* Key Metrics Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {/* Original Size */}
          <div className="p-3.5 rounded-xl bg-muted/40 border border-border/60 flex flex-col justify-between">
            <span className="text-[11px] font-medium text-muted-foreground flex items-center gap-1.5">
              <HardDrive className="w-3.5 h-3.5" /> Original Size
            </span>
            <span className="text-base sm:text-lg font-bold font-mono text-foreground mt-1">
              {formatBytes(originalSize)}
            </span>
          </div>

          {/* Compressed Size */}
          <div className={`p-3.5 rounded-xl border flex flex-col justify-between ${
            isExpanded
              ? 'bg-amber-500/5 border-amber-500/20 text-amber-600 dark:text-amber-400'
              : 'bg-emerald-500/5 border-emerald-500/20 text-emerald-600 dark:text-emerald-400'
          }`}>
            <span className="text-[11px] font-medium flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" /> Output Size
            </span>
            <span className="text-base sm:text-lg font-bold font-mono mt-1">
              {formatBytes(compressedSize)}
            </span>
          </div>

          {/* Savings / Expansion */}
          <div className={`p-3.5 rounded-xl border flex flex-col justify-between ${
            isExpanded ? 'bg-amber-500/5 border-amber-500/20 text-amber-600 dark:text-amber-400' : 'bg-primary/5 border-primary/20 text-primary'
          }`}>
            <span className="text-[11px] font-medium flex items-center gap-1.5">
              {isExpanded ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
              {isExpanded ? 'Size Change' : 'Savings'}
            </span>
            <span className="text-base sm:text-lg font-bold font-mono mt-1">
              {isExpanded ? `+${expansionPercentage}%` : `${savedPercentage}%`}
            </span>
          </div>

          {/* Ratio */}
          <div className="p-3.5 rounded-xl bg-muted/40 border border-border/60 flex flex-col justify-between">
            <span className="text-[11px] font-medium text-muted-foreground">
              Ratio / Format
            </span>
            <span className="text-sm sm:text-base font-bold font-mono text-foreground mt-1 truncate">
              {compressionRatio} ({outputFormat.toUpperCase()})
            </span>
          </div>
        </div>

        {/* Warning if file expanded */}
        {isExpanded && (
          <div className="flex items-start gap-2.5 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-700 dark:text-amber-300">
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-amber-600 dark:text-amber-400" />
            <span>
              <strong>Note on File Expansion:</strong> Converting a lossy image (like a compressed JPEG) to PNG or ultra-high-quality WebP often increases file size because PNG is lossless. Try lowering the compression level or choosing WebP/AVIF for smaller sizes.
            </span>
          </div>
        )}

        {/* Visual Comparison Split Slider */}
        <ImageComparison
          originalUrl={originalUrl}
          compressedUrl={compressedUrl}
          originalName="Original Image"
          compressedName={compressedFile.name}
        />

        {/* Additional File Meta Details */}
        <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-muted-foreground bg-muted/30 p-3 rounded-xl border border-border/50">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5">
              <FileCode className="w-3.5 h-3.5 text-primary" />
              File: <strong className="text-foreground font-mono">{compressedFile.name}</strong>
            </span>
            {outputDimensions && (
              <span className="flex items-center gap-1.5 hidden sm:inline-flex">
                <Maximize2 className="w-3.5 h-3.5 text-muted-foreground" />
                Dimensions: <strong className="text-foreground">{outputDimensions.width} × {outputDimensions.height}</strong>
              </span>
            )}
          </div>
          <span className="text-[11px] text-muted-foreground">
            Processed 100% in your browser
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
            Compress Another
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
