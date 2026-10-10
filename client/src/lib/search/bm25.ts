import { DocumentChunk } from '@/types/file';

export interface BM25Doc {
  id: string;
  tokens: string[];
  length: number;
  chunk: DocumentChunk;
}

export class BM25Index {
  private docs: BM25Doc[] = [];
  private df: Map<string, number> = new Map(); // Document frequency for terms
  private avgDocLength: number = 0;
  private k1: number = 1.2;
  private b: number = 0.75;

  private tokenize(text: string): string[] {
    return text
      .toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter((t) => t.length > 2);
  }

  buildIndex(chunks: DocumentChunk[]): void {
    this.docs = [];
    this.df.clear();
    let totalLength = 0;

    for (const chunk of chunks) {
      const tokens = this.tokenize(chunk.text);
      this.docs.push({
        id: chunk.id,
        tokens,
        length: tokens.length,
        chunk,
      });
      totalLength += tokens.length;

      const uniqueTokens = new Set(tokens);
      for (const token of uniqueTokens) {
        this.df.set(token, (this.df.get(token) || 0) + 1);
      }
    }

    this.avgDocLength = this.docs.length > 0 ? totalLength / this.docs.length : 0;
  }

  search(query: string, topK: number = 5): { chunk: DocumentChunk; score: number }[] {
    const queryTokens = this.tokenize(query);
    if (queryTokens.length === 0 || this.docs.length === 0) return [];

    const N = this.docs.length;
    const scores: { chunk: DocumentChunk; score: number }[] = [];

    for (const doc of this.docs) {
      let score = 0;
      // Pre-calculate term frequencies in doc
      const tfMap: Map<string, number> = new Map();
      for (const t of doc.tokens) {
        tfMap.set(t, (tfMap.get(t) || 0) + 1);
      }

      for (const qTerm of queryTokens) {
        if (!this.df.has(qTerm)) continue;

        const df = this.df.get(qTerm)!;
        const idf = Math.log(1 + (N - df + 0.5) / (df + 0.5));
        const tf = tfMap.get(qTerm) || 0;

        const numerator = tf * (this.k1 + 1);
        const denominator = tf + this.k1 * (1 - this.b + this.b * (doc.length / (this.avgDocLength || 1)));

        score += idf * (numerator / denominator);
      }

      if (score > 0) {
        scores.push({ chunk: doc.chunk, score });
      }
    }

    return scores.sort((a, b) => b.score - a.score).slice(0, topK);
  }
}
