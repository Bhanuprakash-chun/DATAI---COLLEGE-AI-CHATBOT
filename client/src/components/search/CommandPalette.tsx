import React, { useState, useEffect } from 'react';
import { Search, FileText, MessageSquare, Plus, FolderOpen, Shield, BarChart3, Settings } from 'lucide-react';
import { useUIStore } from '@/store/ui-store';
import { useFileStore } from '@/store/file-store';
import { useChatStore } from '@/store/chat-store';
import { useWorkspaceStore } from '@/store/workspace-store';

export function CommandPalette() {
  const { commandPaletteOpen, setCommandPaletteOpen, setCurrentView, openFilePreview } = useUIStore();
  const { files } = useFileStore();
  const { conversations, selectConversation, createConversation } = useChatStore();
  const { activeWorkspaceId } = useWorkspaceStore();
  const [query, setQuery] = useState('');

  // Handle Cmd+K keyboard shortcut
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setCommandPaletteOpen(!commandPaletteOpen);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [commandPaletteOpen, setCommandPaletteOpen]);

  if (!commandPaletteOpen) return null;

  const filteredFiles = files.filter((f) =>
    f.name.toLowerCase().includes(query.toLowerCase())
  );
  const filteredConversations = conversations.filter((c) =>
    c.title.toLowerCase().includes(query.toLowerCase())
  );

  const actions = [
    {
      id: 'new_chat',
      label: 'Start New Conversation',
      icon: Plus,
      run: () => {
        createConversation(activeWorkspaceId);
        setCurrentView('chat');
        setCommandPaletteOpen(false);
      },
    },
    {
      id: 'goto_files',
      label: 'Open File Library',
      icon: FolderOpen,
      run: () => {
        setCurrentView('files');
        setCommandPaletteOpen(false);
      },
    },
    {
      id: 'goto_insights',
      label: 'View Analytics & Charts',
      icon: BarChart3,
      run: () => {
        setCurrentView('insights');
        setCommandPaletteOpen(false);
      },
    },
    {
      id: 'goto_privacy',
      label: 'Open Privacy & Storage Dashboard',
      icon: Shield,
      run: () => {
        setCurrentView('privacy');
        setCommandPaletteOpen(false);
      },
    },
    {
      id: 'goto_settings',
      label: 'Open Settings',
      icon: Settings,
      run: () => {
        setCurrentView('settings');
        setCommandPaletteOpen(false);
      },
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-10 sm:pt-20 p-3 sm:p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 dark:bg-black/80 backdrop-blur-sm animate-fade-in touch-manipulation"
        onClick={() => setCommandPaletteOpen(false)}
      />

      {/* Palette Modal */}
      <div className="relative w-full max-w-xl bg-surface border border-border rounded-2xl shadow-modal overflow-hidden z-10 animate-fade-in">
        <div className="flex items-center gap-3 px-4 border-b border-border bg-surface">
          <Search className="w-4 h-4 text-accent shrink-0" />
          <input
            type="text"
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Type a file name, chat title, or action..."
            className="w-full bg-transparent py-3.5 text-xs text-text-primary placeholder:text-text-muted focus:outline-none"
          />
          <button
            onClick={() => setCommandPaletteOpen(false)}
            className="sm:hidden text-text-muted hover:text-text-primary p-1 min-h-[36px] min-w-[36px] flex items-center justify-center"
            aria-label="Close"
          >
            <span className="text-xs font-semibold">Done</span>
          </button>
          <kbd className="hidden sm:inline font-mono text-[10px] text-text-muted bg-surface-elevated px-2 py-0.5 rounded border border-border shadow-xs">
            ESC
          </kbd>
        </div>

        <div className="max-h-80 overflow-y-auto p-2 space-y-3">
          {/* Quick Actions */}
          <div className="space-y-1">
            <span className="text-[10px] font-mono uppercase tracking-wider text-text-muted px-2">
              Actions
            </span>
            {actions.map((act) => {
              const Icon = act.icon;
              return (
                <button
                  key={act.id}
                  onClick={act.run}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs text-text-secondary hover:text-text-primary hover:bg-surface-elevated text-left transition-colors"
                >
                  <Icon className="w-4 h-4 text-accent shrink-0" />
                  <span>{act.label}</span>
                </button>
              );
            })}
          </div>

          {/* Files */}
          {filteredFiles.length > 0 && (
            <div className="space-y-1 pt-1 border-t border-border">
              <span className="text-[10px] font-mono uppercase tracking-wider text-text-muted px-2">
                Files ({filteredFiles.length})
              </span>
              {filteredFiles.slice(0, 5).map((f) => (
                <button
                  key={f.id}
                  onClick={() => {
                    openFilePreview(f.id);
                    setCommandPaletteOpen(false);
                  }}
                  className="w-full flex items-center justify-between px-3 py-1.5 rounded-lg text-xs text-text-secondary hover:text-text-primary hover:bg-surface-elevated text-left transition-colors"
                >
                  <span className="flex items-center gap-2 truncate">
                    <FileText className="w-3.5 h-3.5 text-text-muted" />
                    <span className="truncate">{f.name}</span>
                  </span>
                  <span className="text-[10px] font-mono text-text-muted">{f.type.toUpperCase()}</span>
                </button>
              ))}
            </div>
          )}

          {/* Conversations */}
          {filteredConversations.length > 0 && (
            <div className="space-y-1 pt-1 border-t border-border">
              <span className="text-[10px] font-mono uppercase tracking-wider text-text-muted px-2">
                Conversations ({filteredConversations.length})
              </span>
              {filteredConversations.slice(0, 5).map((c) => (
                <button
                  key={c.id}
                  onClick={() => {
                    selectConversation(c.id);
                    setCurrentView('chat');
                    setCommandPaletteOpen(false);
                  }}
                  className="w-full flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs text-text-secondary hover:text-text-primary hover:bg-surface-elevated text-left transition-colors truncate"
                >
                  <MessageSquare className="w-3.5 h-3.5 text-text-muted shrink-0" />
                  <span className="truncate">{c.title}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

