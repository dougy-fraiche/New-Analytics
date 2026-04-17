import { LOADING_STEP_LABELS } from "./create-ai-agent-jobs";
import { getClientPageSourceMeta } from "./mock-assistant-structure";
import type { AssistantReplyPayload, AssistantToolStep } from "../types/conversation-types";

export const CREATE_AI_AGENT_IN_CHAT_EVENT = "create-ai-agent-in-chat";

export const CREATE_AI_AGENT_IN_CHAT_PROGRESS_EVENT = "create-ai-agent-in-chat-progress";

export const CREATE_AI_AGENT_IN_CHAT_FINISHED_EVENT = "create-ai-agent-in-chat-finished";

export type CreateAIAgentInChatDetail = {
  sourceKey: string;
  scopeTitle: string;
  /** Stable id for this creation run (persisted when the flow completes). */
  agentId: string;
  ootbTypeId?: string;
  /**
   * Hint for thread behavior in non-global contexts.
   * Global assistant threads always append until the user explicitly resets chat.
   */
  appendToCurrentConversation?: boolean;
};

export type CreateAIAgentInChatFinishedDetail = {
  sourceKey: string;
  scopeTitle: string;
  agentId: string;
  cancelled?: boolean;
};

export type CreateAIAgentInChatProgressDetail = {
  sourceKey: string;
  agentId: string;
  step: number;
};

function buildToolStepDefs(scopeTitle: string): AssistantToolStep[] {
  const s = scopeTitle.trim() || "this scope";
  const details = [
    `Provisioning a specialized agent profile for “${s}”.`,
    `Mapping intents, outcomes, and when to escalate for this category.`,
    `Summarizing recommended agent actions from the current insights.`,
    `Defining job templates, SLAs, and queue handoff behavior.`,
    `Connecting tools, APIs, and knowledge sources the agent can use.`,
    `Finalizing routing, containment targets, and fallback paths.`,
  ] as const;
  return LOADING_STEP_LABELS.map((label, i) => ({
    label,
    status: "done" as const,
    detail: details[i],
  }));
}

/**
 * Final assistant payload for the phased “Create AI Agent” mock flow in global chat.
 * `runPhasedAssistantReply` only reads `label` / `detail` from each step; statuses are driven by the runner.
 */
export function buildCreateAIAgentReplyPayload(
  scopeTitle: string,
  options?: { ootbTypeId?: string; pageLabel?: string; pagePath?: string },
): AssistantReplyPayload {
  const s = scopeTitle.trim() || "this scope";
  const { pageLabel, pagePath } = getClientPageSourceMeta({
    pageLabel: options?.pageLabel,
    pagePath: options?.pagePath,
  });

  const viewHint = options?.ootbTypeId
    ? ` It’s aligned with your **${options.ootbTypeId.replace(/-/g, " ")}** view and filters.`
    : "";

  const content = `Your AI agent for **${s}** is ready.${viewHint} Use **View Agent** in Top Opportunities to open this agent or create another. Tell me if you want to tune containment, add guardrails, or connect another data source.`;

  return {
    content,
    reasoning: `Completed the six-step creation pipeline for “${s}”: process shell, reasons, actions, jobs, tools, and routing—grounded in what you were viewing (${pageLabel}).`,
    toolSteps: buildToolStepDefs(s),
    sources: [
      {
        label: pageLabel,
        url: pagePath,
        snippet: "Page context used to scope the new agent configuration.",
      },
      {
        label: "Agent configuration playbook",
        url: "https://example.com/docs/ai-agents-setup",
        snippet: "Reference patterns for tools, jobs, and routing.",
      },
    ],
  };
}
