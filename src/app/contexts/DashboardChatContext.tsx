import { createContext, useContext, useCallback, useRef, useSyncExternalStore, useMemo, ReactNode } from "react";
import { GLOBAL_AI_ASSISTANT_KEY } from "../lib/ai-assistant-global";
import type { AssistantStructuredFields, DashboardData, WidgetMessageMeta } from "../types/conversation-types";
import type { Conversation } from "./ConversationContext";
import { conversationMessageToGlobalChat } from "../lib/conversation-message-to-global-chat";

export interface ChatMessage extends WidgetMessageMeta, AssistantStructuredFields {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  dashboardData?: DashboardData;
}

type Listener = () => void;
const EMPTY: ChatMessage[] = [];
const EMPTY_CONVERSATIONS: GlobalAiConversation[] = [];

/** Default header label for the global assistant; used until auto-titled from first prompt. */
export const GLOBAL_AI_DEFAULT_CHAT_TITLE = "New Chat";

export interface GlobalAiConversation {
  id: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;
  messages: ChatMessage[];
  /** When true, leaving this chat may replace `name` with text from the first user message if still default. */
  usesAutoTitle?: boolean;
}

export function conversationNameFromPrompt(prompt: string): string {
  const trimmed = prompt.trim().replace(/\s+/g, " ");
  if (!trimmed) return GLOBAL_AI_DEFAULT_CHAT_TITLE;
  return trimmed.length > 56 ? `${trimmed.slice(0, 56).trim()}...` : trimmed;
}

/**
 * Lightweight external store for dashboard chat messages.
 * One conversation per dashboard key (persistKey).
 */
class ChatStore {
  private data: Record<string, ChatMessage[]> = {};
  private listeners = new Set<Listener>();
  private keyListeners = new Map<string, Set<Listener>>();
  private globalConversations: GlobalAiConversation[] = [];
  private globalActiveConversationId: string | null = null;
  private globalDraftMessages: ChatMessage[] = [];
  private globalDraftDisplayName = GLOBAL_AI_DEFAULT_CHAT_TITLE;
  private globalDraftDisplayNameUserSet = false;
  private globalConversationListeners = new Set<Listener>();
  private globalActiveListeners = new Set<Listener>();
  private draftMetaListeners = new Set<Listener>();

  subscribe = (listener: Listener): (() => void) => {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  };

  subscribeKey = (key: string, listener: Listener): (() => void) => {
    let set = this.keyListeners.get(key);
    if (!set) {
      set = new Set();
      this.keyListeners.set(key, set);
    }
    set.add(listener);
    return () => {
      set!.delete(listener);
      if (set!.size === 0) this.keyListeners.delete(key);
    };
  };

  subscribeGlobalConversations = (listener: Listener): (() => void) => {
    this.globalConversationListeners.add(listener);
    return () => this.globalConversationListeners.delete(listener);
  };

  subscribeGlobalActiveConversation = (listener: Listener): (() => void) => {
    this.globalActiveListeners.add(listener);
    return () => this.globalActiveListeners.delete(listener);
  };

  subscribeGlobalDraftMeta = (listener: Listener): (() => void) => {
    this.draftMetaListeners.add(listener);
    return () => this.draftMetaListeners.delete(listener);
  };

  getMessages = (key: string): ChatMessage[] => {
    if (key !== GLOBAL_AI_ASSISTANT_KEY) return this.data[key] ?? EMPTY;
    const active = this.getActiveGlobalConversation();
    return active?.messages ?? this.globalDraftMessages;
  };

  setMessages = (key: string, messages: ChatMessage[]) => {
    if (key === GLOBAL_AI_ASSISTANT_KEY) {
      const active = this.getActiveGlobalConversation();
      if (active) {
        this.globalConversations = this.globalConversations.map((conversation) =>
          conversation.id === active.id
            ? { ...conversation, messages, updatedAt: new Date() }
            : conversation,
        );
        this.sortGlobalConversations();
        this.notifyGlobalConversations();
      } else {
        this.globalDraftMessages = messages;
      }
      this.notify(key);
      return;
    }
    this.data[key] = messages;
    this.notify(key);
  };

  appendMessage = (key: string, message: ChatMessage) => {
    if (key === GLOBAL_AI_ASSISTANT_KEY) {
      const active = this.getActiveGlobalConversation();
      if (active) {
        this.globalConversations = this.globalConversations.map((conversation) =>
          conversation.id === active.id
            ? {
                ...conversation,
                messages: [...conversation.messages, message],
                updatedAt: new Date(),
              }
            : conversation,
        );
        this.sortGlobalConversations();
        this.notifyGlobalConversations();
      } else if (message.role === "user") {
        this.createGlobalConversationFromFirstUserMessage(message);
      } else {
        this.globalDraftMessages = [...this.globalDraftMessages, message];
      }
      this.notify(key);
      return;
    }
    this.data[key] = [...(this.data[key] ?? []), message];
    this.notify(key);
  };

