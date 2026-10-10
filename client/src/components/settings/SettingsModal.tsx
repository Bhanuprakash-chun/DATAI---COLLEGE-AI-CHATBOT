import React, { useState, useEffect } from 'react';
import {
  Settings as SettingsIcon,
  Server,
  Cpu,
  Palette,
  Keyboard,
  CheckCircle,
  XCircle,
  RefreshCw,
} from 'lucide-react';
import { useSettingsStore } from '@/store/settings-store';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { AIMode, ThemeMode } from '@/types/settings';

export function SettingsView() {
  const {
    aiMode,
    setAiMode,
    theme,
    setTheme,
    backendUrl,
    setBackendUrl,
    apiKey,
    setApiKey,
    geminiModel,
    setGeminiModel,
    isBackendConnected,
    checkBackendHealth,
  } = useSettingsStore();

  const [localApiKey, setLocalApiKey] = useState(apiKey);
  const [localBackendUrl, setLocalBackendUrl] = useState(backendUrl);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [isChecking, setIsChecking] = useState(false);

  useEffect(() => {
    setLocalBackendUrl(backendUrl);
  }, [backendUrl]);

  useEffect(() => {
    setLocalApiKey(apiKey);
  }, [apiKey]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleaned = localApiKey
      .trim()
      .replace(/^["'`]|["'`]$/g, '')
      .replace(/^(?:Bearer\s+|GEMINI_API_KEY\s*=\s*)/i, '')
      .trim();
    await setApiKey(cleaned);
    await setBackendUrl(localBackendUrl.trim());

    // Always sync key to backend so .env is updated on server
    try {
      const effectiveBase = localBackendUrl.trim() || backendUrl || window.location.origin;
      await fetch(`${effectiveBase}/api/chat/system-api-key`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ api_key: cleaned, model: geminiModel }),
      });
      await checkBackendHealth();
    } catch {
      // Best-effort push
    }

    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2500);
  };

  const handleTestConnection = async () => {
    setIsChecking(true);
    await checkBackendHealth();
    setIsChecking(false);
  };

  return (
    <div className="flex-1 flex flex-col h-[calc(100vh-3.5rem)] overflow-y-auto p-4 sm:p-6 max-w-4xl mx-auto w-full space-y-6 bg-page pb-[calc(env(safe-area-inset-bottom)+5rem)] md:pb-6">
      {/* Title */}
      <div>
        <h2 className="text-xl sm:text-2xl font-extrabold text-text-primary tracking-tight flex items-center gap-2">
          <SettingsIcon className="w-5 h-5 text-accent" />
          Settings & Configuration
        </h2>
        <p className="text-xs text-text-muted mt-1">
          Manage AI routing mode, Gemini backend gateway connection, theme appearance, and keyboard shortcuts.
        </p>
      </div>

      {/* AI Operating Mode */}
      <Card className="p-5 bg-surface border-border space-y-4">
        <h3 className="text-sm font-semibold text-text-primary flex items-center gap-2">
          <Cpu className="w-4 h-4 text-accent" />
          AI Execution Mode
        </h3>
        <p className="text-xs text-text-muted">
          Select how queries should be processed between your device and Google Gemini.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {(['AUTO', 'ONLINE', 'OFFLINE'] as AIMode[]).map((mode) => (
            <button
              key={mode}
              onClick={() => setAiMode(mode)}
              className={`p-3.5 rounded-xl border text-left transition-all space-y-1.5 ${
                aiMode === mode
                  ? 'bg-accent/15 border-accent text-text-primary shadow-xs'
                  : 'bg-surface-elevated hover:bg-surface-hover border-border text-text-secondary'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs font-bold text-text-primary">{mode}</span>
                {aiMode === mode && <span className="w-2 h-2 rounded-full bg-accent" />}
              </div>
              <p className="text-[11px] text-text-muted leading-relaxed">
                {mode === 'AUTO' && 'Smart routing. Local analytical queries run on device; qualitative questions use Gemini.'}
                {mode === 'ONLINE' && 'Gemini enabled with strict minimum-data context extraction.'}
                {mode === 'OFFLINE' && '100% on device. Zero external cloud network calls.'}
              </p>
            </button>
          ))}
        </div>
      </Card>

      {/* Gateway & Gemini Configuration */}
      <form onSubmit={handleSave}>
        <Card className="p-5 bg-surface border-border space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <h3 className="text-sm font-semibold text-text-primary flex items-center gap-2">
              <Server className="w-4 h-4 text-accent" />
              FastAPI Gemini Gateway
            </h3>

            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleTestConnection}
                isLoading={isChecking}
                className="text-xs gap-1.5"
              >
                <RefreshCw className="w-3 h-3" />
                Check Health
              </Button>
              {isBackendConnected ? (
                <Badge variant="success" className="gap-1">
                  <CheckCircle className="w-3 h-3" /> Connected
                </Badge>
              ) : (
                <Badge variant="outline" className="gap-1">
                  <XCircle className="w-3 h-3 text-text-muted" /> Gateway Offline
                </Badge>
              )}
            </div>
          </div>

          <div className="space-y-3 text-xs">
            <div>
              <label className="text-text-secondary font-medium block mb-1">Gateway Endpoint URL</label>
              <Input
                type="text"
                value={localBackendUrl}
                onChange={(e) => setLocalBackendUrl(e.target.value)}
                placeholder="http://localhost:8000"
                className="font-mono text-xs"
              />
              <span className="text-[10px] text-text-muted mt-1 block font-mono">
                Default local Python FastAPI gateway (main.py)
              </span>
            </div>

            <div>
              <label className="text-text-secondary font-medium block mb-1">
                Google Gemini API Key (Optional Client Override)
              </label>
              <Input
                type="password"
                value={localApiKey}
                onChange={(e) => setLocalApiKey(e.target.value)}
                placeholder="AIzaSy... (or set GEMINI_API_KEY on the server)"
                className="font-mono text-xs"
              />
              <span className="text-[10px] text-text-muted mt-1 block font-mono">
                If left blank, the server uses GEMINI_API_KEY configured in server/.env
              </span>
            </div>

            <div>
              <label className="text-text-secondary font-medium block mb-1">Default Gemini Model</label>
              <select
                value={geminiModel}
                onChange={(e) => setGeminiModel(e.target.value)}
                className="w-full bg-surface-elevated border border-border rounded-lg px-3 py-2 text-text-primary text-xs font-mono focus:outline-none focus:border-accent"
              >
                <option value="gemini-flash-latest">gemini-flash-latest (Fast & Recommended)</option>
                <option value="gemini-3.5-flash-lite">gemini-3.5-flash-lite (Ultra Fast & Lightweight)</option>
                <option value="gemini-3-flash-preview">gemini-3-flash-preview (Next-Gen Preview)</option>
                <option value="gemini-3.8-flash">gemini-3.8-flash (High Intelligence)</option>
              </select>
            </div>
          </div>

          <div className="flex items-center justify-between pt-2">
            {savedSuccess ? (
              <span className="text-xs text-emerald-500 font-medium">Settings saved successfully!</span>
            ) : (
              <span />
            )}
            <Button type="submit" variant="primary" size="sm">
              Save Settings
            </Button>
          </div>
        </Card>
      </form>

      {/* Theme & Appearance */}
      <Card className="p-5 bg-surface border-border space-y-3">
        <h3 className="text-sm font-semibold text-text-primary flex items-center gap-2">
          <Palette className="w-4 h-4 text-accent" />
          Appearance & Design System
        </h3>
        <p className="text-xs text-text-muted">
          DatAI is styled in clean, high-contrast Light Mode tailored for reading academic papers, datasets, and spreadsheets.
        </p>

        <div className="flex items-center gap-3 pt-1">
          <div className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-accent/15 border border-accent/30 text-accent-dark text-xs font-semibold shadow-xs">
            <CheckCircle className="w-4 h-4 text-accent" />
            <span>Pristine Light Theme (Standard)</span>
          </div>
        </div>
      </Card>

      {/* Keyboard Shortcuts Reference */}
      <Card className="p-5 bg-surface border-border space-y-4">
        <h3 className="text-sm font-semibold text-text-primary flex items-center gap-2">
          <Keyboard className="w-4 h-4 text-accent" />
          Keyboard Shortcuts
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
          <div className="flex items-center justify-between p-2.5 rounded-lg bg-surface-elevated border border-border">
            <span className="text-text-secondary">Global Search & Command Palette</span>
            <kbd className="font-mono text-[10px] bg-surface px-2 py-0.5 rounded border border-border text-text-primary">
              ⌘K
            </kbd>
          </div>
          <div className="flex items-center justify-between p-2.5 rounded-lg bg-surface-elevated border border-border">
            <span className="text-text-secondary">New Chat</span>
            <kbd className="font-mono text-[10px] bg-surface px-2 py-0.5 rounded border border-border text-text-primary">
              ⌘N
            </kbd>
          </div>
          <div className="flex items-center justify-between p-2.5 rounded-lg bg-surface-elevated border border-border">
            <span className="text-text-secondary">Send Message</span>
            <kbd className="font-mono text-[10px] bg-surface px-2 py-0.5 rounded border border-border text-text-primary">
              Enter / ⌘Enter
            </kbd>
          </div>
          <div className="flex items-center justify-between p-2.5 rounded-lg bg-surface-elevated border border-border">
            <span className="text-text-secondary">Toggle Context Panel</span>
            <kbd className="font-mono text-[10px] bg-surface px-2 py-0.5 rounded border border-border text-text-primary">
              ⌘B
            </kbd>
          </div>
        </div>
      </Card>
    </div>
  );
}

