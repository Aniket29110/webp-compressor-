'use client';

import React from 'react';
import {
  FileText,
  X,
  Layers,
  Calendar,
  User,
  HardDrive,
  FileCode,
  CheckCircle2,
} from 'lucide-react';
import { formatBytes } from '@/lib/format-utils';
import { DocumentType, DocumentMetadata } from '@/types/document';
import { Card, CardContent } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';

interface DocumentPreviewProps {
  name: string;
  type: string;
  size: number;
  docType: DocumentType;
  pageCount?: number;
  charCount?: number;
  lineCount?: number;
  previewUrl?: string;
  metadata?: DocumentMetadata;
  onRemove: () => void;
  isCompressing?: boolean;
}

export function DocumentPreview({
  name,
  size,
  docType,
  pageCount,
  charCount,
  lineCount,
  previewUrl,
  metadata,
  onRemove,
  isCompressing = false,
}: DocumentPreviewProps) {
  return (
    <Card className="overflow-hidden border-border/80 bg-card shadow-xs">
      <CardContent className="p-6">
        <div className="flex items-start justify-between gap-4 mb-4">
          <div className="flex items-center gap-3 min-w-0">
            <div className="h-12 w-12 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center shrink-0">
              {docType === 'pdf' ? (
                <FileText className="w-6 h-6" />
              ) : (
                <FileCode className="w-6 h-6" />
              )}
            </div>
            <div className="min-w-0">
              <h3 className="font-semibold text-base text-foreground truncate" title={name}>
                {name}
              </h3>
              <p className="text-xs text-muted-foreground flex items-center gap-2 mt-0.5">
                <span>{formatBytes(size)}</span>
                <span>&bull;</span>
                <span className="uppercase font-mono font-medium">{docType}</span>
              </p>
            </div>
          </div>

          <Button
            variant="ghost"
            size="icon"
            onClick={onRemove}
            disabled={isCompressing}
            className="text-muted-foreground hover:text-foreground shrink-0 rounded-full h-8 w-8"
            aria-label="Remove document"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>

        {/* Metadata Badges */}
        <div className="flex flex-wrap gap-2 mb-4">
          {pageCount !== undefined && (
            <Badge variant="secondary" className="gap-1.5 py-1 px-2.5 text-xs font-medium">
              <Layers className="w-3.5 h-3.5 text-emerald-500" />
              {pageCount} {pageCount === 1 ? 'Page' : 'Pages'}
            </Badge>
          )}

          {charCount !== undefined && (
            <Badge variant="secondary" className="gap-1.5 py-1 px-2.5 text-xs font-medium">
              <HardDrive className="w-3.5 h-3.5 text-blue-500" />
              {charCount.toLocaleString()} Characters
            </Badge>
          )}

          {lineCount !== undefined && (
            <Badge variant="secondary" className="gap-1.5 py-1 px-2.5 text-xs font-medium">
              <FileCode className="w-3.5 h-3.5 text-purple-500" />
              {lineCount.toLocaleString()} Lines
            </Badge>
          )}

          {metadata?.author && (
            <Badge variant="outline" className="gap-1.5 py-1 px-2.5 text-xs font-normal">
              <User className="w-3 h-3 text-muted-foreground" />
              {metadata.author}
            </Badge>
          )}

          {metadata?.creationDate && (
            <Badge variant="outline" className="gap-1.5 py-1 px-2.5 text-xs font-normal">
              <Calendar className="w-3 h-3 text-muted-foreground" />
              {new Date(metadata.creationDate).toLocaleDateString()}
            </Badge>
          )}
        </div>

        {/* Document Preview Viewport */}
        {previewUrl && docType === 'pdf' ? (
          <div className="relative w-full h-64 rounded-xl overflow-hidden border border-border/70 bg-muted/40">
            <iframe
              src={`${previewUrl}#toolbar=0&navpanes=0`}
              className="w-full h-full border-0"
              title="PDF Document Preview"
            />
          </div>
        ) : (
          <div className="p-6 rounded-xl border border-dashed border-border/80 bg-muted/20 flex flex-col items-center justify-center text-center">
            <CheckCircle2 className="w-8 h-8 text-emerald-500 mb-2" />
            <p className="text-sm font-medium text-foreground">
              Document Loaded & Inspected
            </p>
            <p className="text-xs text-muted-foreground mt-1 max-w-xs">
              Ready for client-side stream optimization and whitespace compaction.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