  patchMessage = (key: string, messageId: string, partial: Partial<ChatMessage>) => {
    const mapMessages = (messages: ChatMessage[]) => {
      const idx = messages.findIndex((m) => m.id === messageId);
      if (idx === -1) return messages;
      const next = [...messages];
      next[idx] = { ...next[idx]!, ...partial };
      return next;
    };

    if (key === GLOBAL_AI_ASSISTANT_KEY) {
      const active = this.getActiveGlobalConversation();
      if (active) {
        this.globalConversations = this.globalConversations.map((conversation) =>
          conversation.id === active.id
            ? {
                ...conversation,
                messages: mapMessages(conversation.messages),
                updatedAt: new Date(),
              }
            : conversation,
        );
        this.sortGlobalConversations();
        this.notifyGlobalConversations();
      } else {
        this.globalDraftMessages = mapMessages(this.globalDraftMessages);
      }
      this.notify(key);
      return;
    }
    const cur = this.data[key] ?? [];
    this.data[key] = mapMessages(cur);
    this.notify(key);
  };

  clearMessages = (key: string) => {
    if (key === GLOBAL_AI_ASSISTANT_KEY) {
      const active = this.getActiveGlobalConversation();
      if (active) {
        this.globalConversations = this.globalConversations.map((conversation) =>
          conversation.id === active.id
            ? { ...conversation, messages: [], updatedAt: new Date() }
            : conversation,
        );
        this.sortGlobalConversations();
        this.notifyGlobalConversations();
      } else {
        this.globalDraftMessages = [];
      }
      this.notify(key);
      return;
    }
    delete this.data[key];
    this.notify(key);
  };

  getGlobalAiConversations = (): GlobalAiConversation[] => this.globalConversations;

  getActiveGlobalAiConversationId = (): string | null => this.globalActiveConversationId;

  getGlobalAiDraftDisplayName = (): string => this.globalDraftDisplayName;

  setGlobalAiDraftDisplayName = (title: string, options?: { userSet?: boolean }) => {
    const trimmed = title.trim() || GLOBAL_AI_DEFAULT_CHAT_TITLE;
    this.globalDraftDisplayName = trimmed;
    if (options?.userSet) this.globalDraftDisplayNameUserSet = true;
    this.notifyDraftMeta();
  };

  updateGlobalAiConversationTitle = (conversationId: string, title: string) => {
    const trimmed = title.trim() || GLOBAL_AI_DEFAULT_CHAT_TITLE;
    this.globalConversations = this.globalConversations.map((conversation) =>
      conversation.id === conversationId
        ? { ...conversation, name: trimmed, usesAutoTitle: false, updatedAt: new Date() }
        : conversation,
    );
    this.sortGlobalConversations();
    this.notifyGlobalConversations();
    if (this.globalActiveConversationId === conversationId) {
      this.notify(GLOBAL_AI_ASSISTANT_KEY);
    }
  };

  startNewGlobalAiDraft = () => {
    const prevId = this.globalActiveConversationId;
    this.finalizeDefaultTitleIfNeeded(prevId);
    this.globalActiveConversationId = null;
    this.globalDraftMessages = [];
    this.globalDraftDisplayName = GLOBAL_AI_DEFAULT_CHAT_TITLE;
    this.globalDraftDisplayNameUserSet = false;
    this.notifyGlobalActiveConversation();
    this.notifyDraftMeta();
    this.notify(GLOBAL_AI_ASSISTANT_KEY);
  };

  setActiveGlobalAiConversation = (conversationId: string | null) => {
    const prevId = this.globalActiveConversationId;
    if (conversationId !== prevId) {
      this.finalizeDefaultTitleIfNeeded(prevId);
    }
    if (!conversationId) {
      this.globalActiveConversationId = null;
      this.notifyGlobalActiveConversation();
      this.notify(GLOBAL_AI_ASSISTANT_KEY);
      return;
    }
    const exists = this.globalConversations.some((c) => c.id === conversationId);
    if (!exists) return;
    this.globalActiveConversationId = conversationId;
    this.notifyGlobalActiveConversation();
    this.notify(GLOBAL_AI_ASSISTANT_KEY);
  };

