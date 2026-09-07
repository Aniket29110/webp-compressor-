'use client';

import React from 'react';
import { Sliders, Loader2, Gauge } from 'lucide-react';
import { SupportedFormat } from '@/types/image';
import { Slider } from './ui/slider';
import { FormatSelector } from './format-selector';
import { Card, CardHeader, CardTitle, CardContent } from './ui/card';
import { Badge } from './ui/badge';

interface CompressionControlsProps {
  compressionLevel: number;
  onCompressionLevelChange: (level: number) => void;
  format: SupportedFormat;
  onFormatChange: (format: SupportedFormat) => void;
  originalName?: string;
  originalMime?: string;
  isCompressing?: boolean;
}

export function CompressionControls({
  compressionLevel,
  onCompressionLevelChange,
  format,
  onFormatChange,
  originalName,
  originalMime,
  isCompressing = false,
}: CompressionControlsProps) {
  // Preset qualities
  const presets = [
    { label: 'Max Savings', value: 40 },
    { label: 'Balanced', value: 70 },
    { label: 'High Quality', value: 85 },
    { label: 'Near Lossless', value: 95 },
  ];

  // Derive human-readable quality label
  const getQualityTier = (val: number) => {
    if (val <= 45) return { text: 'High Compression', variant: 'warning' as const };
    if (val <= 75) return { text: 'Optimal Balance', variant: 'success' as const };
    if (val <= 90) return { text: 'High Quality', variant: 'secondary' as const };
    return { text: 'Ultra High Quality', variant: 'default' as const };
  };

  const currentTier = getQualityTier(compressionLevel);

  return (
    <Card className="border border-border/80 bg-card shadow-sm">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-primary/10 text-primary">
              <Sliders className="w-4 h-4" />
            </div>
            <CardTitle className="text-base">Optimization Settings</CardTitle>
          </div>
          {isCompressing ? (
            <Badge variant="secondary" className="flex items-center gap-1.5 py-1 px-2.5">
              <Loader2 className="w-3 h-3 animate-spin text-primary" />
              Compressing...
            </Badge>
          ) : (
            <Badge variant={currentTier.variant} className="py-0.5 px-2 text-[11px]">
              {currentTier.text}
            </Badge>
          )}
        </div>
      </CardHeader>

      <CardContent className="flex flex-col gap-6">
        {/* Compression Level Slider Section */}
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <label htmlFor="compression-slider" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <Gauge className="w-3.5 h-3.5" /> Compression Level
            </label>
            <span className="text-sm font-bold text-foreground bg-muted px-2.5 py-0.5 rounded-lg font-mono">
              {compressionLevel}%
            </span>
          </div>

          <Slider
            id="compression-slider"
            value={compressionLevel}
            min={5}
            max={100}
            step={1}
            disabled={isCompressing || format === 'png'}
            onChange={onCompressionLevelChange}
            aria-label="Adjust image compression quality"
          />

          {/* Explanation indicator */}
          <div className="flex items-center justify-between text-[11px] text-muted-foreground px-0.5">
            <span>Stronger Compression (Smaller)</span>
            <span>Better Quality (Larger)</span>
          </div>

          {/* Quick preset buttons */}
          <div className="flex items-center gap-1.5 pt-1">
            {presets.map((preset) => (
              <button
                key={preset.value}
                type="button"
                disabled={isCompressing || format === 'png'}
                onClick={() => onCompressionLevelChange(preset.value)}
                className={`flex-1 text-[11px] py-1.5 px-1 rounded-md border text-center transition-all font-medium ${
                  compressionLevel === preset.value
                    ? 'border-primary bg-primary/10 text-primary font-semibold'
                    : 'border-border/60 hover:bg-muted text-muted-foreground hover:text-foreground'
                } disabled:opacity-40 disabled:pointer-events-none`}
              >
                {preset.label}
              </button>
            ))}
          </div>
        </div>

        {/* Format Selector Section */}
        <div className="pt-2 border-t border-border/60">
          <FormatSelector
            selectedFormat={format}
            onChange={onFormatChange}
            originalName={originalName}
            originalMime={originalMime}
            disabled={isCompressing}
          />
        </div>
      </CardContent>
    </Card>
  );
}
