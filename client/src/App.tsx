import React, { useEffect } from 'react';
import { Sidebar } from '@/components/layout/Sidebar';
import { Header } from '@/components/layout/Header';
import { MobileBottomNav } from '@/components/layout/MobileBottomNav';
import { RightContextPanel } from '@/components/layout/RightContextPanel';
import { ChatWorkspace } from '@/components/chat/ChatWorkspace';
import { FileLibrary } from '@/components/files/FileLibrary';
import { InsightsStudio } from '@/components/analytics/InsightsStudio';
import { PrivacyDashboard } from '@/components/privacy/PrivacyDashboard';
import { SettingsView } from '@/components/settings/SettingsModal';
import { CommandPalette } from '@/components/search/CommandPalette';
import { OnboardingModal } from '@/components/onboarding/OnboardingModal';
import { AuthModal } from '@/components/auth/AuthModal';
import { UsageLimitModal } from '@/components/auth/UsageLimitModal';
import { AdminModal } from '@/components/admin/AdminModal';
import { ApiKeyModal } from '@/components/settings/ApiKeyModal';

import { useWorkspaceStore } from '@/store/workspace-store';
import { useFileStore } from '@/store/file-store';
import { useChatStore } from '@/store/chat-store';
import { useSettingsStore } from '@/store/settings-store';
import { useUIStore } from '@/store/ui-store';
import { useAuthStore } from '@/store/auth-store';

export function App() {
  const { loadWorkspaces, activeWorkspaceId } = useWorkspaceStore();
  const { loadFiles } = useFileStore();
  const { loadConversations, createConversation } = useChatStore();
  const { loadSettings } = useSettingsStore();
  const { loadUsers } = useAuthStore();
  const { currentView, setCurrentView, rightPanelOpen, setRightPanelOpen, setCommandPaletteOpen, setOnboardingOpen } = useUIStore();

  // Initialize application data
  useEffect(() => {
    async function init() {
      await loadSettings();
      await loadWorkspaces();
      await loadUsers();
    }
    init();
  }, [loadSettings, loadWorkspaces, loadUsers]);

  // Sync workspace files & chats whenever activeWorkspaceId changes
  useEffect(() => {
    if (activeWorkspaceId) {
      loadFiles(activeWorkspaceId);
      loadConversations(activeWorkspaceId);
    }
  }, [activeWorkspaceId, loadFiles, loadConversations]);

  // Check if first-time user
  useEffect(() => {
    const hasSeenOnboarding = localStorage.getItem('datai_onboarding_completed');
    if (!hasSeenOnboarding) {
      setOnboardingOpen(true);
      localStorage.setItem('datai_onboarding_completed', 'true');
    }
  }, [setOnboardingOpen]);

  // Global Keyboard Shortcuts
  useEffect(() => {
    const handleGlobalShortcuts = (e: KeyboardEvent) => {
      // Cmd+N: New Chat
      if ((e.metaKey || e.ctrlKey) && e.key === 'n') {
        e.preventDefault();
        createConversation(activeWorkspaceId);
        setCurrentView('chat');
      }
      // Cmd+B: Toggle Right Panel
      if ((e.metaKey || e.ctrlKey) && e.key === 'b') {
        e.preventDefault();
        setRightPanelOpen(!rightPanelOpen);
      }
    };
    window.addEventListener('keydown', handleGlobalShortcuts);
    return () => window.removeEventListener('keydown', handleGlobalShortcuts);
  }, [activeWorkspaceId, createConversation, setCurrentView, rightPanelOpen, setRightPanelOpen]);

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-page text-text-primary antialiased">
      {/* Left Collapsible Sidebar */}
      <Sidebar />

      {/* Center Main Stage */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
        <Header />

        <main className="flex-1 flex min-w-0 overflow-hidden relative">
          {currentView === 'chat' && <ChatWorkspace />}
          {currentView === 'files' && <FileLibrary />}
          {currentView === 'insights' && <InsightsStudio />}
          {currentView === 'privacy' && <PrivacyDashboard />}
          {currentView === 'settings' && <SettingsView />}
        </main>

        {/* Mobile Navigation Bar (strictly md:hidden) */}
        <MobileBottomNav />
      </div>

      {/* Right Context & Evidence Panel */}
      <RightContextPanel />

      {/* Global Command Palette (Cmd+K) */}
      <CommandPalette />

      {/* Onboarding Tour */}
      <OnboardingModal />

      {/* User Authentication & Signup Modal */}
      <AuthModal />

      {/* ChatGPT-style AI Query Limit Notification */}
      <UsageLimitModal />

      {/* Super Admin Management Console */}
      <AdminModal />

      {/* Quick Gemini API Key Configuration */}
      <ApiKeyModal />
    </div>
  );
}

export default App;
