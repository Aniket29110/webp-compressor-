'use client';

import React from 'react';
import { X, FileImage, Maximize2, HardDrive, Tag } from 'lucide-react';
import { formatBytes } from '@/lib/format-utils';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Card } from './ui/card';

interface ImagePreviewProps {
  name: string;
  type: string;
  size: number;
  width?: number;
  height?: number;
  previewUrl: string;
  onRemove: () => void;
  isCompressing?: boolean;
}

export function ImagePreview({
  name,
  type,
  size,
  width,
  height,
  previewUrl,
  onRemove,
  isCompressing = false,
}: ImagePreviewProps) {
  // Format type display cleanly (e.g. image/jpeg -> JPEG)
  const displayFormat = type.replace('image/', '').toUpperCase() || 'IMAGE';

  return (
    <Card className="overflow-hidden border border-border/80 bg-card shadow-sm">
      <div className="p-4 sm:p-5">
        <div className="flex items-start justify-between gap-4 mb-4">
          <div className="flex items-center gap-3 min-w-0">
            <div className="p-2.5 rounded-xl bg-primary/10 text-primary shrink-0">
              <FileImage className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h4 className="text-sm font-semibold text-foreground truncate" title={name}>
                {name}
              </h4>
              <p className="text-xs text-muted-foreground flex items-center gap-2 mt-0.5">
                <span className="font-mono">{formatBytes(size)}</span>
                <span>&bull;</span>
                <span className="font-medium text-foreground/80">{displayFormat}</span>
              </p>
            </div>
          </div>

          <Button
            variant="ghost"
            size="sm"
            onClick={onRemove}
            disabled={isCompressing}
            className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 h-8 px-2 text-xs shrink-0"
            title="Remove image and pick another"
          >
            <X className="w-4 h-4 mr-1" />
            Remove
          </Button>
        </div>

        {/* Image Preview Thumbnail */}
        <div className="relative aspect-video w-full overflow-hidden rounded-xl bg-muted/40 border border-border/50 flex items-center justify-center">
          {/* Checkerboard backdrop for transparency */}
          <div
            className="absolute inset-0 opacity-20 dark:opacity-10 pointer-events-none"
            style={{
              backgroundImage: `linear-gradient(45deg, #888 25%, transparent 25%), linear-gradient(-45deg, #888 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #888 75%), linear-gradient(-45deg, transparent 75%, #888 75%)`,
              backgroundSize: '16px 16px',
              backgroundPosition: '0 0, 0 8px, 8px -8px, -8px 0px',
            }}
          />

          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={previewUrl}
            alt={name}
            className="relative z-10 max-h-full max-w-full object-contain"
          />

          {/* Badge Overlay */}
          <div className="absolute bottom-2 left-2 z-20 flex items-center gap-1.5">
            <Badge variant="secondary" className="text-[11px] bg-background/80 backdrop-blur-sm border-border/50 shadow-sm">
              Original Image
            </Badge>
          </div>
        </div>

        {/* Metadata Details Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-3 mt-4 pt-3 border-t border-border/60">
          <div className="flex flex-col">
            <span className="text-[11px] text-muted-foreground font-medium flex items-center gap-1">
              <HardDrive className="w-3 h-3" /> Size
            </span>
            <span className="text-xs font-semibold text-foreground mt-0.5">
              {formatBytes(size)}
            </span>
          </div>

          <div className="flex flex-col">
            <span className="text-[11px] text-muted-foreground font-medium flex items-center gap-1">
              <Maximize2 className="w-3 h-3" /> Dimensions
            </span>
            <span className="text-xs font-semibold text-foreground mt-0.5">
              {width && height ? `${width} × ${height}` : 'Calculating...'}
            </span>
          </div>

          <div className="flex flex-col col-span-2 sm:col-span-1">
            <span className="text-[11px] text-muted-foreground font-medium flex items-center gap-1">
              <Tag className="w-3 h-3" /> Type
            </span>
            <span className="text-xs font-semibold text-foreground mt-0.5">
              {displayFormat}
            </span>
          </div>
        </div>
      </div>
    </Card>
  );
}
