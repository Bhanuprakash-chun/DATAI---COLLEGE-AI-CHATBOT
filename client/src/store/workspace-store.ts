import { create } from 'zustand';
import { Workspace } from '@/types/file';
import { storage } from '@/lib/storage/idb-storage';
import { generateId } from '@/lib/utils';

interface WorkspaceState {
  workspaces: Workspace[];
  activeWorkspaceId: string;
  isLoading: boolean;
  loadWorkspaces: () => Promise<void>;
  setActiveWorkspace: (id: string) => void;
  createWorkspace: (name: string, description?: string) => Promise<Workspace>;
  deleteWorkspace: (id: string) => Promise<void>;
}

export const useWorkspaceStore = create<WorkspaceState>((set, get) => ({
  workspaces: [],
  activeWorkspaceId: 'default',
  isLoading: true,

  loadWorkspaces: async () => {
    let list = await storage.getWorkspaces();
    if (list.length === 0) {
      // Create initial default workspace
      const defaultWs: Workspace = {
        id: 'default',
        name: 'General Workspace',
        description: 'Default local workspace for documents and spreadsheets',
        createdAt: Date.now(),
        updatedAt: Date.now(),
        fileIds: [],
      };
      await storage.saveWorkspace(defaultWs);
      list = [defaultWs];
    }
    set({ workspaces: list, activeWorkspaceId: list[0].id, isLoading: false });
  },

  setActiveWorkspace: (id: string) => {
    set({ activeWorkspaceId: id });
  },

  createWorkspace: async (name: string, description?: string) => {
    const newWs: Workspace = {
      id: generateId(),
      name,
      description,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      fileIds: [],
    };
    await storage.saveWorkspace(newWs);
    set((state) => ({
      workspaces: [newWs, ...state.workspaces],
      activeWorkspaceId: newWs.id,
    }));
    return newWs;
  },

  deleteWorkspace: async (id: string) => {
    await storage.deleteWorkspace(id);
    const remaining = get().workspaces.filter((w) => w.id !== id);
    set({
      workspaces: remaining,
      activeWorkspaceId: remaining[0]?.id || 'default',
    });
  },
}));
