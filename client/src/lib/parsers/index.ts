import { FileMetadata, SupportedFileType, DocumentChunk } from '@/types/file';
import { parsePDF } from './pdf-parser';
import { parseDOCX } from './docx-parser';
import { parseSpreadsheet } from './spreadsheet-parser';
import { parseText } from './text-parser';
import { parseImageOCR } from './ocr-parser';
import { storage } from '@/lib/storage/idb-storage';

export function detectFileType(fileName: string, mimeType: string): SupportedFileType {
  const ext = fileName.split('.').pop()?.toLowerCase();
  if (ext === 'xlsx') return 'xlsx';
  if (ext === 'xls') return 'xls';
  if (ext === 'csv') return 'csv';
  if (ext === 'pdf') return 'pdf';
  if (ext === 'docx') return 'docx';
  if (ext === 'md' || ext === 'markdown') return 'md';
  if (ext === 'json') return 'json';
  if (ext === 'txt') return 'txt';
  if (['png', 'jpg', 'jpeg', 'webp', 'bmp'].includes(ext || '') || mimeType.startsWith('image/')) {
    return 'image';
  }
  return 'txt';
}

export async function processAndIndexFile(
  file: File,
  workspaceId: string,
  onProgress?: (step: 'reading' | 'analyzing' | 'indexing' | 'ready', progress: number) => void
): Promise<FileMetadata> {
  const type = detectFileType(file.name, file.type);
  const fileId = `file_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  const storageKey = `blob_${fileId}_${file.name}`;

  if (onProgress) onProgress('reading', 15);

  const arrayBuffer = await file.arrayBuffer();

  // Save raw blob to OPFS / Storage
  await storage.saveFileBlob(storageKey, arrayBuffer);

  if (onProgress) onProgress('analyzing', 40);

  let chunks: DocumentChunk[] = [];
  let pageCount: number | undefined;
  let rowCount: number | undefined;
  let sheets: any[] | undefined;
  let ocrApplied = false;

  try {
    switch (type) {
      case 'pdf': {
        const result = await parsePDF(fileId, file.name, arrayBuffer, (p) => {
          if (onProgress) onProgress('analyzing', 40 + Math.round(p * 0.3));
        });
        chunks = result.chunks;
        pageCount = result.pageCount;
        break;
      }
      case 'docx': {
        const result = await parseDOCX(fileId, file.name, arrayBuffer);
        chunks = result.chunks;
        break;
      }
      case 'csv': {
        const result = await parseSpreadsheet(fileId, file.name, arrayBuffer, true);
        chunks = result.chunks;
        sheets = result.sheets;
        rowCount = result.totalRowCount;
        break;
      }
      case 'xlsx':
      case 'xls': {
        const result = await parseSpreadsheet(fileId, file.name, arrayBuffer, false);
        chunks = result.chunks;
        sheets = result.sheets;
        rowCount = result.totalRowCount;
        break;
      }
      case 'image': {
        ocrApplied = true;
        const result = await parseImageOCR(fileId, file.name, file, (p) => {
          if (onProgress) onProgress('analyzing', 40 + Math.round(p * 0.3));
        });
        chunks = result.chunks;
        break;
      }
      case 'txt':
      case 'md':
      case 'json':
      default: {
        const text = new TextDecoder('utf-8').decode(arrayBuffer);
        const result = parseText(fileId, file.name, text, type as any);
        chunks = result.chunks;
        break;
      }
    }

    if (onProgress) onProgress('indexing', 80);

    // Save chunks to IndexedDB
    await storage.saveChunks(chunks);

    const metadata: FileMetadata = {
      id: fileId,
      workspaceId,
      name: file.name,
      size: file.size,
      type,
      mimeType: file.type || 'application/octet-stream',
      createdAt: Date.now(),
      updatedAt: Date.now(),
      status: 'ready',
      progress: 100,
      chunkCount: chunks.length,
      pageCount,
      rowCount,
      sheets,
      ocrApplied,
      storageKey,
    };

    await storage.saveFile(metadata);

    if (onProgress) onProgress('ready', 100);

    return metadata;
  } catch (error: any) {
    console.error(`Failed to process ${file.name}:`, error);
    const failedMeta: FileMetadata = {
      id: fileId,
      workspaceId,
      name: file.name,
      size: file.size,
      type,
      mimeType: file.type,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      status: 'error',
      statusMessage: error.message || 'Processing failed',
      progress: 0,
      chunkCount: 0,
      storageKey,
    };
    await storage.saveFile(failedMeta);
    throw error;
  }
}
