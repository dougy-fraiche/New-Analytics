import { createContext, useContext, useState, useCallback, useMemo, type ReactNode } from "react";
import type { ChartRow, DashboardData, WidgetMessageMeta } from "../types/conversation-types";

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

export interface Message extends WidgetMessageMeta {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  dashboardData?: DashboardData;
  widgetData?: WidgetData;
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
  getConversationMessages: (conversationId: string) => Message[];
  renameConversation: (conversationId: string, newName: string) => void;
  archiveConversation: (conversationId: string) => void;
  unarchiveConversation: (conversationId: string) => void;
  deleteConversation: (conversationId: string) => void;
  restoreConversation: (conversation: Conversation) => void;
}

const ConversationContext = createContext<ConversationContextType | undefined>(undefined);

// ─── Mock seed conversations ──────────────────────────────────────────────

const MOCK_CONVERSATIONS: Conversation[] = [
  // ── Generic / cross-dashboard ────────────────────────────────────────────
  {
    id: "conv-mock-1",
    name: "Why are users dropping off at checkout?",
    createdAt: new Date("2026-01-08T14:32:00"),
    messages: [
      {
        id: "m1-1",
        role: "user",
        content: "Why are users dropping off at checkout?",
        timestamp: new Date("2026-01-08T14:32:00"),
      },
      {
        id: "m1-2",
        role: "assistant",
        content:
          "Based on the last 30 days of conversation data, the top three reasons users abandon checkout are:\n\n1. **Unexpected shipping costs** — 34% of drop-offs mention pricing surprises at the final step.\n2. **Account creation requirement** — 22% of users leave when prompted to create an account before paying.\n3. **Payment method limitations** — 18% cite missing payment options (Apple Pay, Klarna).\n\nWould you like me to generate a dashboard breaking down these abandonment reasons over time?",
        timestamp: new Date("2026-01-08T14:32:08"),
      },
      {
        id: "m1-3",
        role: "user",
        content: "What about mobile vs desktop — is there a difference?",
        timestamp: new Date("2026-01-08T14:33:15"),
      },
      {
        id: "m1-4",
        role: "assistant",
        content:
          "Yes, there's a significant split:\n\n- **Mobile** users drop off 2.4× more often at checkout, primarily due to form-filling friction and slow page loads on cellular connections.\n- **Desktop** users are more likely to abandon due to account creation requirements.\n\nMobile checkout completion improved by 12% last month after the autofill update, but it's still notably behind desktop (68% vs 81% completion rate).",
        timestamp: new Date("2026-01-08T14:33:24"),
      },
    ],
  },
  {
    id: "conv-mock-2",
    name: "Agent escalation trends this quarter",
    createdAt: new Date("2026-01-15T09:15:00"),
    messages: [
      {
        id: "m2-1",
        role: "user",
        content: "Show me agent escalation trends for this quarter",
        timestamp: new Date("2026-01-15T09:15:00"),
      },
      {
        id: "m2-2",
        role: "assistant",
        content:
          "Here's an escalation analysis for Q1 2026. Escalations peaked in late January around the billing system migration, then normalized. The overall escalation rate is down 8% compared to last quarter.",
        timestamp: new Date("2026-01-15T09:15:12"),
        dashboardData: {
          id: "mock-dash-escalation",
          title: "Agent Escalation Trends — Q1 2026",
          description:
            "Escalation volume, rate, and root-cause breakdown across all support channels.",
          metrics: [
            { label: "Total Escalations", value: "1,247" },
            { label: "Escalation Rate", value: "14.2%" },
            { label: "Avg Resolution Time", value: "4.3 hrs" },
            { label: "Repeat Escalation %", value: "8.6%" },
          ],
        },
      },
      {
        id: "m2-3",
        role: "user",
        content: "Which topics drive the most escalations?",
        timestamp: new Date("2026-01-15T09:16:30"),
      },
      {
        id: "m2-4",
        role: "assistant",
        content:
          "The top escalation drivers are:\n\n1. **Billing disputes** — 31% of all escalations, up from 24% last quarter\n2. **Technical outages** — 22%, clustered around the Jan 18–20 incident window\n3. **Account security** — 17%, steady quarter over quarter\n4. **Refund requests** — 14%, down slightly from 16%\n\nBilling disputes spiked specifically during the migration week (Jan 20–26). Excluding that week, the rate would be closer to 25%.",
        timestamp: new Date("2026-01-15T09:16:42"),
      },
    ],
  },
  {
    id: "conv-mock-3",
    name: "CSAT deep-dive by channel",
    createdAt: new Date("2026-01-22T11:05:00"),
    messages: [
      {
        id: "m3-1",
        role: "user",
        content: "Give me a CSAT breakdown by support channel",
        timestamp: new Date("2026-01-22T11:05:00"),
      },
      {
        id: "m3-2",
        role: "assistant",
        content:
          "I've generated a customer satisfaction dashboard segmented by channel. Chat leads with a 4.6 average, while email trails at 3.9 — mainly due to longer response times.",
        timestamp: new Date("2026-01-22T11:05:14"),
        dashboardData: {
          id: "mock-dash-csat",
          title: "Customer Satisfaction by Channel",
          description:
            "CSAT scores, response times, and satisfaction drivers across chat, email, phone, and social channels.",
          metrics: [
            { label: "Overall CSAT", value: "4.3 / 5" },
            { label: "Chat CSAT", value: "4.6 / 5" },
            { label: "Phone CSAT", value: "4.2 / 5" },
            { label: "Email CSAT", value: "3.9 / 5" },
          ],
        },
      },
      {
        id: "m3-3",
        role: "user",
        content: "Why is email so much lower?",
        timestamp: new Date("2026-01-22T11:06:20"),
      },
      {
        id: "m3-4",
        role: "assistant",
        content:
          "Email CSAT is dragged down by two key factors:\n\n1. **Response latency** — median first response is 6.2 hours vs. 45 seconds for chat. Users who wait >4 hours rate satisfaction 1.2 points lower on average.\n2. **Resolution loops** — email conversations average 3.4 back-and-forth messages before resolution vs. 1.8 for chat, creating frustration.\n\nTeams that adopted the new email triage templates last month saw a 0.3-point CSAT improvement, suggesting process changes could close the gap.",
        timestamp: new Date("2026-01-22T11:06:34"),
      },
    ],
  },

  // ── Agent Queries (2 threads) ─────────────────────────────────────────────
  {
    id: "conv-mock-aq-1",
    name: "Which agent queries have deflection potential?",
    createdAt: new Date("2026-01-28T10:10:00"),
    messages: [
      {
        id: "maq1-1",
        role: "user",
        content: "Which agent queries have the highest deflection potential?",
        timestamp: new Date("2026-01-28T10:10:00"),
      },
      {
        id: "maq1-2",
        role: "assistant",
        content:
          "I've identified the top query clusters where self-service or automation could deflect agent workload. Password resets, order status checks, and plan upgrade questions together account for 41% of total query volume — all of which have existing self-service paths that are underutilized.",
        timestamp: new Date("2026-01-28T10:10:18"),
        dashboardData: {
          id: "mock-dash-aq-deflection",
          title: "Agent Query Deflection Opportunities",
          description:
            "Query volume, deflection readiness scores, and self-service coverage gaps by intent cluster.",
          metrics: [
            { label: "Deflectable Queries", value: "41%" },
            { label: "Top Cluster: Password Reset", value: "8,240 / mo" },
            { label: "Avg Handle Time (deflectable)", value: "3.1 min" },
            { label: "Est. Monthly Agent Hours Saved", value: "1,420 hrs" },
          ],
        },
      },
      {
        id: "maq1-3",
        role: "user",
        content: "What would it take to actually deflect the password reset ones?",
        timestamp: new Date("2026-01-28T10:12:05"),
      },
      {
        id: "maq1-4",
        role: "assistant",
        content:
          "Password reset deflection is mostly a routing problem. The self-service flow already exists — 73% of users who reach the self-service page successfully reset without agent help. The issue is that 62% of users who contact an agent about this never saw the self-service option. Surfacing it in the chat widget before opening a conversation could deflect the majority of these queries with minimal engineering lift.",
        timestamp: new Date("2026-01-28T10:12:29"),
      },
    ],
  },
  {
    id: "conv-mock-aq-2",
    name: "Are agents searching before escalating?",
    createdAt: new Date("2026-02-10T15:40:00"),
    messages: [
      {
        id: "maq2-1",
        role: "user",
        content: "Are agents using internal search effectively before escalating conversations?",
        timestamp: new Date("2026-02-10T15:40:00"),
      },
      {
        id: "maq2-2",
        role: "assistant",
        content:
          "Search usage before escalation varies significantly by team. Tier 1 agents perform a search in 68% of conversations before escalating, but Tier 2 drops to 29%. Conversations with at least one search event resolve 22% faster on average, suggesting there's meaningful room to improve Tier 2 search habits.",
        timestamp: new Date("2026-02-10T15:40:14"),
      },
      {
        id: "maq2-3",
        role: "user",
        content: "What are Tier 2 agents doing instead?",
        timestamp: new Date("2026-02-10T15:41:20"),
      },
      {
        id: "maq2-4",
        role: "assistant",
        content:
          "Tier 2 agents are more likely to rely on direct colleague messaging (Slack/Teams), with 54% flagging 'asked a colleague' as their primary resolution path in post-conversation tagging. This is faster in the short term but doesn't scale and bypasses the knowledge base, so those answers never get captured for future use.",
        timestamp: new Date("2026-02-10T15:41:38"),
      },
    ],
  },

  // ── Auto Summary (1 thread) ───────────────────────────────────────────────
  {
    id: "conv-mock-as-1",
    name: "AI summary accuracy this week",
    createdAt: new Date("2026-02-03T08:55:00"),
    messages: [
      {
        id: "mas1-1",
        role: "user",
        content: "How accurate are the AI-generated conversation summaries this week?",
        timestamp: new Date("2026-02-03T08:55:00"),
      },
      {
        id: "mas1-2",
        role: "assistant",
        content:
          "This week's auto-summary accuracy is sitting at 91.4% — up from 88.7% last week. The main improvement came from better handling of multi-intent conversations after the model update on Monday. However, summaries for conversations involving billing disputes still lag at 84.2% accuracy.",
        timestamp: new Date("2026-02-03T08:55:20"),
        dashboardData: {
          id: "mock-dash-auto-summary",
          title: "Auto Summary Accuracy — Feb W1 2026",
          description:
            "Summary quality scores, human review rates, and intent-level accuracy breakdown.",
          metrics: [
            { label: "Overall Accuracy", value: "91.4%" },
            { label: "Human Review Rate", value: "6.2%" },
            { label: "Worst Intent: Billing", value: "84.2%" },
            { label: "Avg Summary Length", value: "47 words" },
          ],
        },
      },
    ],
  },

  // ── Task Assist (2 threads) ───────────────────────────────────────────────
  {
    id: "conv-mock-ta-1",
    name: "Fastest tasks completed with Task Assist",
    createdAt: new Date("2026-02-06T13:20:00"),
    messages: [
      {
        id: "mta1-1",
        role: "user",
        content: "What tasks are agents completing fastest with Task Assist?",
        timestamp: new Date("2026-02-06T13:20:00"),
      },
      {
        id: "mta1-2",
        role: "assistant",
        content:
          "The three fastest-completed task types are subscription downgrades (avg 38 sec), address updates (avg 52 sec), and refund initiations (avg 1 min 14 sec). All three have pre-filled form templates in Task Assist, which accounts for the speed advantage versus free-form task handling.",
        timestamp: new Date("2026-02-06T13:20:22"),
        dashboardData: {
          id: "mock-dash-task-assist",
          title: "Task Assist Performance Breakdown",
          description:
            "Completion times, adoption rates, and time savings by task type across all agent teams.",
          metrics: [
            { label: "Tasks Completed via Assist", value: "14,820" },
            { label: "Avg Time Saved per Task", value: "2.4 min" },
            { label: "Top Task: Subscription Change", value: "38 sec avg" },
            { label: "Overall Adoption Rate", value: "63%" },
          ],
        },
      },
    ],
  },
  {
    id: "conv-mock-ta-2",
    name: "Task Assist adoption month over month",
    createdAt: new Date("2026-02-18T09:05:00"),
    messages: [
      {
        id: "mta2-1",
        role: "user",
        content: "Is Task Assist adoption growing month over month?",
        timestamp: new Date("2026-02-18T09:05:00"),
      },
      {
        id: "mta2-2",
        role: "assistant",
        content:
          "Adoption has grown consistently: 41% in November, 51% in December, 57% in January, and 63% so far in February. The jump from December to January correlates with the onboarding module released Jan 6th. Teams that completed the onboarding show 79% adoption vs 47% for those who haven't.",
        timestamp: new Date("2026-02-18T09:05:19"),
      },
      {
        id: "mta2-3",
        role: "user",
        content: "Which teams still have low adoption?",
        timestamp: new Date("2026-02-18T09:06:40"),
      },
      {
        id: "mta2-4",
        role: "assistant",
        content:
          "The Technical Escalations team is the outlier at 31% adoption. Their team lead noted in last week's QBR that agents feel the task templates don't map well to their more complex workflows. This suggests a template gap rather than a training issue — adding 3–4 technical task templates could move the needle significantly.",
        timestamp: new Date("2026-02-18T09:07:01"),
      },
    ],
  },
];

export function ConversationProvider({ children }: { children: ReactNode }) {
  const [conversations, setConversations] = useState<Conversation[]>(MOCK_CONVERSATIONS);
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