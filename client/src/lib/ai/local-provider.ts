import { AIProvider, AICompletionOptions, AICompletionResult } from './ai-provider';

export class LocalBrowserModelProvider implements AIProvider {
  name = 'LocalBrowserEngine';

  async isAvailable(): Promise<boolean> {
    return true; // Always available in-browser
  }

  async stream(options: AICompletionOptions): Promise<AICompletionResult> {
    const { prompt, contextSnippet, onChunk } = options;
    const lowerPrompt = prompt.toLowerCase();

    const lines = contextSnippet
      .split('\n')
      .map((l) => l.trim())
      .filter((l) => l.length > 0 && !l.startsWith('---'));

    let synthesis = '';

    // Check if context has spreadsheet information
    const isSpreadsheetContext =
      contextSnippet.includes('Spreadsheet File:') ||
      contextSnippet.includes('Table:') ||
      contextSnippet.includes('Columns:') ||
      contextSnippet.includes('Total Rows:');

    if (isSpreadsheetContext) {
      // Extract table/file name
      const fileNameMatch = contextSnippet.match(/(?:Spreadsheet File|Table):\s*([^\n\r\]]+)/i);
      const fileName = fileNameMatch ? fileNameMatch[1].replace(/\]+$/, '').trim() : 'Spreadsheet';

      // Extract columns and filter out invalid tokens
      const colsMatch = contextSnippet.match(/Columns(?:\s*\(\d+\))?:\s*([^\n\r]+)/i);
      const rawCols = colsMatch ? colsMatch[1].split(',') : [];
      const columnsList = rawCols
        .map((c) => c.replace(/[\[\]]/g, '').trim())
        .filter((c) => c.length > 0 && !c.startsWith('-') && !c.startsWith('|') && c !== '---');

      // Extract rows count
      const rowsMatch = contextSnippet.match(/Total Rows:\s*(\d+)/i);
      const rowCount = rowsMatch ? rowsMatch[1] : 'multiple';

      synthesis = `### Dataset Overview: \`${fileName}\`\n\n`;
      synthesis += `This dataset contains **${rowCount} records** organized across **${columnsList.length || 'multiple'} columns**.\n\n`;

      if (columnsList.length > 0) {
        synthesis += `### Dataset Schema\n\n`;
        synthesis += `| Column Name | Data Type | Notes |\n`;
        synthesis += `| :--- | :--- | :--- |\n`;
        columnsList.forEach((col) => {
          const isNumeric = /amount|total|sum|price|cost|qty|quantity|num|id|rate|score|sales/i.test(col);
          const isDate = /date|time|year|month|day/i.test(col);
          const colType = isNumeric ? 'Numeric' : isDate ? 'Date' : 'Text';
          synthesis += `| **${col}** | ${colType} | Active field in dataset |\n`;
        });
        synthesis += `\n`;
      }

      // Extract sample row snippets if available
      const sampleRowLines = lines
        .filter((l) => (l.startsWith('Row ') || l.startsWith('[Row ')) && !l.includes('---'))
        .slice(0, 5);

      if (sampleRowLines.length > 0) {
        synthesis += `### Sample Records Preview\n\n`;
        sampleRowLines.forEach((row) => {
          const cleanRow = row.replace(/^\[?Row\s*\d+\]?:?\s*/i, '').trim();
          synthesis += `- ${cleanRow}\n`;
        });
        synthesis += `\n`;
      }

      synthesis += `### Suggested Analysis\n\n`;
      synthesis += `- **Calculations**: Ask "What is the total revenue?" or "Calculate average values"\n`;
      synthesis += `- **Rankings**: Ask "Show top 5 entries by amount"\n`;
      synthesis += `- **Visualizations**: Ask "Create a chart for this data"\n`;
    } else if (lowerPrompt.includes('summar') || lowerPrompt.includes('overview') || lowerPrompt.includes('explain')) {
      synthesis = `### Document Summary\n\n`;
      synthesis += `Based on the retrieved document evidence, here are the key findings:\n\n`;

      const meaningfulLines = lines.filter((l) => !l.startsWith('[Source') && l.length > 25).slice(0, 6);
      if (meaningfulLines.length > 0) {
        meaningfulLines.forEach((l, idx) => {
          synthesis += `- **Key Point ${idx + 1}**: ${l}\n`;
        });
      } else {
        synthesis += `The analyzed documents have been indexed and are ready for specific questions.\n`;
      }
    } else if (lowerPrompt.includes('risk') || lowerPrompt.includes('issue') || lowerPrompt.includes('warn')) {
      synthesis = `### Risk & Compliance Assessment\n\n`;
      const riskLines = lines.filter((l) => /risk|liab|terminat|penalty|fail|breach|delay|warn|loss|obligat/i.test(l));
      if (riskLines.length > 0) {
        riskLines.slice(0, 4).forEach((r) => {
          synthesis += `> **Observation**: ${r}\n\n`;
        });
      } else {
        synthesis += `No explicit high-risk clauses or liability penalties were detected in the retrieved document sections.\n\n`;
      }
    } else {
      // General question answering
      synthesis = `### Analysis & Findings\n\n`;
      const validLines = lines.filter((l) => !l.startsWith('[Source') && l.length > 20);
      if (validLines.length > 0) {
        synthesis += `${validLines[0]}\n\n`;
        if (validLines.length > 1) {
          synthesis += `### Key Details\n\n`;
          validLines.slice(1, 5).forEach((l) => {
            synthesis += `- ${l}\n`;
          });
        }
      } else {
        synthesis += `Here is the relevant information from your active files:\n\n`;
        lines.slice(0, 4).forEach((l) => {
          synthesis += `- ${l}\n`;
        });
      }
    }

    // Stream out tokens smoothly
    const words = synthesis.split(' ');
    let emitted = '';

    for (let i = 0; i < words.length; i++) {
      const wordToken = (i === 0 ? '' : ' ') + words[i];
      emitted += wordToken;
      if (onChunk) {
        onChunk(wordToken);
      }
      if (i % 6 === 0) {
        await new Promise((resolve) => setTimeout(resolve, 10));
      }
    }

    return {
      content: emitted,
      tokensUsed: words.length,
    };
  }

  async generate(prompt: string, contextSnippet: string): Promise<string> {
    const res = await this.stream({ prompt, contextSnippet });
    return res.content;
  }
}
