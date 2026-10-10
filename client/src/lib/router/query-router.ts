import { FileMetadata, DocumentChunk } from '@/types/file';
import { ChatMessage, Citation, CalculationEvidence, MessageChart } from '@/types/chat';
import { AIMode } from '@/types/settings';
import { QueryPlanner } from '@/lib/analytics/query-planner';
import { hybridRetriever } from '@/lib/search/hybrid-retriever';
import { GeminiGatewayProvider } from '@/lib/ai/gemini-gateway-provider';
import { LocalBrowserModelProvider } from '@/lib/ai/local-provider';
import { storage } from '@/lib/storage/idb-storage';

export class QueryRouter {
  private geminiProvider = new GeminiGatewayProvider();
  private localProvider = new LocalBrowserModelProvider();

  async processQuery(options: {
    question: string;
    files: FileMetadata[];
    chunks: DocumentChunk[];
    cachedSpreadsheetRows?: Record<string, any>[];
    mode: AIMode;
    conversationHistory?: { role: 'user' | 'assistant'; content: string }[];
    onToken?: (token: string) => void;
    signal?: AbortSignal;
  }): Promise<{
    content: string;
    citations?: Citation[];
    calculationEvidence?: CalculationEvidence;
    chart?: MessageChart;
    modeUsed: 'ONLINE' | 'AUTO' | 'OFFLINE';
  }> {
    const { question, files, chunks, cachedSpreadsheetRows, mode, conversationHistory, onToken, signal } = options;
    const lowerQ = question.toLowerCase();

    // Check if network / backend is available
    const isOnlineAvailable = navigator.onLine && (await this.geminiProvider.isAvailable());
    const effectiveMode: 'ONLINE' | 'AUTO' | 'OFFLINE' =
      mode === 'OFFLINE' || !isOnlineAvailable ? 'OFFLINE' : mode;

    // Check if files include tabular data
    const tabularFile = files.find((f) => f.type === 'csv' || f.type === 'xlsx' || f.type === 'xls');
    const isCalculationIntent =
      /revenue|sales|total|sum|average|avg|count|highest|lowest|top\s*\d+|chart|graph|trend|growth/i.test(lowerQ);

    // 1. Spreadsheet / Analytical Path
    if (tabularFile && isCalculationIntent && cachedSpreadsheetRows && cachedSpreadsheetRows.length > 0) {
      const planResult = QueryPlanner.planAndExecute(question, tabularFile, cachedSpreadsheetRows);
      if (planResult) {
        const { plan, result, evidence, chart } = planResult;

        // Formulate Answer First
        let answerHeader = `## Result: ${evidence.calculatedValue}\n\n`;
        let answerBody = `**Source**: \`${tabularFile.name}\` (${evidence.sheetName})\n`;
        answerBody += `**Data Scope**: ${evidence.rowsAnalyzed.toLocaleString()} rows analyzed\n`;
        answerBody += `**Calculation**: \`${evidence.formula}\`\n\n`;

        if (result.rows.length > 1) {
          answerBody += `### Top Aggregates\n\n`;
          answerBody += `| ${result.columns.join(' | ')} |\n`;
          answerBody += `| ${result.columns.map(() => '---').join(' | ')} |\n`;
          for (const row of result.rows.slice(0, 5)) {
            answerBody += `| ${result.columns.map((c) => row[c] ?? '').join(' | ')} |\n`;
          }
          answerBody += `\n`;
        }

        // If in ONLINE mode and Gemini is available, ask Gemini to provide a 2-sentence executive summary of the calculated data
        let aiExplanation = '';
        if (effectiveMode === 'ONLINE' && isOnlineAvailable) {
          try {
            const contextData = `Calculated data: ${JSON.stringify(result.rows.slice(0, 10))}\nQuery: ${question}`;
            const prompt = `Explain these exact calculated metrics in 2 clear sentences. Do not recalculate or invent values.`;
            aiExplanation = await this.geminiProvider.generate(prompt, contextData);
          } catch (_) {
            // Keep deterministic answer
          }
        }

        const fullContent = answerHeader + answerBody + (aiExplanation ? `### Insights\n${aiExplanation}\n` : '');

        // Emit tokens for animated UX
        if (onToken) {
          const parts = fullContent.split(' ');
          for (const p of parts) {
            onToken(p + ' ');
            await new Promise((r) => setTimeout(r, 8));
          }
        }

        return {
          content: fullContent,
          calculationEvidence: evidence,
          chart,
          modeUsed: effectiveMode,
        };
      }
    }

    // 2. Document & Spreadsheet Intelligence Path
    hybridRetriever.setChunks(chunks);
    const retrieval = hybridRetriever.retrieve(question, 6);

    // Build comprehensive context including spreadsheet columns and sample records
    let enrichedContext = retrieval.contextPrompt;
    if (tabularFile) {
      const rows = cachedSpreadsheetRows || [];
      let columns: string[] = [];
      if (rows.length > 0) {
        columns = Object.keys(rows[0]);
      } else if (tabularFile.sheets && tabularFile.sheets.length > 0 && tabularFile.sheets[0].columns) {
        columns = tabularFile.sheets[0].columns.map((c) => c.name);
      }
      const totalRowCount = rows.length > 0 ? rows.length : (tabularFile.rowCount || tabularFile.sheets?.[0]?.rowCount || 0);
      const sample = rows.slice(0, 8);
      
      let tableMeta = `[Spreadsheet File: ${tabularFile.name}]\nTotal Rows: ${totalRowCount}\n`;
      if (columns.length > 0) {
        tableMeta += `Columns (${columns.length}): ${columns.join(', ')}\n`;
      }
      if (sample.length > 0) {
        tableMeta += `Sample Records:\n${sample.map((r, i) => `Row ${i + 1}: ` + Object.entries(r).map(([k, v]) => `${k}=${v}`).join(' | ')).join('\n')}\n\n`;
      }
      enrichedContext = tableMeta + (enrichedContext ? `\n---\n` + enrichedContext : '');
    }

    // If user explicitly selected OFFLINE mode -> Local synthesis
    if (mode === 'OFFLINE') {
      const localResult = await this.localProvider.stream({
        prompt: question,
        contextSnippet: enrichedContext,
        onChunk: onToken,
      });

      return {
        content: localResult.content,
        citations: retrieval.citations,
        modeUsed: 'OFFLINE',
      };
    }

    // 3. Online Gemini Mode with High-Fidelity Context
    try {
      const geminiResult = await this.geminiProvider.stream({
        prompt: question,
        contextSnippet: enrichedContext,
        conversationHistory,
        onChunk: onToken,
        signal,
      });

      if (!geminiResult.content || !geminiResult.content.trim()) {
        throw new Error('Gemini returned an empty response.');
      }

      return {
        content: geminiResult.content,
        citations: retrieval.citations,
        modeUsed: mode === 'AUTO' ? 'AUTO' : 'ONLINE',
      };
    } catch (err: any) {
      console.warn('Gemini stream failed, falling back to articulate local synthesis:', err);
      const fallbackResult = await this.localProvider.stream({
        prompt: question,
        contextSnippet: enrichedContext,
        onChunk: onToken,
      });

      return {
        content: fallbackResult.content,
        citations: retrieval.citations,
        modeUsed: 'OFFLINE',
      };
    }
  }
}

export const queryRouter = new QueryRouter();