  deleteGlobalAiConversation = (conversationId: string) => {
    this.globalConversations = this.globalConversations.filter((c) => c.id !== conversationId);
    if (this.globalActiveConversationId === conversationId) {
      this.globalActiveConversationId = null;
      this.notifyGlobalActiveConversation();
      this.notify(GLOBAL_AI_ASSISTANT_KEY);
    }
    this.notifyGlobalConversations();
  };

  /**
   * One-time hydration: mirror active Explore drafts into AI Assistant Chat History
   * (matching titles + messages). Skips if the user already has global chats.
   */
  seedGlobalAiFromExploreConversationsIfEmpty = (exploreConversations: Conversation[]) => {
    if (this.globalConversations.length > 0) return;
    const active = exploreConversations.filter((c) => !c.archived);
    if (active.length === 0) return;
    this.globalConversations = active.map((c) => {
      const messages = c.messages.map((m) => conversationMessageToGlobalChat(m));
      const lastTs =
        messages.length > 0 ? messages[messages.length - 1]!.timestamp : c.createdAt;
      return {
        id: `gai-${c.id}`,
        name: c.name,
        usesAutoTitle: false,
        createdAt: c.createdAt,
        updatedAt: lastTs.getTime() >= c.createdAt.getTime() ? lastTs : c.createdAt,
        messages,
      };
    });
    this.globalActiveConversationId = null;
    this.sortGlobalConversations();
    this.notifyGlobalConversations();
    this.notifyGlobalActiveConversation();
    this.notify(GLOBAL_AI_ASSISTANT_KEY);
  };

  private finalizeDefaultTitleIfNeeded(conversationId: string | null) {
    if (!conversationId) return;
    const target = this.globalConversations.find((c) => c.id === conversationId);
    if (!target?.usesAutoTitle) return;
    if (target.name.trim() !== GLOBAL_AI_DEFAULT_CHAT_TITLE) return;
    const firstUser = target.messages.find((m) => m.role === "user" && m.content.trim());
    if (!firstUser) return;
    const generated = conversationNameFromPrompt(firstUser.content);
    this.globalConversations = this.globalConversations.map((conversation) =>
      conversation.id === conversationId
        ? { ...conversation, name: generated, usesAutoTitle: false, updatedAt: new Date() }
        : conversation,
    );
    this.sortGlobalConversations();
    this.notifyGlobalConversations();
    if (this.globalActiveConversationId === conversationId) {
      this.notify(GLOBAL_AI_ASSISTANT_KEY);
    }
  }

  private createGlobalConversationFromFirstUserMessage(message: ChatMessage) {
    const now = new Date();
    const displayName = this.globalDraftDisplayName.trim() || GLOBAL_AI_DEFAULT_CHAT_TITLE;
    const usesAutoTitle = !this.globalDraftDisplayNameUserSet && displayName === GLOBAL_AI_DEFAULT_CHAT_TITLE;
    const convo: GlobalAiConversation = {
      id: crypto.randomUUID(),
      name: displayName,
      usesAutoTitle,
      createdAt: now,
      updatedAt: now,
      messages: [message],
    };
    this.globalConversations = [convo, ...this.globalConversations];
    this.globalActiveConversationId = convo.id;
    this.globalDraftMessages = [];
    this.globalDraftDisplayName = GLOBAL_AI_DEFAULT_CHAT_TITLE;
    this.globalDraftDisplayNameUserSet = false;
    this.notifyDraftMeta();
    this.notifyGlobalConversations();
    this.notifyGlobalActiveConversation();
  }

  private getActiveGlobalConversation(): GlobalAiConversation | undefined {
    if (!this.globalActiveConversationId) return undefined;
    return this.globalConversations.find((c) => c.id === this.globalActiveConversationId);
  }

  private sortGlobalConversations() {
    this.globalConversations = [...this.globalConversations].sort(
      (a, b) => b.updatedAt.getTime() - a.updatedAt.getTime(),
    );
  }

  private notifyGlobalConversations() {
    this.globalConversationListeners.forEach((l) => l());
  }

  private notifyGlobalActiveConversation() {
    this.globalActiveListeners.forEach((l) => l());
  }

  private notifyDraftMeta() {
    this.draftMetaListeners.forEach((l) => l());
  }

  private notify(key: string) {
    this.listeners.forEach((l) => l());
    this.keyListeners.get(key)?.forEach((l) => l());
  }
}

