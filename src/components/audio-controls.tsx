'use client';

import React from 'react';
import {
  Settings2,
  Sparkles,
  Loader2,
} from 'lucide-react';
import {
  SupportedAudioFormat,
  AudioBitrate,
  AudioChannels,
  AudioSampleRate,
} from '@/types/audio';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';

interface AudioControlsProps {
  format: SupportedAudioFormat;
  onFormatChange: (fmt: SupportedAudioFormat) => void;
  bitrate: AudioBitrate;
  onBitrateChange: (bitrate: AudioBitrate) => void;
  channels: AudioChannels;
  onChannelsChange: (channels: AudioChannels) => void;
  sampleRate: AudioSampleRate;
  onSampleRateChange: (rate: AudioSampleRate) => void;
  onCompress: () => void;
  isCompressing?: boolean;
  progress?: number;
}

const AUDIO_FORMATS: {
  id: SupportedAudioFormat;
  label: string;
  ext: string;
  desc: string;
  badge?: string;
}[] = [
  {
    id: 'mp3',
    label: 'MP3',
    ext: '.mp3',
    desc: 'Universal compatibility across all devices and players',
    badge: 'Universal',
  },
  {
    id: 'webm',
    label: 'Opus (WebM)',
    ext: '.webm',
    desc: 'Ultra-efficient modern codec with superior sound at low bitrates',
    badge: 'Smallest Size',
  },
  {
    id: 'wav',
    label: 'WAV',
    ext: '.wav',
    desc: 'Uncompressed 16-bit PCM for lossless audio processing',
  },
];

const BITRATE_OPTIONS: AudioBitrate[] = [64, 96, 128, 192, 256, 320];

const SAMPLE_RATE_OPTIONS: { id: AudioSampleRate; label: string }[] = [
  { id: 'original', label: 'Original' },
  { id: 44100, label: '44.1 kHz (CD Quality)' },
  { id: 32000, label: '32.0 kHz (FM Radio)' },
  { id: 22050, label: '22.05 kHz (Voice/Speech)' },
  { id: 16000, label: '16.0 kHz (Low Bandwidth)' },
];

