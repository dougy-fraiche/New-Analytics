export const copilotAiInsightsIds = {
  overview: "ai-agents-copilot-overview",
  autoSummary: "ai-agents-copilot-auto-summary",
  taskAssist: "ai-agents-copilot-task-assist",
  rulesEngine: "ai-agents-copilot-rules-engine",
  realTimeSummary: "ai-agents-copilot-real-time-summary",
  generativeResponses: "ai-agents-copilot-generative-responses",
} as const;

export type CopilotAiInsightsId = (typeof copilotAiInsightsIds)[keyof typeof copilotAiInsightsIds];
