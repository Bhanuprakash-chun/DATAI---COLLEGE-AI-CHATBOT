import { Citation, CalculationEvidence, MessageChart } from '@/types/chat';

export interface AICompletionOptions {
  prompt: string;
  contextSnippet: string;
  conversationHistory?: { role: 'user' | 'assistant'; content: string }[];
  model?: string;
  onChunk?: (token: string) => void;
  signal?: AbortSignal;
}

export interface AICompletionResult {
  content: string;
  citations?: Citation[];
  evidence?: CalculationEvidence;
  chart?: MessageChart;
  tokensUsed?: number;
}

export interface AIProvider {
  name: string;
  isAvailable(): Promise<boolean>;
  stream(options: AICompletionOptions): Promise<AICompletionResult>;
  generate(prompt: string, contextSnippet: string): Promise<string>;
}
