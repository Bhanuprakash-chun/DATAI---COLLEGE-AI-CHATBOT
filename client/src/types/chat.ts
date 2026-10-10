export type MessageRole = 'user' | 'assistant' | 'system';

export interface Citation {
  id: string;
  fileId: string;
  fileName: string;
  fileType: string;
  pageNumber?: number;
  sectionTitle?: string;
  sheetName?: string;
  rowRange?: [number, number];
  exactSnippet: string;
  confidence?: number;
}

export interface CalculationEvidence {
  query: string;
  sqlQuery?: string;
  formula?: string;
  sheetName?: string;
  rowsAnalyzed: number;
  calculatedValue: string | number;
  unit?: string;
}

export interface ChartDataSeries {
  name: string;
  dataKey: string;
  color?: string;
}

export interface MessageChart {
  id: string;
  title: string;
  description?: string;
  type: 'bar' | 'line' | 'area' | 'pie' | 'scatter';
  xAxisKey: string;
  series: ChartDataSeries[];
  data: Record<string, any>[];
}

export interface ToolExecutionRecord {
  toolName: string;
  input: Record<string, any>;
  output: Record<string, any>;
  status: 'success' | 'error';
  executionTimeMs: number;
}

export interface ChatMessage {
  id: string;
  conversationId: string;
  workspaceId: string;
  role: MessageRole;
  content: string;
  createdAt: number;
  
  // Grounded Intelligence fields
  citations?: Citation[];
  calculationEvidence?: CalculationEvidence;
  chart?: MessageChart;
  toolExecutions?: ToolExecutionRecord[];
  
  // Streaming state
  isStreaming?: boolean;
  error?: string;
  
  // Context metadata
  filesReferenced?: { id: string; name: string }[];
  modeUsed?: 'ONLINE' | 'AUTO' | 'OFFLINE';
}

export interface Conversation {
  id: string;
  workspaceId: string;
  title: string;
  createdAt: number;
  updatedAt: number;
  fileIds: string[];
  pinnedMessageIds?: string[];
}
