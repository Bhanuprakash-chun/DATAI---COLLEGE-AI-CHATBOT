import { FileMetadata, DocumentChunk, Workspace } from '@/types/file';
import { ChatMessage, Conversation, MessageChart } from '@/types/chat';
import { AppSettings, CloudRequestAuditRecord } from '@/types/settings';

export interface StorageProvider {
  // Workspaces
  getWorkspaces(): Promise<Workspace[]>;
  saveWorkspace(workspace: Workspace): Promise<void>;
  deleteWorkspace(id: string): Promise<void>;

  // Files
  getFiles(workspaceId?: string): Promise<FileMetadata[]>;
  getFile(id: string): Promise<FileMetadata | undefined>;
  saveFile(file: FileMetadata): Promise<void>;
  deleteFile(id: string): Promise<void>;

  // Raw file blobs (OPFS / Blob store)
  saveFileBlob(storageKey: string, data: ArrayBuffer | Blob): Promise<void>;
  getFileBlob(storageKey: string): Promise<Blob | undefined>;
  deleteFileBlob(storageKey: string): Promise<void>;

  // Chunks (Text & tabular chunks)
  saveChunks(chunks: DocumentChunk[]): Promise<void>;
  getChunksByFile(fileId: string): Promise<DocumentChunk[]>;
  getAllChunks(workspaceId?: string): Promise<DocumentChunk[]>;
  deleteChunksByFile(fileId: string): Promise<void>;

  // Conversations & Messages
  getConversations(workspaceId?: string): Promise<Conversation[]>;
  saveConversation(conversation: Conversation): Promise<void>;
  deleteConversation(id: string): Promise<void>;
  getMessages(conversationId: string): Promise<ChatMessage[]>;
  saveMessage(message: ChatMessage): Promise<void>;
  deleteMessage(id: string): Promise<void>;

  // Charts
  getCharts(workspaceId?: string): Promise<MessageChart[]>;
  saveChart(chart: MessageChart): Promise<void>;
  deleteChart(id: string): Promise<void>;

  // Audit Logs
  getAuditLogs(): Promise<CloudRequestAuditRecord[]>;
  saveAuditLog(log: CloudRequestAuditRecord): Promise<void>;
  clearAuditLogs(): Promise<void>;

  // Settings
  getSettings(): Promise<Partial<AppSettings>>;
  saveSettings(settings: Partial<AppSettings>): Promise<void>;

  // Storage Stats & Data Management
  getStorageEstimate(): Promise<{ usage: number; quota: number }>;
  clearAllData(): Promise<void>;
}
