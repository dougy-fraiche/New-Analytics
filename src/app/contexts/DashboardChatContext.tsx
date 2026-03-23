import { createContext, useContext, useCallback, useRef, useSyncExternalStore, useMemo, ReactNode } from "react";
import { SEED_DASHBOARD_THREADS } from "../data/seed-dashboard-threads";

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  dashboardData?: any;
  /** Optional widget reference — shown as a badge above the message */
  widgetRef?: string;
  /** When the prompt originated from a chart KPI/segment selection, shown with the widget title */
  widgetKpiLabel?: string;
  /** Optional chart type for widget icon in the badge */
  widgetIconType?: string;
  /** Optional in-page anchor for jumping back to the originating card */
  widgetAnchorId?: string;
}

export interface ChatThread {
  id: string;
  title: string;
  createdAt: Date;
  updatedAt: Date;
}

type Listener = () => void;

/**
 * Lightweight external store for dashboard chat messages.
 * Allows per-key subscriptions so that only the consumers of a specific
 * dashboard key re-render when that key's messages change.
 *
 * Supports multi-thread conversations per dashboard. Messages for a thread
 * are stored under the composite key `${dashboardKey}::thread::${threadId}`.
 * Thread metadata is stored separately per dashboard key.
 */
class ChatStore {
  private data: Record<string, ChatMessage[]> = {};
  private threads: Record<string, ChatThread[]> = {};
  private listeners = new Set<Listener>();
  private keyListeners = new Map<string, Set<Listener>>();

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

  // ── Message operations ───────────────────────────────────────────────

  getMessages = (key: string): ChatMessage[] => this.data[key] ?? EMPTY;

  setMessages = (key: string, messages: ChatMessage[]) => {
    this.data[key] = messages;
    this.notify(key);
  };

  appendMessage = (key: string, message: ChatMessage) => {
    this.data[key] = [...(this.data[key] ?? []), message];
    this.notify(key);
  };

  clearMessages = (key: string) => {
    delete this.data[key];
    this.notify(key);
  };

  // ── Thread operations ────────────────────────────────────────────────

  static threadKey(dashboardKey: string, threadId: string) {
    return `${dashboardKey}::thread::${threadId}`;
  }

  /** Key used for subscribing to thread-list changes for a dashboard */
  static threadsListKey(dashboardKey: string) {
    return `${dashboardKey}::__threads__`;
  }

  getThreads = (dashboardKey: string): ChatThread[] =>
    this.threads[dashboardKey] ?? EMPTY_THREADS;

  createThread = (dashboardKey: string, title: string, id?: string): ChatThread => {
    const thread: ChatThread = {
      id: id ?? crypto.randomUUID(),
      title,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.threads[dashboardKey] = [...(this.threads[dashboardKey] ?? []), thread];
    this.notify(ChatStore.threadsListKey(dashboardKey));
    return thread;
  };

  updateThreadTimestamp = (dashboardKey: string, threadId: string) => {
    const list = this.threads[dashboardKey];
    if (!list) return;
    this.threads[dashboardKey] = list.map((t) =>
      t.id === threadId ? { ...t, updatedAt: new Date() } : t,
    );
    this.notify(ChatStore.threadsListKey(dashboardKey));
  };

  renameThread = (dashboardKey: string, threadId: string, title: string): void => {
    const list = this.threads[dashboardKey];
    if (!list) return;
    this.threads[dashboardKey] = list.map((t) =>
      t.id === threadId ? { ...t, title, updatedAt: new Date() } : t,
    );
    this.notify(ChatStore.threadsListKey(dashboardKey));
  };

  deleteThread = (dashboardKey: string, threadId: string) => {
    const list = this.threads[dashboardKey];
    if (!list) return;
    this.threads[dashboardKey] = list.filter((t) => t.id !== threadId);
    // Also clean up thread messages
    const msgKey = ChatStore.threadKey(dashboardKey, threadId);
    delete this.data[msgKey];
    this.notify(ChatStore.threadsListKey(dashboardKey));
    this.notify(msgKey);
  };

  private notify(key: string) {
    this.listeners.forEach((l) => l());
    this.keyListeners.get(key)?.forEach((l) => l());
  }
}

const EMPTY: ChatMessage[] = [];
const EMPTY_THREADS: ChatThread[] = [];

interface DashboardChatContextType {
  /** Get persisted messages for a given dashboard key */
  getMessages: (dashboardKey: string) => ChatMessage[];
  /** Replace the full message list for a dashboard key */
  setMessages: (dashboardKey: string, messages: ChatMessage[]) => void;
  /** Append a single message to a dashboard's history */
  appendMessage: (dashboardKey: string, message: ChatMessage) => void;
  /** Clear conversation for a specific dashboard */
  clearMessages: (dashboardKey: string) => void;
  /** Get all threads for a dashboard */
  getThreads: (dashboardKey: string) => ChatThread[];
  /** Create a new thread */
  createThread: (dashboardKey: string, title: string, id?: string) => ChatThread;
  /** Update a thread's timestamp */
  updateThreadTimestamp: (dashboardKey: string, threadId: string) => void;
  /** Rename a thread */
  renameThread: (dashboardKey: string, threadId: string, title: string) => void;
  /** Delete a thread and its messages */
  deleteThread: (dashboardKey: string, threadId: string) => void;
  /** Access the underlying store for per-key subscriptions */
  _store: ChatStore;
}

const DashboardChatContext = createContext<DashboardChatContextType | undefined>(undefined);

export function DashboardChatProvider({ children }: { children: ReactNode }) {
  // Store is stable for the lifetime of the provider
  const storeRef = useRef<ChatStore>(null);
  if (!storeRef.current) {
    storeRef.current = new ChatStore();
    // Seed with placeholder threads for OOTB dashboards
    const store = storeRef.current;
    for (const [dashboardKey, seedThreads] of Object.entries(SEED_DASHBOARD_THREADS)) {
      for (const { thread, messages } of seedThreads) {
        store.createThread(dashboardKey, thread.title, thread.id);
        const msgKey = ChatStore.threadKey(dashboardKey, thread.id);
        store.setMessages(msgKey, messages);
      }
    }
  }
  const store = storeRef.current;

  // Memoize context value so consumers don't re-render when the provider re-renders
  const value = useMemo<DashboardChatContextType>(
    () => ({
      getMessages: store.getMessages,
      setMessages: store.setMessages,
      appendMessage: store.appendMessage,
      clearMessages: store.clearMessages,
      getThreads: store.getThreads,
      createThread: store.createThread,
      updateThreadTimestamp: store.updateThreadTimestamp,
      renameThread: store.renameThread,
      deleteThread: store.deleteThread,
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

/**
 * Per-key selector hook — only re-renders when THIS dashboard's
 * messages change, not when any other dashboard's messages change.
 */
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

/**
 * Per-dashboard thread list hook — only re-renders when the thread list
 * for THIS dashboard changes.
 */
export function useDashboardThreads(dashboardKey: string): ChatThread[] {
  const ctx = useDashboardChat();
  const store = ctx._store;

  const subscribe = useCallback(
    (onStoreChange: () => void) =>
      store.subscribeKey(ChatStore.threadsListKey(dashboardKey), onStoreChange),
    [store, dashboardKey],
  );

  const getSnapshot = useCallback(
    () => ctx.getThreads(dashboardKey),
    [ctx, dashboardKey],
  );

  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}

export { ChatStore };