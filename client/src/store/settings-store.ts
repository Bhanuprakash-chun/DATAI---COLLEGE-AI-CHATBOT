import { create } from 'zustand';
import { AIMode, ThemeMode, CloudRequestAuditRecord } from '@/types/settings';
import { storage } from '@/lib/storage/idb-storage';

export function getDefaultBackendUrl(): string {
  // If explicitly configured via Vite env var at build/runtime
  if (import.meta.env.VITE_BACKEND_URL) {
    let url = (import.meta.env.VITE_BACKEND_URL as string).trim();
    if (!/^https?:\/\//i.test(url)) {
      url = `https://${url}`;
    }
    return url.replace(/\/+$/, '');
  }

  // In production (hosted on Render, etc.), default to same origin for unified deployment
  if (typeof window !== 'undefined') {
    const { hostname, origin } = window.location;
    if (hostname !== 'localhost' && hostname !== '127.0.0.1') {
      return origin;
    }
  }

  // Local development fallback
  return 'http://localhost:8000';
}

export function applyThemeToDOM(_theme: ThemeMode = 'light') {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;
  root.classList.add('light');
  root.classList.remove('dark');
  try {
    localStorage.setItem('datai_theme', 'light');
  } catch (_) {}
}

interface SettingsState {
  aiMode: AIMode;
  geminiModel: string;
  backendUrl: string;
  apiKey: string;
  theme: ThemeMode;
  storageUsage: number;
  storageQuota: number;
  auditLogs: CloudRequestAuditRecord[];
  isBackendConnected: boolean;
  isGeminiConfiguredOnServer: boolean;
  loadSettings: () => Promise<void>;
  setAiMode: (mode: AIMode) => Promise<void>;
  setTheme: (theme: ThemeMode) => Promise<void>;
  setBackendUrl: (url: string) => Promise<void>;
  setApiKey: (key: string) => Promise<void>;
  setGeminiModel: (model: string) => Promise<void>;
  refreshStorageStats: () => Promise<void>;
  loadAuditLogs: () => Promise<void>;
  clearAuditLogs: () => Promise<void>;
  checkBackendHealth: () => Promise<boolean>;
  eraseAllApplicationData: () => Promise<void>;
}

export const useSettingsStore = create<SettingsState>((set, get) => ({
  aiMode: 'AUTO',
  geminiModel: 'gemini-flash-latest',
  backendUrl: getDefaultBackendUrl(),
  apiKey: '',
  theme: 'light',
  storageUsage: 0,
  storageQuota: 0,
  auditLogs: [],
  isBackendConnected: false,
  isGeminiConfiguredOnServer: false,

  loadSettings: async () => {
    set({ theme: 'light' });
    applyThemeToDOM('light');

    const saved = await storage.getSettings();
    if (saved.aiMode) set({ aiMode: saved.aiMode });

    const defaultUrl = getDefaultBackendUrl();
    if (saved.backendUrl) {
      const isLocalHostDefault = saved.backendUrl === 'http://localhost:8000';
      const isRemoteHost = typeof window !== 'undefined' && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1';
      // Automatically upgrade previous localhost:8000 default when accessed remotely on production Render URL
      if (isLocalHostDefault && isRemoteHost) {
        set({ backendUrl: defaultUrl });
      } else {
        set({ backendUrl: saved.backendUrl });
      }
    } else {
      set({ backendUrl: defaultUrl });
    }

    const savedApiKey = saved.apiKey?.trim() ?? '';
    if (savedApiKey && !savedApiKey.startsWith('AQ.')) {
      set({ apiKey: savedApiKey });
    } else {
      set({ apiKey: '' });
      if (savedApiKey.startsWith('AQ.')) {
        await storage.saveSettings({ apiKey: '' });
      }
    }

    // Allowed models list — keep in sync with the dropdown options
    const VALID_MODELS = [
      'gemini-flash-latest',
      'gemini-3.5-flash-lite',
      'gemini-3-flash-preview',
      'gemini-3.8-flash',
    ];
    // Auto-migrate deprecated models (1.0, 1.5, 2.0, 2.5) to gemini-flash-latest
    const isValidModel = saved.geminiModel && VALID_MODELS.includes(saved.geminiModel);
    if (isValidModel) {
      set({ geminiModel: saved.geminiModel });
    } else {
      set({ geminiModel: 'gemini-flash-latest' });
      await storage.saveSettings({ geminiModel: 'gemini-flash-latest' });
    }

    await get().refreshStorageStats();
    await get().loadAuditLogs();
    await get().checkBackendHealth();
  },

  setAiMode: async (mode: AIMode) => {
    set({ aiMode: mode });
    await storage.saveSettings({ aiMode: mode });
  },

  setTheme: async (_theme: ThemeMode) => {
    set({ theme: 'light' });
    applyThemeToDOM('light');
    await storage.saveSettings({ theme: 'light' });
  },

  setBackendUrl: async (url: string) => {
    const sanitized = url.trim().replace(/\/+$/, '');
    set({ backendUrl: sanitized });
    await storage.saveSettings({ backendUrl: sanitized });
    await get().checkBackendHealth();
  },

  setApiKey: async (key: string) => {
    const cleaned = (key || '')
      .trim()
      .replace(/^["'`]|["'`]$/g, '')
      .replace(/^(?:Bearer\s+|GEMINI_API_KEY\s*=\s*)/i, '')
      .trim();
    set({ apiKey: cleaned });
    await storage.saveSettings({ apiKey: cleaned });
  },

  setGeminiModel: async (model: string) => {
    const VALID_MODELS = [
      'gemini-flash-latest',
      'gemini-3.5-flash-lite',
      'gemini-3-flash-preview',
      'gemini-3.8-flash',
    ];
    let clean = (model || '').trim();
    // Only accept known valid models; default to gemini-flash-latest for anything deprecated
    if (!clean || !VALID_MODELS.includes(clean)) {
      clean = 'gemini-flash-latest';
    }
    set({ geminiModel: clean });
    await storage.saveSettings({ geminiModel: clean });
  },

  refreshStorageStats: async () => {
    const est = await storage.getStorageEstimate();
    set({ storageUsage: est.usage, storageQuota: est.quota });
  },

  loadAuditLogs: async () => {
    const logs = await storage.getAuditLogs();
    set({ auditLogs: logs.reverse() });
  },

  clearAuditLogs: async () => {
    await storage.clearAuditLogs();
    set({ auditLogs: [] });
  },

  checkBackendHealth: async () => {
    try {
      const base = (get().backendUrl || getDefaultBackendUrl()).replace(/\/+$/, '');
      const res = await fetch(`${base}/api/health`, { method: 'GET', signal: AbortSignal.timeout(3500) });
      if (res.ok) {
        const data = await res.json();
        set({
          isBackendConnected: true,
          isGeminiConfiguredOnServer: Boolean(data.gemini_configured),
        });
        return true;
      }
      set({ isBackendConnected: false, isGeminiConfiguredOnServer: false });
      return false;
    } catch (_) {
      set({ isBackendConnected: false, isGeminiConfiguredOnServer: false });
      return false;
    }
  },

  eraseAllApplicationData: async () => {
    await storage.clearAllData();
    window.location.reload();
  },
}));