interface DashboardChatContextType {
  getMessages: (dashboardKey: string) => ChatMessage[];
  setMessages: (dashboardKey: string, messages: ChatMessage[]) => void;
  appendMessage: (dashboardKey: string, message: ChatMessage) => void;
  patchMessage: (dashboardKey: string, messageId: string, partial: Partial<ChatMessage>) => void;
  clearMessages: (dashboardKey: string) => void;
  getGlobalAiConversations: () => GlobalAiConversation[];
  getActiveGlobalAiConversationId: () => string | null;
  getGlobalAiDraftDisplayName: () => string;
  setGlobalAiDraftDisplayName: (title: string, options?: { userSet?: boolean }) => void;
  updateGlobalAiConversationTitle: (conversationId: string, title: string) => void;
  deleteGlobalAiConversation: (conversationId: string) => void;
  startNewGlobalAiDraft: () => void;
  setActiveGlobalAiConversation: (conversationId: string | null) => void;
  seedGlobalAiFromExploreConversationsIfEmpty: (exploreConversations: Conversation[]) => void;
  _store: ChatStore;
}

const DashboardChatContext = createContext<DashboardChatContextType | undefined>(undefined);

export function DashboardChatProvider({ children }: { children: ReactNode }) {
  const storeRef = useRef<ChatStore | null>(null);
  if (!storeRef.current) {
    storeRef.current = new ChatStore();
    // Single app-wide assistant thread — no per-dashboard seed data.
  }
  const store = storeRef.current;

  const value = useMemo<DashboardChatContextType>(
    () => ({
      getMessages: store.getMessages,
      setMessages: store.setMessages,
      appendMessage: store.appendMessage,
      patchMessage: store.patchMessage,
      clearMessages: store.clearMessages,
      getGlobalAiConversations: store.getGlobalAiConversations,
      getActiveGlobalAiConversationId: store.getActiveGlobalAiConversationId,
      getGlobalAiDraftDisplayName: store.getGlobalAiDraftDisplayName,
      setGlobalAiDraftDisplayName: store.setGlobalAiDraftDisplayName,
      updateGlobalAiConversationTitle: store.updateGlobalAiConversationTitle,
      deleteGlobalAiConversation: store.deleteGlobalAiConversation,
      startNewGlobalAiDraft: store.startNewGlobalAiDraft,
      setActiveGlobalAiConversation: store.setActiveGlobalAiConversation,
      seedGlobalAiFromExploreConversationsIfEmpty: store.seedGlobalAiFromExploreConversationsIfEmpty,
      _store: store,
    }),
    [store],
  );

  return (
    <DashboardChatContext.Provider value={value}>
      {children}
    </DashboardChatContext.Provider>
  );
}

export function useDashboardChat() {
  const context = useContext(DashboardChatContext);
  if (context === undefined) {
    throw new Error("useDashboardChat must be used within a DashboardChatProvider");
  }
  return context;
}

export function useDashboardMessages(dashboardKey: string): ChatMessage[] {
  const { _store: store } = useDashboardChat();

  const subscribe = useCallback(
    (onStoreChange: () => void) => store.subscribeKey(dashboardKey, onStoreChange),
    [store, dashboardKey],
  );

  const getSnapshot = useCallback(
    () => store.getMessages(dashboardKey),
    [store, dashboardKey],
  );

  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}

/** Subscribe to the single global AI assistant conversation. */
export function useGlobalAiMessages(): ChatMessage[] {
  return useDashboardMessages(GLOBAL_AI_ASSISTANT_KEY);
}

export function useGlobalAiConversations(): GlobalAiConversation[] {
  const { _store: store } = useDashboardChat();

  const subscribe = useCallback(
    (onStoreChange: () => void) => store.subscribeGlobalConversations(onStoreChange),
    [store],
  );

  const getSnapshot = useCallback(
    () => store.getGlobalAiConversations(),
    [store],
  );

  return useSyncExternalStore(subscribe, getSnapshot, () => EMPTY_CONVERSATIONS);
}

export function useActiveGlobalAiConversationId(): string | null {
  const { _store: store } = useDashboardChat();

  const subscribe = useCallback(
    (onStoreChange: () => void) => store.subscribeGlobalActiveConversation(onStoreChange),
    [store],
  );

  const getSnapshot = useCallback(
    () => store.getActiveGlobalAiConversationId(),
    [store],
  );

  return useSyncExternalStore(subscribe, getSnapshot, () => null);
}

export function useGlobalAiDraftDisplayName(): string {
  const { _store: store } = useDashboardChat();

  const subscribe = useCallback(
    (onStoreChange: () => void) => store.subscribeGlobalDraftMeta(onStoreChange),
    [store],
  );

  const getSnapshot = useCallback(
    () => store.getGlobalAiDraftDisplayName(),
    [store],
  );

  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}

export { ChatStore };
