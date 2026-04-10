import type { Message } from "../contexts/ConversationContext";
import type { ChatMessage } from "../contexts/DashboardChatContext";

/**
 * Map a conversation-thread message into the global AI assistant store.
 * Assistant messages that carry `dashboardData` omit it so the panel thread shows the text reply;
 * the live dashboard remains in the main column.
 */
export function conversationMessageToGlobalChat(msg: Message): ChatMessage {
  const base: ChatMessage = {
    id: msg.id,
    role: msg.role,
    content: msg.content,
    timestamp: msg.timestamp,
    widgetRef: msg.widgetRef,
    widgetKpiLabel: msg.widgetKpiLabel,
    widgetIconType: msg.widgetIconType,
    widgetAnchorId: msg.widgetAnchorId,
    widgetSourcePath: msg.widgetSourcePath,
    reasoning: msg.reasoning,
    sources: msg.sources,
    toolSteps: msg.toolSteps,
    isTypingContent: msg.isTypingContent,
  };
  if (msg.role === "assistant" && msg.dashboardData) {
    return base;
  }
  if (msg.dashboardData) {
    base.dashboardData = msg.dashboardData;
  }
  return base;
}
