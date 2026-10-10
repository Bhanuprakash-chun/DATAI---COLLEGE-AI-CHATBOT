import React, { useState, useEffect } from 'react';
import { BarChart3, TrendingUp, Sparkles } from 'lucide-react';
import { useWorkspaceStore } from '@/store/workspace-store';
import { useFileStore } from '@/store/file-store';
import { storage } from '@/lib/storage/idb-storage';
import { MessageChart } from '@/types/chat';
import { ChartRenderer } from './ChartRenderer';
import { Card } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { useChatStore } from '@/store/chat-store';
import { useUIStore } from '@/store/ui-store';

export function InsightsStudio() {
  const [charts, setCharts] = useState<MessageChart[]>([]);
  const [loading, setLoading] = useState(true);

  const { activeWorkspaceId } = useWorkspaceStore();
  const { files } = useFileStore();
  const { sendMessage } = useChatStore();
  const { setCurrentView } = useUIStore();

  const workspaceFiles = files.filter((f) => f.workspaceId === activeWorkspaceId);
  const spreadsheetFiles = workspaceFiles.filter((f) => ['xlsx', 'xls', 'csv'].includes(f.type));

  useEffect(() => {
    async function loadSavedCharts() {
      setLoading(true);
      const list = await storage.getCharts(activeWorkspaceId);
      setCharts(list);
      setLoading(false);
    }
    loadSavedCharts();
  }, [activeWorkspaceId]);

  const handleAskQuickInsight = (prompt: string) => {
    setCurrentView('chat');
    sendMessage(prompt, 'AUTO');
  };

  return (
    <div className="flex-1 flex flex-col h-[calc(100vh-3.5rem)] overflow-y-auto p-4 sm:p-6 max-w-6xl mx-auto w-full space-y-6 bg-page pb-[calc(env(safe-area-inset-bottom)+5rem)] md:pb-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-text-primary tracking-tight flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-accent" />
            Insights & Analytics Studio
          </h2>
          <p className="text-xs text-text-muted mt-1">
            Locally generated analytical charts, aggregations, and trends across your tabular data.
          </p>
        </div>
      </div>

      {/* Overview Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="p-4 bg-surface border-border space-y-1">
          <span className="text-[11px] font-mono text-text-muted uppercase">Tabular Files</span>
          <p className="text-2xl font-bold text-text-primary font-mono">{spreadsheetFiles.length}</p>
          <span className="text-[10px] text-accent font-medium">Ready for DuckDB-WASM execution</span>
        </Card>

        <Card className="p-4 bg-surface border-border space-y-1">
          <span className="text-[11px] font-mono text-text-muted uppercase">Total Rows Indexed</span>
          <p className="text-2xl font-bold text-text-primary font-mono">
            {spreadsheetFiles.reduce((acc, f) => acc + (f.rowCount || 0), 0).toLocaleString()}
          </p>
          <span className="text-[10px] text-emerald-500 font-medium">100% computed in browser</span>
        </Card>

        <Card className="p-4 bg-surface border-border space-y-1">
          <span className="text-[11px] font-mono text-text-muted uppercase">Generated Charts</span>
          <p className="text-2xl font-bold text-text-primary font-mono">{charts.length}</p>
          <span className="text-[10px] text-text-secondary font-medium">Interactive visualizations</span>
        </Card>
      </div>

      {/* Suggested Analytics Queries */}
      {spreadsheetFiles.length > 0 && (
        <Card className="p-4 sm:p-5 bg-surface border-border space-y-3">
          <h3 className="text-xs font-semibold text-text-primary uppercase tracking-wider flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-accent" />
            Quick Data Inquiries
          </h3>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => handleAskQuickInsight('What is the total revenue and sum of key metrics?')}
              className="text-xs bg-surface-elevated hover:bg-surface-hover text-text-secondary hover:text-text-primary px-3 py-1.5 rounded-lg border border-border transition-all"
            >
              📊 Total Revenue & Metrics
            </button>
            <button
              onClick={() => handleAskQuickInsight('Which category or region had the highest performance?')}
              className="text-xs bg-surface-elevated hover:bg-surface-hover text-text-secondary hover:text-text-primary px-3 py-1.5 rounded-lg border border-border transition-all"
            >
              🏆 Top Categories & Regions
            </button>
            <button
              onClick={() => handleAskQuickInsight('Create a chart showing distribution or trend over time')}
              className="text-xs bg-surface-elevated hover:bg-surface-hover text-text-secondary hover:text-text-primary px-3 py-1.5 rounded-lg border border-border transition-all"
            >
              📈 Time Series / Trend Chart
            </button>
            <button
              onClick={() => handleAskQuickInsight('Find unusual values or anomalies in this dataset')}
              className="text-xs bg-surface-elevated hover:bg-surface-hover text-text-secondary hover:text-text-primary px-3 py-1.5 rounded-lg border border-border transition-all"
            >
              🔍 Anomaly & Outlier Scan
            </button>
          </div>
        </Card>
      )}

      {/* Charts Gallery */}
      <div className="space-y-3">
        <h3 className="text-xs font-semibold text-text-muted uppercase tracking-wider">
          Workspace Visualizations
        </h3>

        {charts.length === 0 ? (
          <EmptyState
            icon={TrendingUp}
            title="No charts generated yet"
            description="Ask analytical questions like 'Create a chart of monthly sales' or 'Show product distribution' in your chat workspace."
            actionLabel="Go to Chat"
            onAction={() => setCurrentView('chat')}
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {charts.map((chart) => (
              <ChartRenderer key={chart.id} chart={chart} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

