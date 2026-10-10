import { DocumentChunk } from '@/types/file';
import { Citation } from '@/types/chat';
import { BM25Index } from './bm25';
import { generateId } from '@/lib/utils';

export class HybridRetriever {
  private bm25: BM25Index = new BM25Index();
  private allChunks: DocumentChunk[] = [];

  setChunks(chunks: DocumentChunk[]): void {
    this.allChunks = chunks;
    this.bm25.buildIndex(chunks);
  }

  retrieve(query: string, topK: number = 6): {
    chunks: DocumentChunk[];
    citations: Citation[];
    contextPrompt: string;
  } {
    if (this.allChunks.length === 0) {
      return { chunks: [], citations: [], contextPrompt: '' };
    }

    // 1. BM25 Retrieval
    const bm25Results = this.bm25.search(query, topK * 2);

    // 2. Term overlap heuristic for ranking
    const queryWords = query.toLowerCase().split(/\s+/).filter((w) => w.length > 2);
    const scoredChunks = bm25Results.map((res, index) => {
      let overlapCount = 0;
      const lowerText = res.chunk.text.toLowerCase();
      for (const w of queryWords) {
        if (lowerText.includes(w)) overlapCount++;
      }
      // Reciprocal rank score
      const rrfScore = (1 / (60 + index)) + (overlapCount * 0.1);
      return { chunk: res.chunk, score: rrfScore };
    });

    // Fallback if BM25 had 0 matches (e.g. general query like "Summarize this file")
    let finalChunks: DocumentChunk[] = [];
    if (scoredChunks.length > 0) {
      finalChunks = scoredChunks
        .sort((a, b) => b.score - a.score)
        .slice(0, topK)
        .map((sc) => sc.chunk);
    } else {
      // Pick top introductory chunks from the files
      finalChunks = this.allChunks.slice(0, topK);
    }

    // 3. Generate Citations with exact coordinates
    const citations: Citation[] = finalChunks.map((chunk) => ({
      id: generateId(),
      fileId: chunk.fileId,
      fileName: chunk.fileName,
      fileType: chunk.fileName.split('.').pop() || 'doc',
      pageNumber: chunk.pageNumber,
      sectionTitle: chunk.sectionTitle,
      sheetName: chunk.sheetName,
      rowRange: chunk.rowRange,
      exactSnippet: chunk.text.length > 280 ? chunk.text.substring(0, 280) + '...' : chunk.text,
      confidence: 0.95,
    }));

    // 4. Build Zero-Trust Context String
    const contextPrompt = finalChunks
      .map((c, i) => {
        const sourceLoc = c.pageNumber
          ? `Page ${c.pageNumber}`
          : c.sheetName
          ? `Sheet: ${c.sheetName}, Rows: ${c.rowRange ? c.rowRange.join('-') : 'All'}`
          : c.sectionTitle || `Section ${i + 1}`;
        return `[Source ${i + 1}: ${c.fileName} | ${sourceLoc}]\n${c.text}\n`;
      })
      .join('\n---\n\n');

    return {
      chunks: finalChunks,
      citations,
      contextPrompt,
    };
  }
}

export const hybridRetriever = new HybridRetriever();
