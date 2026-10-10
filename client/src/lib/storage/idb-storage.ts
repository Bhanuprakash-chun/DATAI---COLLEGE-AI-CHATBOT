import { openDB, DBSchema, IDBPDatabase } from 'idb';
import { StorageProvider } from './storage-provider';
import { OPFSStorage } from './opfs-storage';
import { FileMetadata, DocumentChunk, Workspace } from '@/types/file';
import { ChatMessage, Conversation, MessageChart } from '@/types/chat';
import { AppSettings, CloudRequestAuditRecord } from '@/types/settings';

interface DatAIDBSchema extends DBSchema {
  workspaces: {
    key: string;
    value: Workspace;
    indexes: { 'by-updated': number };
  };
  files: {
    key: string;
    value: FileMetadata;
    indexes: { 'by-workspace': string; 'by-type': string };
  };
  file_blobs: {
    key: string;
    value: { key: string; blob: Blob };
  };
  chunks: {
    key: string;
    value: DocumentChunk;
    indexes: { 'by-file': string };
  };
  conversations: {
    key: string;
    value: Conversation;
    indexes: { 'by-workspace': string; 'by-updated': number };
  };
  messages: {
    key: string;
    value: ChatMessage;
    indexes: { 'by-conversation': string; 'by-created': number };
  };
  charts: {
    key: string;
    value: MessageChart & { workspaceId?: string };
  };
  audit_logs: {
    key: string;
    value: CloudRequestAuditRecord;
    indexes: { 'by-timestamp': number };
  };
  settings: {
    key: string;
    value: any;
  };
}

const DB_NAME = 'datai_workspace_db';
const DB_VERSION = 1;

export class BrowserStorageProvider implements StorageProvider {
  private dbPromise: Promise<IDBPDatabase<DatAIDBSchema>>;

