export type DocumentType = 'pdf' | 'json' | 'text' | 'markdown' | 'csv' | 'xml';

export type DocumentCompressionPreset = 'recommended' | 'maximum' | 'lossless';

export interface DocumentMetadata {
  title?: string;
  author?: string;
  subject?: string;
  creator?: string;
  producer?: string;
  creationDate?: Date;
  modificationDate?: Date;
}

export interface DocumentDetails {
  file: File;
  name: string;
  size: number;
  type: string;
  docType: DocumentType;
  pageCount?: number;
  charCount?: number;
  lineCount?: number;
  previewUrl?: string;
  metadata?: DocumentMetadata;
}

export interface DocumentCompressionOptions {
  preset: DocumentCompressionPreset;
  stripMetadata: boolean;
  flattenForms: boolean;
  removeAnnotations: boolean;
  minifyWhitespace?: boolean;
}

export interface DocumentCompressionResult {
  file: File;
  name: string;
  size: number;
  previewUrl?: string;
  savedBytes: number;
  savedPercentage: number;
  compressionRatio: string;
}

export interface UseDocumentCompressReturn {
  compress: (fileToCompress?: File) => Promise<void>;
  preset: DocumentCompressionPreset;
  setPreset: (preset: DocumentCompressionPreset) => void;
  stripMetadata: boolean;
  setStripMetadata: (val: boolean) => void;
  flattenForms: boolean;
  setFlattenForms: (val: boolean) => void;
  removeAnnotations: boolean;
  setRemoveAnnotations: (val: boolean) => void;
  compressedFile: File | null;
  originalSize: number | null;
  compressedSize: number | null;
  savedPercentage: number | null;
  preview: string | null;
  isCompressing: boolean;
  progress: number;
  error: string | null;
  reset: () => void;
}
