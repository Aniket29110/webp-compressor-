'use client';

import React from 'react';
import {
  Settings2,
  Shield,
  FileSpreadsheet,
  Trash2,
  Sparkles,
  Loader2,
} from 'lucide-react';
import { DocumentCompressionPreset, DocumentType } from '@/types/document';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';

interface DocumentControlsProps {
  preset: DocumentCompressionPreset;
  onPresetChange: (preset: DocumentCompressionPreset) => void;
  stripMetadata: boolean;
  onStripMetadataChange: (val: boolean) => void;
  flattenForms: boolean;
  onFlattenFormsChange: (val: boolean) => void;
  removeAnnotations: boolean;
  onRemoveAnnotationsChange: (val: boolean) => void;
  docType: DocumentType;
  isCompressing?: boolean;
  onCompress?: () => void;
  progress?: number;
}

const PRESET_OPTIONS: {
  id: DocumentCompressionPreset;
  label: string;
  desc: string;
  badge?: string;
}[] = [
  {
    id: 'recommended',
    label: 'Standard Optimization',
    desc: 'Flate object stream compression & form consolidation',
    badge: 'Recommended',
  },
  {
    id: 'maximum',
    label: 'Maximum Compression',
    desc: 'Strips metadata, unreferenced objects & annotations',
    badge: 'Smallest Size',
  },
  {
    id: 'lossless',
    label: 'Lossless Cleanup',
    desc: 'Stream reorganization without touching user metadata',
  },
];

export function DocumentControls({
  preset,
  onPresetChange,
  stripMetadata,
  onStripMetadataChange,
  flattenForms,
  onFlattenFormsChange,
  removeAnnotations,
  onRemoveAnnotationsChange,
  docType,
  isCompressing = false,
  onCompress,
  progress = 0,
}: DocumentControlsProps) {
  return (
    <Card className="border-border/80 bg-card shadow-xs">
      <CardHeader className="pb-3 border-b border-border/60">
        <CardTitle className="text-base font-semibold flex items-center gap-2">
          <Settings2 className="w-4 h-4 text-emerald-500" />
          <span>Optimization Settings</span>
        </CardTitle>
      </CardHeader>

      <CardContent className="p-6 space-y-6">
        {/* Preset Selector */}
        {docType === 'pdf' ? (
          <div>
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-3">
              Compression Profile
            </label>
            <div className="grid grid-cols-1 gap-2.5">
              {PRESET_OPTIONS.map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => onPresetChange(opt.id)}
                  disabled={isCompressing}
                  className={`flex flex-col items-start p-3.5 rounded-xl border text-left transition-all duration-200 cursor-pointer ${
                    preset === opt.id
                      ? 'border-emerald-500 bg-emerald-500/10 ring-1 ring-emerald-500'
                      : 'border-border/70 bg-card hover:border-border hover:bg-muted/30'
                  } ${isCompressing ? 'opacity-60 pointer-events-none' : ''}`}
                >
                  <div className="w-full flex items-center justify-between mb-1">
                    <span className="font-semibold text-sm text-foreground">
                      {opt.label}
                    </span>
                    {opt.badge && (
                      <Badge
                        variant="secondary"
                        className="text-[10px] py-0 px-2 bg-emerald-500/15 text-emerald-600 font-medium"
                      >
                        {opt.badge}
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">{opt.desc}</p>
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="p-4 rounded-xl bg-muted/30 border border-border/70 text-xs text-muted-foreground space-y-1">
            <span className="font-semibold text-foreground block">
              Text & Code Minification
            </span>
            <p>
              Whitespace stripping, comment cleanup, and delimiter compaction are applied automatically to minimize payload size.
            </p>
          </div>
        )}

        {/* PDF-Specific Optimization Toggles */}
        {docType === 'pdf' && (
          <div className="space-y-3 pt-2 border-t border-border/60">
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block">
              Security & Redundancy
            </label>

            {/* Strip Metadata */}
            <label className="flex items-center justify-between p-3 rounded-xl border border-border/60 bg-muted/20 hover:bg-muted/40 cursor-pointer transition-colors">
              <div className="flex items-center gap-3">
                <Shield className="w-4 h-4 text-emerald-500 shrink-0" />
                <div>
                  <span className="text-xs font-semibold text-foreground block">
                    Strip Document Metadata
                  </span>
                  <span className="text-[11px] text-muted-foreground">
                    Removes author, software tags, and edit timestamps
                  </span>
                </div>
              </div>
              <input
                type="checkbox"
                checked={stripMetadata}
                onChange={(e) => onStripMetadataChange(e.target.checked)}
                disabled={isCompressing}
                className="h-4 w-4 rounded text-emerald-600 focus:ring-emerald-500 border-border"
              />
            </label>

            {/* Flatten Forms */}
            <label className="flex items-center justify-between p-3 rounded-xl border border-border/60 bg-muted/20 hover:bg-muted/40 cursor-pointer transition-colors">
              <div className="flex items-center gap-3">
                <FileSpreadsheet className="w-4 h-4 text-blue-500 shrink-0" />
                <div>
                  <span className="text-xs font-semibold text-foreground block">
                    Flatten Form Fields
                  </span>
                  <span className="text-[11px] text-muted-foreground">
                    Merges interactive form inputs into static page text
                  </span>
                </div>
              </div>
              <input
                type="checkbox"
                checked={flattenForms}
                onChange={(e) => onFlattenFormsChange(e.target.checked)}
                disabled={isCompressing}
                className="h-4 w-4 rounded text-emerald-600 focus:ring-emerald-500 border-border"
              />
            </label>

            {/* Remove Annotations */}
            <label className="flex items-center justify-between p-3 rounded-xl border border-border/60 bg-muted/20 hover:bg-muted/40 cursor-pointer transition-colors">
              <div className="flex items-center gap-3">
                <Trash2 className="w-4 h-4 text-amber-500 shrink-0" />
                <div>
                  <span className="text-xs font-semibold text-foreground block">
                    Purge Annotations
                  </span>
                  <span className="text-[11px] text-muted-foreground">
                    Removes sticky notes, highlights, and popup layers
                  </span>
                </div>
              </div>
              <input
                type="checkbox"
                checked={removeAnnotations}
                onChange={(e) => onRemoveAnnotationsChange(e.target.checked)}
                disabled={isCompressing}
                className="h-4 w-4 rounded text-emerald-600 focus:ring-emerald-500 border-border"
              />
            </label>
          </div>
        )}

        {/* Compression Action Button */}
        {onCompress && (
          <Button
            type="button"
            onClick={onCompress}
            disabled={isCompressing}
            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-2.5 rounded-xl shadow-sm transition-all"
          >
            {isCompressing ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Optimizing Document... ({progress}%)
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 mr-2" />
                Re-compress Document
              </>
            )}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