  constructor() {
    this.dbPromise = openDB<DatAIDBSchema>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        // Workspaces
        if (!db.objectStoreNames.contains('workspaces')) {
          const wsStore = db.createObjectStore('workspaces', { keyPath: 'id' });
          wsStore.createIndex('by-updated', 'updatedAt');
        }

        // Files
        if (!db.objectStoreNames.contains('files')) {
          const fileStore = db.createObjectStore('files', { keyPath: 'id' });
          fileStore.createIndex('by-workspace', 'workspaceId');
          fileStore.createIndex('by-type', 'type');
        }

        // File Blobs Fallback
        if (!db.objectStoreNames.contains('file_blobs')) {
          db.createObjectStore('file_blobs', { keyPath: 'key' });
        }

        // Chunks
        if (!db.objectStoreNames.contains('chunks')) {
          const chunkStore = db.createObjectStore('chunks', { keyPath: 'id' });
          chunkStore.createIndex('by-file', 'fileId');
        }

        // Conversations
        if (!db.objectStoreNames.contains('conversations')) {
          const convStore = db.createObjectStore('conversations', { keyPath: 'id' });
          convStore.createIndex('by-workspace', 'workspaceId');
          convStore.createIndex('by-updated', 'updatedAt');
        }

        // Messages
        if (!db.objectStoreNames.contains('messages')) {
          const msgStore = db.createObjectStore('messages', { keyPath: 'id' });
          msgStore.createIndex('by-conversation', 'conversationId');
          msgStore.createIndex('by-created', 'createdAt');
        }

        // Charts
        if (!db.objectStoreNames.contains('charts')) {
          db.createObjectStore('charts', { keyPath: 'id' });
        }

        // Audit Logs
        if (!db.objectStoreNames.contains('audit_logs')) {
          const auditStore = db.createObjectStore('audit_logs', { keyPath: 'id' });
          auditStore.createIndex('by-timestamp', 'timestamp');
        }

        // Settings
        if (!db.objectStoreNames.contains('settings')) {
          db.createObjectStore('settings', { keyPath: 'key' });
        }
      },
    });
  }

  // Workspaces
  async getWorkspaces(): Promise<Workspace[]> {
    const db = await this.dbPromise;
    return await db.getAllFromIndex('workspaces', 'by-updated');
  }

  async saveWorkspace(workspace: Workspace): Promise<void> {
    const db = await this.dbPromise;
    await db.put('workspaces', workspace);
  }

  async deleteWorkspace(id: string): Promise<void> {
    const db = await this.dbPromise;
    // Delete files in workspace
    const files = await this.getFiles(id);
    for (const f of files) {
      await this.deleteFile(f.id);
    }
    // Delete conversations in workspace
    const convs = await this.getConversations(id);
    for (const c of convs) {
      await this.deleteConversation(c.id);
    }
    await db.delete('workspaces', id);
  }

  // Files
  async getFiles(workspaceId?: string): Promise<FileMetadata[]> {
    const db = await this.dbPromise;
    if (workspaceId) {
      return await db.getAllFromIndex('files', 'by-workspace', workspaceId);
    }
    return await db.getAll('files');
  }

  async getFile(id: string): Promise<FileMetadata | undefined> {
    const db = await this.dbPromise;
    return await db.get('files', id);
  }

  async saveFile(file: FileMetadata): Promise<void> {
    const db = await this.dbPromise;
    await db.put('files', file);
  }

  async deleteFile(id: string): Promise<void> {
    const db = await this.dbPromise;
    const file = await this.getFile(id);
    if (file) {
      await this.deleteFileBlob(file.storageKey);
      await this.deleteChunksByFile(id);
      await db.delete('files', id);
    }
  }

  // Blob storage (OPFS preferred, IndexedDB fallback)
  async saveFileBlob(storageKey: string, data: ArrayBuffer | Blob): Promise<void> {
    const savedInOpfs = await OPFSStorage.saveFile(storageKey, data);
    if (!savedInOpfs) {
      const blob = data instanceof Blob ? data : new Blob([data]);
      const db = await this.dbPromise;
      await db.put('file_blobs', { key: storageKey, blob });
    }
  }

  async getFileBlob(storageKey: string): Promise<Blob | undefined> {
    const opfsBlob = await OPFSStorage.getFile(storageKey);
    if (opfsBlob) return opfsBlob;

    const db = await this.dbPromise;
    const record = await db.get('file_blobs', storageKey);
    return record?.blob;
  }

  async deleteFileBlob(storageKey: string): Promise<void> {
    await OPFSStorage.deleteFile(storageKey);
    const db = await this.dbPromise;
    await db.delete('file_blobs', storageKey);
  }

  // Chunks
  async saveChunks(chunks: DocumentChunk[]): Promise<void> {
    const db = await this.dbPromise;
    const tx = db.transaction('chunks', 'readwrite');
    for (const chunk of chunks) {
      await tx.store.put(chunk);
    }
    await tx.done;
  }

  async getChunksByFile(fileId: string): Promise<DocumentChunk[]> {
    const db = await this.dbPromise;
    return await db.getAllFromIndex('chunks', 'by-file', fileId);
  }

  async getAllChunks(workspaceId?: string): Promise<DocumentChunk[]> {
    const db = await this.dbPromise;
    if (!workspaceId) {
      return await db.getAll('chunks');
    }
    const files = await this.getFiles(workspaceId);
    const fileIds = new Set(files.map((f) => f.id));
    const allChunks = await db.getAll('chunks');
    return allChunks.filter((c) => fileIds.has(c.fileId));
  }

  async deleteChunksByFile(fileId: string): Promise<void> {
    const db = await this.dbPromise;
    const chunks = await this.getChunksByFile(fileId);
    const tx = db.transaction('chunks', 'readwrite');
    for (const chunk of chunks) {
      await tx.store.delete(chunk.id);
    }
    await tx.done;
  }

  // Conversations & Messages
  async getConversations(workspaceId?: string): Promise<Conversation[]> {
    const db = await this.dbPromise;
    if (workspaceId) {
      return await db.getAllFromIndex('conversations', 'by-workspace', workspaceId);
    }
    return await db.getAllFromIndex('conversations', 'by-updated');
  }

  async saveConversation(conversation: Conversation): Promise<void> {
    const db = await this.dbPromise;
    await db.put('conversations', conversation);
  }

  async deleteConversation(id: string): Promise<void> {
    const db = await this.dbPromise;
    const messages = await this.getMessages(id);
    const tx = db.transaction('messages', 'readwrite');
    for (const msg of messages) {
      await tx.store.delete(msg.id);
    }
    await tx.done;
    await db.delete('conversations', id);
  }

  async getMessages(conversationId: string): Promise<ChatMessage[]> {
    const db = await this.dbPromise;
    const messages = await db.getAllFromIndex('messages', 'by-conversation', conversationId);
    return messages.sort((a, b) => a.createdAt - b.createdAt);
  }

  async saveMessage(message: ChatMessage): Promise<void> {
    const db = await this.dbPromise;
    await db.put('messages', message);
  }

  async deleteMessage(id: string): Promise<void> {
    const db = await this.dbPromise;
    await db.delete('messages', id);
  }

  // Charts
  async getCharts(workspaceId?: string): Promise<MessageChart[]> {
    const db = await this.dbPromise;
    const all = await db.getAll('charts');
    if (workspaceId) {
      return all.filter((c) => c.workspaceId === workspaceId);
    }
    return all;
  }

  async saveChart(chart: MessageChart & { workspaceId?: string }): Promise<void> {
    const db = await this.dbPromise;
    await db.put('charts', chart);
  }

  async deleteChart(id: string): Promise<void> {
    const db = await this.dbPromise;
    await db.delete('charts', id);
  }

  // Audit Logs
  async getAuditLogs(): Promise<CloudRequestAuditRecord[]> {
    const db = await this.dbPromise;
    return await db.getAllFromIndex('audit_logs', 'by-timestamp');
  }

  async saveAuditLog(log: CloudRequestAuditRecord): Promise<void> {
    const db = await this.dbPromise;
    await db.put('audit_logs', log);
  }

  async clearAuditLogs(): Promise<void> {
    const db = await this.dbPromise;
    await db.clear('audit_logs');
  }

  // Settings
  async getSettings(): Promise<Partial<AppSettings>> {
    const db = await this.dbPromise;
    const record = await db.get('settings', 'app_config');
    return record?.value || {};
  }

  async saveSettings(settings: Partial<AppSettings>): Promise<void> {
    const db = await this.dbPromise;
    const existing = (await db.get('settings', 'app_config'))?.value || {};
    const merged = { ...existing, ...settings };
    await db.put('settings', { key: 'app_config', value: merged });
  }

  // Storage Stats & Data Management
  async getStorageEstimate(): Promise<{ usage: number; quota: number }> {
    if (typeof navigator !== 'undefined' && 'storage' in navigator && 'estimate' in navigator.storage) {
      try {
        const est = await navigator.storage.estimate();
        return {
          usage: est.usage || 0,
          quota: est.quota || 0,
        };
      } catch (e) {
        console.warn('Storage estimate failed:', e);
      }
    }
    return { usage: 0, quota: 0 };
  }

  async clearAllData(): Promise<void> {
    const db = await this.dbPromise;
    await db.clear('workspaces');
    await db.clear('files');
    await db.clear('file_blobs');
    await db.clear('chunks');
    await db.clear('conversations');
    await db.clear('messages');
    await db.clear('charts');
    await db.clear('audit_logs');
    await OPFSStorage.clearAll();
  }
}

// Singleton storage instance
export const storage = new BrowserStorageProvider();
