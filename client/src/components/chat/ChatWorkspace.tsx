import React, { useRef, useEffect } from 'react';
import { Sparkles, UploadCloud, FileSpreadsheet, FileText, ShieldCheck, Database, Zap } from 'lucide-react';
import { useChatStore } from '@/store/chat-store';
import { useFileStore } from '@/store/file-store';
import { useWorkspaceStore } from '@/store/workspace-store';
import { useAuthStore } from '@/store/auth-store';
import { MessageCard } from './MessageCard';
import { Composer } from './Composer';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

export function ChatWorkspace() {
  const { messages, isGenerating } = useChatStore();
  const { files, uploadFiles } = useFileStore();
  const { activeWorkspaceId } = useWorkspaceStore();
  const { currentUser, openAuthModal } = useAuthStore();
  const scrollEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll on new tokens
  useEffect(() => {
    scrollEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isGenerating]);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(e.target.files || []);
    if (selected.length > 0) {
      await uploadFiles(selected, activeWorkspaceId);
    }
  };

  return (
    <div className="flex-1 flex flex-col h-[calc(100vh-3.5rem)] overflow-hidden bg-page relative">
      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto px-4 py-6 z-10">
        {messages.length === 0 ? (
          <div className="max-w-4xl mx-auto my-auto text-center pt-8 pb-8 flex flex-col items-center justify-between min-h-[75vh]">
            {/* Hidden file input for quick hero upload */}
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileSelect}
              multiple
              className="hidden"
              accept=".xlsx,.xls,.csv,.pdf,.docx,.txt,.md,.json,image/*"
            />

            <div />

            {/* Center Hero Section */}
            <div className="space-y-6 max-w-2xl px-4 animate-fade-in text-center">
              {/* Badge */}
              <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full text-xs font-semibold bg-accent/15 text-accent-dark border border-accent/30 shadow-xs">
                <Sparkles className="w-3.5 h-3.5 text-accent" />
                <span>Next-Level File Intelligence</span>
              </div>

              {/* Main Typography Title */}
              <h1 className="text-2xl sm:text-4xl md:text-5xl lg:text-6xl font-extrabold text-text-primary tracking-tight leading-[1.15] font-sans">
                Your files, understood <br />
                <span className="text-accent">with verifiable evidence.</span>
              </h1>

              {/* Subtitle */}
              <p className="text-sm sm:text-base text-text-secondary max-w-lg mx-auto font-medium leading-relaxed">
                Analyze complex spreadsheets, inspect documents, and calculate exact aggregations with local DuckDB and zero-trust privacy.
              </p>

              {/* Primary CTA Button */}
              <div className="pt-2">
                <Button
                  variant="primary-pill"
                  size="lg"
                  onClick={() => {
                    if (!currentUser) {
                      openAuthModal('login');
                      return;
                    }
                    fileInputRef.current?.click();
                  }}
                  className="px-8 py-3 text-sm font-semibold tracking-wide gap-2.5 transition-transform hover:scale-105 active:scale-95 shadow-md"
                >
                  <UploadCloud className="w-4 h-4" />
                  <span>{currentUser ? 'Upload Files to Analyze' : 'Sign In to Start Analyzing Files'}</span>
                </Button>
              </div>

              {/* Subtle Quick Capability Tags */}
              <div className="flex flex-wrap items-center justify-center gap-2 pt-2 text-xs text-text-muted">
                <span className="inline-flex items-center gap-1.5 bg-surface border border-border px-3 py-1 rounded-full shadow-xs">
                  <FileSpreadsheet className="w-3.5 h-3.5 text-accent" /> Excel & CSV (.xlsx, .csv)
                </span>
                <span className="inline-flex items-center gap-1.5 bg-surface border border-border px-3 py-1 rounded-full shadow-xs">
                  <FileText className="w-3.5 h-3.5 text-text-primary" /> PDFs & Documents (.pdf, .docx, .md)
                </span>
                <span className="inline-flex items-center gap-1.5 bg-surface border border-border px-3 py-1 rounded-full shadow-xs">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" /> 100% In-Browser Privacy
                </span>
              </div>
            </div>

            {/* Feature Cards Grid */}
            <div className="w-full max-w-3xl pt-8 grid grid-cols-1 sm:grid-cols-3 gap-3.5 px-2">
              <Card className="text-left bg-surface/70 backdrop-blur-sm border-border hover:border-border-strong transition-all">
                <CardHeader className="p-4 pb-2">
                  <div className="w-8 h-8 rounded-lg bg-surface-elevated border border-border flex items-center justify-center mb-2">
                    <Database className="w-4 h-4 text-accent" />
                  </div>
                  <CardTitle className="text-xs font-semibold text-text-primary">DuckDB Analytical Core</CardTitle>
                </CardHeader>
                <CardDescription className="px-4 pb-4 text-[11px] text-text-muted leading-relaxed">
                  Fast column aggregations, group-by sums, and statistical summaries executed directly inside browser WASM.
                </CardDescription>
              </Card>

              <Card className="text-left bg-surface/70 backdrop-blur-sm border-border hover:border-border-strong transition-all">
                <CardHeader className="p-4 pb-2">
                  <div className="w-8 h-8 rounded-lg bg-surface-elevated border border-border flex items-center justify-center mb-2">
                    <Zap className="w-4 h-4 text-accent" />
                  </div>
                  <CardTitle className="text-xs font-semibold text-text-primary">Verifiable Citations</CardTitle>
                </CardHeader>
                <CardDescription className="px-4 pb-4 text-[11px] text-text-muted leading-relaxed">
                  Inspect exact document snippets, page numbers, and table cell references with interactive evidence popups.
                </CardDescription>
              </Card>

              <Card className="text-left bg-surface/70 backdrop-blur-sm border-border hover:border-border-strong transition-all">
                <CardHeader className="p-4 pb-2">
                  <div className="w-8 h-8 rounded-lg bg-surface-elevated border border-border flex items-center justify-center mb-2">
                    <ShieldCheck className="w-4 h-4 text-emerald-500" />
                  </div>
                  <CardTitle className="text-xs font-semibold text-text-primary">Local Storage First</CardTitle>
                </CardHeader>
                <CardDescription className="px-4 pb-4 text-[11px] text-text-muted leading-relaxed">
                  Persistent IndexedDB and OPFS storage ensures your sensitive files remain strictly on your local machine.
                </CardDescription>
              </Card>
            </div>
          </div>
        ) : (
          <div className="space-y-4 max-w-3xl mx-auto">
            {messages.map((message) => (
              <MessageCard key={message.id} message={message} />
            ))}
            <div ref={scrollEndRef} />
          </div>
        )}
      </div>

      {/* Floating Composer Container */}
      <div className="p-3 sm:p-4 pt-1 bg-gradient-to-t from-page via-page/90 to-transparent z-20 pb-[max(0.75rem,calc(env(safe-area-inset-bottom)+4.25rem))] md:pb-4">
        <Composer />
      </div>
    </div>
  );
}

