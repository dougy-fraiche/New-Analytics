import { createContext, useContext, useState, useCallback, useMemo, type ReactNode } from "react";
import type {
  AnomalyInvestigationMeta,
  AssistantStructuredFields,
  ChartRow,
  DashboardData,
  WidgetMessageMeta,
} from "../types/conversation-types";

// Context for managing conversations and messages across the Explore page
export type { DashboardData };

export interface WidgetData {
  id: string;
  chartType: "area" | "bar" | "line" | "donut" | "metric";
  title: string;
  description: string;
  value?: string;
  change?: string;
  trend?: "up" | "down" | "neutral";
  data: ChartRow[];
  xKey: string;
  yKey: string;
}

export interface Message extends WidgetMessageMeta, AssistantStructuredFields {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  anomalyInvestigation?: AnomalyInvestigationMeta;
  dashboardData?: DashboardData;
  widgetData?: WidgetData;
  isTypingContent?: boolean;
}

export interface Conversation {
  id: string;
  name: string;
  createdAt: Date;
  messages: Message[];
  archived?: boolean;
}

interface ConversationContextType {
  conversations: Conversation[];
  activeConversationId: string | null;
  addConversation: (name: string) => Conversation;
  setActiveConversationId: (id: string | null) => void;
  addMessageToConversation: (conversationId: string, message: Message) => void;
  patchMessageInConversation: (
    conversationId: string,
    messageId: string,
    partial: Partial<Message>,
  ) => void;
  getConversationMessages: (conversationId: string) => Message[];
  renameConversation: (conversationId: string, newName: string) => void;
  archiveConversation: (conversationId: string) => void;
  unarchiveConversation: (conversationId: string) => void;
  deleteConversation: (conversationId: string) => void;
  restoreConversation: (conversation: Conversation) => void;
}

const ConversationContext = createContext<ConversationContextType | undefined>(undefined);

// Explore conversations start empty until the user creates one.

export function ConversationProvider({ children }: { children: ReactNode }) {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversationId, setActiveConversationIdRaw] = useState<string | null>(null);

  // Derived Map for O(1) lookups (memoised to avoid rebuilding on every render)
  const conversationMap = useMemo(() => {
    const map = new Map<string, Conversation>();
    for (const c of conversations) {
      map.set(c.id, c);
    }
    return map;
  }, [conversations]);

  // Wrap the raw setter so it only triggers a re-render when the value actually changes
  const setActiveConversationId = useCallback((id: string | null) => {
    setActiveConversationIdRaw((prev) => (prev === id ? prev : id));
  }, []);

  const addConversation = useCallback((name: string): Conversation => {
    const newConversation: Conversation = {
      id: `conv-${Date.now()}`,
      name,
      createdAt: new Date(),
      messages: [],
    };
    setConversations((prev) => [newConversation, ...prev]);
    return newConversation;
  }, []);

  const addMessageToConversation = useCallback((conversationId: string, message: Message) => {
    setConversations((prev) =>
      prev.map((conv) =>
        conv.id === conversationId
          ? { ...conv, messages: [...conv.messages, message] }
          : conv
      )
    );
  }, []);

  const patchMessageInConversation = useCallback(
    (conversationId: string, messageId: string, partial: Partial<Message>) => {
      setConversations((prev) =>
        prev.map((conv) =>
          conv.id !== conversationId
            ? conv
            : {
                ...conv,
                messages: conv.messages.map((m) =>
                  m.id === messageId ? { ...m, ...partial } : m,
                ),
              },
        ),
      );
    },
    [],
  );

  const getConversationMessages = useCallback((conversationId: string): Message[] => {
    const conversation = conversationMap.get(conversationId);
    return conversation?.messages || [];
  }, [conversationMap]);

  const renameConversation = useCallback((conversationId: string, newName: string) => {
    setConversations((prev) =>
      prev.map((conv) =>
        conv.id === conversationId ? { ...conv, name: newName } : conv
      )
    );
  }, []);

  const archiveConversation = useCallback((conversationId: string) => {
    setConversations((prev) =>
      prev.map((conv) =>
        conv.id === conversationId ? { ...conv, archived: true } : conv
      )
    );
  }, []);

  const unarchiveConversation = useCallback((conversationId: string) => {
    setConversations((prev) =>
      prev.map((conv) =>
        conv.id === conversationId ? { ...conv, archived: false } : conv
      )
    );
  }, []);

  const deleteConversation = useCallback((conversationId: string) => {
    setConversations((prev) => prev.filter((conv) => conv.id !== conversationId));
  }, []);

  const restoreConversation = useCallback((conversation: Conversation) => {
    setConversations((prev) => {
      // Avoid duplicates
      if (prev.some((c) => c.id === conversation.id)) return prev;
      // Re-insert in chronological order (newest first)
      const updated = [...prev, conversation];
      updated.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      return updated;
    });
  }, []);

  const value = useMemo(
    () => ({
      conversations,
      activeConversationId,
      addConversation,
      setActiveConversationId,
      addMessageToConversation,
      patchMessageInConversation,
      getConversationMessages,
      renameConversation,
      archiveConversation,
      unarchiveConversation,
      deleteConversation,
      restoreConversation,
    }),
    [
      conversations,
      activeConversationId,
      addConversation,
      setActiveConversationId,
      addMessageToConversation,
      patchMessageInConversation,
      getConversationMessages,
      renameConversation,
      archiveConversation,
      unarchiveConversation,
      deleteConversation,
      restoreConversation,
    ]
  );

  return (
    <ConversationContext.Provider value={value}>
      {children}
    </ConversationContext.Provider>
  );
}

export function useConversations() {
  const context = useContext(ConversationContext);
  if (context === undefined) {
    throw new Error("useConversations must be used within a ConversationProvider");
  }
  return context;
}
