import type { ChatMessage } from "../contexts/DashboardChatContext";
import type { Message } from "../contexts/ConversationContext";

/** Fields that exist on both Explore `Message` and global `ChatMessage` for assistant thread sync. */
export function exploreAssistantPartialToGlobalPatch(
  partial: Partial<Message>,
): Partial<ChatMessage> {
  const out: Partial<ChatMessage> = {};
  if (partial.content !== undefined) out.content = partial.content;
  if (partial.reasoning !== undefined) out.reasoning = partial.reasoning;
  if (partial.sources !== undefined) out.sources = partial.sources;
  if (partial.toolSteps !== undefined) out.toolSteps = partial.toolSteps;
  if (partial.widgetRef !== undefined) out.widgetRef = partial.widgetRef;
  if (partial.widgetKpiLabel !== undefined) out.widgetKpiLabel = partial.widgetKpiLabel;
  if (partial.widgetIconType !== undefined) out.widgetIconType = partial.widgetIconType;
  if (partial.widgetAnchorId !== undefined) out.widgetAnchorId = partial.widgetAnchorId;
  if (partial.isTypingContent !== undefined) out.isTypingContent = partial.isTypingContent;
  return out;
}
