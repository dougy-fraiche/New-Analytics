import { createContext, useContext, useCallback, useRef, useSyncExternalStore, useMemo, ReactNode } from "react";
import { GLOBAL_AI_ASSISTANT_KEY } from "../lib/ai-assistant-global";

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

type Listener = () => void;

/**
 * Lightweight external store for dashboard chat messages.
 * One conversation per dashboard key (persistKey).
 */
class ChatStore {
  private data: Record<string, ChatMessage[]> = {};
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

  private notify(key: string) {
    this.listeners.forEach((l) => l());
    this.keyListeners.get(key)?.forEach((l) => l());
  }
}

const EMPTY: ChatMessage[] = [];

interface DashboardChatContextType {
  getMessages: (dashboardKey: string) => ChatMessage[];
  setMessages: (dashboardKey: string, messages: ChatMessage[]) => void;
  appendMessage: (dashboardKey: string, message: ChatMessage) => void;
  clearMessages: (dashboardKey: string) => void;
  _store: ChatStore;
}

const DashboardChatContext = createContext<DashboardChatContextType | undefined>(undefined);

export function DashboardChatProvider({ children }: { children: ReactNode }) {
  const storeRef = useRef<ChatStore>(null);
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
      clearMessages: store.clearMessages,
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

export { ChatStore };
