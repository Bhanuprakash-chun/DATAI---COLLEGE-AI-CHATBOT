export type AIMode = 'AUTO' | 'ONLINE' | 'OFFLINE';

export type ThemeMode = 'dark' | 'light' | 'system';

export interface CloudRequestAuditRecord {
  id: string;
  timestamp: number;
  userPrompt: string;
  minimalContextSnippet: string;
  tokensEstimated: number;
  status: 'success' | 'error';
  latencyMs: number;
  model: string;
}

export interface AppSettings {
  aiMode: AIMode;
  geminiModel: string;
  backendUrl: string;
  apiKey?: string; // Optional user-provided override sent to backend gateway
  theme: ThemeMode;
  localEmbeddingEnabled: boolean;
  enableTelemetry: boolean;
  maxContextTokens: number;
}
