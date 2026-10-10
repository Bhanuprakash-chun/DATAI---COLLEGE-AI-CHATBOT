import React, { useState, useRef, useEffect } from 'react';
import {
  ArrowUp,
  Paperclip,
  X,
  FileText,
  Lightbulb,
  Crown,
  Zap,
  Lock,
  Key,
} from 'lucide-react';
import { useChatStore } from '@/store/chat-store';
import { useFileStore } from '@/store/file-store';
import { useSettingsStore } from '@/store/settings-store';
import { useUIStore } from '@/store/ui-store';
import { useAuthStore } from '@/store/auth-store';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export function Composer() {
  const [text, setText] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { isGenerating, sendMessage, selectedFileIdsForChat, toggleFileSelectionForChat, clearFileSelections } = useChatStore();
  const { files, uploadFiles } = useFileStore();
  const { aiMode, apiKey } = useSettingsStore();
  const { setApiKeyModalOpen } = useUIStore();
  const { currentUser, checkCanQuery, openLimitModal, openAuthModal, incrementQueryCount } = useAuthStore();
  const queryPermission = checkCanQuery();

  const selectedFiles = files.filter((f) => selectedFileIdsForChat.includes(f.id));
  const activeFiles = selectedFiles.length > 0 ? selectedFiles : files;

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 180)}px`;
    }
  }, [text]);

  const handleSend = async () => {
    if (!text.trim() || isGenerating) return;

    if (!currentUser) {
      openAuthModal('login');
      return;
    }

    // ChatGPT-style Query limit check
    const permission = checkCanQuery();
    if (!permission.allowed) {
      openLimitModal('user');
      return;
    }

    const queryText = text.trim();
    setText('');
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }

    await incrementQueryCount();
    sendMessage(queryText, aiMode);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey || !e.shiftKey)) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const uploaded = Array.from(e.target.files || []);
    if (uploaded.length > 0) {
      const workspaceId = files[0]?.workspaceId || 'default';
      await uploadFiles(uploaded, workspaceId);
    }
  };

  // Generate dynamic suggestions based on loaded files
  const suggestions: string[] = React.useMemo(() => {
    const list: string[] = [];
    const hasSpreadsheet = activeFiles.some((f) => ['xlsx', 'xls', 'csv'].includes(f.type));
    const hasDoc = activeFiles.some((f) => ['pdf', 'docx', 'txt', 'md'].includes(f.type));

    if (hasSpreadsheet) {
      list.push('Which category had the highest sales?');
      list.push('Create a chart of revenue by region');
      list.push('Show average metrics and top rows');
    }
    if (hasDoc) {
      list.push('Summarize key points in this document');
      list.push('What are the major risks or liabilities mentioned?');
      list.push('Find all obligations and deadlines');
    }
    if (hasSpreadsheet && hasDoc) {
      list.push('Compare findings in the spreadsheet with the report');
    }
    if (list.length === 0) {
      list.push('Upload a spreadsheet or PDF to explore analytics');
    }
    return list.slice(0, 3);
  }, [activeFiles]);

  return (
    <div
      className={cn(
        'relative w-full max-w-3xl mx-auto rounded-2xl sm:rounded-3xl bg-surface/95 backdrop-blur-xl border transition-all duration-200 shadow-elevated overflow-hidden',
        isDragging
          ? 'border-accent bg-accent/10 scale-[1.01]'
          : 'border-border hover:border-border-strong focus-within:border-accent focus-within:ring-2 focus-within:ring-accent/20'
      )}
      onDragOver={(e) => {
        e.preventDefault();
        setIsDragging(true);
      }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={async (e) => {
        e.preventDefault();
        setIsDragging(false);
        const droppedFiles = Array.from(e.dataTransfer.files);
        if (droppedFiles.length > 0) {
          const workspaceId = files[0]?.workspaceId || 'default';
          await uploadFiles(droppedFiles, workspaceId);
        }
      }}
    >
      {/* File Attachment Context Pills */}
      {selectedFiles.length > 0 && (
        <div className="flex flex-wrap items-center gap-1.5 p-3 pb-0 bg-surface-elevated/70 border-b border-border">
          <span className="text-[10px] font-mono text-text-muted uppercase font-semibold">Active Context:</span>
          {selectedFiles.map((file) => (
            <span
              key={file.id}
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-surface border border-border text-xs font-medium text-text-primary shadow-xs"
            >
              <FileText className="w-3 h-3 text-accent" />
              <span className="truncate max-w-[130px]">{file.name}</span>
              <button
                onClick={() => toggleFileSelectionForChat(file.id)}
                className="text-text-muted hover:text-text-primary transition-colors"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}
          <button
            onClick={clearFileSelections}
            className="text-[11px] text-text-muted hover:text-accent ml-1 font-medium transition-colors"
          >
            Clear all
          </button>
        </div>
      )}

      {/* Auth Gate Banner for unauthenticated visitors */}
      {!currentUser && (
        <div className="flex items-center justify-between p-2.5 px-3.5 mb-2 bg-amber-500/10 border border-amber-400/30 rounded-xl text-xs text-amber-900">
          <div className="flex items-center gap-2">
            <Lock className="w-4 h-4 text-amber-600 shrink-0" />
            <span>
              <strong>Sign In Required:</strong> You must sign in or register to use the AI chatbot and analyze files.
            </span>
          </div>
          <div className="flex items-center gap-1.5 shrink-0 ml-2">
            <button
              type="button"
              onClick={() => openAuthModal('login')}
              className="px-2.5 py-1 rounded-lg bg-slate-900 text-white font-medium text-[11px] hover:bg-slate-800 transition-colors shadow-2xs"
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => openAuthModal('signup')}
              className="px-2.5 py-1 rounded-lg bg-amber-500 text-white font-medium text-[11px] hover:bg-amber-600 transition-colors shadow-2xs"
            >
              Sign Up
            </button>
          </div>
        </div>
      )}

      {/* Main Textarea */}
      <div className="p-4 pt-3.5">
        <textarea
          ref={textareaRef}
          rows={1}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={
            !currentUser
              ? 'Please sign in or sign up to use College AI...'
              : activeFiles.length > 0
              ? `Ask anything about ${activeFiles.length} file${activeFiles.length === 1 ? '' : 's'}...`
              : 'Upload files and ask anything...'
          }
          className="w-full bg-transparent text-text-primary placeholder:text-text-muted/60 text-sm leading-relaxed resize-none focus:outline-none max-h-44 font-sans"
        />

        {/* Dynamic Prompt Suggestion Chips */}
        {text.length === 0 && suggestions.length > 0 && (
          <div className="flex flex-wrap gap-1.5 pt-2.5 pb-1">
            {suggestions.map((sug) => (
              <button
                key={sug}
                onClick={() => {
                  if (!currentUser) {
                    openAuthModal('login');
                    return;
                  }
                  setText(sug);
                }}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-surface-elevated hover:bg-surface-hover text-xs font-medium text-text-secondary hover:text-text-primary border border-border transition-all text-left shadow-2xs hover:scale-[1.01]"
              >
                <Lightbulb className="w-3 h-3 text-accent" />
                <span className="truncate max-w-[240px]">{sug}</span>
              </button>
            ))}
          </div>
        )}

        {/* Composer Controls Bar */}
        <div className="flex items-center justify-between pt-2.5 border-t border-border mt-2 gap-2">
          {/* Left: Attachment, Mode Pill, and Quota Indicator */}
          <div className="flex items-center gap-2 flex-wrap min-w-0">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileUpload}
              multiple
              className="hidden"
              accept=".xlsx,.xls,.csv,.pdf,.docx,.txt,.md,.json,image/*"
            />
            <Button
              type="button"
              variant="outline-pill"
              size="sm"
              onClick={() => {
                if (!currentUser) {
                  openAuthModal('login');
                  return;
                }
                fileInputRef.current?.click();
              }}
              className="text-xs gap-1.5 px-3 py-1 text-text-secondary hover:text-text-primary shrink-0"
              title="Attach files (Excel, CSV, PDF, DOCX, TXT, Images)"
            >
              <Paperclip className="w-3.5 h-3.5 text-text-muted" />
              <span>Attach</span>
            </Button>

            {/* Mode Pill Badge */}
            <span className="text-[11px] font-mono text-text-muted px-2.5 py-0.5 rounded-full bg-surface-elevated border border-border font-semibold shrink-0">
              {aiMode}
            </span>

            {/* API Key Quick Button */}
            <button
              type="button"
              onClick={() => setApiKeyModalOpen(true)}
              className="inline-flex items-center gap-1.5 text-[11px] font-mono text-slate-700 hover:text-slate-900 px-2.5 py-0.5 rounded-full bg-surface-elevated hover:bg-slate-100 border border-border hover:border-amber-400 font-semibold transition-colors shrink-0"
              title="Click to view or change Gemini API key"
            >
              <Key className="w-3 h-3 text-amber-500" />
              <span>Key: {apiKey ? 'Active' : 'Set API'}</span>
            </button>

            {/* ChatGPT-style AI Quota / Limit Pill */}
            {currentUser?.role === 'SUPER_ADMIN' ? (
              <span className="inline-flex items-center gap-1.5 text-[11px] font-mono text-amber-800 font-semibold bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200 shadow-2xs shrink-0">
                <Crown className="w-3 h-3 text-amber-600" />
                <span>Super Admin • Unlimited</span>
              </span>
            ) : currentUser?.role === 'ADMIN' ? (
              <span className="inline-flex items-center gap-1.5 text-[11px] font-mono text-blue-700 font-semibold bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-200 shrink-0">
                <span>🛡️ Admin • Unlimited</span>
              </span>
            ) : currentUser ? (
              <button
                type="button"
                onClick={() => queryPermission.remaining <= 0 && openLimitModal('user')}
                className={cn(
                  'inline-flex items-center gap-1 text-[11px] font-mono px-2.5 py-0.5 rounded-full border transition-all shrink-0',
                  queryPermission.remaining <= 0
                    ? 'bg-red-50 text-red-700 border-red-200 animate-pulse cursor-pointer font-bold'
                    : queryPermission.remaining <= 5
                    ? 'bg-amber-50 text-amber-700 border-amber-200'
                    : 'bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200'
                )}
                title="Daily AI queries remaining"
              >
                <Zap className="w-3 h-3 text-amber-500" />
                <span>
                  {queryPermission.remaining}/{queryPermission.limit} left
                </span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => openAuthModal('login')}
                className="inline-flex items-center gap-1.5 text-[11px] font-mono px-3 py-1 rounded-full border border-amber-300 bg-amber-50 text-amber-900 hover:bg-amber-100 transition-all cursor-pointer shadow-2xs shrink-0 font-bold"
                title="Sign in or Sign up to use AI"
              >
                <Lock className="w-3 h-3 text-amber-600" />
                <span>Sign In Required</span>
              </button>
            )}
          </div>

          {/* Right: Send Button */}
          <div className="flex items-center gap-2">
            <span className="hidden sm:inline text-[11px] font-mono text-slate-400">
              ↵ to send
            </span>
            <Button
              variant="ghost"
              size="icon-sm"
              disabled={!text.trim() || isGenerating}
              onClick={handleSend}
              className={cn(
                'rounded-full transition-all duration-150',
                text.trim() && !isGenerating
                  ? 'bg-slate-900 text-white hover:bg-slate-800 shadow-xs'
                  : 'bg-slate-100 text-slate-400 cursor-not-allowed'
              )}
              title="Send question"
            >
              <ArrowUp className="w-4 h-4 font-bold" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

