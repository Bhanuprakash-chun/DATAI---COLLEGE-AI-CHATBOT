import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  Trash2,
  HardDrive,
  Cloud,
} from 'lucide-react';
import { useSettingsStore } from '@/store/settings-store';
import { useFileStore } from '@/store/file-store';
import { useChatStore } from '@/store/chat-store';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Dialog, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { formatBytes, formatDate } from '@/lib/utils';

export function PrivacyDashboard() {
  const {
    storageUsage,
    storageQuota,
    refreshStorageStats,
    auditLogs,
    clearAuditLogs,
    aiMode,
    eraseAllApplicationData,
  } = useSettingsStore();

  const { files } = useFileStore();
  const { conversations } = useChatStore();
  const [selectedAuditLog, setSelectedAuditLog] = useState<any | null>(null);

  useEffect(() => {
    refreshStorageStats();
  }, [refreshStorageStats]);

  const storagePercentage = storageQuota > 0 ? ((storageUsage / storageQuota) * 100).toFixed(1) : '0';
  const remainingStorage = Math.max(0, storageQuota - storageUsage);

  return (
    <div className="flex-1 flex flex-col h-[calc(100vh-3.5rem)] overflow-y-auto p-4 sm:p-6 max-w-5xl mx-auto w-full space-y-6 bg-page pb-[calc(env(safe-area-inset-bottom)+5rem)] md:pb-6">
      {/* Title */}
      <div>
        <h2 className="text-xl sm:text-2xl font-extrabold text-text-primary tracking-tight flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-accent" />
          Privacy & Storage Dashboard
        </h2>
        <p className="text-xs text-text-muted mt-1">
          Complete transparency over local disk allocation, browser sandboxing, and audit logs of cloud requests.
        </p>
      </div>

      {/* Zero-Trust Architecture Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-4 bg-surface border-border space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-text-primary">Browser Sandboxing</span>
            <Badge variant="success">Active</Badge>
          </div>
          <p className="text-[11px] text-text-muted leading-relaxed">
            All files are stored locally in IndexedDB & Origin Private File System (OPFS). No cloud database is required or contacted.
          </p>
        </Card>

        <Card className="p-4 bg-surface border-border space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-text-primary">Cloud AI Mode</span>
            <Badge variant={aiMode === 'ONLINE' ? 'success' : aiMode === 'AUTO' ? 'saffron' : 'outline'}>
              {aiMode}
            </Badge>
          </div>
          <p className="text-[11px] text-text-muted leading-relaxed">
            {aiMode === 'OFFLINE'
              ? '100% offline. Zero requests sent to external servers.'
              : 'Strict Minimum-Data processing: Only extracted snippets (~few KB) are sent when querying Gemini.'}
          </p>
        </Card>

        <Card className="p-4 bg-surface border-border space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-text-primary">Untrusted Content Guard</span>
            <Badge variant="saffron">Enforced</Badge>
          </div>
          <p className="text-[11px] text-text-muted leading-relaxed">
            File content is sandboxed as untrusted data (`SYSTEM &gt; APPLICATION &gt; USER &gt; RETRIEVED DATA`). Prompt injections within files are nullified.
          </p>
        </Card>
      </div>

      {/* Storage Quota Inspector */}
      <Card className="p-5 bg-surface border-border space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <HardDrive className="w-4 h-4 text-accent" />
            <h3 className="text-sm font-semibold text-text-primary">Local Storage Quota & Capacity</h3>
          </div>
          <span className="text-xs font-mono text-text-muted">
            {formatBytes(storageUsage)} used / {formatBytes(storageQuota)} allocated ({storagePercentage}%)
          </span>
        </div>

        <div className="w-full bg-surface-elevated h-2.5 rounded-full overflow-hidden border border-border">
          <div
            className="bg-accent h-full transition-all duration-300"
            style={{ width: `${Math.max(2, parseFloat(storagePercentage))}%` }}
          />
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs pt-1">
          <div className="p-2.5 rounded-lg bg-surface-elevated border border-border">
            <span className="text-text-muted text-[10px] block font-mono">Files Stored</span>
            <span className="font-mono text-text-primary font-semibold">{files.length}</span>
          </div>
          <div className="p-2.5 rounded-lg bg-surface-elevated border border-border">
            <span className="text-text-muted text-[10px] block font-mono">Estimated Free</span>
            <span className="font-mono text-emerald-500 font-semibold">{formatBytes(remainingStorage)}</span>
          </div>
          <div className="p-2.5 rounded-lg bg-surface-elevated border border-border">
            <span className="text-text-muted text-[10px] block font-mono">Conversations</span>
            <span className="font-mono text-text-primary font-semibold">{conversations.length}</span>
          </div>
          <div className="p-2.5 rounded-lg bg-surface-elevated border border-border">
            <span className="text-text-muted text-[10px] block font-mono">Cloud Requests Logged</span>
            <span className="font-mono text-accent font-semibold">{auditLogs.length}</span>
          </div>
        </div>
      </Card>

      {/* Cloud Request Audit Log */}
      <Card className="p-5 bg-surface border-border space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div>
            <h3 className="text-sm font-semibold text-text-primary flex items-center gap-2">
              <Cloud className="w-4 h-4 text-accent" />
              Minimum-Data Cloud Processing Audit Log
            </h3>
            <p className="text-xs text-text-muted mt-0.5">
              Inspect exactly what minimal context was passed to Gemini. Raw files are never transmitted.
            </p>
          </div>

          {auditLogs.length > 0 && (
            <Button variant="ghost" size="sm" onClick={clearAuditLogs} className="text-text-muted hover:text-text-primary">
              Clear Logs
            </Button>
          )}
        </div>

        {auditLogs.length === 0 ? (
          <div className="text-center py-8 text-xs text-text-muted italic bg-surface-elevated/40 rounded-xl border border-border">
            No cloud requests recorded. When in Offline mode, or when running local analytical calculations, zero requests are sent.
          </div>
        ) : (
          <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
            {auditLogs.map((log) => (
              <div
                key={log.id}
                onClick={() => setSelectedAuditLog(log)}
                className="p-3 rounded-lg bg-surface-elevated hover:bg-surface-hover border border-border text-xs flex items-center justify-between cursor-pointer transition-colors"
              >
                <div className="space-y-0.5 truncate max-w-md">
                  <span className="font-medium text-text-primary truncate block">"{log.userPrompt}"</span>
                  <span className="text-[10px] text-text-muted font-mono">
                    Model: {log.model} · ~{log.tokensEstimated} tokens · {log.latencyMs}ms
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-text-muted font-mono">{formatDate(log.timestamp)}</span>
                  <Badge variant={log.status === 'success' ? 'success' : 'danger'} size="sm">
                    {log.status}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Granular Data Sanitizer / Deletion Actions */}
      <Card className="p-5 bg-danger/5 border border-danger/25 space-y-4">
        <div>
          <h3 className="text-sm font-semibold text-danger flex items-center gap-2">
            <Trash2 className="w-4 h-4" />
            Granular Data Sanitizer
          </h3>
          <p className="text-xs text-text-muted mt-0.5">
            Erase local files, chunk indices, or all application state immediately from your browser sandbox.
          </p>
        </div>

        <div className="flex flex-wrap gap-3 pt-1">
          <Button
            variant="danger"
            size="sm"
            onClick={() => {
              if (confirm('Erase all local DatAI files, chats, indices, and settings from this browser?')) {
                eraseAllApplicationData();
              }
            }}
          >
            Factory Reset (Erase All Browser Data)
          </Button>
        </div>
      </Card>

      {/* Audit Log Modal Preview */}
      <Dialog
        open={!!selectedAuditLog}
        onOpenChange={(open) => {
          if (!open) setSelectedAuditLog(null);
        }}
        size="md"
      >
        <DialogHeader>
          <DialogTitle>Transmitted Context Inspection</DialogTitle>
          <DialogDescription>
            Inspect the exact minimal context snippet that was passed to the AI gateway.
          </DialogDescription>
        </DialogHeader>

        {selectedAuditLog && (
          <div className="text-xs space-y-3 py-2">
            <div>
              <span className="text-text-muted block mb-1">User Prompt:</span>
              <p className="text-text-primary font-medium bg-surface-elevated p-2.5 rounded-lg border border-border">
                {selectedAuditLog.userPrompt}
              </p>
            </div>
            <div>
              <span className="text-text-muted block mb-1">Minimal Context Snippet Sent to Gemini:</span>
              <pre className="p-3 bg-surface-elevated rounded-lg text-[11px] font-mono text-text-secondary whitespace-pre-wrap max-h-48 overflow-y-auto border border-border">
                {selectedAuditLog.minimalContextSnippet}
              </pre>
            </div>
          </div>
        )}

        <DialogFooter>
          <Button variant="secondary" size="sm" onClick={() => setSelectedAuditLog(null)}>
            Close
          </Button>
        </DialogFooter>
      </Dialog>
    </div>
  );
}

