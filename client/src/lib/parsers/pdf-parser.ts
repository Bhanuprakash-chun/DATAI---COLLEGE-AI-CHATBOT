import * as pdfjsLib from 'pdfjs-dist';
import { DocumentChunk } from '@/types/file';
import { generateId } from '@/lib/utils';

// Configure pdf.js worker
if (typeof window !== 'undefined') {
  pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;
}

export interface ParsedPDFResult {
  pageCount: number;
  chunks: DocumentChunk[];
  fullText: string;
}

export async function parsePDF(
  fileId: string,
  fileName: string,
  data: ArrayBuffer,
  onProgress?: (progress: number) => void
): Promise<ParsedPDFResult> {
  const loadingTask = pdfjsLib.getDocument({ data });
  const pdf = await loadingTask.promise;
  const pageCount = pdf.numPages;
  const chunks: DocumentChunk[] = [];
  let fullText = '';

  for (let pageNum = 1; pageNum <= pageCount; pageNum++) {
    const page = await pdf.getPage(pageNum);
    const textContent = await page.getTextContent();
    const pageText = textContent.items
      .map((item: any) => item.str)
      .join(' ')
      .replace(/\s+/g, ' ')
      .trim();

    if (pageText.length > 0) {
      fullText += `\n--- Page ${pageNum} ---\n` + pageText;

      // Split page text into manageable chunks if long, preserving page citation
      const words = pageText.split(' ');
      const CHUNK_SIZE = 180; // ~200-250 tokens
      const OVERLAP = 30;

      for (let i = 0; i < words.length; i += CHUNK_SIZE - OVERLAP) {
        const chunkWords = words.slice(i, i + CHUNK_SIZE);
        const text = chunkWords.join(' ');
        if (text.trim().length > 20) {
          chunks.push({
            id: generateId(),
            fileId,
            fileName,
            chunkIndex: chunks.length,
            text,
            pageNumber: pageNum,
            sectionTitle: `Page ${pageNum}`,
            metadata: {
              wordCount: chunkWords.length,
              pageNumber: pageNum,
            },
          });
        }
      }
    }

    if (onProgress) {
      onProgress(Math.round((pageNum / pageCount) * 100));
    }
  }

  return {
    pageCount,
    chunks,
    fullText,
  };
}
