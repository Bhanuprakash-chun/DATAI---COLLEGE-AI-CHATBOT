import React, { useState, useEffect } from 'react';
import {
  Key,
  X,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Sparkles,
  Loader2,
  ShieldCheck,
} from 'lucide-react';
import { useUIStore } from '@/store/ui-store';
import { useSettingsStore } from '@/store/settings-store';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

export function ApiKeyModal() {
  const { apiKeyModalOpen, setApiKeyModalOpen } = useUIStore();
  const {
    apiKey,
    geminiModel,
    setApiKey,
    setGeminiModel,
    backendUrl,
    isGeminiConfiguredOnServer,
    checkBackendHealth,
  } = useSettingsStore();

  const [inputKey, setInputKey] = useState(apiKey || '');
  const [selectedModel, setSelectedModel] = useState(geminiModel || 'gemini-flash-latest');
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveMessage, setSaveMessage] = useState('Saved to .env & activated! Ready to chat.');

  useEffect(() => {
    if (apiKeyModalOpen) {
      setInputKey(apiKey || '');
      setSelectedModel(geminiModel || 'gemini-flash-latest');
      setTestResult(null);
      setSaveSuccess(false);
      checkBackendHealth().catch(() => {});
    }
  }, [apiKeyModalOpen, apiKey, geminiModel, checkBackendHealth]);

  if (!apiKeyModalOpen) return null;

  const cleanKey = (val: string) =>
    val
      .trim()
      .replace(/^["'`]|["'`]$/g, '')
      .replace(/^(?:Bearer\s+|GEMINI_API_KEY\s*=\s*)/i, '')
      .trim();

  const handleTestKey = async () => {
    const keyToTest = cleanKey(inputKey);
    if (!keyToTest) {
      setTestResult({
        success: false,
        message: 'Please enter a Google Gemini API key to test.',
      });
      return;
    }

    if (keyToTest.length < 15) {
      setTestResult({
        success: false,
        message: 'Key looks too short. Gemini API keys are typically ~39 characters from aistudio.google.com.',
      });
      return;
    }

    setTesting(true);
    setTestResult(null);

    try {
      const effectiveBase = backendUrl || window.location.origin;
      const res = await fetch(`${effectiveBase}/api/chat/validate-key`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ api_key: keyToTest, model: selectedModel }),
      });
      const data = await res.json();
      if (res.ok && data.valid) {
        setTestResult({
          success: true,
          message: data.message || 'Key verified with Google GenAI!',
        });
      } else {
        setTestResult({
          success: false,
          message: data.message || 'Verification failed. Please check your key.',
        });
      }
    } catch {
      setTestResult({
        success: false,
        message: 'Cannot reach backend gateway to verify key. Ensure backend server is running.',
      });
    } finally {
      setTesting(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const finalKey = cleanKey(inputKey);
    // Save locally (browser storage + zustand store)
    await setApiKey(finalKey);
    await setGeminiModel(selectedModel);

    let savedToEnv = false;
    try {
      const effectiveBase = backendUrl || window.location.origin;
      const res = await fetch(`${effectiveBase}/api/chat/system-api-key`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ api_key: finalKey, model: selectedModel }),
      });
      const data = await res.json();
      if (res.ok && data.saved) {
        savedToEnv = true;
        setSaveMessage(data.message || 'Key saved to server .env & activated!');
      }
      await checkBackendHealth();
    } catch {
      // Backend push failed, still saved in browser store
      setSaveMessage('Key saved in browser storage & activated for this session.');
    }

    setSaveSuccess(true);
    setTimeout(() => {
      setApiKeyModalOpen(false);
      setSaveSuccess(false);
    }, 1500);
  };


  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <Card className="w-full max-w-md bg-white border border-slate-200 shadow-2xl rounded-2xl overflow-hidden p-0">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-100 bg-slate-50/70">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-600 shadow-2xs">
              <Key className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900">Gemini AI API Key</h2>
              <p className="text-xs text-slate-500">Configure or update your Google GenAI key</p>
            </div>
          </div>
          <button
            onClick={() => setApiKeyModalOpen(false)}
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSave} className="p-5 space-y-4">
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-slate-800 flex items-center gap-1.5">
                <span>API Key</span>
                {isGeminiConfiguredOnServer && (
                  <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-emerald-100 text-emerald-800 border border-emerald-300">
                    Active in Server .env
                  </span>
                )}
              </label>
              <a
                href="https://aistudio.google.com/app/apikey"
                target="_blank"
                rel="noreferrer"
                className="text-[11px] text-amber-600 hover:text-amber-700 flex items-center gap-1 font-medium"
              >
                <span>Get Free Key</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
            <div className="relative">
              <input
                type="text"
                value={inputKey}
                onChange={(e) => setInputKey(e.target.value)}
                placeholder={isGeminiConfiguredOnServer ? "Key configured in server .env (enter new key to override)" : "AIza... (from Google AI Studio)"}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-mono text-slate-900 focus:bg-white focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 transition-all pr-10"
              />
              {inputKey && (inputKey.trim().startsWith('AIza') || inputKey.trim().length >= 30) && (
                <ShieldCheck className="w-4 h-4 text-emerald-500 absolute right-3 top-3 pointer-events-none" />
              )}
            </div>
            <p className="text-[11px] text-slate-500 leading-normal">
              Saving synchronizes with your server&apos;s <code className="bg-slate-100 px-1 py-0.5 rounded text-amber-700 font-mono">.env</code> file and local browser cache.
            </p>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-800 block">AI Model</label>
            <select
              value={selectedModel}
              onChange={(e) => setSelectedModel(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono text-slate-900 focus:bg-white focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20"
            >
              <option value="gemini-flash-latest">gemini-flash-latest (Fast & Recommended)</option>
              <option value="gemini-3.5-flash-lite">gemini-3.5-flash-lite (Ultra Fast & Lightweight)</option>
              <option value="gemini-3-flash-preview">gemini-3-flash-preview (Next-Gen Preview)</option>
              <option value="gemini-3.8-flash">gemini-3.8-flash (High Intelligence)</option>
            </select>
          </div>

          {/* Test connection feedback */}
          {testResult && (
            <div
              className={`p-3 rounded-xl text-xs flex items-center gap-2 border ${
                testResult.success
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                  : 'bg-rose-50 text-rose-800 border-rose-200'
              }`}
            >
              {testResult.success ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              )}
              <span>{testResult.message}</span>
            </div>
          )}

          {saveSuccess && (
            <div className="p-3 rounded-xl text-xs bg-emerald-50 text-emerald-800 border border-emerald-200 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span className="font-semibold">{saveMessage}</span>
            </div>
          )}

          {/* Footer Actions */}
          <div className="flex items-center justify-between pt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleTestKey}
              disabled={testing}
              className="rounded-xl text-xs"
            >
              {testing ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                  Testing...
                </>
              ) : (
                'Test Key'
              )}
            </Button>

            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setApiKeyModalOpen(false)}
                className="rounded-xl text-xs"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                size="sm"
                className="rounded-xl text-xs bg-amber-500 hover:bg-amber-600 text-white font-semibold"
              >
                <Sparkles className="w-3.5 h-3.5 mr-1.5" />
                Save & Activate
              </Button>
            </div>
          </div>
        </form>
      </Card>
    </div>
  );
}
