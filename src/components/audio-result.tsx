'use client';

import React, { useRef, useState, useEffect } from 'react';
import {
  Download,
  RotateCcw,
  Sparkles,
  TrendingDown,
  Play,
  Pause,
  Volume2,
  VolumeX,
  Music,
} from 'lucide-react';
import { formatBytes, calculateSavings } from '@/lib/format-utils';
import { formatDuration } from '@/lib/video-utils';
import { SupportedAudioFormat } from '@/types/audio';
import { Card, CardContent } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';

interface AudioResultProps {
  originalUrl?: string;
  compressedUrl: string;
  originalSize: number;
  compressedSize: number;
  savedPercentage?: number;
  compressionRatio?: string;
  outputFormat: SupportedAudioFormat;
  compressedFile: File;
  onReset: () => void;
  isCompressing?: boolean;
}

export function AudioResult({
  compressedUrl,
  originalSize,
  compressedSize,
  outputFormat,
  compressedFile,
  onReset,
  isCompressing = false,
}: AudioResultProps) {
  const savings = calculateSavings(originalSize, compressedSize);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(0);
  const [isMuted, setIsMuted] = useState<boolean>(false);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleTimeUpdate = () => setCurrentTime(audio.currentTime);
    const handleLoadedMetadata = () => {
      if (audio.duration && !isNaN(audio.duration)) {
        setDuration(audio.duration);
      }
    };
    const handleEnded = () => {
      setIsPlaying(false);
      setCurrentTime(0);
    };

    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('ended', handleEnded);

    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('ended', handleEnded);
    };
  }, [compressedUrl]);

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play().then(() => setIsPlaying(true)).catch(() => {});
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = parseFloat(e.target.value);
    setCurrentTime(time);
    if (audioRef.current) {
      audioRef.current.currentTime = time;
    }
  };

  const toggleMute = () => {
    if (!audioRef.current) return;
    audioRef.current.muted = !isMuted;
    setIsMuted(!isMuted);
  };

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
      {/* Hidden audio element */}
      <audio ref={audioRef} src={compressedUrl} preload="metadata" />

      {/* Metrics Banner Card */}
      <Card className="border-purple-500/20 bg-gradient-to-br from-purple-500/5 via-card to-card shadow-sm overflow-hidden">
        <CardContent className="p-6">
          <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
            <div className="flex items-center gap-2.5">
              <div className="h-9 w-9 rounded-xl bg-purple-500/15 text-purple-600 flex items-center justify-center">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-lg text-foreground">
                  Audio Compression Complete
                </h3>
                <p className="text-xs text-muted-foreground">
                  Encoded directly in-browser using Web Audio & LAME
                </p>
              </div>
            </div>

            <Badge
              variant={savings.isExpanded ? 'secondary' : 'default'}
              className={`px-3 py-1 text-sm font-semibold gap-1.5 ${
                savings.isExpanded
                  ? 'bg-amber-500/10 text-amber-600 border border-amber-500/20'
                  : 'bg-purple-600 text-white'
              }`}
            >
              {savings.isExpanded ? (
                <span>+0.0% (Lossless / High Bitrate)</span>
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

            <div className="p-3.5 rounded-xl bg-purple-500/10 border border-purple-500/20">
              <span className="text-[11px] font-medium text-purple-600 uppercase tracking-wider block mb-1">
                Compressed Size
              </span>
              <span className="text-sm sm:text-base font-bold text-purple-600">
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

          {/* Playback Preview of Compressed Audio */}
          <div className="mb-6 p-4 rounded-2xl bg-muted/50 border border-border/80 flex flex-col gap-3">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span className="font-semibold text-foreground flex items-center gap-1.5">
                <Music className="w-4 h-4 text-purple-600" />
                Listen to Compressed Output ({outputFormat.toUpperCase()})
              </span>
              <span>{compressedFile.name}</span>
            </div>

            <div className="flex items-center gap-3">
              <Button
                type="button"
                variant="default"
                size="icon"
                onClick={togglePlay}
                className="h-10 w-10 rounded-full bg-purple-600 hover:bg-purple-700 text-white shadow-xs shrink-0"
              >
                {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
              </Button>

              <div className="flex-1 flex flex-col gap-1">
                <input
                  type="range"
                  min={0}
                  max={duration || 100}
                  step={0.1}
                  value={currentTime}
                  onChange={handleSeek}
                  className="w-full accent-purple-600 h-1.5 bg-muted rounded-lg cursor-pointer"
                />
                <div className="flex items-center justify-between text-[11px] font-mono text-muted-foreground">
                  <span>{formatDuration(currentTime)}</span>
                  <span>{formatDuration(duration)}</span>
                </div>
              </div>

              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={toggleMute}
                className="text-muted-foreground hover:text-foreground h-8 w-8 shrink-0"
              >
                {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
              </Button>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row items-center gap-3">
            <Button
              type="button"
              onClick={handleDownload}
              className="w-full sm:flex-1 bg-purple-600 hover:bg-purple-700 text-white font-semibold py-2.5 rounded-xl shadow-sm gap-2"
            >
              <Download className="w-4 h-4" />
              Download {outputFormat.toUpperCase()} ({formatBytes(compressedSize)})
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
    </div>
  );
}