export function AudioControls({
  format,
  onFormatChange,
  bitrate,
  onBitrateChange,
  channels,
  onChannelsChange,
  sampleRate,
  onSampleRateChange,
  onCompress,
  isCompressing = false,
  progress = 0,
}: AudioControlsProps) {
  return (
    <Card className="border-border/80 bg-card shadow-xs">
      <CardHeader className="pb-3 border-b border-border/60">
        <CardTitle className="text-base font-semibold flex items-center gap-2">
          <Settings2 className="w-4 h-4 text-purple-500" />
          <span>Audio Compression Settings</span>
        </CardTitle>
      </CardHeader>

      <CardContent className="p-6 space-y-6">
        {/* Format Selector */}
        <div>
          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-3">
            Output Audio Format
          </label>
          <div className="grid grid-cols-1 gap-2.5">
            {AUDIO_FORMATS.map((fmt) => (
              <button
                key={fmt.id}
                type="button"
                onClick={() => onFormatChange(fmt.id)}
                disabled={isCompressing}
                className={`flex flex-col items-start p-3.5 rounded-xl border text-left transition-all duration-200 cursor-pointer ${
                  format === fmt.id
                    ? 'border-purple-500 bg-purple-500/10 ring-1 ring-purple-500'
                    : 'border-border/70 bg-card hover:border-border hover:bg-muted/30'
                } ${isCompressing ? 'opacity-60 pointer-events-none' : ''}`}
              >
                <div className="w-full flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-sm text-foreground">
                      {fmt.label}
                    </span>
                    <span className="text-xs text-muted-foreground font-mono">
                      {fmt.ext}
                    </span>
                  </div>
                  {fmt.badge && (
                    <Badge
                      variant="secondary"
                      className="text-[10px] py-0 px-2 bg-purple-500/15 text-purple-600 font-medium"
                    >
                      {fmt.badge}
                    </Badge>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">{fmt.desc}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Bitrate Selector (for MP3 & Opus) */}
        {format !== 'wav' && (
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Target Bitrate
              </label>
              <span className="text-xs font-bold text-purple-600 font-mono">
                {bitrate} kbps
              </span>
            </div>
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
              {BITRATE_OPTIONS.map((rate) => (
                <button
                  key={rate}
                  type="button"
                  onClick={() => onBitrateChange(rate)}
                  disabled={isCompressing}
                  className={`py-2 px-1 rounded-lg text-xs font-semibold text-center border transition-all cursor-pointer ${
                    bitrate === rate
                      ? 'border-purple-500 bg-purple-500 text-white shadow-xs'
                      : 'border-border/70 bg-card text-muted-foreground hover:text-foreground hover:bg-muted/40'
                  } ${isCompressing ? 'opacity-60 pointer-events-none' : ''}`}
                >
                  {rate}k
                </button>
              ))}
            </div>
            <p className="text-[11px] text-muted-foreground mt-2">
              {bitrate <= 96
                ? 'Ultra low filesize, great for speech, audiobooks and podcasts.'
                : bitrate <= 192
                ? 'Standard high-fidelity music streaming quality.'
                : 'Maximum studio fidelity for professional audio.'}
            </p>
          </div>
        )}

        {/* Channels (Stereo vs Mono) */}
        <div>
          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-2">
            Audio Channels
          </label>
          <div className="grid grid-cols-2 gap-2.5">
            <button
              type="button"
              onClick={() => onChannelsChange('original')}
              disabled={isCompressing}
              className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                channels === 'original'
                  ? 'border-purple-500 bg-purple-500/10 ring-1 ring-purple-500'
                  : 'border-border/70 bg-card hover:bg-muted/30 text-muted-foreground'
              } ${isCompressing ? 'opacity-60 pointer-events-none' : ''}`}
            >
              <span className="font-semibold text-xs text-foreground block">
                Keep Original (Stereo)
              </span>
              <span className="text-[11px] text-muted-foreground">
                Preserves spatial balance
              </span>
            </button>

            <button
              type="button"
              onClick={() => onChannelsChange('mono')}
              disabled={isCompressing}
              className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                channels === 'mono'
                  ? 'border-purple-500 bg-purple-500/10 ring-1 ring-purple-500'
                  : 'border-border/70 bg-card hover:bg-muted/30 text-muted-foreground'
              } ${isCompressing ? 'opacity-60 pointer-events-none' : ''}`}
            >
              <span className="font-semibold text-xs text-foreground block">
                Convert to Mono (-50% size)
              </span>
              <span className="text-[11px] text-muted-foreground">
                Merges into 1 channel
              </span>
            </button>
          </div>
        </div>

        {/* Sample Rate Resampling */}
        <div>
          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-2">
            Sample Rate
          </label>
          <select
            value={sampleRate}
            onChange={(e) =>
              onSampleRateChange(
                e.target.value === 'original'
                  ? 'original'
                  : (parseInt(e.target.value, 10) as AudioSampleRate)
              )
            }
            disabled={isCompressing}
            className="w-full p-2.5 rounded-xl border border-border/80 bg-background text-sm text-foreground focus:ring-2 focus:ring-purple-500 focus:outline-none cursor-pointer"
          >
            {SAMPLE_RATE_OPTIONS.map((opt) => (
              <option key={opt.id} value={opt.id}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        {/* Start Compression Button */}
        <div className="pt-2">
          <Button
            type="button"
            onClick={onCompress}
            disabled={isCompressing}
            className="w-full bg-purple-600 hover:bg-purple-700 text-white font-semibold py-3 rounded-xl shadow-md transition-all cursor-pointer"
          >
            {isCompressing ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Encoding Audio... ({progress}%)
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 mr-2" />
                Start Audio Compression
              </>
            )}
          </Button>

          {isCompressing && (
            <div className="mt-3">
              <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
                <div
                  className="bg-purple-600 h-2 transition-all duration-200 rounded-full"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
