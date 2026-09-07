import { PDFDocument, PDFName } from 'pdf-lib';
import {
  DocumentDetails,
  DocumentType,
  DocumentCompressionOptions,
} from '@/types/document';

export const ACCEPTED_DOC_EXTENSIONS = [
  '.pdf',
  '.json',
  '.txt',
  '.md',
  '.csv',
  '.xml',
] as const;

export const ACCEPTED_DOC_MIMES = [
  'application/pdf',
  'application/json',
  'text/plain',
  'text/markdown',
  'text/csv',
  'application/xml',
  'text/xml',
] as const;

export const ACCEPTED_DOC_INPUT_STRING =
  '.pdf,.json,.txt,.md,.csv,.xml,application/pdf,application/json,text/plain,text/markdown,text/csv,text/xml,application/xml';

export const MAX_ALLOWED_DOC_SIZE_BYTES = 75 * 1024 * 1024; // 75MB client-side limit

/**
 * Detect document type from file name and mime type
 */
export function getDocumentType(file: File): DocumentType {
  const nameLower = file.name.toLowerCase();
  if (nameLower.endsWith('.pdf') || file.type === 'application/pdf') {
    return 'pdf';
  }
  if (nameLower.endsWith('.json') || file.type === 'application/json') {
    return 'json';
  }
  if (nameLower.endsWith('.md')) {
    return 'markdown';
  }
  if (nameLower.endsWith('.csv') || file.type === 'text/csv') {
    return 'csv';
  }
  if (nameLower.endsWith('.xml') || file.type.includes('xml')) {
    return 'xml';
  }
  return 'text';
}

/**
 * Validates selected document file
 */
export function validateDocumentFile(file: File): { isValid: boolean; error?: string } {
  if (!file) {
    return { isValid: false, error: 'No document file provided.' };
  }

  if (file.size === 0) {
    return { isValid: false, error: 'The selected document is empty (0 bytes).' };
  }

  if (file.size > MAX_ALLOWED_DOC_SIZE_BYTES) {
    return {
      isValid: false,
      error: `File exceeds the 75MB in-browser limit (selected: ${(file.size / (1024 * 1024)).toFixed(1)}MB).`,
    };
  }

  const nameLower = file.name.toLowerCase();
  const hasValidExt = ACCEPTED_DOC_EXTENSIONS.some((ext) => nameLower.endsWith(ext));
  const hasValidMime =
    (ACCEPTED_DOC_MIMES as readonly string[]).includes(file.type) ||
    file.type.startsWith('text/') ||
    file.type === 'application/pdf';

  if (!hasValidExt && !hasValidMime) {
    return {
      isValid: false,
      error: 'Unsupported document format. Please upload PDF, JSON, TXT, MD, CSV, or XML.',
    };
  }

  return { isValid: true };
}

/**
 * Loads document metadata and generates a preview URL
 */
export async function loadDocumentDetails(file: File): Promise<DocumentDetails> {
  const docType = getDocumentType(file);
  const previewUrl = URL.createObjectURL(file);

  if (docType === 'pdf') {
    const arrayBuffer = await file.arrayBuffer();
    const pdfDoc = await PDFDocument.load(arrayBuffer, { ignoreEncryption: true });
    const pageCount = pdfDoc.getPageCount();

    const title = pdfDoc.getTitle() || undefined;
    const author = pdfDoc.getAuthor() || undefined;
    const subject = pdfDoc.getSubject() || undefined;
    const creator = pdfDoc.getCreator() || undefined;
    const producer = pdfDoc.getProducer() || undefined;
    const creationDate = pdfDoc.getCreationDate() || undefined;
    const modificationDate = pdfDoc.getModificationDate() || undefined;

    return {
      file,
      name: file.name,
      size: file.size,
      type: file.type || 'application/pdf',
      docType,
      pageCount,
      previewUrl,
      metadata: {
        title,
        author,
        subject,
        creator,
        producer,
        creationDate,
        modificationDate,
      },
    };
  }

  // Text-based files
  const text = await file.text();
  const lines = text.split(/\r\n|\r|\n/);

  return {
    file,
    name: file.name,
    size: file.size,
    type: file.type || 'text/plain',
    docType,
    charCount: text.length,
    lineCount: lines.length,
    previewUrl,
  };
}

