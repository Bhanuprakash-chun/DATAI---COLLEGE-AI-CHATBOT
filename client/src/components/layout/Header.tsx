import React, { useState, useRef, useEffect } from 'react';
import {
  Menu,
  Search,
  PanelRight,
  Plus,
  Sparkles,
  Wifi,
  WifiOff,
  Crown,
  User as UserIcon,
  LogOut,
  Shield,
  Settings,
  UserCheck,
  Key,
} from 'lucide-react';
import { useWorkspaceStore } from '@/store/workspace-store';
import { useSettingsStore } from '@/store/settings-store';
import { useUIStore, MainView } from '@/store/ui-store';
import { useChatStore } from '@/store/chat-store';
import { useAuthStore } from '@/store/auth-store';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AIMode } from '@/types/settings';
import { cn } from '@/lib/utils';

export function Header() {
  const { activeWorkspaceId } = useWorkspaceStore();
  const { aiMode, setAiMode, apiKey } = useSettingsStore();
  const {
    currentView,
    setCurrentView,
    rightPanelOpen,
    setRightPanelOpen,
    setCommandPaletteOpen,
    setMobileSidebarOpen,
    setApiKeyModalOpen,
  } = useUIStore();
  const { createConversation } = useChatStore();
  const {
    currentUser,
    isAuthenticated,
    openAuthModal,
    setAdminModalOpen,
    logout,
  } = useAuthStore();

  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setProfileDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const navLinks: { id: MainView; label: string }[] = [
    { id: 'chat', label: 'Workspace' },
    { id: 'files', label: 'File Library' },
    { id: 'insights', label: 'Analytics' },
    { id: 'privacy', label: 'Privacy' },
  ];

  const isSuperAdmin = currentUser?.role === 'SUPER_ADMIN';

  return (
    <header className="h-14 bg-surface/85 backdrop-blur-md border-b border-border flex items-center justify-between px-3 sm:px-6 z-20 transition-colors">
      {/* Left: Mobile Hamburger, Brand Identity & Desktop Nav Links */}
      <div className="flex items-center gap-2 sm:gap-4 lg:gap-6">
        {/* Mobile/Tablet Hamburger Button (< 1024px) */}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setMobileSidebarOpen(true)}
          className="lg:hidden text-text-muted hover:text-text-primary -ml-1 min-h-[44px] min-w-[44px] rounded-lg shrink-0"
          title="Open menu"
          aria-label="Open menu"
        >
          <Menu className="w-5 h-5" />
        </Button>

        <div
          onClick={() => setCurrentView('chat')}
          className="flex items-center gap-2.5 cursor-pointer select-none group"
        >
          <div className="w-8 h-8 rounded-full bg-surface-elevated flex items-center justify-center p-1.5 border border-border group-hover:border-accent/50 transition-colors shadow-xs shrink-0">
            <svg viewBox="0 0 48 48" fill="none" className="w-full h-full">
              <circle cx="24" cy="14" r="5" stroke="currentColor" strokeWidth="4" className="text-text-primary" fill="transparent"/>
              <circle cx="14" cy="31" r="5" stroke="currentColor" strokeWidth="4" className="text-text-primary" fill="transparent"/>
              <circle cx="34" cy="31" r="5" stroke="currentColor" strokeWidth="4" className="text-text-primary" fill="transparent"/>
              <path d="M21.5 18L16.5 27" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" className="text-text-primary"/>
              <path d="M26.5 18L31.5 27" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" className="text-text-primary"/>
              <path d="M19 31H29" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" className="text-text-primary"/>
              <circle cx="24" cy="24" r="2.5" fill="#F59E0B"/>
            </svg>
          </div>
          <span className="font-bold text-base tracking-tight text-text-primary font-sans">
            Dat<span className="text-accent">AI</span>
          </span>
        </div>

        {/* Center/Left Navigation Links */}
        <nav className="hidden md:flex items-center gap-1">
          {navLinks.map((item) => {
            const isActive = currentView === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setCurrentView(item.id)}
                className={cn(
                  'px-3.5 py-1.5 rounded-full text-xs font-medium transition-all duration-150',
                  isActive
                    ? 'text-text-primary font-semibold bg-surface-elevated border border-border shadow-xs'
                    : 'text-text-muted hover:text-text-primary hover:bg-surface-hover'
                )}
              >
                {item.label}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Center: Search Pill (Cmd+K) (Desktop only) */}
      <div className="hidden lg:flex items-center flex-1 max-w-xs mx-6">
        <button
          onClick={() => setCommandPaletteOpen(true)}
          className="w-full flex items-center justify-between px-3.5 py-1.5 rounded-full bg-surface-hover/80 hover:bg-surface-hover border border-border text-xs text-text-muted hover:text-text-primary transition-all shadow-xs"
        >
          <span className="flex items-center gap-2">
            <Search className="w-3.5 h-3.5 text-text-muted" />
            <span className="truncate">Search files & chats...</span>
          </span>
          <kbd className="font-mono text-[10px] bg-surface text-text-muted px-2 py-0.5 rounded-full border border-border shadow-xs">
            ⌘K
          </kbd>
        </button>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-2 sm:gap-2.5">
        {/* AI Mode Selector Pill */}
        <div
          onClick={() => {
            const nextMode: Record<AIMode, AIMode> = {
              AUTO: 'ONLINE',
              ONLINE: 'OFFLINE',
              OFFLINE: 'AUTO',
            };
            setAiMode(nextMode[aiMode]);
          }}
          className="cursor-pointer group flex items-center gap-1.5 sm:gap-2 p-1 pl-2.5 sm:pl-3 bg-surface border border-border rounded-full shadow-xs hover:border-border-strong transition-all select-none min-h-[36px]"
          title={`Click to switch AI mode (Current: ${aiMode})`}
        >
          <span className="text-[11px] font-mono font-semibold text-text-primary">
            {aiMode}
          </span>
          
          <div
            className={cn(
              'w-11 h-6 rounded-full p-0.5 transition-all duration-300 flex items-center relative',
              aiMode === 'ONLINE'
                ? 'bg-emerald-500'
                : aiMode === 'AUTO'
                ? 'bg-accent'
                : 'bg-border-strong'
            )}
          >
            <div
              className={cn(
                'w-5 h-5 rounded-full bg-white shadow-sm transform transition-transform duration-300 flex items-center justify-center',
                aiMode === 'ONLINE'
                  ? 'translate-x-5'
                  : aiMode === 'AUTO'
                  ? 'translate-x-2.5'
                  : 'translate-x-0'
              )}
            >
              {aiMode === 'ONLINE' && <Wifi className="w-2.5 h-2.5 text-emerald-600" />}
              {aiMode === 'AUTO' && <Sparkles className="w-2.5 h-2.5 text-accent-dark" />}
              {aiMode === 'OFFLINE' && <WifiOff className="w-2.5 h-2.5 text-text-muted" />}
            </div>
          </div>
        </div>

        {/* Gemini API Key Quick Status & Changer Button */}
        <button
          type="button"
          onClick={() => setApiKeyModalOpen(true)}
          className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1 bg-surface hover:bg-surface-elevated border border-border hover:border-amber-400 rounded-full shadow-xs transition-all select-none min-h-[36px] group"
          title="Click to view, test, or update your Gemini API key"
        >
          <div className="w-5 h-5 rounded-full bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-600 group-hover:scale-110 transition-transform">
            <Key className="w-3 h-3" />
          </div>
          <span className="hidden sm:inline text-xs font-semibold text-text-primary">
            API Key
          </span>
          <span
            className={cn(
              "w-2 h-2 rounded-full",
              apiKey ? "bg-emerald-500" : "bg-amber-400 animate-pulse"
            )}
            title={apiKey ? "API Key active & configured" : "Configure API Key"}
          />
        </button>

        {/* User Account / Super Admin Pill */}
        <div className="relative" ref={dropdownRef}>
          {isAuthenticated && currentUser ? (
            <button
              onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
              className="flex items-center gap-2 p-1 pr-3 rounded-full bg-surface hover:bg-surface-elevated border border-border hover:border-accent/40 shadow-xs transition-all select-none min-h-[36px]"
              title={`Account: ${currentUser.name} (${currentUser.role})`}
            >
              <div className="w-7 h-7 rounded-full bg-accent/20 border border-accent/40 flex items-center justify-center text-xs font-bold text-accent">
                {currentUser.name.charAt(0).toUpperCase()}
              </div>

              <div className="hidden sm:flex items-center gap-1.5 text-left">
                <span className="text-xs font-bold text-text-primary truncate max-w-[100px]">
                  {currentUser.name}
                </span>
                {isSuperAdmin ? (
                  <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-accent/15 text-accent-dark text-[10px] font-mono font-bold border border-accent/30">
                    <Crown className="w-2.5 h-2.5 text-accent" /> Super Admin
                  </span>
                ) : currentUser.role === 'ADMIN' ? (
                  <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-blue-500/15 text-blue-700 text-[10px] font-mono font-bold border border-blue-500/30">
                    🛡️ Faculty Admin
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-700 text-[10px] font-mono font-medium border border-emerald-500/20">
                    🎓 Student
                  </span>
                )}
              </div>
            </button>
          ) : (
            <div className="flex items-center gap-1.5">
              <Button
                variant="outline"
                size="sm"
                onClick={() => openAuthModal('login')}
                className="text-xs px-2.5 py-1 rounded-full"
              >
                Sign In
              </Button>
              <Button
                variant="primary-pill"
                size="sm"
                onClick={() => openAuthModal('signup')}
                className="text-xs px-3 py-1 font-bold"
              >
                Sign Up
              </Button>
            </div>
          )}

          {/* Profile Dropdown Menu */}
          {profileDropdownOpen && currentUser && (
            <div className="absolute right-0 mt-2 w-64 rounded-2xl bg-surface border border-border shadow-modal p-2 z-50 animate-scale-in text-left">
              {/* User Info Header */}
              <div className="p-3 pb-2.5 border-b border-border mb-1">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-accent/20 border border-accent/40 flex items-center justify-center text-xs font-bold text-accent">
                    {currentUser.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="overflow-hidden">
                    <p className="text-xs font-bold text-text-primary truncate">{currentUser.name}</p>
                    <p className="text-[11px] text-text-muted font-mono truncate">{currentUser.email}</p>
                  </div>
                </div>

                <div className="mt-2">
                  {isSuperAdmin ? (
                    <Badge variant="saffron" size="sm" className="w-full justify-center gap-1">
                      <Crown className="w-3 h-3 text-accent" /> Super Administrator
                    </Badge>
                  ) : currentUser.role === 'ADMIN' ? (
                    <Badge variant="default" size="sm" className="w-full justify-center gap-1 bg-blue-50 text-blue-700 border-blue-200">
                      🛡️ Faculty Administrator
                    </Badge>
                  ) : (
                    <Badge variant="default" size="sm" className="w-full justify-center gap-1 bg-emerald-50 text-emerald-700 border-emerald-200">
                      🎓 Student ({currentUser.institution || 'Verified'})
                    </Badge>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="space-y-0.5 text-xs">
                {(isSuperAdmin || currentUser.role === 'ADMIN') && (
                  <button
                    onClick={() => {
                      setProfileDropdownOpen(false);
                      setAdminModalOpen(true);
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-text-primary hover:bg-surface-elevated font-semibold text-accent transition-colors"
                  >
                    <Crown className="w-4 h-4 text-accent" />
                    <span>{isSuperAdmin ? 'Super Admin Console' : 'Faculty Admin Console'}</span>
                  </button>
                )}

                <button
                  onClick={() => {
                    setProfileDropdownOpen(false);
                    setCurrentView('settings');
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-text-secondary hover:text-text-primary hover:bg-surface-elevated transition-colors"
                >
                  <Settings className="w-4 h-4 text-text-muted" />
                  <span>Workspace Settings</span>
                </button>

                <button
                  onClick={() => {
                    setProfileDropdownOpen(false);
                    openAuthModal('signup');
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-text-secondary hover:text-text-primary hover:bg-surface-elevated transition-colors"
                >
                  <UserCheck className="w-4 h-4 text-text-muted" />
                  <span>Register New Account</span>
                </button>

                <div className="border-t border-border my-1" />

                <button
                  onClick={() => {
                    setProfileDropdownOpen(false);
                    logout();
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-danger hover:bg-danger-subtle font-medium transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Sign Out</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Quick New Chat Button (Tablet & Desktop) */}
        <Button
          variant="primary-pill"
          size="sm"
          onClick={() => {
            createConversation(activeWorkspaceId);
            setCurrentView('chat');
          }}
          className="text-xs px-3.5 gap-1.5 hidden sm:inline-flex min-h-[36px]"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>New Chat</span>
        </Button>

        {/* Right Context Panel Toggle Button */}
        <Button
          variant={rightPanelOpen ? 'secondary' : 'outline'}
          size="icon-sm"
          onClick={() => setRightPanelOpen(!rightPanelOpen)}
          className={cn(
            'rounded-full min-h-[38px] min-w-[38px]',
            rightPanelOpen && 'border-accent text-accent'
          )}
          title="Toggle Context Panel"
          aria-label="Toggle Context Panel"
        >
          <PanelRight className="w-4 h-4" />
        </Button>
      </div>
    </header>
  );
}
