import type { ChatMessage } from "../contexts/DashboardChatContext";
import type { Message } from "../contexts/ConversationContext";
import type { ExploreAIResponse } from "../data/explore-data";
import { exploreAssistantPartialToGlobalPatch } from "./explore-to-global-ai-patch";
import { runPhasedAssistantReply } from "./run-phased-assistant-reply";

/**
 * Phased assistant reply for Explore: keeps ConversationContext, global AI panel, and local
 * ExplorePage `messages` state aligned on every patch, then attaches widget/dashboard payloads.
 */
export async function runPhasedExploreAssistantReply(options: {
  conversationId: string;
  assistantId: string;
  final: ExploreAIResponse;
  isCancelled: () => boolean;
  patchMessageInConversation: (
    conversationId: string,
    messageId: string,
    partial: Partial<Message>,
  ) => void;
  patchGlobalMessage: (messageId: string, partial: Partial<ChatMessage>) => void;
  syncLocalMessages: (updater: (prev: Message[]) => Message[]) => void;
}): Promise<void> {
  const { final, assistantId, conversationId, isCancelled, patchMessageInConversation, patchGlobalMessage, syncLocalMessages } =
    options;

  const applyPartial = (partial: Partial<Message>) => {
    patchMessageInConversation(conversationId, assistantId, partial);
    const g = exploreAssistantPartialToGlobalPatch(partial);
    if (Object.keys(g).length > 0) {
      patchGlobalMessage(assistantId, g);
    }
    syncLocalMessages((prev) =>
      prev.map((m) => (m.id === assistantId ? { ...m, ...partial } : m)),
    );
  };

  await runPhasedAssistantReply({
    final: {
      content: final.content,
      reasoning: final.reasoning,
      sources: final.sources,
      toolSteps: final.toolSteps,
    },
    isCancelled,
    patch: (partial) => applyPartial(partial as Partial<Message>),
  });

  if (isCancelled()) return;

  const extra: Partial<Message> = {};
  if (final.widgetData !== undefined) extra.widgetData = final.widgetData;
  if (final.dashboardData !== undefined) extra.dashboardData = final.dashboardData;
  if (Object.keys(extra).length > 0) {
    applyPartial(extra);
  }
}
