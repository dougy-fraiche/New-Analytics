import { useEffect } from "react";
import { useConversations } from "../contexts/ConversationContext";
import { useDashboardChat } from "../contexts/DashboardChatContext";

/** Mirrors active Explore drafts into AI Assistant Chat History (matching titles + threads). */
export function GlobalAiExploreHistorySeed() {
  const { conversations } = useConversations();
  const { seedGlobalAiFromExploreConversationsIfEmpty } = useDashboardChat();

  useEffect(() => {
    seedGlobalAiFromExploreConversationsIfEmpty(conversations);
  }, [conversations, seedGlobalAiFromExploreConversationsIfEmpty]);

  return null;
}
