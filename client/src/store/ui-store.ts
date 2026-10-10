import { create } from 'zustand';

export type MainView = 'chat' | 'files' | 'insights' | 'privacy' | 'settings';
export type RightPanelView = 'sources' | 'preview' | 'schema' | 'chart';

interface UIState {
  currentView: MainView;
  rightPanelOpen: boolean;
  rightPanelView: RightPanelView;
  commandPaletteOpen: boolean;
  onboardingOpen: boolean;
  apiKeyModalOpen: boolean;
  previewFileId: string | null;
  highlightPage: number | null;
  highlightRow: number | null;
  mobileSidebarOpen: boolean;
  setCurrentView: (view: MainView) => void;
  setRightPanelOpen: (open: boolean) => void;
  setRightPanelView: (view: RightPanelView) => void;
  setCommandPaletteOpen: (open: boolean) => void;
  setOnboardingOpen: (open: boolean) => void;
  setApiKeyModalOpen: (open: boolean) => void;
  setMobileSidebarOpen: (open: boolean) => void;
  openFilePreview: (fileId: string, page?: number, row?: number) => void;
  closeFilePreview: () => void;
}

export const useUIStore = create<UIState>((set) => ({
  currentView: 'chat',
  rightPanelOpen: false,
  rightPanelView: 'sources',
  commandPaletteOpen: false,
  onboardingOpen: false,
  apiKeyModalOpen: false,
  mobileSidebarOpen: false,
  previewFileId: null,
  highlightPage: null,
  highlightRow: null,

  setCurrentView: (view) => set({ currentView: view }),
  setRightPanelOpen: (open) => set({ rightPanelOpen: open }),
  setRightPanelView: (view) => set({ rightPanelView: view }),
  setCommandPaletteOpen: (open) => set({ commandPaletteOpen: open }),
  setOnboardingOpen: (open) => set({ onboardingOpen: open }),
  setApiKeyModalOpen: (open) => set({ apiKeyModalOpen: open }),
  setMobileSidebarOpen: (open) => set({ mobileSidebarOpen: open }),

  openFilePreview: (fileId, page, row) =>
    set({
      rightPanelOpen: true,
      rightPanelView: 'preview',
      previewFileId: fileId,
      highlightPage: page || null,
      highlightRow: row || null,
    }),

  closeFilePreview: () =>
    set({
      rightPanelOpen: false,
      previewFileId: null,
      highlightPage: null,
      highlightRow: null,
    }),
}));
