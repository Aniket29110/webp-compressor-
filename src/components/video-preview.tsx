'use client';

import React from 'react';
import { X, Film, Maximize2, HardDrive, Clock } from 'lucide-react';
import { formatBytes } from '@/lib/format-utils';
import { formatDuration } from '@/lib/video-utils';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Card } from './ui/card';

interface VideoPreviewProps {
  name: string;
  type: string;
  size: number;
  width?: number;
  height?: number;
  duration?: number;
  previewUrl: string;
  onRemove: () => void;
  isCompressing?: boolean;
}

export function VideoPreview({
  name,
  type,
  size,
  width,
  height,
  duration,
  previewUrl,
  onRemove,
  isCompressing = false,
}: VideoPreviewProps) {
  const displayFormat = type.replace('video/', '').toUpperCase() || 'VIDEO';

  return (
    <Card className="overflow-hidden border border-border/80 bg-card shadow-sm">
      <div className="p-4 sm:p-5">
        <div className="flex items-start justify-between gap-4 mb-4">
          <div className="flex items-center gap-3 min-w-0">
            <div className="p-2.5 rounded-xl bg-primary/10 text-primary shrink-0">
              <Film className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h4 className="text-sm font-semibold text-foreground truncate" title={name}>
                {name}
              </h4>
              <p className="text-xs text-muted-foreground flex items-center gap-2 mt-0.5">
                <span className="font-mono">{formatBytes(size)}</span>
                <span>&bull;</span>
                <span className="font-medium text-foreground/80">{displayFormat}</span>
                {duration ? (
                  <>
                    <span>&bull;</span>
                    <span className="font-mono">{formatDuration(duration)}</span>
                  </>
                ) : null}
              </p>
            </div>
          </div>

          <Button
            variant="ghost"
            size="sm"
            onClick={onRemove}
            disabled={isCompressing}
            className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 h-8 px-2 text-xs shrink-0"
            title="Remove video and pick another"
          >
            <X className="w-4 h-4 mr-1" />
            Remove
          </Button>
        </div>

        {/* Video Player Preview */}
        <div className="relative aspect-video w-full overflow-hidden rounded-xl bg-black border border-border/50 flex items-center justify-center">
          <video
            src={previewUrl}
            controls
            playsInline
            className="w-full h-full object-contain"
          />

          <div className="absolute top-2 left-2 z-20 pointer-events-none">
            <Badge variant="secondary" className="text-[11px] bg-background/80 backdrop-blur-sm border-border/50 shadow-sm">
              Original Video
            </Badge>
          </div>
        </div>

        {/* Details Grid */}
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
              {width && height ? `${width} × ${height}` : 'Loading...'}
            </span>
          </div>

          <div className="flex flex-col col-span-2 sm:col-span-1">
            <span className="text-[11px] text-muted-foreground font-medium flex items-center gap-1">
              <Clock className="w-3 h-3" /> Duration
            </span>
            <span className="text-xs font-semibold text-foreground mt-0.5 font-mono">
              {duration ? formatDuration(duration) : '00:00'}
            </span>
          </div>
        </div>
      </div>
    </Card>
  );
}
