'use client';

import React from 'react';
import {
  Sliders,
  Loader2,
  Gauge,
  Volume2,
  VolumeX,
  Tv,
  Check,
  Play,
  FileVideo,
} from 'lucide-react';
import { SupportedVideoFormat, VideoResolution } from '@/types/image';
import { Slider } from './ui/slider';
import { Card, CardHeader, CardTitle, CardContent } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';

interface VideoControlsProps {
  compressionLevel: number;
  onCompressionLevelChange: (level: number) => void;
  format: SupportedVideoFormat;
  onFormatChange: (format: SupportedVideoFormat) => void;
  resolution: VideoResolution;
  onResolutionChange: (res: VideoResolution) => void;
  includeAudio: boolean;
  onIncludeAudioChange: (include: boolean) => void;
  onCompress: () => void;
  isCompressing?: boolean;
  progress?: number;
}

export function VideoControls({
  compressionLevel,
  onCompressionLevelChange,
  format,
  onFormatChange,
  resolution,
  onResolutionChange,
  includeAudio,
  onIncludeAudioChange,
  onCompress,
  isCompressing = false,
  progress = 0,
}: VideoControlsProps) {
  const resolutions: { id: VideoResolution; label: string; desc: string }[] = [
    { id: 'original', label: 'Original', desc: 'Keep source dimensions' },
    { id: '1080p', label: '1080p FHD', desc: '1920 × 1080 max' },
    { id: '720p', label: '720p HD', desc: '1280 × 720 (Recommended)' },
    { id: '480p', label: '480p SD', desc: '854 × 480 (Small file)' },
  ];

  const formats: { id: SupportedVideoFormat; label: string; desc: string; badge?: string }[] = [
    {
      id: 'webm',
      label: 'WebM (VP9/VP8)',
      desc: 'High compression ratio for web and modern browsers',
      badge: 'Recommended',
    },
    {
      id: 'mp4',
      label: 'MP4 (H.264)',
      desc: 'Universal device and legacy player compatibility',
    },
  ];

  return (
    <Card className="border border-border/80 bg-card shadow-sm">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-primary/10 text-primary">
              <Sliders className="w-4 h-4" />
            </div>
            <CardTitle className="text-base">Video Compression Settings</CardTitle>
          </div>
          {isCompressing && (
            <Badge variant="secondary" className="flex items-center gap-1.5 py-1 px-2.5">
              <Loader2 className="w-3 h-3 animate-spin text-primary" />
              {progress}%
            </Badge>
          )}
        </div>
      </CardHeader>

      <CardContent className="flex flex-col gap-6">
        {/* Progress bar during compression */}
        {isCompressing && (
          <div className="flex flex-col gap-2 p-3.5 rounded-xl bg-primary/5 border border-primary/20">
            <div className="flex items-center justify-between text-xs font-semibold text-primary">
              <span>Encoding Video Frames...</span>
              <span className="font-mono">{progress}%</span>
            </div>
            <div className="w-full bg-primary/20 h-2 rounded-full overflow-hidden">
              <div
                className="bg-primary h-full transition-all duration-150 ease-out"
                style={{ width: `${progress}%` }}
              />
            </div>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              Playing and re-encoding video locally. Please keep this tab active.
            </p>
          </div>
        )}

        {/* Quality / Bitrate Slider */}
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <label htmlFor="video-bitrate-slider" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <Gauge className="w-3.5 h-3.5" /> Bitrate Quality
            </label>
            <span className="text-sm font-bold text-foreground bg-muted px-2.5 py-0.5 rounded-lg font-mono">
              {compressionLevel}%
            </span>
          </div>

          <Slider
            id="video-bitrate-slider"
            value={compressionLevel}
            min={10}
            max={100}
            step={5}
            disabled={isCompressing}
            onChange={onCompressionLevelChange}
            aria-label="Adjust video bitrate quality"
          />

          <div className="flex items-center justify-between text-[11px] text-muted-foreground px-0.5">
            <span>Stronger Compression (Lower Bitrate)</span>
            <span>Higher Quality (Higher Bitrate)</span>
          </div>
        </div>

        {/* Target Resolution Selector */}
        <div className="flex flex-col gap-2.5 pt-2 border-t border-border/60">
          <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
            <Tv className="w-3.5 h-3.5" /> Output Resolution
          </label>
          <div className="grid grid-cols-2 gap-2">
            {resolutions.map((res) => {
              const isSelected = resolution === res.id;
              return (
                <button
                  key={res.id}
                  type="button"
                  disabled={isCompressing}
                  onClick={() => onResolutionChange(res.id)}
                  className={`flex flex-col items-start p-2.5 rounded-xl border text-left transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${
                    isSelected
                      ? 'border-primary bg-primary/10 ring-1 ring-primary/40'
                      : 'border-border/70 bg-card hover:bg-muted/50'
                  }`}
                >
                  <div className="w-full flex items-center justify-between">
                    <span className={`text-xs font-bold ${isSelected ? 'text-primary' : 'text-foreground'}`}>
                      {res.label}
                    </span>
                    {isSelected && <Check className="w-3.5 h-3.5 text-primary" />}
                  </div>
                  <span className="text-[10px] text-muted-foreground mt-0.5">{res.desc}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Output Format */}
        <div className="flex flex-col gap-2.5 pt-2 border-t border-border/60">
          <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
            <FileVideo className="w-3.5 h-3.5" /> Video Format
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {formats.map((fmt) => {
              const isSelected = format === fmt.id;
              return (
                <button
                  key={fmt.id}
                  type="button"
                  disabled={isCompressing}
                  onClick={() => onFormatChange(fmt.id)}
                  className={`flex flex-col items-start p-2.5 rounded-xl border text-left transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${
                    isSelected
                      ? 'border-primary bg-primary/10 ring-1 ring-primary/40'
                      : 'border-border/70 bg-card hover:bg-muted/50'
                  }`}
                >
                  <div className="w-full flex items-center justify-between">
                    <span className={`text-xs font-bold ${isSelected ? 'text-primary' : 'text-foreground'}`}>
                      {fmt.label}
                    </span>
                    {isSelected && <Check className="w-3.5 h-3.5 text-primary" />}
                  </div>
                  <span className="text-[10px] text-muted-foreground mt-0.5">{fmt.desc}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Audio Optimization Toggle */}
        <div className="flex items-center justify-between p-3 rounded-xl bg-muted/40 border border-border/60">
          <div className="flex items-center gap-2.5">
            {includeAudio ? (
              <Volume2 className="w-4 h-4 text-primary shrink-0" />
            ) : (
              <VolumeX className="w-4 h-4 text-amber-500 shrink-0" />
            )}
            <div>
              <span className="text-xs font-semibold text-foreground block">
                {includeAudio ? 'Include Audio Track' : 'Mute / Remove Audio'}
              </span>
              <span className="text-[11px] text-muted-foreground">
                {includeAudio ? 'Keeps soundtrack' : 'Stripping audio reduces size significantly'}
              </span>
            </div>
          </div>

          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={isCompressing}
            onClick={() => onIncludeAudioChange(!includeAudio)}
            className="h-8 text-xs font-medium"
          >
            {includeAudio ? 'Mute' : 'Include'}
          </Button>
        </div>

        {/* Compress Action Trigger Button */}
        <Button
          type="button"
          size="lg"
          disabled={isCompressing}
          onClick={onCompress}
          className="w-full font-semibold shadow-md"
        >
          {isCompressing ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Compressing Video ({progress}%)...
            </>
          ) : (
            <>
              <Play className="w-4 h-4 mr-2" />
              Start Video Compression
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}
