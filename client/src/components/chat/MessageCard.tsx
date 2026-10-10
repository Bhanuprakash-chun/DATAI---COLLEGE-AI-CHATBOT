import React, { useState } from 'react';
import {
  FileText,
  Copy,
  Check,
  Calculator,
  ExternalLink,
  Sparkles,
  Bot,
  User as UserIcon,
} from 'lucide-react';
import { ChatMessage, Citation } from '@/types/chat';
import { Button } from '@/components/ui/button';
import { ChartRenderer } from '@/components/analytics/ChartRenderer';
import { useUIStore } from '@/store/ui-store';
import { useChatStore } from '@/store/chat-store';
import { cn, formatDate } from '@/lib/utils';

export interface MessageCardProps {
  message: ChatMessage;
}

function renderFormattedMarkdown(content: string) {
  if (!content) return null;

  const lines = content.split('\n');
  const elements: React.ReactNode[] = [];
  let inCodeBlock = false;
  let codeBuffer: string[] = [];

  const formatInline = (text: string) => {
    if (!text) return null;

    // Clean any accidental leading raw hashes
    const cleaned = text.replace(/^#+\s*/, '');

    // Split on **bold**, *italic*, `code`, _italic_
    const parts = cleaned.split(/(\*\*.*?\*\*|\*[^*\n]+?\*|`[^`\n]+?`|_[^_\n]+?_)/g);
    return parts.map((part, i) => {
      if (part.startsWith('**') && part.endsWith('**') && part.length >= 4) {
        return (
          <strong key={i} className="font-bold text-slate-900">
            {part.slice(2, -2)}
          </strong>
        );
      }
      if (part.startsWith('`') && part.endsWith('`') && part.length >= 2) {
        return (
          <code
            key={i}
            className="font-mono text-xs bg-slate-100 text-amber-800 px-1.5 py-0.5 rounded border border-slate-200"
          >
            {part.slice(1, -1)}
          </code>
        );
      }
      if (
        (part.startsWith('*') && part.endsWith('*') && part.length >= 2 && !part.startsWith('**')) ||
        (part.startsWith('_') && part.endsWith('_') && part.length >= 2)
      ) {
        return (
          <em key={i} className="italic text-slate-800">
            {part.slice(1, -1)}
          </em>
        );
      }
      return part;
    });
  };

  for (let idx = 0; idx < lines.length; idx++) {
    const rawLine = lines[idx];
    const line = rawLine.trim();

    // Code block delimiter
    if (line.startsWith('```')) {
      if (inCodeBlock) {
        elements.push(
          <pre
            key={`code-${idx}`}
            className="bg-slate-900 text-slate-100 p-3.5 rounded-xl overflow-x-auto text-xs font-mono my-2.5 border border-slate-800 shadow-xs"
          >
            <code>{codeBuffer.join('\n')}</code>
          </pre>
        );
        codeBuffer = [];
        inCodeBlock = false;
      } else {
        inCodeBlock = true;
      }
      continue;
    }

    if (inCodeBlock) {
      codeBuffer.push(rawLine);
      continue;
    }

    // Blank line
    if (!line) {
      elements.push(<div key={idx} className="h-2" />);
      continue;
    }

    // Horizontal Divider (---, ***, ___)
    if (/^(\s*[-*_]\s*){3,}$/.test(line)) {
      elements.push(<hr key={idx} className="my-2.5 border-t border-slate-200" />);
      continue;
    }

    // Markdown Headings: #, ##, ###, ####, #####, ######
    const headingMatch = line.match(/^(#{1,6})\s+(.*)$/);
    if (headingMatch) {
      const level = headingMatch[1].length;
      const headingText = headingMatch[2].trim();
      if (level === 1) {
        elements.push(
          <h1 key={idx} className="text-lg font-extrabold text-slate-900 pt-3 pb-1">
            {formatInline(headingText)}
          </h1>
        );
      } else if (level === 2) {
        elements.push(
          <h2 key={idx} className="text-base font-bold text-slate-900 pt-2.5 pb-1">
            {formatInline(headingText)}
          </h2>
        );
      } else if (level === 3) {
        elements.push(
          <h3
            key={idx}
            className="text-sm font-bold text-slate-900 pt-2 pb-1 border-b border-slate-100 flex items-center gap-1.5"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
            <span>{formatInline(headingText)}</span>
          </h3>
        );
      } else {
        // level 4, 5, 6
        elements.push(
          <h4
            key={idx}
            className="text-xs font-bold text-slate-800 pt-2 pb-0.5 flex items-center gap-1.5 uppercase tracking-wide"
          >
            <span className="w-1 h-1 rounded-full bg-amber-400" />
            <span>{formatInline(headingText)}</span>
          </h4>
        );
      }
      continue;
    }

    // Blockquotes (> Quote)
    if (line.startsWith('>')) {
      const quoteText = line.replace(/^>\s*/, '');
      elements.push(
        <div
          key={idx}
          className="my-2 pl-3 py-1.5 border-l-2 border-amber-500 bg-amber-50/40 rounded-r-lg text-xs sm:text-sm text-slate-700 italic"
        >
          {formatInline(quoteText)}
        </div>
      );
      continue;
    }

    // Bullet list items (- , * , • )
    const bulletMatch = line.match(/^([-*•])\s+(.*)$/);
    if (bulletMatch) {
      const bulletText = bulletMatch[2].trim();
      // Skip if bulletText is just separator like ---
      if (/^[-*_]{2,}$/.test(bulletText)) {
        continue;
      }
      elements.push(
        <div
          key={idx}
          className="flex items-start gap-2 my-1 text-slate-700 text-xs sm:text-sm leading-relaxed pl-1"
        >
          <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-2 shrink-0" />
          <span className="flex-1">{formatInline(bulletText)}</span>
        </div>
      );
      continue;
    }

    // Numbered list items
    const numMatch = line.match(/^(\d+)\.\s+(.*)$/);
    if (numMatch) {
      elements.push(
        <div
          key={idx}
          className="flex items-start gap-2 my-1 text-slate-700 text-xs sm:text-sm leading-relaxed pl-1"
        >
          <span className="font-mono text-xs font-bold text-amber-600 mt-0.5 shrink-0">
            {numMatch[1]}.
          </span>
          <span className="flex-1">{formatInline(numMatch[2])}</span>
        </div>
      );
      continue;
    }

    // Markdown Tables
    if (line.startsWith('|') && line.endsWith('|')) {
      const tableLines: string[] = [];
      let tIdx = idx;
      while (
        tIdx < lines.length &&
        lines[tIdx].trim().startsWith('|') &&
        lines[tIdx].trim().endsWith('|')
      ) {
        tableLines.push(lines[tIdx].trim());
        tIdx++;
      }
      idx = tIdx - 1;

      const parseCells = (rowStr: string) =>
        rowStr
          .split('|')
          .slice(1, -1)
          .map((c) => c.trim());

      const headerRow = tableLines.length > 0 ? parseCells(tableLines[0]) : [];
      const hasSeparator =
        tableLines.length > 1 &&
        tableLines[1].replace(/[\s|:-]/g, '').length === 0;
      const dataRows = (hasSeparator ? tableLines.slice(2) : tableLines.slice(1)).map(parseCells);

      elements.push(
        <div key={`table-${idx}`} className="overflow-x-auto my-3 border border-slate-200 rounded-xl shadow-2xs">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                {headerRow.map((cell, cIdx) => (
                  <th key={cIdx} className="px-3.5 py-2 font-bold text-slate-800">
                    {formatInline(cell)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {dataRows.map((row, rIdx) => (
                <tr key={rIdx} className="hover:bg-slate-50/70 transition-colors">
                  {row.map((cell, cIdx) => (
                    <td key={cIdx} className="px-3.5 py-2 text-slate-700">
                      {formatInline(cell)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
      continue;
    }

    // Paragraph
    elements.push(
      <p key={idx} className="text-xs sm:text-sm text-slate-700 leading-relaxed my-0.5">
        {formatInline(rawLine)}
      </p>
    );
  }

  if (inCodeBlock && codeBuffer.length > 0) {
    elements.push(
      <pre
        key="code-final"
        className="bg-slate-900 text-slate-100 p-3.5 rounded-xl overflow-x-auto text-xs font-mono my-2.5 border border-slate-800"
      >
        <code>{codeBuffer.join('\n')}</code>
      </pre>
    );
  }

  return elements;
}

export function MessageCard({ message }: MessageCardProps) {
  const [copied, setCopied] = useState(false);
  const isUser = message.role === 'user';
  const { openFilePreview } = useUIStore();
  const { setActiveCitation } = useChatStore();

  const handleCopy = () => {
    navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCitationClick = (citation: Citation) => {
    setActiveCitation(citation);
    openFilePreview(citation.fileId, citation.pageNumber, citation.rowRange?.[0]);
  };

  return (
    <div
      className={cn(
        'group flex flex-col my-3 max-w-3xl w-full mx-auto transition-all',
        isUser ? 'items-end' : 'items-start'
      )}
    >
      {/* Sender Header Meta */}
      <div className="flex items-center gap-2 mb-1 px-2 select-none">
        {isUser ? (
          <>
            <span className="text-[11px] text-slate-400 font-mono">
              {formatDate(message.createdAt)}
            </span>
            <span className="text-xs font-bold text-slate-800">You</span>
            <div className="w-5 h-5 rounded-full bg-slate-200 border border-slate-300 flex items-center justify-center text-[10px] text-slate-700 font-bold">
              Y
            </div>
          </>
        ) : (
          <>
            <div className="w-5 h-5 rounded-md bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-600 shadow-2xs">
              <Bot className="w-3.5 h-3.5" />
            </div>
            <span className="text-xs font-bold text-slate-900">DatAI</span>
            <span className="text-[11px] text-slate-400 font-mono">
              {formatDate(message.createdAt)}
            </span>
            {message.modeUsed && (
              <span
                className={cn(
                  'text-[10px] font-mono px-2 py-0.5 rounded-full font-semibold border',
                  message.modeUsed === 'ONLINE'
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    : message.modeUsed === 'AUTO'
                    ? 'bg-amber-50 text-amber-800 border-amber-200'
                    : 'bg-slate-100 text-slate-600 border-slate-200'
                )}
              >
                {message.modeUsed}
              </span>
            )}
          </>
        )}
      </div>

      {/* Main Message Bubble */}
      <div
        className={cn(
          'relative text-sm leading-relaxed max-w-full transition-all duration-200',
          isUser
            ? 'bg-slate-900 text-white rounded-2xl sm:rounded-3xl rounded-tr-xs px-5 py-3.5 shadow-sm max-w-[85%]'
            : 'bg-white text-slate-800 border border-slate-200/90 rounded-2xl sm:rounded-3xl rounded-tl-xs p-5 sm:p-6 w-full shadow-xs'
        )}
      >
        {/* Referenced Files Pill (for user message) */}
        {isUser && message.filesReferenced && message.filesReferenced.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-2 pb-2 border-b border-white/10">
            {message.filesReferenced.map((f) => (
              <span
                key={f.id}
                className="inline-flex items-center gap-1.5 text-[11px] font-mono bg-white/10 px-2.5 py-0.5 rounded-full text-slate-100"
              >
                <FileText className="w-3 h-3 text-amber-400" />
                {f.name}
              </span>
            ))}
          </div>
        )}

        {/* Calculation Evidence Box */}
        {!isUser && message.calculationEvidence && (
          <div className="mb-4 p-4 rounded-xl bg-slate-50 border border-slate-200 shadow-2xs space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                <Calculator className="w-4 h-4 text-amber-600" />
                Verified DuckDB Calculation
              </span>
              <span className="text-[11px] font-mono bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full font-semibold border border-amber-200">
                {message.calculationEvidence.rowsAnalyzed.toLocaleString()} rows analyzed
              </span>
            </div>

            <div className="flex items-baseline gap-2 pt-1">
              <span className="text-2xl font-extrabold font-mono text-slate-900 tracking-tight">
                {message.calculationEvidence.calculatedValue}
              </span>
              <span className="text-xs text-slate-500 font-medium">
                from {message.calculationEvidence.sheetName || 'Dataset'}
              </span>
            </div>

            <div className="text-xs font-mono bg-white p-2.5 rounded-lg text-slate-700 border border-slate-200">
              <code>{message.calculationEvidence.formula || message.calculationEvidence.sqlQuery}</code>
            </div>
          </div>
        )}

        {/* Content Body with Clean Formatted Markdown */}
        <div className="space-y-1 font-sans">
          {isUser ? (
            <p className="text-sm text-slate-100 leading-relaxed whitespace-pre-wrap">
              {message.content}
            </p>
          ) : message.content && message.content.trim() ? (
            renderFormattedMarkdown(message.content)
          ) : message.isStreaming ? (
            <div className="flex items-center gap-2.5 text-slate-600 text-xs sm:text-sm py-2">
              <Sparkles className="w-4 h-4 text-amber-500 animate-spin" />
              <span className="font-medium animate-pulse text-slate-700">Analyzing data and generating answer...</span>
            </div>
          ) : (
            <div className="text-xs sm:text-sm text-slate-500 italic py-1">
              No response text generated. Please check your prompt or verify your API settings.
            </div>
          )}
          {message.isStreaming && message.content && (
            <span className="inline-block w-1.5 h-4 bg-amber-500 ml-1 animate-pulse align-middle" />
          )}
        </div>

        {/* Embedded Interactive Chart */}
        {!isUser && message.chart && <ChartRenderer chart={message.chart} />}

        {/* Citations Badges - Deduplicated & Grouped by File */}
        {!isUser && message.citations && message.citations.length > 0 && (() => {
          const fileGroups = new Map<string, {
            primary: Citation;
            count: number;
            sheets: Set<string>;
            pages: Set<number>;
            sections: Set<string>;
          }>();

          for (const c of message.citations) {
            const key = c.fileId || c.fileName;
            let group = fileGroups.get(key);
            if (!group) {
              group = {
                primary: c,
                count: 0,
                sheets: new Set(),
                pages: new Set(),
                sections: new Set(),
              };
              fileGroups.set(key, group);
            }
            group.count++;
            if (c.sheetName) group.sheets.add(c.sheetName);
            if (c.pageNumber) group.pages.add(c.pageNumber);
            if (c.sectionTitle && !c.sectionTitle.toLowerCase().startsWith('section')) {
              group.sections.add(c.sectionTitle);
            }
          }

          const uniqueFiles = Array.from(fileGroups.values());

          return (
            <div className="mt-4 pt-3.5 border-t border-slate-100 space-y-2">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 block font-mono">
                Grounded Evidence & Sources:
              </span>
              <div className="flex flex-wrap gap-2">
                {uniqueFiles.map(({ primary, count, sheets, pages, sections }, idx) => {
                  let badge = '';
                  if (sheets.size > 0) {
                    badge = Array.from(sheets).join(', ');
                  } else if (pages.size > 0) {
                    badge = `p. ${Array.from(pages).sort((a, b) => a - b).join(', ')}`;
                  } else if (sections.size > 0) {
                    badge = Array.from(sections).slice(0, 2).join(', ');
                  } else {
                    badge = count > 1 ? `${count} sections` : 'Document';
                  }

                  return (
                    <button
                      key={primary.id || idx}
                      onClick={() => handleCitationClick(primary)}
                      className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-50 hover:bg-slate-100 border border-slate-200 text-xs font-medium text-slate-700 hover:text-slate-900 transition-all shadow-2xs group"
                      title={`Inspect source: ${primary.fileName} (${count} evidence reference${count > 1 ? 's' : ''})`}
                    >
                      <FileText className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                      <span className="truncate max-w-[180px] font-medium">{primary.fileName}</span>
                      <span className="text-amber-800 font-semibold font-mono text-[11px] bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200/60">
                        {badge}
                      </span>
                      <ExternalLink className="w-3 h-3 text-slate-400 group-hover:text-amber-600 transition-colors shrink-0" />
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })()}
      </div>

      {/* Message Action Footer (Copy, etc.) */}
      {!isUser && !message.isStreaming && (
        <div className="flex items-center gap-1 mt-1 opacity-0 group-hover:opacity-100 transition-opacity px-2">
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={handleCopy}
            className="rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100"
            title="Copy response"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
          </Button>
        </div>
      )}
    </div>
  );
}
