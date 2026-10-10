import { create } from 'zustand';
import { FileMetadata, DocumentChunk } from '@/types/file';
import { storage } from '@/lib/storage/idb-storage';
import { processAndIndexFile } from '@/lib/parsers';

interface UploadQueueItem {
  id: string;
  name: string;
  size: number;
  status: 'reading' | 'analyzing' | 'indexing' | 'ready' | 'error';
  progress: number;
  error?: string;
}

interface FileState {
  files: FileMetadata[];
  activeFileId: string | null;
  uploadQueue: UploadQueueItem[];
  isLoading: boolean;
  spreadsheetRowCache: Map<string, Record<string, any>[]>;
  loadFiles: (workspaceId: string) => Promise<void>;
  uploadFiles: (files: File[], workspaceId: string) => Promise<void>;
  deleteFile: (id: string) => Promise<void>;
  setActiveFileId: (id: string | null) => void;
  getChunksForFiles: (fileIds: string[]) => Promise<DocumentChunk[]>;
  cacheSpreadsheetRows: (fileId: string, rows: Record<string, any>[]) => void;
}

export const useFileStore = create<FileState>((set, get) => ({
  files: [],
  activeFileId: null,
  uploadQueue: [],
  isLoading: false,
  spreadsheetRowCache: new Map(),

  loadFiles: async (workspaceId: string) => {
    set({ isLoading: true });
    const list = await storage.getFiles(workspaceId);
    set({ files: list, isLoading: false });
  },

  uploadFiles: async (files: File[], workspaceId: string) => {
    const queueItems: UploadQueueItem[] = files.map((f) => ({
      id: `queue_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      name: f.name,
      size: f.size,
      status: 'reading',
      progress: 10,
    }));

    set((state) => ({ uploadQueue: [...queueItems, ...state.uploadQueue] }));

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const qItem = queueItems[i];

      try {
        const metadata = await processAndIndexFile(file, workspaceId, (step, prog) => {
          set((state) => ({
            uploadQueue: state.uploadQueue.map((item) =>
              item.id === qItem.id ? { ...item, status: step, progress: prog } : item
            ),
          }));
        });

        // Add to files list
        set((state) => ({
          files: [metadata, ...state.files],
          uploadQueue: state.uploadQueue.filter((item) => item.id !== qItem.id),
        }));
      } catch (err: any) {
        set((state) => ({
          uploadQueue: state.uploadQueue.map((item) =>
            item.id === qItem.id ? { ...item, status: 'error', error: err.message } : item
          ),
        }));
      }
    }
  },

  deleteFile: async (id: string) => {
    await storage.deleteFile(id);
    set((state) => ({
      files: state.files.filter((f) => f.id !== id),
      activeFileId: state.activeFileId === id ? null : state.activeFileId,
    }));
  },

  setActiveFileId: (id: string | null) => {
    set({ activeFileId: id });
  },

  getChunksForFiles: async (fileIds: string[]) => {
    const allChunks: DocumentChunk[] = [];
    for (const fid of fileIds) {
      const chunks = await storage.getChunksByFile(fid);
      allChunks.push(...chunks);
    }
    return allChunks;
  },

  cacheSpreadsheetRows: (fileId: string, rows: Record<string, any>[]) => {
    const map = new Map(get().spreadsheetRowCache);
    map.set(fileId, rows);
    set({ spreadsheetRowCache: map });
  },
}));
