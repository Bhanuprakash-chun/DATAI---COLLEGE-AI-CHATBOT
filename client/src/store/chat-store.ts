import { create } from 'zustand';
import { ChatMessage, Conversation, Citation } from '@/types/chat';
import { AIMode } from '@/types/settings';
import { storage } from '@/lib/storage/idb-storage';
import { queryRouter } from '@/lib/router/query-router';
import { useFileStore } from './file-store';
import { useAuthStore } from './auth-store';
import { generateId } from '@/lib/utils';

interface ChatState {
  conversations: Conversation[];
  activeConversationId: string | null;
  messages: ChatMessage[];
  isGenerating: boolean;
  selectedFileIdsForChat: string[];
  activeCitation: Citation | null;
  loadConversations: (workspaceId: string) => Promise<void>;
  selectConversation: (id: string) => Promise<void>;
  createConversation: (workspaceId: string, initialTitle?: string) => Promise<string>;
  deleteConversation: (id: string) => Promise<void>;
  toggleFileSelectionForChat: (fileId: string) => void;
  clearFileSelections: () => void;
  setActiveCitation: (citation: Citation | null) => void;
  sendMessage: (text: string, mode: AIMode) => Promise<void>;
}

export const useChatStore = create<ChatState>((set, get) => ({
  conversations: [],
  activeConversationId: null,
  messages: [],
  isGenerating: false,
  selectedFileIdsForChat: [],
  activeCitation: null,

  loadConversations: async (workspaceId: string) => {
    const list = await storage.getConversations(workspaceId);
    set({ conversations: list });
    if (list.length > 0 && !get().activeConversationId) {
      await get().selectConversation(list[0].id);
    }
  },

  selectConversation: async (id: string) => {
    set({ activeConversationId: id });
    const msgs = await storage.getMessages(id);
    set({ messages: msgs });
  },

  createConversation: async (workspaceId: string, initialTitle: string = 'New Conversation') => {
    const newConv: Conversation = {
      id: generateId(),
      workspaceId,
      title: initialTitle,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      fileIds: get().selectedFileIdsForChat,
    };
    await storage.saveConversation(newConv);
    set((state) => ({
      conversations: [newConv, ...state.conversations],
      activeConversationId: newConv.id,
      messages: [],
    }));
    return newConv.id;
  },

  deleteConversation: async (id: string) => {
    await storage.deleteConversation(id);
    const remaining = get().conversations.filter((c) => c.id !== id);
    set({
      conversations: remaining,
      activeConversationId: remaining[0]?.id || null,
      messages: remaining[0] ? await storage.getMessages(remaining[0].id) : [],
    });
  },

  toggleFileSelectionForChat: (fileId: string) => {
    const current = get().selectedFileIdsForChat;
    if (current.includes(fileId)) {
      set({ selectedFileIdsForChat: current.filter((id) => id !== fileId) });
    } else {
      set({ selectedFileIdsForChat: [...current, fileId] });
    }
  },

  clearFileSelections: () => {
    set({ selectedFileIdsForChat: [] });
  },

  setActiveCitation: (citation: Citation | null) => {
    set({ activeCitation: citation });
  },

  sendMessage: async (text: string, mode: AIMode) => {
    const authStore = useAuthStore.getState();
    if (!authStore.currentUser) {
      authStore.openAuthModal('login');
      return;
    }

    const permission = authStore.checkCanQuery();
    if (!permission.allowed) {
      authStore.openLimitModal('user');
      return;
    }

    let convId = get().activeConversationId;
    const fileStore = useFileStore.getState();

    // Auto-create conversation if none active
    if (!convId) {
      const activeWsId = fileStore.files[0]?.workspaceId || 'default';
      convId = await get().createConversation(activeWsId, text.substring(0, 32));
    }

    // Determine target files: either explicit selection or all workspace files
    const targetFileIds = get().selectedFileIdsForChat.length > 0
      ? get().selectedFileIdsForChat
      : fileStore.files.map((f) => f.id);
    const targetFiles = fileStore.files.filter((f) => targetFileIds.includes(f.id));

    // 1. Create and save User Message
    const userMsg: ChatMessage = {
      id: generateId(),
      conversationId: convId,
      workspaceId: targetFiles[0]?.workspaceId || 'default',
      role: 'user',
      content: text,
      createdAt: Date.now(),
      filesReferenced: targetFiles.map((f) => ({ id: f.id, name: f.name })),
    };

    await storage.saveMessage(userMsg);
    set((state) => ({
      messages: [...state.messages, userMsg],
      isGenerating: true,
    }));

    // 2. Prepare Assistant Message Placeholder
    const assistantMsgId = generateId();
    const assistantMsg: ChatMessage = {
      id: assistantMsgId,
      conversationId: convId,
      workspaceId: targetFiles[0]?.workspaceId || 'default',
      role: 'assistant',
      content: '',
      createdAt: Date.now(),
      isStreaming: true,
    };

    set((state) => ({ messages: [...state.messages, assistantMsg] }));

    try {
      // Gather relevant chunks
      const chunks = await fileStore.getChunksForFiles(targetFileIds);
      // Check cached tabular rows
      const tabularFile = targetFiles.find((f) => f.type === 'csv' || f.type === 'xlsx' || f.type === 'xls');
      const cachedRows = tabularFile ? fileStore.spreadsheetRowCache.get(tabularFile.id) : undefined;

      // History for multi-turn context
      const history = get().messages
        .filter((m) => m.role === 'user' || m.role === 'assistant')
        .slice(-6)
        .map((m) => ({ role: m.role as 'user' | 'assistant', content: m.content }));

      const result = await queryRouter.processQuery({
        question: text,
        files: targetFiles,
        chunks,
        cachedSpreadsheetRows: cachedRows,
        mode,
        conversationHistory: history,
        onToken: (token) => {
          set((state) => ({
            messages: state.messages.map((m) =>
              m.id === assistantMsgId ? { ...m, content: m.content + token } : m
            ),
          }));
        },
      });

      // Update assistant message with completed evidence, citations, and chart
      const completedAssistantMsg: ChatMessage = {
        ...assistantMsg,
        content: result.content,
        citations: result.citations,
        calculationEvidence: result.calculationEvidence,
        chart: result.chart,
        modeUsed: result.modeUsed,
        isStreaming: false,
      };

      await storage.saveMessage(completedAssistantMsg);

      // Save chart to workspace if generated
      if (result.chart) {
        await storage.saveChart({
          ...result.chart,
          workspaceId: targetFiles[0]?.workspaceId || 'default',
        });
      }

      set((state) => ({
        messages: state.messages.map((m) =>
          m.id === assistantMsgId ? completedAssistantMsg : m
        ),
        isGenerating: false,
      }));
    } catch (error: any) {
      console.error('Failed to generate answer:', error);
      const errorMsg: ChatMessage = {
        ...assistantMsg,
        content: `Error answering query: ${error.message || 'Unknown processing error'}`,
        error: error.message,
        isStreaming: false,
      };
      await storage.saveMessage(errorMsg);
      set((state) => ({
        messages: state.messages.map((m) => (m.id === assistantMsgId ? errorMsg : m)),
        isGenerating: false,
      }));
    }
  },
}));
