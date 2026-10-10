import { DocumentChunk } from '@/types/file';
import { generateId } from '@/lib/utils';

export function parseText(
  fileId: string,
  fileName: string,
  content: string,
  type: 'txt' | 'md' | 'json'
): { chunks: DocumentChunk[]; fullText: string } {
  const chunks: DocumentChunk[] = [];

  if (type === 'json') {
    try {
      const parsed = JSON.parse(content);
      const formatted = JSON.stringify(parsed, null, 2);
      const lines = formatted.split('\n');
      const CHUNK_LINES = 60;

      for (let i = 0; i < lines.length; i += CHUNK_LINES) {
        const slice = lines.slice(i, i + CHUNK_LINES).join('\n');
        chunks.push({
          id: generateId(),
          fileId,
          fileName,
          chunkIndex: chunks.length,
          text: `JSON structure from ${fileName} (lines ${i + 1}-${Math.min(i + CHUNK_LINES, lines.length)}):\n` + slice,
          sectionTitle: `Lines ${i + 1}-${Math.min(i + CHUNK_LINES, lines.length)}`,
        });
      }

      return { chunks, fullText: formatted };
    } catch (_) {
      // Fallback as raw text if JSON parsing fails
    }
  }

  // Text and Markdown chunking
  const paragraphs = content
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter((p) => p.length > 0);

  let currentSection = 'Document Body';

  for (const para of paragraphs) {
    if (type === 'md' && (para.startsWith('#') || para.startsWith('##') || para.startsWith('###'))) {
      currentSection = para.replace(/^#+\s*/, '').trim();
    }

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
        sectionTitle: currentSection,
        metadata: { wordCount: words.length },
      });
    } else {
      for (let i = 0; i < words.length; i += CHUNK_SIZE - OVERLAP) {
        const chunkWords = words.slice(i, i + CHUNK_SIZE);
        chunks.push({
          id: generateId(),
          fileId,
          fileName,
          chunkIndex: chunks.length,
          text: chunkWords.join(' '),
          sectionTitle: currentSection,
          metadata: { wordCount: chunkWords.length },
        });
      }
    }
  }

  return {
    chunks,
    fullText: content,
  };
}
