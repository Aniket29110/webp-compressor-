'use client';

import React from 'react';
import {
  Download,
  RotateCcw,
  Sparkles,
  FileDown,
  TrendingDown,
} from 'lucide-react';
import { formatBytes, calculateSavings } from '@/lib/format-utils';
import { DocumentType } from '@/types/document';
import { Card, CardContent } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';

interface DocumentResultProps {
  originalSize: number;
  compressedSize: number;
  savedPercentage?: number;
  compressionRatio?: string;
  compressedFile: File;
  previewUrl?: string | null;
  docType: DocumentType;
  onReset: () => void;
  isCompressing?: boolean;
}

export function DocumentResult({
  originalSize,
  compressedSize,
  compressedFile,
  previewUrl,
  docType,
  onReset,
  isCompressing = false,
}: DocumentResultProps) {
  const savings = calculateSavings(originalSize, compressedSize);

  const handleDownload = () => {
    if (!compressedFile) return;
    const url = URL.createObjectURL(compressedFile);
    const a = document.createElement('a');
    a.href = url;
    a.download = compressedFile.name;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  return (
    <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
      {/* Metrics Banner Card */}
      <Card className="border-emerald-500/20 bg-gradient-to-br from-emerald-500/5 via-card to-card shadow-sm overflow-hidden">
        <CardContent className="p-6">
          <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
            <div className="flex items-center gap-2.5">
              <div className="h-9 w-9 rounded-xl bg-emerald-500/15 text-emerald-600 flex items-center justify-center">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-lg text-foreground">
                  Optimization Complete
                </h3>
                <p className="text-xs text-muted-foreground">
                  Processed locally with in-browser stream compaction
                </p>
              </div>
            </div>

            <Badge
              variant={savings.isExpanded ? 'secondary' : 'default'}
              className={`px-3 py-1 text-sm font-semibold gap-1.5 ${
                savings.isExpanded
                  ? 'bg-amber-500/10 text-amber-600 border border-amber-500/20'
                  : 'bg-emerald-500 text-white'
              }`}
            >
              {savings.isExpanded ? (
                <span>+0.0% (Already Compact)</span>
              ) : (
                <>
                  <TrendingDown className="w-4 h-4" />
                  <span>{savings.savedPercentage}% Smaller</span>
                </>
              )}
            </Badge>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
            <div className="p-3.5 rounded-xl bg-muted/40 border border-border/60">
              <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider block mb-1">
                Original Size
              </span>
              <span className="text-sm sm:text-base font-bold text-foreground">
                {formatBytes(originalSize)}
              </span>
            </div>

            <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
              <span className="text-[11px] font-medium text-emerald-600 uppercase tracking-wider block mb-1">
                Optimized Size
              </span>
              <span className="text-sm sm:text-base font-bold text-emerald-600">
                {formatBytes(compressedSize)}
              </span>
            </div>

            <div className="p-3.5 rounded-xl bg-muted/40 border border-border/60">
              <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider block mb-1">
                Total Saved
              </span>
              <span className="text-sm sm:text-base font-bold text-foreground">
                {formatBytes(savings.savedBytes)}
              </span>
            </div>

            <div className="p-3.5 rounded-xl bg-muted/40 border border-border/60">
              <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider block mb-1">
                Ratio
              </span>
              <span className="text-sm sm:text-base font-bold text-foreground">
                {savings.compressionRatio}
              </span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row items-center gap-3">
            <Button
              type="button"
              onClick={handleDownload}
              className="w-full sm:flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-2.5 rounded-xl shadow-sm gap-2"
            >
              <Download className="w-4 h-4" />
              Download Optimized {docType.toUpperCase()}
            </Button>

            <Button
              type="button"
              variant="outline"
              onClick={onReset}
              disabled={isCompressing}
              className="w-full sm:w-auto rounded-xl gap-2 text-muted-foreground hover:text-foreground"
            >
              <RotateCcw className="w-4 h-4" />
              Compress Another
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* PDF Viewport if PDF */}
      {previewUrl && docType === 'pdf' && (
        <Card className="overflow-hidden border-border/80 bg-card">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-3 text-xs text-muted-foreground">
              <span className="font-semibold text-foreground flex items-center gap-1.5">
                <FileDown className="w-4 h-4 text-emerald-500" />
                Optimized PDF Viewport
              </span>
              <span>{compressedFile.name}</span>
            </div>
            <div className="relative w-full h-80 rounded-xl overflow-hidden border border-border/70 bg-muted/30">
              <iframe
                src={`${previewUrl}#toolbar=0&navpanes=0`}
                className="w-full h-full border-0"
                title="Optimized PDF Preview"
              />
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
