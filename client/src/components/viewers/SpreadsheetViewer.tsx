import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { Search, ArrowUpDown } from 'lucide-react';
import { FileMetadata } from '@/types/file';
import { storage } from '@/lib/storage/idb-storage';
import { parseSpreadsheet } from '@/lib/parsers/spreadsheet-parser';
import { useFileStore } from '@/store/file-store';
import { cn } from '@/lib/utils';

export interface SpreadsheetViewerProps {
  file: FileMetadata;
  highlightRow?: number;
}

export function SpreadsheetViewer({ file, highlightRow }: SpreadsheetViewerProps) {
  const [rows, setRows] = useState<Record<string, any>[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterText, setFilterText] = useState('');
  const [sortCol, setSortCol] = useState<string | null>(null);
  const [sortDesc, setSortDesc] = useState(false);
  const parentRef = useRef<HTMLDivElement>(null);

  const { spreadsheetRowCache, cacheSpreadsheetRows } = useFileStore();

  useEffect(() => {
    let isMounted = true;
    async function loadData() {
      setLoading(true);
      // Check cache first
      if (spreadsheetRowCache.has(file.id)) {
        setRows(spreadsheetRowCache.get(file.id)!);
        setLoading(false);
        return;
      }

      // Fetch blob and parse
      const blob = await storage.getFileBlob(file.storageKey);
      if (blob) {
        const buffer = await blob.arrayBuffer();
        const parsed = await parseSpreadsheet(file.id, file.name, buffer, file.type === 'csv');
        const firstSheetName = parsed.sheets[0]?.sheetName || 'Sheet1';
        const parsedRows = parsed.sheetData[firstSheetName] || [];
        if (isMounted) {
          setRows(parsedRows);
          cacheSpreadsheetRows(file.id, parsedRows);
          setLoading(false);
        }
      } else {
        setLoading(false);
      }
    }
    loadData();
    return () => {
      isMounted = false;
    };
  }, [file.id, file.storageKey, file.type, file.name]);

  const columns = useMemo(() => {
    if (file.sheets && file.sheets[0]) {
      return file.sheets[0].columns.map((c) => c.name);
    }
    return rows.length > 0 ? Object.keys(rows[0]) : [];
  }, [file.sheets, rows]);

  // Filtered and sorted rows
  const processedRows = useMemo(() => {
    let result = rows;
    if (filterText.trim()) {
      const q = filterText.toLowerCase();
      result = result.filter((row) =>
        Object.values(row).some((val) => String(val ?? '').toLowerCase().includes(q))
      );
    }

    if (sortCol) {
      result = [...result].sort((a, b) => {
        const valA = a[sortCol];
        const valB = b[sortCol];
        if (valA === valB) return 0;
        if (valA === null || valA === undefined) return 1;
        if (valB === null || valB === undefined) return -1;
        return sortDesc ? (valB > valA ? 1 : -1) : (valA > valB ? 1 : -1);
      });
    }

    return result;
  }, [rows, filterText, sortCol, sortDesc]);

  // Virtualizer for 50,000+ rows
  const rowVirtualizer = useVirtualizer({
    count: processedRows.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 32,
    overscan: 10,
  });

  // Jump to highlighted row if specified
  useEffect(() => {
    if (highlightRow && highlightRow > 0 && highlightRow <= processedRows.length) {
      rowVirtualizer.scrollToIndex(highlightRow - 1, { align: 'center' });
    }
  }, [highlightRow, processedRows.length, rowVirtualizer]);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8 text-xs text-text-muted">
        <div className="w-5 h-5 border-2 border-accent border-t-transparent rounded-full animate-spin mr-2" />
        Loading dataset into virtual grid...
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[560px] border border-border rounded-xl bg-surface overflow-hidden">
      {/* Controls Bar */}
      <div className="flex items-center justify-between p-2 border-b border-border bg-surface-elevated/40">
        <div className="relative flex-1 max-w-xs">
          <Search className="w-3.5 h-3.5 text-text-muted absolute left-2.5 top-2" />
          <input
            type="text"
            placeholder="Filter data..."
            value={filterText}
            onChange={(e) => setFilterText(e.target.value)}
            className="w-full bg-surface border border-border rounded-lg pl-8 pr-3 py-1 text-xs text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent"
          />
        </div>
        <div className="text-[11px] font-mono text-text-muted">
          {processedRows.length.toLocaleString()} rows · {columns.length} columns
        </div>
      </div>

      {/* Virtualized Table */}
      <div ref={parentRef} className="flex-1 overflow-auto">
        <table className="w-full text-left text-xs border-collapse">
          {/* Table Header */}
          <thead className="sticky top-0 bg-surface-elevated text-text-muted border-b border-border z-10">
            <tr>
              <th className="py-2 px-2.5 w-12 font-mono text-[10px] text-center border-r border-border">#</th>
              {columns.map((col) => (
                <th
                  key={col}
                  onClick={() => {
                    if (sortCol === col) {
                      setSortDesc(!sortDesc);
                    } else {
                      setSortCol(col);
                      setSortDesc(false);
                    }
                  }}
                  className="py-2 px-3 font-mono text-[11px] font-semibold text-text-primary whitespace-nowrap cursor-pointer hover:bg-surface-hover select-none"
                >
                  <div className="flex items-center gap-1.5">
                    <span>{col}</span>
                    <ArrowUpDown className="w-3 h-3 text-text-muted" />
                  </div>
                </th>
              ))}
            </tr>
          </thead>

          {/* Virtual Table Body */}
          <tbody
            style={{
              height: `${rowVirtualizer.getTotalSize()}px`,
              position: 'relative',
            }}
          >
            {rowVirtualizer.getVirtualItems().map((virtualRow) => {
              const row = processedRows[virtualRow.index];
              const isHighlighted = highlightRow === virtualRow.index + 1;

              return (
                <tr
                  key={virtualRow.index}
                  className={cn(
                    'absolute w-full flex items-center border-b border-border/60 transition-colors',
                    isHighlighted
                      ? 'bg-accent/15 border-accent text-text-primary'
                      : virtualRow.index % 2 === 0
                      ? 'bg-transparent hover:bg-surface-hover/50'
                      : 'bg-surface-elevated/20 hover:bg-surface-hover/50'
                  )}
                  style={{
                    transform: `translateY(${virtualRow.start}px)`,
                    height: `${virtualRow.size}px`,
                  }}
                >
                  <td className="w-12 text-center text-[10px] font-mono text-text-muted border-r border-border/60 py-1.5 shrink-0">
                    {virtualRow.index + 1}
                  </td>
                  {columns.map((col) => (
                    <td
                      key={col}
                      className="px-3 py-1.5 truncate text-[11px] text-text-secondary font-mono shrink-0"
                      style={{ width: `${Math.max(120, 100 / columns.length)}%` }}
                    >
                      {row[col] !== null && row[col] !== undefined ? String(row[col]) : '—'}
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

