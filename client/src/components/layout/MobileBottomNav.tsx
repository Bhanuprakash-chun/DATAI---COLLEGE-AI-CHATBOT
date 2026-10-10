import React from 'react';
import { MessageSquare, FolderOpen, Search, BarChart3, Settings } from 'lucide-react';
import { useUIStore, MainView } from '@/store/ui-store';
import { cn } from '@/lib/utils';

export function MobileBottomNav() {
  const { currentView, setCurrentView, setCommandPaletteOpen } = useUIStore();

  const navItems = [
    {
      id: 'chat' as MainView,
      label: 'Chats',
      icon: MessageSquare,
      onClick: () => setCurrentView('chat'),
      isActive: currentView === 'chat',
    },
    {
      id: 'files' as MainView,
      label: 'Files',
      icon: FolderOpen,
      onClick: () => setCurrentView('files'),
      isActive: currentView === 'files',
    },
    {
      id: 'search' as const,
      label: 'Search',
      icon: Search,
      onClick: () => setCommandPaletteOpen(true),
      isActive: false,
    },
    {
      id: 'insights' as MainView,
      label: 'Analytics',
      icon: BarChart3,
      onClick: () => setCurrentView('insights'),
      isActive: currentView === 'insights',
    },
    {
      id: 'settings' as MainView,
      label: 'Settings',
      icon: Settings,
      onClick: () => setCurrentView('settings'),
      isActive: currentView === 'settings',
    },
  ];

  return (
    <nav
      className="md:hidden fixed bottom-0 inset-x-0 z-30 bg-surface/95 backdrop-blur-xl border-t border-border flex items-center justify-around px-2 pt-1 pb-[max(0.35rem,env(safe-area-inset-bottom))] shadow-lg select-none"
      role="navigation"
      aria-label="Mobile navigation"
    >
      {navItems.map((item) => {
        const Icon = item.icon;
        return (
          <button
            key={item.id}
            onClick={item.onClick}
            className={cn(
              'flex-1 flex flex-col items-center justify-center py-1 min-h-[44px] min-w-[44px] rounded-xl transition-all duration-150 active:scale-95 touch-manipulation',
              item.isActive
                ? 'text-accent font-semibold'
                : 'text-text-muted hover:text-text-primary'
            )}
            aria-label={item.label}
            aria-current={item.isActive ? 'page' : undefined}
          >
            <div
              className={cn(
                'relative flex items-center justify-center w-8 h-7 rounded-full transition-all',
                item.isActive && 'bg-accent/15'
              )}
            >
              <Icon className="w-5 h-5 shrink-0" />
            </div>
            <span className="text-[10px] tracking-tight mt-0.5 leading-none">
              {item.label}
            </span>
          </button>
        );
      })}
    </nav>
  );
}
