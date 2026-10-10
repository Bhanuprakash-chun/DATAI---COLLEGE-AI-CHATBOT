import mammoth from 'mammoth';
import { DocumentChunk } from '@/types/file';
import { generateId } from '@/lib/utils';

export interface ParsedDOCXResult {
  chunks: DocumentChunk[];
  fullText: string;
  headings: string[];
}

export async function parseDOCX(
  fileId: string,
  fileName: string,
  arrayBuffer: ArrayBuffer
): Promise<ParsedDOCXResult> {
  const result = await mammoth.extractRawText({ arrayBuffer });
  const fullText = result.value;
  const chunks: DocumentChunk[] = [];
  const headings: string[] = [];

  // Break text down into structural paragraphs / sections
  const paragraphs = fullText
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter((p) => p.length > 0);

  let currentHeading = 'Document Body';

  for (const para of paragraphs) {
    // Basic heading heuristic (short line without ending punctuation or starting with numbers)
    if (para.length < 90 && !para.endsWith('.') && !para.endsWith(';')) {
      currentHeading = para;
      headings.push(para);
    }

    // Split long paragraphs if necessary
    const words = para.split(' ');
    const CHUNK_SIZE = 180;
    const OVERLAP = 30;

    if (words.length <= CHUNK_SIZE) {
      chunks.push({
        id: generateId(),
        fileId,
        fileName,
        chunkIndex: chunks.length,
        text: para,
        sectionTitle: currentHeading,
        metadata: {
          sectionTitle: currentHeading,
          wordCount: words.length,
        },
      });
    } else {
      for (let i = 0; i < words.length; i += CHUNK_SIZE - OVERLAP) {
        const chunkWords = words.slice(i, i + CHUNK_SIZE);
        const text = chunkWords.join(' ');
        chunks.push({
          id: generateId(),
          fileId,
          fileName,
          chunkIndex: chunks.length,
          text,
          sectionTitle: currentHeading,
          metadata: {
            sectionTitle: currentHeading,
            wordCount: chunkWords.length,
          },
        });
      }
    }
  }

  return {
    chunks,
    fullText,
    headings,
  };
}
