import { AIProvider, AICompletionOptions, AICompletionResult } from './ai-provider';
import { storage } from '@/lib/storage/idb-storage';
import { generateId } from '@/lib/utils';
import { getDefaultBackendUrl, useSettingsStore } from '@/store/settings-store';
import { AppSettings } from '@/types/settings';

export class GeminiGatewayProvider implements AIProvider {
  name = 'GeminiGateway';
  private baseUrl: string | null;

  constructor(baseUrl?: string) {
    this.baseUrl = baseUrl || null;
  }

  setBaseUrl(url: string) {
    this.baseUrl = url.trim().replace(/\/+$/, '');
  }

  private async getEffectiveBaseUrl(): Promise<string> {
    if (this.baseUrl) return this.baseUrl.replace(/\/+$/, '');
    if (typeof window !== 'undefined') {
      const { hostname, origin } = window.location;
      // In remote environments (e.g. Render), always communicate with the same origin
      if (hostname !== 'localhost' && hostname !== '127.0.0.1') {
        return origin;
      }
    }
    try {
      const settings = await storage.getSettings();
      if (settings.backendUrl && settings.backendUrl !== 'http://localhost:8000') {
        return settings.backendUrl.trim().replace(/\/+$/, '');
      }
    } catch (_) {}
    return getDefaultBackendUrl();
  }

  async isAvailable(): Promise<boolean> {
    try {
      const base = await this.getEffectiveBaseUrl();
      const res = await fetch(`${base}/api/health`, { method: 'GET', signal: AbortSignal.timeout(15000) });
      if (!res.ok) return false;
      const data = await res.json();
      return data.status === 'ok';
    } catch (_) {
      return false;
    }
  }

  async stream(options: AICompletionOptions): Promise<AICompletionResult> {
    const startTime = performance.now();
    const currentSettings = useSettingsStore.getState();
    const storedSettings: Partial<AppSettings> = await storage.getSettings().catch(() => ({}));
    const VALID_MODELS = ['gemini-flash-latest', 'gemini-3.5-flash-lite', 'gemini-3-flash-preview', 'gemini-3.8-flash'];
    let model = (options.model || currentSettings.geminiModel || storedSettings.geminiModel || 'gemini-flash-latest').trim();
    if (!model || !VALID_MODELS.includes(model)) {
      model = 'gemini-flash-latest';
    }
    const rawKey = (currentSettings.apiKey || storedSettings.apiKey || '')
      .trim()
      .replace(/^["'`]|["'`]$/g, '')
      .replace(/^(?:Bearer\s+|GEMINI_API_KEY\s*=\s*)/i, '')
      .trim();
    const effectiveKey = rawKey;
    const base = await this.getEffectiveBaseUrl();

    try {
      const response = await fetch(`${base}/api/chat/stream`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(effectiveKey ? { 'X-Gemini-Key': effectiveKey } : {}),
        },
        body: JSON.stringify({
          prompt: options.prompt,
          context: options.contextSnippet,
          history: options.conversationHistory || [],
          model,
        }),
        signal: options.signal,
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Gemini Gateway Error (${response.status}): ${errorText}`);
      }

      if (!response.body) {
        throw new Error('ReadableStream not supported by response');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder('utf-8');
      let accumulatedContent = '';

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        const chunkText = decoder.decode(value, { stream: true });
        const lines = chunkText.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const dataStr = line.slice(6).trim();
            if (dataStr === '[DONE]') continue;
            try {
              const parsed = JSON.parse(dataStr);
              if (parsed.text) {
                accumulatedContent += parsed.text;
                if (options.onChunk) {
                  options.onChunk(parsed.text);
                }
              } else if (parsed.error) {
                const errSnippet = `\n\n> **Notice**: ${parsed.error}`;
                accumulatedContent += errSnippet;
                if (options.onChunk) options.onChunk(errSnippet);
              }
            } catch (_) {
              // Plain text stream fallback
              if (dataStr.length > 0 && !dataStr.startsWith('{')) {
                accumulatedContent += dataStr;
                if (options.onChunk) options.onChunk(dataStr);
              }
            }
          }
        }
      }

      if (!accumulatedContent.trim()) {
        throw new Error('Received empty response from AI Gateway.');
      }

      const latencyMs = Math.round(performance.now() - startTime);

      // Audit Log Record for Privacy Transparency
      await storage.saveAuditLog({
        id: generateId(),
        timestamp: Date.now(),
        userPrompt: options.prompt,
        minimalContextSnippet: options.contextSnippet.substring(0, 300) + '...',
        tokensEstimated: Math.round((options.prompt.length + options.contextSnippet.length + accumulatedContent.length) / 4),
        status: 'success',
        latencyMs,
        model,
      });

      return {
        content: accumulatedContent,
        tokensUsed: Math.round((options.prompt.length + accumulatedContent.length) / 4),
      };
    } catch (err: any) {
      const latencyMs = Math.round(performance.now() - startTime);
      await storage.saveAuditLog({
        id: generateId(),
        timestamp: Date.now(),
        userPrompt: options.prompt,
        minimalContextSnippet: options.contextSnippet.substring(0, 300) + '...',
        tokensEstimated: 0,
        status: 'error',
        latencyMs,
        model,
      });
      throw err;
    }
  }

  async generate(prompt: string, contextSnippet: string): Promise<string> {
    let result = '';
    await this.stream({
      prompt,
      contextSnippet,
      onChunk: (tok) => {
        result += tok;
      },
    });
    return result;
  }
}