/**
 * Optimizes and compresses a PDF document using pdf-lib
 */
export async function compressPdf(
  sourceFile: File,
  options: DocumentCompressionOptions
): Promise<File> {
  const arrayBuffer = await sourceFile.arrayBuffer();
  const pdfDoc = await PDFDocument.load(arrayBuffer, {
    ignoreEncryption: true,
    updateMetadata: false,
  });

  // 1. Strip Metadata if requested or in maximum mode
  if (options.stripMetadata || options.preset === 'maximum') {
    pdfDoc.setTitle('');
    pdfDoc.setAuthor('');
    pdfDoc.setSubject('');
    pdfDoc.setKeywords([]);
    pdfDoc.setProducer('');
    pdfDoc.setCreator('');
  }

  // 2. Flatten Forms if requested or in maximum mode
  if (options.flattenForms || options.preset === 'maximum') {
    try {
      const form = pdfDoc.getForm();
      form.flatten();
    } catch {
      // Document might not have interactive form fields, safely ignore
    }
  }

  // 3. Remove Annotations if requested or in maximum mode
  if (options.removeAnnotations || options.preset === 'maximum') {
    try {
      const pages = pdfDoc.getPages();
      for (const page of pages) {
        page.node.delete(PDFName.of('Annots'));
      }
    } catch {
      // Safely ignore annotation cleanup failures
    }
  }

  // 4. Save with high-density object stream compression
  const savedBytes = await pdfDoc.save({
    useObjectStreams: true,
    addDefaultPage: false,
    objectsPerTick: 50,
  });

  // Construct output filename
  const dotIdx = sourceFile.name.lastIndexOf('.');
  const baseName = dotIdx !== -1 ? sourceFile.name.slice(0, dotIdx) : sourceFile.name;
  const outputName = `${baseName}_optimized.pdf`;

  return new File([savedBytes as Uint8Array<ArrayBuffer>], outputName, {
    type: 'application/pdf',
  });
}

/**
 * Minifies and compresses text-based documents
 */
export async function compressTextDocument(sourceFile: File): Promise<File> {
  const text = await sourceFile.text();
  const docType = getDocumentType(sourceFile);

  let optimizedText = text;

  if (docType === 'json') {
    try {
      const parsed = JSON.parse(text);
      optimizedText = JSON.stringify(parsed);
    } catch {
      // If malformed JSON, fallback to line/whitespace compression
      optimizedText = text
        .split('\n')
        .map((line) => line.trim())
        .filter(Boolean)
        .join('');
    }
  } else if (docType === 'csv') {
    // Trim extraneous trailing commas and spaces on each row
    optimizedText = text
      .split(/\r?\n/)
      .map((row) => row.trimEnd())
      .filter((row) => row.length > 0)
      .join('\n');
  } else if (docType === 'xml') {
    // Strip redundant whitespace between XML tags
    optimizedText = text
      .replace(/>\s+</g, '><')
      .trim();
  } else {
    // General TXT / Markdown: normalize newlines, collapse 3+ blank lines to max 1
    optimizedText = text
      .replace(/\r\n/g, '\n')
      .replace(/\n{3,}/g, '\n\n')
      .trim();
  }

  const dotIdx = sourceFile.name.lastIndexOf('.');
  const baseName = dotIdx !== -1 ? sourceFile.name.slice(0, dotIdx) : sourceFile.name;
  const ext = dotIdx !== -1 ? sourceFile.name.slice(dotIdx) : '';
  const outputName = `${baseName}_optimized${ext}`;

  return new File([optimizedText], outputName, {
    type: sourceFile.type || 'text/plain',
  });
}
