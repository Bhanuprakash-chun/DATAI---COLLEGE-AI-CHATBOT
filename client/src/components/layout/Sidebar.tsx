import React, { useState } from 'react';
import {
  MessageSquare,
  FolderOpen,
  BarChart3,
  Shield,
  Settings,
  Plus,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Database,
  FolderPlus,
  X,
} from 'lucide-react';
import { useWorkspaceStore } from '@/store/workspace-store';
import { useChatStore } from '@/store/chat-store';
import { useUIStore, MainView } from '@/store/ui-store';
import { useSettingsStore } from '@/store/settings-store';
import { Button } from '@/components/ui/button';
import { Dialog } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { formatBytes, cn } from '@/lib/utils';

export function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const [showNewWorkspaceDialog, setShowNewWorkspaceDialog] = useState(false);
  const [newWorkspaceName, setNewWorkspaceName] = useState('');

  const { workspaces, activeWorkspaceId, setActiveWorkspace, createWorkspace } = useWorkspaceStore();
  const { conversations, activeConversationId, selectConversation, createConversation, deleteConversation } = useChatStore();
  const { currentView, setCurrentView, mobileSidebarOpen, setMobileSidebarOpen } = useUIStore();
  const { storageUsage, storageQuota } = useSettingsStore();

  const handleCreateWorkspace = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newWorkspaceName.trim()) return;
    await createWorkspace(newWorkspaceName.trim());
    setNewWorkspaceName('');
    setShowNewWorkspaceDialog(false);
  };

  const navItems: { id: MainView; label: string; icon: React.ElementType }[] = [
    { id: 'chat', label: 'Chat Workspace', icon: MessageSquare },
    { id: 'files', label: 'File Library', icon: FolderOpen },
    { id: 'insights', label: 'Analytics & Charts', icon: BarChart3 },
    { id: 'privacy', label: 'Privacy & Storage', icon: Shield },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  const storagePercentage = storageQuota > 0 ? Math.min(100, Math.round((storageUsage / storageQuota) * 100)) : 0;

  return (
    <>
      {/* ========================================================================= */}
      {/* 1. MOBILE & TABLET DRAWER (Strictly < 1024px / lg:hidden)                 */}
      {/* ========================================================================= */}
      {mobileSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-xs z-40 lg:hidden animate-fade-in touch-manipulation"
          onClick={() => setMobileSidebarOpen(false)}
          aria-label="Close menu backdrop"
        />
      )}

      <aside
        className={cn(
          'fixed inset-y-0 left-0 w-80 max-w-[85vw] bg-surface border-r border-border z-50 flex flex-col shadow-2xl transition-transform duration-200 ease-out select-none lg:hidden',
          mobileSidebarOpen ? 'translate-x-0' : '-translate-x-full pointer-events-none'
        )}
      >
        {/* Mobile Drawer Header with Close Button */}
        <div className="flex items-center justify-between h-14 px-4 border-b border-border shrink-0">
          <div className="flex items-center gap-2.5 overflow-hidden">
            <div className="w-8 h-8 rounded-lg bg-surface-elevated border border-accent/40 flex items-center justify-center shrink-0 shadow-subtle">
              <span className="font-extrabold text-accent text-sm tracking-tighter">D</span>
              <span className="font-bold text-secondary text-xs">AI</span>
            </div>
            <div className="flex flex-col truncate">
              <span className="font-bold text-primary text-sm tracking-tight">DatAI</span>
              <span className="text-[10px] text-muted tracking-wider uppercase font-mono">Workspace</span>
            </div>
          </div>

          <Button
            variant="ghost"
            size="icon"
            onClick={() => setMobileSidebarOpen(false)}
            className="text-muted hover:text-primary min-h-[44px] min-w-[44px] rounded-lg -mr-1"
            title="Close navigation"
            aria-label="Close navigation"
          >
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Mobile Workspace Selector */}
        <div className="p-3 border-b border-border shrink-0">
          <div className="flex items-center justify-between mb-1.5 px-1">
            <span className="text-[10px] font-mono uppercase tracking-wider text-muted font-semibold">Workspace</span>
            <button
              onClick={() => setShowNewWorkspaceDialog(true)}
              className="text-muted hover:text-accent p-1 transition-colors"
              title="Create new workspace"
            >
              <FolderPlus className="w-4 h-4" />
            </button>
          </div>
          <select
            value={activeWorkspaceId}
            onChange={(e) => setActiveWorkspace(e.target.value)}
            className="w-full min-h-[40px] bg-surface-elevated hover:bg-surface-hover border border-border rounded-lg px-2.5 py-1.5 text-xs text-primary font-medium focus:outline-none focus:border-accent transition-colors"
          >
            {workspaces.map((ws) => (
              <option key={ws.id} value={ws.id}>
                {ws.name}
              </option>
            ))}
          </select>
        </div>

        {/* Mobile Navigation List */}
        <nav className="p-2 space-y-1 shrink-0">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentView === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  setCurrentView(item.id);
                  setMobileSidebarOpen(false);
                }}
                className={cn(
                  'w-full min-h-[44px] flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-medium transition-all duration-150',
                  isActive
                    ? 'bg-accent-subtle text-accent-text font-semibold border border-accent-border shadow-subtle'
                    : 'text-secondary hover:bg-surface-hover hover:text-primary'
                )}
              >
                <Icon className={cn('w-4 h-4 shrink-0', isActive ? 'text-accent' : 'text-muted')} />
                <span className="truncate">{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Mobile Conversations Section */}
        <div className="flex-1 flex flex-col min-h-0 px-2 pt-3 border-t border-border overflow-hidden">
          <div className="flex items-center justify-between px-2 mb-2 shrink-0">
            <span className="text-[10px] font-mono uppercase tracking-wider text-muted font-semibold">Conversations</span>
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => {
                createConversation(activeWorkspaceId);
                setCurrentView('chat');
                setMobileSidebarOpen(false);
              }}
              className="text-muted hover:text-accent w-7 h-7"
              title="New Conversation"
            >
              <Plus className="w-4 h-4" />
            </Button>
          </div>

          <div className="flex-1 overflow-y-auto space-y-1 pr-1">
            {conversations.length === 0 ? (
              <p className="text-[11px] text-muted px-2 py-4 italic text-center">No chats yet</p>
            ) : (
              conversations.map((conv) => {
                const isSelected = activeConversationId === conv.id;
                return (
                  <div
                    key={conv.id}
                    className={cn(
                      'group flex items-center justify-between px-3 py-2.5 rounded-lg text-xs transition-colors cursor-pointer min-h-[40px]',
                      isSelected
                        ? 'bg-surface-elevated text-primary font-semibold border border-border shadow-subtle'
                        : 'text-secondary hover:bg-surface-hover hover:text-primary'
                    )}
                    onClick={() => {
                      selectConversation(conv.id);
                      setCurrentView('chat');
                      setMobileSidebarOpen(false);
                    }}
                  >
                    <span className="truncate flex-1">{conv.title}</span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteConversation(conv.id);
                      }}
                      className="text-muted hover:text-danger p-1 ml-1"
                      title="Delete conversation"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Mobile Footer */}
        <div className="p-3 border-t border-border space-y-2.5 shrink-0 pb-[max(1rem,env(safe-area-inset-bottom))]">
          <div>
            <div className="flex items-center justify-between text-[11px] font-mono text-muted mb-1 font-medium">
              <span className="flex items-center gap-1.5">
                <Database className="w-3.5 h-3.5 text-accent" />
                Local Storage
              </span>
              <span>{formatBytes(storageUsage)}</span>
            </div>
            <div className="w-full bg-surface-elevated h-1.5 rounded-full overflow-hidden border border-border">
              <div
                className="bg-accent h-full transition-all duration-300"
                style={{ width: `${Math.max(4, storagePercentage)}%` }}
              />
            </div>
          </div>

          <div className="flex items-center justify-between pt-1">
            <span className="text-[11px] font-mono text-muted flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
              DatAI Engine Online
            </span>
          </div>
        </div>
      </aside>

      {/* ========================================================================= */}
      {/* 2. DESKTOP SIDEBAR (Strictly Locked & Unchanged at lg: / 1024px+)          */}
      {/* ========================================================================= */}
      <aside
        className={cn(
          'relative flex-col h-screen bg-surface border-r border-border transition-all duration-200 select-none z-20 shrink-0 hidden lg:flex',
          collapsed ? 'w-16' : 'w-64'
        )}
      >
        {/* Top Header: Exact 56px height for alignment parity */}
        <div className="flex items-center justify-between h-14 px-3.5 border-b border-border">
          <div className="flex items-center gap-2.5 overflow-hidden">
            <div className="w-8 h-8 rounded-lg bg-surface-elevated border border-accent/40 flex items-center justify-center shrink-0 shadow-subtle">
              <span className="font-extrabold text-accent text-sm tracking-tighter">D</span>
              <span className="font-bold text-secondary text-xs">AI</span>
            </div>
            {!collapsed && (
              <div className="flex flex-col truncate">
                <span className="font-bold text-primary text-sm tracking-tight">DatAI</span>
                <span className="text-[10px] text-muted tracking-wider uppercase font-mono">Workspace</span>
              </div>
            )}
          </div>

          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => setCollapsed(!collapsed)}
            className="text-muted hover:text-primary shrink-0"
            title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </Button>
        </div>

        {/* Workspace Selector */}
        {!collapsed && (
          <div className="p-3 border-b border-border">
            <div className="flex items-center justify-between mb-1.5 px-1">
              <span className="text-[10px] font-mono uppercase tracking-wider text-muted font-semibold">Workspace</span>
              <button
                onClick={() => setShowNewWorkspaceDialog(true)}
                className="text-muted hover:text-accent transition-colors"
                title="Create new workspace"
              >
                <FolderPlus className="w-3.5 h-3.5" />
              </button>
            </div>
            <select
              value={activeWorkspaceId}
              onChange={(e) => setActiveWorkspace(e.target.value)}
              className="w-full bg-surface-elevated hover:bg-surface-hover border border-border rounded-lg px-2.5 py-1.5 text-xs text-primary font-medium focus:outline-none focus:border-accent transition-colors"
            >
              {workspaces.map((ws) => (
                <option key={ws.id} value={ws.id}>
                  {ws.name}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Primary Navigation List */}
        <nav className="p-2 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentView === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setCurrentView(item.id)}
                className={cn(
                  'w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition-all duration-150',
                  isActive
                    ? 'bg-accent-subtle text-accent-text font-semibold border border-accent-border shadow-subtle'
                    : 'text-secondary hover:bg-surface-hover hover:text-primary'
                )}
                title={item.label}
              >
                <Icon className={cn('w-4 h-4 shrink-0', isActive ? 'text-accent' : 'text-muted')} />
                {!collapsed && <span className="truncate">{item.label}</span>}
              </button>
            );
          })}
        </nav>

        {/* Conversations Section (When on Chat view) */}
        {!collapsed && currentView === 'chat' && (
          <div className="flex-1 flex flex-col min-h-0 px-2 pt-3 border-t border-border">
            <div className="flex items-center justify-between px-2 mb-2">
              <span className="text-[10px] font-mono uppercase tracking-wider text-muted font-semibold">Conversations</span>
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={() => createConversation(activeWorkspaceId)}
                className="text-muted hover:text-accent w-6 h-6"
                title="New Conversation (Cmd+N)"
              >
                <Plus className="w-3.5 h-3.5" />
              </Button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-0.5 pr-1">
              {conversations.length === 0 ? (
                <p className="text-[11px] text-muted px-2 py-4 italic text-center">No chats yet</p>
              ) : (
                conversations.map((conv) => {
                  const isSelected = activeConversationId === conv.id;
                  return (
                    <div
                      key={conv.id}
                      className={cn(
                        'group flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs transition-colors cursor-pointer',
                        isSelected
                          ? 'bg-surface-elevated text-primary font-semibold border border-border shadow-subtle'
                          : 'text-secondary hover:bg-surface-hover hover:text-primary'
                      )}
                      onClick={() => selectConversation(conv.id)}
                    >
                      <span className="truncate flex-1">{conv.title}</span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteConversation(conv.id);
                        }}
                        className="opacity-0 group-hover:opacity-100 text-muted hover:text-danger p-0.5 transition-opacity"
                        title="Delete conversation"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* Spacer */}
        {(collapsed || currentView !== 'chat') && <div className="flex-1" />}

        {/* Bottom Footer: Storage Meter & Theme Toggle */}
        <div className="p-3 border-t border-border space-y-2.5">
          {!collapsed ? (
            <div>
              <div className="flex items-center justify-between text-[11px] font-mono text-muted mb-1 font-medium">
                <span className="flex items-center gap-1.5">
                  <Database className="w-3.5 h-3.5 text-accent" />
                  Local Storage
                </span>
                <span>{formatBytes(storageUsage)}</span>
              </div>
              <div className="w-full bg-surface-elevated h-1.5 rounded-full overflow-hidden border border-border">
                <div
                  className="bg-accent h-full transition-all duration-300"
                  style={{ width: `${Math.max(4, storagePercentage)}%` }}
                />
              </div>
            </div>
          ) : (
            <div className="flex justify-center" title={`Storage: ${formatBytes(storageUsage)}`}>
              <Database className="w-4 h-4 text-accent" />
            </div>
          )}

          {/* Command Shortcut & Engine Status */}
          <div className="flex items-center justify-between pt-1">
            {!collapsed && (
              <span className="text-[11px] font-mono text-muted flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
                DuckDB Active
              </span>
            )}
            {!collapsed && (
              <span className="text-[10px] font-mono text-muted bg-surface-elevated border border-border px-1.5 py-0.5 rounded">
                ⌘K
              </span>
            )}
          </div>
        </div>
      </aside>

      {/* Shared Create Workspace Modal using universal Dialog */}
      <Dialog
        open={showNewWorkspaceDialog}
        onClose={() => setShowNewWorkspaceDialog(false)}
        title="Create New Workspace"
        description="Organize files and chats into a dedicated local environment."
        maxWidth="sm"
        footer={
          <>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setShowNewWorkspaceDialog(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              onClick={handleCreateWorkspace}
              className="bg-accent text-brand-black hover:bg-accent-hover font-semibold px-4 shadow-xs"
            >
              Create Workspace
            </Button>
          </>
        }
      >
        <form onSubmit={handleCreateWorkspace} className="space-y-3">
          <Input
            autoFocus
            placeholder="Workspace Name (e.g. Q4 Finance, Research)"
            value={newWorkspaceName}
            onChange={(e) => setNewWorkspaceName(e.target.value)}
          />
        </form>
      </Dialog>
    </>
  );
}
