'use client';

import React, { useRef, useState, useEffect } from 'react';
import {
  Music,
  X,
  Play,
  Pause,
  Volume2,
  VolumeX,
  Radio,
  Clock,
  Waves,
} from 'lucide-react';
import { formatBytes } from '@/lib/format-utils';
import { formatDuration } from '@/lib/video-utils';
import { Card, CardContent } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';

interface AudioPreviewProps {
  name: string;
  type: string;
  size: number;
  duration?: number;
  sampleRate?: number;
  channels?: number;
  previewUrl: string;
  onRemove: () => void;
  isCompressing?: boolean;
}

export function AudioPreview({
  name,
  type,
  size,
  duration,
  sampleRate,
  channels,
  previewUrl,
  onRemove,
  isCompressing = false,
}: AudioPreviewProps) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [audioDuration, setAudioDuration] = useState<number>(duration || 0);
  const [isMuted, setIsMuted] = useState<boolean>(false);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleTimeUpdate = () => setCurrentTime(audio.currentTime);
    const handleLoadedMetadata = () => {
      if (audio.duration && !isNaN(audio.duration)) {
        setAudioDuration(audio.duration);
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
  }, [previewUrl]);

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

  return (
    <Card className="overflow-hidden border-border/80 bg-card shadow-xs">
      <CardContent className="p-6">
        <audio ref={audioRef} src={previewUrl} preload="metadata" />

        <div className="flex items-start justify-between gap-4 mb-4">
          <div className="flex items-center gap-3 min-w-0">
            <div className="h-12 w-12 rounded-xl bg-purple-500/10 text-purple-500 flex items-center justify-center shrink-0">
              <Music className="w-6 h-6" />
            </div>
            <div className="min-w-0">
              <h3 className="font-semibold text-base text-foreground truncate" title={name}>
                {name}
              </h3>
              <p className="text-xs text-muted-foreground flex items-center gap-2 mt-0.5">
                <span>{formatBytes(size)}</span>
                <span>&bull;</span>
                <span className="truncate">{type || 'audio/media'}</span>
              </p>
            </div>
          </div>

          <Button
            variant="ghost"
            size="icon"
            onClick={onRemove}
            disabled={isCompressing}
            className="text-muted-foreground hover:text-foreground shrink-0 rounded-full h-8 w-8"
            aria-label="Remove audio"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>

        {/* Audio Badges */}
        <div className="flex flex-wrap gap-2 mb-5">
          <Badge variant="secondary" className="gap-1.5 py-1 px-2.5 text-xs font-medium">
            <Clock className="w-3.5 h-3.5 text-purple-500" />
            {formatDuration(audioDuration || duration || 0)}
          </Badge>

          {sampleRate && (
            <Badge variant="secondary" className="gap-1.5 py-1 px-2.5 text-xs font-medium">
              <Radio className="w-3.5 h-3.5 text-blue-500" />
              {(sampleRate / 1000).toFixed(1)} kHz
            </Badge>
          )}

          {channels && (
            <Badge variant="secondary" className="gap-1.5 py-1 px-2.5 text-xs font-medium">
              <Waves className="w-3.5 h-3.5 text-emerald-500" />
              {channels === 1 ? 'Mono (1 Ch)' : 'Stereo (2 Ch)'}
            </Badge>
          )}
        </div>

        {/* Interactive Custom Audio Player */}
        <div className="p-4 rounded-2xl bg-muted/40 border border-border/70 flex flex-col gap-3">
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
                max={audioDuration || 100}
                step={0.1}
                value={currentTime}
                onChange={handleSeek}
                className="w-full accent-purple-600 h-1.5 bg-muted rounded-lg cursor-pointer"
              />
              <div className="flex items-center justify-between text-[11px] font-mono text-muted-foreground">
                <span>{formatDuration(currentTime)}</span>
                <span>{formatDuration(audioDuration)}</span>
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
      </CardContent>
    </Card>
  );
}
