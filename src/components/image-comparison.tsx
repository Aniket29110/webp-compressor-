'use client';

import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Columns, Split, MoveHorizontal, ZoomIn } from 'lucide-react';
import { Badge } from './ui/badge';

interface ImageComparisonProps {
  originalUrl: string;
  compressedUrl: string;
  originalName?: string;
  compressedName?: string;
}

export function ImageComparison({
  originalUrl,
  compressedUrl,
  originalName = 'Original',
  compressedName = 'Compressed',
}: ImageComparisonProps) {
  const [sliderPosition, setSliderPosition] = useState(50);
  const [isDragging, setIsDragging] = useState(false);
  const [viewMode, setViewMode] = useState<'slider' | 'side-by-side'>('slider');
  const containerRef = useRef<HTMLDivElement>(null);

  const handleMove = useCallback((clientX: number) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = clientX - rect.left;
    const percentage = Math.min(100, Math.max(0, (x / rect.width) * 100));
    setSliderPosition(percentage);
  }, []);

  const handleTouchMove = useCallback(
    (e: TouchEvent) => {
      if (!isDragging) return;
      handleMove(e.touches[0].clientX);
    },
    [isDragging, handleMove]
  );

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!isDragging) return;
      handleMove(e.clientX);
    },
    [isDragging, handleMove]
  );

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  // Keyboard navigation for full a11y compliance
  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (viewMode !== 'slider') return;
    const step = e.shiftKey ? 10 : 2;

    switch (e.key) {
      case 'ArrowLeft':
      case 'ArrowDown':
        e.preventDefault();
        setSliderPosition((prev) => Math.max(0, prev - step));
        break;
      case 'ArrowRight':
      case 'ArrowUp':
        e.preventDefault();
        setSliderPosition((prev) => Math.min(100, prev + step));
        break;
      case 'Home':
        e.preventDefault();
        setSliderPosition(0);
        break;
      case 'End':
        e.preventDefault();
        setSliderPosition(100);
        break;
    }
  };

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      window.addEventListener('touchmove', handleTouchMove);
      window.addEventListener('touchend', handleMouseUp);
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleMouseUp);
    };
  }, [isDragging, handleMouseMove, handleMouseUp, handleTouchMove]);

  return (
    <div className="flex flex-col gap-3">
      {/* View Mode Toggle Header */}
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
          <ZoomIn className="w-3.5 h-3.5" /> Visual Quality Comparison
        </span>

        <div className="flex items-center gap-1 bg-muted/60 p-0.5 rounded-lg border border-border/50">
          <button
            type="button"
            onClick={() => setViewMode('slider')}
            className={`flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-md font-medium transition-all ${
              viewMode === 'slider'
                ? 'bg-background text-foreground shadow-xs font-semibold'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Split className="w-3.5 h-3.5" />
            Split Slider
          </button>
          <button
            type="button"
            onClick={() => setViewMode('side-by-side')}
            className={`flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-md font-medium transition-all ${
              viewMode === 'side-by-side'
                ? 'bg-background text-foreground shadow-xs font-semibold'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Columns className="w-3.5 h-3.5" />
            Side by Side
          </button>
        </div>
      </div>

      {/* Mode 1: Interactive Accessible Split Slider */}
      {viewMode === 'slider' ? (
        <div
          ref={containerRef}
          role="slider"
          tabIndex={0}
          aria-label="Image comparison before and after position"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={Math.round(sliderPosition)}
          onKeyDown={handleKeyDown}
          onMouseDown={(e) => {
            setIsDragging(true);
            handleMove(e.clientX);
          }}
          onTouchStart={(e) => {
            setIsDragging(true);
            handleMove(e.touches[0].clientX);
          }}
          style={{ touchAction: 'none' }}
          className="relative w-full aspect-video rounded-2xl overflow-hidden select-none cursor-ew-resize border border-border/80 bg-muted/40 shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        >
          {/* Transparency checkerboard background */}
          <div
            className="absolute inset-0 opacity-15 dark:opacity-10 pointer-events-none"
            style={{
              backgroundImage: `linear-gradient(45deg, #888 25%, transparent 25%), linear-gradient(-45deg, #888 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #888 75%), linear-gradient(-45deg, transparent 75%, #888 75%)`,
              backgroundSize: '16px 16px',
            }}
          />

          {/* Underneath Layer: Compressed Image */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={compressedUrl}
            alt={compressedName}
            className="absolute inset-0 w-full h-full object-contain pointer-events-none"
          />

          {/* Top Layer: Original Image clipped with pure CSS clipPath */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={originalUrl}
            alt={originalName}
            className="absolute inset-0 w-full h-full object-contain pointer-events-none"
            style={{
              clipPath: `inset(0 ${100 - sliderPosition}% 0 0)`,
            }}
          />

          {/* Divider Line */}
          <div
            className="absolute top-0 bottom-0 w-0.5 bg-white shadow-lg pointer-events-none z-30"
            style={{ left: `${sliderPosition}%` }}
          >
            {/* Grab handle bubble */}
            <div className="absolute top-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white text-slate-800 shadow-xl flex items-center justify-center border-2 border-slate-900/10">
              <MoveHorizontal className="w-4 h-4" />
            </div>
          </div>

          {/* Labels on opposite sides */}
          <div className="absolute top-3 left-3 z-20 pointer-events-none">
            <Badge variant="secondary" className="bg-background/85 backdrop-blur-md text-foreground font-semibold border-border/60 shadow-sm text-xs">
              Before (Original)
            </Badge>
          </div>
          <div className="absolute top-3 right-3 z-20 pointer-events-none">
            <Badge variant="success" className="bg-background/85 backdrop-blur-md shadow-sm text-xs font-semibold">
              After (Compressed)
            </Badge>
          </div>

          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 z-20 pointer-events-none">
            <span className="text-[10px] text-muted-foreground/80 bg-background/70 backdrop-blur-xs px-2.5 py-0.5 rounded-full border border-border/40">
              Drag or use Arrow keys to compare
            </span>
          </div>
        </div>
      ) : (
        /* Mode 2: Side by Side Two Column View */
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* Original Preview */}
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between px-1">
              <span className="text-xs font-semibold text-muted-foreground">Original</span>
              <Badge variant="outline" className="text-[10px] py-0">Before</Badge>
            </div>
            <div className="relative aspect-video rounded-xl overflow-hidden border border-border/80 bg-muted/40 flex items-center justify-center">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={originalUrl}
                alt="Original"
                className="w-full h-full object-contain"
              />
            </div>
          </div>

          {/* Compressed Preview */}
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between px-1">
              <span className="text-xs font-semibold text-foreground">Compressed</span>
              <Badge variant="success" className="text-[10px] py-0">After</Badge>
            </div>
            <div className="relative aspect-video rounded-xl overflow-hidden border border-emerald-500/30 bg-muted/40 flex items-center justify-center">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={compressedUrl}
                alt="Compressed"
                className="w-full h-full object-contain"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
