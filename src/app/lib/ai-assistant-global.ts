/** Single app-wide AI assistant conversation (see DashboardChatContext). */
export const GLOBAL_AI_ASSISTANT_KEY = "__global_ai__";

const EXPLORE_CONVERSATION_ASSISTANT_PREFIX = "explore-conversation:";

/** Route-scoped AI assistant thread key for `/conversation/:conversationId`. */
export function getExploreConversationAssistantKey(conversationId: string): string {
  return `${EXPLORE_CONVERSATION_ASSISTANT_PREFIX}${conversationId}`;
}

/** Fired when Explore commits a user turn (hero, panel composer, or widget). Stops AI-panel dictation. */
export const EXPLORE_THREAD_USER_TURN_EVENT = "exploreThreadUserTurn";
