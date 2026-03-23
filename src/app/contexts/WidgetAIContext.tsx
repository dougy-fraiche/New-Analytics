import { createContext, useContext, ReactNode, useCallback, useRef } from "react";
import { useDashboardChat, ChatStore, type ChatMessage } from "./DashboardChatContext";

const WIDGET_THREAD_CREATED_EVENT = "widget-ai-thread-created";

interface WidgetAIContextType {
  /** Send a prompt from a widget to the AI chat panel */
  sendWidgetPrompt: (
    widgetTitle: string,
    message: string,
    chartType?: string,
    widgetAnchorId?: string,
    selectedKpiLabel?: string | null,
  ) => void;
}

const WidgetAIContext = createContext<WidgetAIContextType | undefined>(undefined);

interface WidgetAIProviderProps {
  children: ReactNode;
  /** Persistence key for the dashboard chat (same key used by DashboardChatPanel) */
  persistKey: string;
  /** OOTB type ID for AI response generation */
  ootbTypeId?: string;
  /** Optional callback for external response generation (e.g. custom pages) */
  generateResponse?: (message: string) => string;
  /** When provided, overrides default behaviour and sends the prompt externally (e.g. back to the Explore conversation) */
  onWidgetPrompt?: (
    widgetTitle: string,
    message: string,
    chartType?: string,
    selectedKpiLabel?: string | null,
  ) => void;
}

/** Default generic response generator for widget-sourced questions */
function defaultWidgetResponse(
  widgetTitle: string,
  userMessage: string,
  selectedKpiLabel?: string | null,
): string {
  const widgetScope = selectedKpiLabel
    ? `the "${widgetTitle}" widget (selected: "${selectedKpiLabel}")`
    : `the "${widgetTitle}" widget`;
  const lower = userMessage.toLowerCase();

  if (lower.includes("trend") || lower.includes("pattern")) {
    return `Looking at ${widgetScope}, I can see a clear upward trend over the observed period. The data shows approximately 12% growth month-over-month with some cyclical variation. Would you like me to break down the contributing factors or forecast the next period?`;
  }
  if (lower.includes("anomal") || lower.includes("outlier") || lower.includes("unusual")) {
    return `In ${widgetScope}, there are two notable anomalies: a spike on Feb 17 that's 2.1 standard deviations above the mean, and a dip in late January. The spike correlates with a product launch event. Want me to investigate the root cause of the January dip?`;
  }
  if (lower.includes("compare") || lower.includes("versus") || lower.includes("vs")) {
    return `Comparing the data in ${widgetScope}: the current period shows a 14% improvement over the previous period across most segments. The strongest gains are in the top two categories. Shall I generate a detailed comparison table?`;
  }
  if (lower.includes("explain") || lower.includes("what does") || lower.includes("meaning")) {
    return `${widgetScope.charAt(0).toUpperCase() + widgetScope.slice(1)} shows the distribution and trend of the underlying metric. The current values indicate healthy performance, with the primary segment contributing 34% of the total. Would you like a deeper breakdown of any specific segment?`;
  }
  if (lower.includes("export") || lower.includes("download") || lower.includes("csv")) {
    return `I can export the data from "${widgetTitle}" in CSV or PDF format. The export will include all data points currently displayed. Which format would you prefer?`;
  }
  if (lower.includes("filter") || lower.includes("drill") || lower.includes("breakdown")) {
    return `I can drill down into ${widgetScope} by time period (daily, weekly, monthly), by segment, or by source channel. The most insightful breakdown appears to be by segment, which reveals a 3x difference between top and bottom performers. What dimension would you like to explore?`;
  }

  return `Looking at ${widgetScope} data, here are the key takeaways: the primary metric is trending positively (+8.3% MoM), the top segment accounts for 31% of the total, and there's a notable acceleration in the most recent period. Would you like me to analyze a specific aspect in more detail?`;
}

export function WidgetAIProvider({
  children,
  persistKey,
  ootbTypeId,
  generateResponse,
  onWidgetPrompt,
}: WidgetAIProviderProps) {
  const dashboardChat = useDashboardChat();
  const ootbTypeIdRef = useRef(ootbTypeId);
  ootbTypeIdRef.current = ootbTypeId;

  const sendWidgetPrompt = useCallback(
    (
      widgetTitle: string,
      message: string,
      chartType?: string,
      widgetAnchorId?: string,
      selectedKpiLabel?: string | null,
    ) => {
      // If an external handler is provided, delegate entirely to it
      if (onWidgetPrompt) {
        onWidgetPrompt(widgetTitle, message, chartType, selectedKpiLabel);
        return;
      }

      const kpiSuffix = selectedKpiLabel?.trim() ? ` · ${selectedKpiLabel.trim()}` : "";
      // Create a new thread for this widget prompt
      const threadTitle = `${widgetTitle}${kpiSuffix}: ${message.length > 40 ? message.slice(0, 40) + "\u2026" : message}`;
      const thread = dashboardChat.createThread(persistKey, threadTitle);
      const threadMsgKey = ChatStore.threadKey(persistKey, thread.id);

      // Tell the assistant panel to open the newly created thread (if present on the page)
      window.dispatchEvent(
        new CustomEvent(WIDGET_THREAD_CREATED_EVENT, {
          detail: { persistKey, threadId: thread.id },
        }),
      );

      const userMessage: ChatMessage = {
        id: crypto.randomUUID(),
        role: "user",
        content: message,
        timestamp: new Date(),
        widgetRef: widgetTitle,
        ...(selectedKpiLabel?.trim()
          ? { widgetKpiLabel: selectedKpiLabel.trim() }
          : {}),
        widgetIconType: chartType,
        widgetAnchorId,
      };

      dashboardChat.appendMessage(threadMsgKey, userMessage);

      // Generate AI response after delay
      setTimeout(() => {
        let responseText: string;

        if (generateResponse) {
          responseText = generateResponse(message);
        } else {
          responseText = defaultWidgetResponse(widgetTitle, message, selectedKpiLabel);
        }

        const assistantMessage: ChatMessage = {
          id: crypto.randomUUID(),
          role: "assistant",
          content: responseText,
          timestamp: new Date(),
        };

        dashboardChat.appendMessage(threadMsgKey, assistantMessage);
        dashboardChat.updateThreadTimestamp(persistKey, thread.id);
      }, 1500);
    },
    [persistKey, dashboardChat, generateResponse, onWidgetPrompt],
  );

  return (
    <WidgetAIContext.Provider value={{ sendWidgetPrompt }}>
      {children}
    </WidgetAIContext.Provider>
  );
}

export function useWidgetAI() {
  return useContext(WidgetAIContext);
}