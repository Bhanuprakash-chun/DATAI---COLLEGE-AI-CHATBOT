import React, { useRef, useState } from 'react';
import {
  UploadCloud,
  FileText,
  FileCode,
  Image,
  Trash2,
  ExternalLink,
  MessageSquare,
  FileSpreadsheet,
} from 'lucide-react';
import { useFileStore } from '@/store/file-store';
import { useWorkspaceStore } from '@/store/workspace-store';
import { useUIStore } from '@/store/ui-store';
import { useChatStore } from '@/store/chat-store';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { SearchInput } from '@/components/ui/search-input';
import { EmptyState } from '@/components/ui/empty-state';
import { FileMetadata, SupportedFileType } from '@/types/file';
import { formatBytes, formatDate } from '@/lib/utils';
import { cn } from '@/lib/utils';

export function FileLibrary() {
  const [filterQuery, setFilterQuery] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { files, uploadFiles, deleteFile, uploadQueue } = useFileStore();
  const { activeWorkspaceId } = useWorkspaceStore();
  const { openFilePreview, setCurrentView } = useUIStore();
  const { toggleFileSelectionForChat } = useChatStore();

  const workspaceFiles = files.filter((f) => f.workspaceId === activeWorkspaceId);

  const filteredFiles = workspaceFiles.filter((f) =>
    f.name.toLowerCase().includes(filterQuery.toLowerCase())
  );

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const droppedFiles = Array.from(e.dataTransfer.files);
    if (droppedFiles.length > 0) {
      await uploadFiles(droppedFiles, activeWorkspaceId);
    }
  };

  const handleFileInput = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(e.target.files || []);
    if (selected.length > 0) {
      await uploadFiles(selected, activeWorkspaceId);
    }
  };

  const getFileIcon = (type: SupportedFileType) => {
    switch (type) {
      case 'xlsx':
      case 'xls':
      case 'csv':
        return <FileSpreadsheet className="w-5 h-5 text-accent" />;
      case 'pdf':
        return <FileText className="w-5 h-5 text-rose-500" />;
      case 'docx':
        return <FileText className="w-5 h-5 text-blue-500" />;
      case 'image':
        return <Image className="w-5 h-5 text-emerald-500" />;
      default:
        return <FileCode className="w-5 h-5 text-text-muted" />;
    }
  };

  const handleAskAIAboutFile = (file: FileMetadata) => {
    toggleFileSelectionForChat(file.id);
    setCurrentView('chat');
  };

  return (
    <div className="flex-1 flex flex-col h-[calc(100vh-3.5rem)] overflow-y-auto p-4 sm:p-6 max-w-6xl mx-auto w-full space-y-6 bg-page pb-[calc(env(safe-area-inset-bottom)+5rem)] md:pb-6">
      {/* Header Bar */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-text-primary tracking-tight">File Library</h2>
          <p className="text-xs text-text-muted mt-1">
            Files are indexed and stored locally in your browser sandbox. Nothing is transmitted without your explicit question.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileInput}
            multiple
            className="hidden"
            accept=".xlsx,.xls,.csv,.pdf,.docx,.txt,.md,.json,image/*"
          />
          <Button
            variant="primary-pill"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            className="gap-2 px-4"
          >
            <UploadCloud className="w-4 h-4" />
            Upload Files
          </Button>
        </div>
      </div>

      {/* Drag & Drop Upload Hero Area */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={cn(
          'p-8 sm:p-10 rounded-2xl sm:rounded-3xl border-2 border-dashed transition-all duration-200 cursor-pointer flex flex-col items-center justify-center text-center space-y-3',
          isDragging
            ? 'border-accent bg-accent/10 scale-[1.01]'
            : 'border-border hover:border-accent/60 bg-surface/60 hover:bg-surface-elevated/80 shadow-xs'
        )}
      >
        <div className="w-12 h-12 rounded-2xl bg-surface-elevated border border-border flex items-center justify-center text-accent shadow-xs">
          <UploadCloud className="w-6 h-6 text-accent" />
        </div>
        <div>
          <p className="text-sm sm:text-base font-bold text-text-primary">Drag & drop files here, or click to browse</p>
          <p className="text-xs text-text-muted mt-1">
            Supports Excel (.xlsx, .xls), CSV, PDF, DOCX, TXT, Markdown, JSON, and Images
          </p>
        </div>
        <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
          <Badge variant="saffron">Browser-Local Indexing</Badge>
          <Badge variant="outline">Zero-Trust Protected</Badge>
          <Badge variant="ice">DuckDB Ready</Badge>
        </div>
      </div>

      {/* Upload Queue Progress */}
      {uploadQueue.length > 0 && (
        <div className="space-y-2">
          <span className="text-xs font-semibold text-text-muted uppercase tracking-wider font-mono">
            Processing Queue ({uploadQueue.length})
          </span>
          <div className="space-y-2">
            {uploadQueue.map((item) => (
              <div
                key={item.id}
                className="p-3.5 rounded-xl bg-surface border border-border shadow-xs space-y-2"
              >
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-text-primary truncate max-w-sm">{item.name}</span>
                  <span className="font-mono text-[11px] text-accent capitalize font-semibold">
                    {item.status}... {item.progress}%
                  </span>
                </div>
                <div className="w-full bg-surface-hover h-1.5 rounded-full overflow-hidden">
                  <div
                    className="bg-accent h-full transition-all duration-300"
                    style={{ width: `${item.progress}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Files List Search Bar */}
      <div className="flex items-center justify-between pt-2 gap-4 flex-wrap">
        <div className="max-w-xs w-full">
          <SearchInput
            placeholder="Search uploaded files..."
            value={filterQuery}
            onChange={(e) => setFilterQuery(e.target.value)}
            onClear={() => setFilterQuery('')}
            size="sm"
          />
        </div>
        <span className="text-xs font-mono text-text-muted font-semibold">
          Total: {filteredFiles.length} files
        </span>
      </div>

      {/* File Cards Grid */}
      {filteredFiles.length === 0 ? (
        <EmptyState
          icon={FileText}
          title="No files found"
          description={filterQuery ? 'No files match your search query.' : 'Upload documents, spreadsheets, or data files to begin asking questions.'}
          actionLabel="Upload Files"
          onAction={() => fileInputRef.current?.click()}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredFiles.map((file) => (
            <Card
              key={file.id}
              className="p-4 sm:p-5 flex flex-col justify-between space-y-4 hover:border-border-strong transition-all shadow-subtle group"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-3 overflow-hidden">
                  <div className="p-2.5 rounded-xl bg-surface-elevated border border-border shrink-0">
                    {getFileIcon(file.type)}
                  </div>
                  <div className="truncate">
                    <h4 className="text-sm font-bold text-text-primary truncate" title={file.name}>
                      {file.name}
                    </h4>
                    <p className="text-[11px] text-text-muted font-mono mt-0.5">
                      {formatBytes(file.size)} · {formatDate(file.createdAt)}
                    </p>
                  </div>
                </div>

                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => deleteFile(file.id)}
                  className="rounded-full text-text-muted hover:text-danger opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
                  title="Delete file"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </Button>
              </div>

              {/* Metadata Badges */}
              <div className="flex flex-wrap gap-1.5 text-[11px]">
                <Badge variant="outline">{file.type.toUpperCase()}</Badge>
                {file.rowCount !== undefined && (
                  <Badge variant="ice">{file.rowCount.toLocaleString()} rows</Badge>
                )}
                {file.pageCount !== undefined && (
                  <Badge variant="lavender">{file.pageCount} pages</Badge>
                )}
                {file.chunkCount > 0 && (
                  <Badge variant="saffron">{file.chunkCount} chunks</Badge>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-between pt-3 border-t border-border">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => openFilePreview(file.id)}
                  className="text-xs gap-1.5"
                >
                  <ExternalLink className="w-3 h-3 text-text-muted" />
                  Preview
                </Button>

                <Button
                  variant="accent"
                  size="sm"
                  onClick={() => handleAskAIAboutFile(file)}
                  className="text-xs gap-1.5"
                >
                  <MessageSquare className="w-3 h-3" />
                  Ask AI
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

