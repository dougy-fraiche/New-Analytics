import type { AssistantReplyPayload } from "../types/conversation-types";

export const START_OPPORTUNITY_INVESTIGATION_CHAT_EVENT =
  "start-opportunity-investigation-chat";

export type StartOpportunityInvestigationChatDetail = {
  prompt: string;
  conversationTitle: string;
  ootbTypeId: string;
  pageLabel: string;
  pagePath: string;
};

/**
 * Builds the initial assistant payload context for an Action/Opportunity
 * investigation started from Explore Top Insights.
 */
export function buildOpportunityInvestigationAssistantPayload(
  detail: StartOpportunityInvestigationChatDetail,
  generate: (
    userMessage: string,
    ootbTypeId?: string,
    pageContext?: { pageLabel?: string; pagePath?: string },
  ) => AssistantReplyPayload,
): AssistantReplyPayload {
  return generate(detail.prompt, detail.ootbTypeId, {
    pageLabel: detail.pageLabel,
    pagePath: detail.pagePath,
  });
}
