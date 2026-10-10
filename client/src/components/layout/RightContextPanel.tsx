import React from 'react';
import { X, FileText, Table, BarChart2, BookOpen, ExternalLink } from 'lucide-react';
import { useUIStore, RightPanelView } from '@/store/ui-store';
import { useChatStore } from '@/store/chat-store';
import { useFileStore } from '@/store/file-store';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn, formatBytes } from '@/lib/utils';
import { SpreadsheetViewer } from '@/components/viewers/SpreadsheetViewer';
import { PDFViewer } from '@/components/viewers/PDFViewer';
import { DocumentViewer } from '@/components/viewers/DocumentViewer';

export function RightContextPanel() {
  const {
    rightPanelOpen,
    setRightPanelOpen,
    rightPanelView,
    setRightPanelView,
    previewFileId,
    highlightPage,
    highlightRow,
    closeFilePreview,
  } = useUIStore();

  const { messages, activeCitation, setActiveCitation } = useChatStore();
  const { files } = useFileStore();

  if (!rightPanelOpen) return null;

  // Find latest citations from current chat
  const latestAssistantMsg = [...messages].reverse().find((m) => m.role === 'assistant');
  const citations = latestAssistantMsg?.citations || [];
  const chart = latestAssistantMsg?.chart;
  const calculation = latestAssistantMsg?.calculationEvidence;

  // Selected preview file
  const activeFile = files.find((f) => f.id === previewFileId);

  const tabs: { id: RightPanelView; label: string; icon: React.ElementType }[] = [
    { id: 'sources', label: 'Citations', icon: BookOpen },
    { id: 'preview', label: 'Preview', icon: FileText },
    { id: 'schema', label: 'Schema', icon: Table },
    { id: 'chart', label: 'Analytics', icon: BarChart2 },
  ];

  return (
    <>
      {/* Mobile/Tablet Backdrop Overlay */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-xs z-40 lg:hidden animate-fade-in touch-manipulation"
        onClick={() => setRightPanelOpen(false)}
        aria-label="Close context panel backdrop"
      />

      <aside
        className={cn(
          'bg-surface border-border flex flex-col transition-all duration-200 z-50 select-none',
          // Mobile & Tablet: Fixed overlay drawer sliding from right
          'max-lg:fixed max-lg:inset-y-0 max-lg:right-0 max-lg:w-full max-lg:sm:w-96 max-lg:max-w-[92vw] max-lg:border-l max-lg:shadow-2xl',
          // Desktop: Exactly locked docked panel
          'lg:relative lg:w-80 lg:xl:w-96 lg:h-[calc(100vh-3.5rem)] lg:border-l lg:shadow-elevated lg:z-20'
        )}
      >
        {/* Panel Header & Tabs */}
        <div className="flex items-center justify-between px-3 py-2 border-b border-border bg-surface-elevated/50 shrink-0">
          <div className="flex items-center gap-1 overflow-x-auto py-0.5">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = rightPanelView === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setRightPanelView(tab.id)}
                  className={cn(
                    'flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors shrink-0 min-h-[36px]',
                    isActive
                      ? 'bg-accent/15 text-accent-dark font-semibold border border-accent/30'
                      : 'text-text-muted hover:text-text-primary hover:bg-surface-hover'
                  )}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => setRightPanelOpen(false)}
            className="rounded-full text-text-muted hover:text-text-primary shrink-0 min-h-[36px] min-w-[36px]"
            title="Close panel"
            aria-label="Close panel"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>

      {/* Panel Body Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* VIEW 1: Sources / Citations */}
        {rightPanelView === 'sources' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-text-muted">
                Evidence Citations ({citations.length})
              </span>
              <span className="text-[10px] text-accent font-mono">100% Grounded</span>
            </div>

            {citations.length === 0 ? (
              <div className="text-center py-8 text-xs text-text-muted italic">
                No citations referenced in the latest response yet.
              </div>
            ) : (
              citations.map((c, i) => (
                <div
                  key={c.id || i}
                  onClick={() => {
                    setActiveCitation(c);
                    useUIStore.getState().openFilePreview(c.fileId, c.pageNumber, c.rowRange?.[0]);
                  }}
                  className={cn(
                    'p-3 rounded-xl border transition-all cursor-pointer space-y-1.5',
                    activeCitation?.id === c.id
                      ? 'bg-accent/10 border-accent/40 shadow-xs'
                      : 'bg-surface-elevated hover:bg-surface-hover border-border'
                  )}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-text-primary truncate max-w-[200px] flex items-center gap-1.5">
                      <FileText className="w-3.5 h-3.5 text-accent" />
                      {c.fileName}
                    </span>
                    <Badge variant="saffron" size="sm">
                      {c.pageNumber ? `Page ${c.pageNumber}` : c.sheetName ? `${c.sheetName}` : 'Doc Section'}
                    </Badge>
                  </div>

                  <p className="text-xs text-text-secondary leading-relaxed font-serif bg-surface p-2.5 rounded-lg border border-border italic">
                    "{c.exactSnippet}"
                  </p>

                  <div className="flex items-center justify-between pt-1 text-[10px] text-text-muted">
                    <span>
                      {c.rowRange ? `Rows ${c.rowRange[0]}-${c.rowRange[1]}` : c.sectionTitle || 'Direct Match'}
                    </span>
                    <span className="text-accent flex items-center gap-1 hover:underline">
                      Jump to source <ExternalLink className="w-2.5 h-2.5" />
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* VIEW 2: File Preview */}
        {rightPanelView === 'preview' && (
          <div className="h-full flex flex-col space-y-3">
            {activeFile ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-border">
                  <div>
                    <h3 className="text-xs font-semibold text-text-primary truncate max-w-[240px]">{activeFile.name}</h3>
                    <p className="text-[10px] text-text-muted">
                      {formatBytes(activeFile.size)} · {activeFile.type.toUpperCase()}
                      {activeFile.pageCount ? ` · ${activeFile.pageCount} pages` : ''}
                      {activeFile.rowCount ? ` · ${activeFile.rowCount.toLocaleString()} rows` : ''}
                    </p>
                  </div>
                  <Button variant="ghost" size="sm" onClick={closeFilePreview} className="text-xs text-text-muted hover:text-text-primary">
                    Close
                  </Button>
                </div>

                {activeFile.type === 'pdf' && (
                  <PDFViewer file={activeFile} targetPage={highlightPage || undefined} />
                )}
                {(activeFile.type === 'csv' || activeFile.type === 'xlsx' || activeFile.type === 'xls') && (
                  <SpreadsheetViewer file={activeFile} highlightRow={highlightRow || undefined} />
                )}
                {['docx', 'txt', 'md', 'json'].includes(activeFile.type) && (
                  <DocumentViewer file={activeFile} />
                )}
              </div>
            ) : (
              <div className="text-center py-12 text-xs text-text-muted space-y-2">
                <BookOpen className="w-8 h-8 mx-auto text-text-muted/40" />
                <p>Click on any citation or file in your workspace to preview it here with highlights.</p>
              </div>
            )}
          </div>
        )}

        {/* VIEW 3: Data Schema & Profiling */}
        {rightPanelView === 'schema' && (
          <div className="space-y-4">
            <span className="text-xs font-semibold uppercase tracking-wider text-text-muted">
              Tabular Schema & Profiling
            </span>

            {files.filter((f) => f.sheets && f.sheets.length > 0).length === 0 ? (
              <div className="text-center py-8 text-xs text-text-muted italic">
                No spreadsheet or CSV files loaded in this workspace.
              </div>
            ) : (
              files
                .filter((f) => f.sheets && f.sheets.length > 0)
                .map((file) => (
                  <div key={file.id} className="bg-surface-elevated rounded-xl border border-border p-3 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-text-primary truncate">{file.name}</span>
                      <Badge variant="outline">{file.rowCount?.toLocaleString()} rows</Badge>
                    </div>

                    {file.sheets?.map((sheet) => (
                      <div key={sheet.sheetName} className="space-y-2 pt-1">
                        <span className="text-[11px] font-mono text-accent">Sheet: {sheet.sheetName}</span>
                        <div className="space-y-1.5 max-h-60 overflow-y-auto pr-1">
                          {sheet.columns.map((col) => (
                            <div
                              key={col.name}
                              className="text-[11px] bg-surface p-2 rounded-lg border border-border space-y-1"
                            >
                              <div className="flex items-center justify-between">
                                <span className="font-mono text-text-primary font-medium">{col.name}</span>
                                <Badge variant="saffron" size="sm">{col.type}</Badge>
                              </div>
                              <div className="text-[10px] text-text-muted flex flex-wrap gap-x-2">
                                <span>Unique: {col.uniqueCount}</span>
                                <span>Nulls: {col.nullCount}</span>
                                {col.min !== undefined && <span>Min: {col.min}</span>}
                                {col.max !== undefined && <span>Max: {col.max}</span>}
                                {col.mean !== undefined && <span>Mean: {col.mean}</span>}
                                {col.sum !== undefined && <span>Sum: {col.sum}</span>}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                ))
            )}
          </div>
        )}

        {/* VIEW 4: Chart Details & Calculation */}
        {rightPanelView === 'chart' && (
          <div className="space-y-4">
            <span className="text-xs font-semibold uppercase tracking-wider text-text-muted">
              Calculation & Analytical Metrics
            </span>

            {calculation ? (
              <div className="bg-surface-elevated rounded-xl border border-border p-3 space-y-2 text-xs">
                <span className="font-mono text-[10px] uppercase text-accent font-semibold">Formula Verified</span>
                <div className="p-2.5 bg-surface rounded-lg font-mono text-xs text-text-primary border border-border">
                  {calculation.formula || calculation.sqlQuery}
                </div>
                <div className="grid grid-cols-2 gap-2 text-[11px] pt-1">
                  <div>
                    <span className="text-text-muted">Rows Analyzed:</span>
                    <p className="font-mono text-text-primary font-medium">{calculation.rowsAnalyzed.toLocaleString()}</p>
                  </div>
                  <div>
                    <span className="text-text-muted">Calculated Value:</span>
                    <p className="font-mono text-accent font-bold">{calculation.calculatedValue}</p>
                  </div>
                </div>
              </div>
            ) : null}

            {chart ? (
              <div className="bg-surface-elevated rounded-xl border border-border p-3 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-text-primary">{chart.title}</span>
                  <Badge variant="saffron">{chart.type.toUpperCase()}</Badge>
                </div>
                <p className="text-[11px] text-text-muted">{chart.description}</p>
                <div className="text-[11px] font-mono text-text-secondary">
                  Data points: {chart.data.length}
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-xs text-text-muted italic">
                Ask an analytical question (e.g. "Create a revenue chart" or "Top products") to see calculations and chart metrics.
              </div>
            )}
          </div>
        )}
      </div>
    </aside>
    </>
  );
}

