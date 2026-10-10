import React, { useState, useEffect } from 'react';
import { FileMetadata } from '@/types/file';
import { storage } from '@/lib/storage/idb-storage';

export interface DocumentViewerProps {
  file: FileMetadata;
}

export function DocumentViewer({ file }: DocumentViewerProps) {
  const [content, setContent] = useState<string>('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    async function loadContent() {
      setLoading(true);
      const chunks = await storage.getChunksByFile(file.id);
      if (chunks.length > 0) {
        const full = chunks.map((c) => c.text).join('\n\n');
        if (isMounted) {
          setContent(full);
          setLoading(false);
        }
      } else {
        const blob = await storage.getFileBlob(file.storageKey);
        if (blob) {
          const text = await blob.text();
          if (isMounted) {
            setContent(text);
            setLoading(false);
          }
        } else {
          setLoading(false);
        }
      }
    }
    loadContent();
    return () => {
      isMounted = false;
    };
  }, [file.id, file.storageKey]);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8 text-xs text-text-muted">
        <div className="w-5 h-5 border-2 border-accent border-t-transparent rounded-full animate-spin mr-2" />
        Loading document content...
      </div>
    );
  }

  const lines = content.split('\n');

  return (
    <div className="flex flex-col h-[560px] border border-border rounded-xl bg-surface overflow-hidden">
      <div className="flex items-center justify-between p-2.5 border-b border-border bg-surface-elevated/50 text-xs">
        <span className="font-mono text-text-secondary">{file.name}</span>
        <span className="font-mono text-[10px] text-text-muted">{lines.length} lines</span>
      </div>

      <div className="flex-1 overflow-auto p-4 font-mono text-xs text-text-secondary leading-relaxed select-text space-y-1 bg-surface">
        {lines.map((line, idx) => (
          <div key={idx} className="flex gap-3 hover:bg-surface-hover/50 rounded px-1">
            <span className="text-[10px] text-text-muted/60 select-none w-8 text-right shrink-0">
              {idx + 1}
            </span>
            <span className="break-all whitespace-pre-wrap">{line}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

