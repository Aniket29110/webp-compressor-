'use client';

import React from 'react';
import { SupportedFormat } from '@/types/image';
import { FORMAT_OPTIONS, getOutputFilename } from '@/lib/format-utils';
import { Badge } from './ui/badge';
import { Check, Info } from 'lucide-react';

interface FormatSelectorProps {
  selectedFormat: SupportedFormat;
  onChange: (format: SupportedFormat) => void;
  originalName?: string;
  originalMime?: string;
  disabled?: boolean;
}

export function FormatSelector({
  selectedFormat,
  onChange,
  originalName = 'image.jpg',
  originalMime = 'image/jpeg',
  disabled = false,
}: FormatSelectorProps) {
  const currentFilename = getOutputFilename(originalName, selectedFormat, originalMime);

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Output Format
        </label>
        {originalName && (
          <span className="text-xs font-mono text-primary bg-primary/10 px-2 py-0.5 rounded-md truncate max-w-[200px]" title={currentFilename}>
            {currentFilename}
          </span>
        )}
      </div>

      {/* Format Selection Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        {FORMAT_OPTIONS.map((opt) => {
          const isSelected = selectedFormat === opt.id;

          return (
            <button
              key={opt.id}
              type="button"
              disabled={disabled}
              onClick={() => onChange(opt.id)}
              className={`relative flex flex-col items-start p-3 rounded-xl border text-left transition-all duration-200 cursor-pointer disabled:cursor-not-allowed disabled:opacity-50 ${
                isSelected
                  ? 'border-primary bg-primary/10 ring-1 ring-primary/40 shadow-sm'
                  : 'border-border/70 bg-card hover:bg-accent/40 hover:border-border'
              }`}
            >
              <div className="w-full flex items-center justify-between mb-1">
                <span className={`text-sm font-bold ${isSelected ? 'text-primary' : 'text-foreground'}`}>
                  {opt.label}
                </span>
                {isSelected && <Check className="w-4 h-4 text-primary shrink-0" />}
              </div>

              <p className="text-[11px] text-muted-foreground line-clamp-2 leading-tight">
                {opt.description}
              </p>

              {opt.badge && (
                <div className="mt-2">
                  <Badge
                    variant={opt.badge === 'Recommended' ? 'success' : 'secondary'}
                    className="text-[9px] px-1.5 py-0 font-medium"
                  >
                    {opt.badge}
                  </Badge>
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Format-specific guidance message */}
      {selectedFormat === 'png' && (
        <div className="flex items-start gap-2 p-2.5 rounded-lg bg-amber-500/10 text-amber-700 dark:text-amber-300 text-xs leading-relaxed border border-amber-500/20">
          <Info className="w-4 h-4 shrink-0 mt-0.5 text-amber-600 dark:text-amber-400" />
          <span>
            <strong>Lossless Note:</strong> PNG uses lossless compression in Canvas. The quality slider will have minimal effect on PNG file size.
          </span>
        </div>
      )}

      {selectedFormat === 'avif' && (
        <div className="flex items-start gap-2 p-2.5 rounded-lg bg-primary/10 text-primary text-xs leading-relaxed border border-primary/20">
          <Info className="w-4 h-4 shrink-0 mt-0.5" />
          <span>
            <strong>Next-Gen AVIF:</strong> Provides up to 50% smaller sizes than JPEG. Supported in all modern evergreen browsers.
          </span>
        </div>
      )}
    </div>
  );
}
