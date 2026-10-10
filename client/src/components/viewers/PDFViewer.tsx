import React, { useState, useEffect, useRef } from 'react';
import * as pdfjsLib from 'pdfjs-dist';
import { ChevronLeft, ChevronRight, ZoomIn, ZoomOut } from 'lucide-react';
import { FileMetadata } from '@/types/file';
import { storage } from '@/lib/storage/idb-storage';
import { Button } from '@/components/ui/button';

export interface PDFViewerProps {
  file: FileMetadata;
  targetPage?: number;
}

export function PDFViewer({ file, targetPage }: PDFViewerProps) {
  const [currentPage, setCurrentPage] = useState<number>(targetPage || 1);
  const [totalPages, setTotalPages] = useState<number>(file.pageCount || 1);
  const [scale, setScale] = useState<number>(1.2);
  const [loading, setLoading] = useState<boolean>(true);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const pdfDocRef = useRef<pdfjsLib.PDFDocumentProxy | null>(null);

  // Sync when targetPage changes from citation click
  useEffect(() => {
    if (targetPage && targetPage > 0) {
      setCurrentPage(targetPage);
    }
  }, [targetPage]);

  // Load PDF Document
  useEffect(() => {
    let isMounted = true;
    async function loadPdf() {
      setLoading(true);
      const blob = await storage.getFileBlob(file.storageKey);
      if (!blob) {
        setLoading(false);
        return;
      }
      try {
        const buffer = await blob.arrayBuffer();
        const loadingTask = pdfjsLib.getDocument({ data: buffer });
        const pdf = await loadingTask.promise;
        if (isMounted) {
          pdfDocRef.current = pdf;
          setTotalPages(pdf.numPages);
          setLoading(false);
        }
      } catch (err) {
        console.error('Error loading PDF in viewer:', err);
        if (isMounted) setLoading(false);
      }
    }
    loadPdf();
    return () => {
      isMounted = false;
    };
  }, [file.id, file.storageKey]);

  // Render Page to Canvas
  useEffect(() => {
    if (!pdfDocRef.current || !canvasRef.current) return;

    let renderTask: any = null;
    async function renderPage() {
      try {
        const page = await pdfDocRef.current!.getPage(currentPage);
        const viewport = page.getViewport({ scale });
        const canvas = canvasRef.current!;
        const context = canvas.getContext('2d')!;

        canvas.height = viewport.height;
        canvas.width = viewport.width;

        renderTask = page.render({
          canvasContext: context,
          viewport: viewport,
        });

        await renderTask.promise;
      } catch (err: any) {
        if (err.name !== 'RenderingCancelledException') {
          console.error('PDF page render error:', err);
        }
      }
    }

    renderPage();
    return () => {
      if (renderTask) renderTask.cancel();
    };
  }, [currentPage, scale, loading]);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8 text-xs text-text-muted">
        <div className="w-5 h-5 border-2 border-accent border-t-transparent rounded-full animate-spin mr-2" />
        Rendering PDF document...
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[560px] border border-border rounded-xl bg-surface overflow-hidden">
      {/* Viewer Toolbar */}
      <div className="flex items-center justify-between p-2 border-b border-border bg-surface-elevated/50 text-xs">
        <div className="flex items-center gap-1.5">
          <Button
            variant="ghost"
            size="icon-sm"
            disabled={currentPage <= 1}
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            className="rounded-full text-text-muted hover:text-text-primary"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
          </Button>
          <span className="font-mono text-[11px] text-text-secondary">
            Page {currentPage} of {totalPages}
          </span>
          <Button
            variant="ghost"
            size="icon-sm"
            disabled={currentPage >= totalPages}
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            className="rounded-full text-text-muted hover:text-text-primary"
          >
            <ChevronRight className="w-3.5 h-3.5" />
          </Button>
        </div>

        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => setScale((s) => Math.max(0.7, s - 0.2))}
            className="rounded-full text-text-muted hover:text-text-primary"
            title="Zoom Out"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </Button>
          <span className="font-mono text-[10px] text-text-muted w-10 text-center">
            {Math.round(scale * 100)}%
          </span>
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => setScale((s) => Math.min(2.5, s + 0.2))}
            className="rounded-full text-text-muted hover:text-text-primary"
            title="Zoom In"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>

      {/* PDF Canvas Viewport */}
      <div className="flex-1 overflow-auto p-4 flex justify-center bg-surface-elevated/30">
        <canvas ref={canvasRef} className="shadow-elevated rounded border border-border" />
      </div>
    </div>
  );
}

