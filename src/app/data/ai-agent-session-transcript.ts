import type {
  CopilotTranscriptMetric,
  CopilotTranscriptSentiment,
  CopilotTranscriptSessionContext,
} from "./copilot-session-transcript";

type SessionStatus = "resolved" | "needs follow-up" | "in progress";

type AIAgentsOverviewSessionRow = {
  id: string;
  categoryLabel?: string;
  categoryKind?: string;
  channel: string;
  rating?: number;
  escalations?: number;
  duration: string;
};

type AIAgentsGoalsOutcomesSessionRow = {
  id: string;
  category: string;
  channel: string;
  topIntent: string;
  intentScore: number;
  rating: number;
  escalated: boolean;
  duration: string;
};

type AIAgentsIntentNluSessionRow = {
  id: string;
  category: string;
  channel: string;
  topIntent: string;
  intentScore: number;
  rating: number;
  escalated: boolean;
  duration: string;
};

type AIAgentsEvaluationSessionRow = {
  conversationId: string;
  timestamp: string;
  channel: string;
  agent: string;
  sentiment: "positive" | "neutral" | "negative";
  containment: "contained" | "escalated";
  successful: boolean;
  compliance: "compliant" | "non_compliant" | "na";
  avgConfidence: "high" | "medium";
};

const FIRST_NAMES = ["Emma", "Noah", "Sophia", "Liam", "Olivia"] as const;
const LAST_NAMES = ["Rodriguez", "Nguyen", "Martinez", "Clark", "Patel"] as const;

function hashString(value: string): number {
  let hash = 0;
  for (let index = 0; index < value.length; index++) {
    hash = (Math.imul(31, hash) + value.charCodeAt(index)) | 0;
  }
  return Math.abs(hash);
}

function titleCase(value: string): string {
  return value
    .replace(/[_-]+/g, " ")
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function normalizeChannel(channel: string): string {
  const normalized = channel.trim().toLowerCase().replace(/[\s_-]+/g, "");
  if (normalized === "voice") return "Voice";
  if (normalized === "webchat") return "Webchat";
  if (normalized === "whatsapp") return "WhatsApp";
  if (normalized === "messenger") return "Messenger";
  return channel.trim() || "Webchat";
}

function normalizeDuration(duration: string): string {
  const value = duration.trim();
  const mmssMatch = value.match(/^(\d+):(\d{2})$/);
  if (mmssMatch) {
    const minutes = Number(mmssMatch[1] ?? 0);
    const seconds = Number(mmssMatch[2] ?? 0);
    return `${minutes}m ${seconds}s`;
  }
  return value || "8m 00s";
}

function customerName(contact: string): string {
  const seed = hashString(contact);
  const first = FIRST_NAMES[seed % FIRST_NAMES.length] ?? "Emma";
  const last = LAST_NAMES[Math.floor(seed / FIRST_NAMES.length) % LAST_NAMES.length] ?? "Rodriguez";
  return `${first} ${last}`;
}

function sessionCode(contact: string, source: string): string {
  const suffix = hashString(`${source}|${contact}`).toString(16).slice(-4).toUpperCase().padStart(4, "0");
  const id = contact.replace(/[^A-Za-z0-9]/g, "").slice(-8).toUpperCase() || "SESSION";
  return `EVAL-${id}-${suffix}`;
}

function turnCount(contact: string): number {
  return 11 + (hashString(`${contact}|turns`) % 10);
}

function statusLabel(status: SessionStatus): string {
  if (status === "needs follow-up") return "Needs Follow-up";
  if (status === "in progress") return "In Progress";
  return "Resolved";
}

function contextFromBase(params: {
  contact: string;
  source: string;
  channel: string;
  duration: string;
  agentDisplayName: string;
  agent: string;
  skill: string;
  issueLabel: string;
  sentiment: CopilotTranscriptSentiment;
  status: SessionStatus;
  flags: number;
  resolutionText: string;
  metrics: CopilotTranscriptMetric[];
}): CopilotTranscriptSessionContext {
  return {
    contact: params.contact,
    customerName: customerName(params.contact),
    agentDisplayName: params.agentDisplayName,
    issueLabel: params.issueLabel,
    sessionCode: sessionCode(params.contact, params.source),
    channel: normalizeChannel(params.channel),
    agent: params.agent,
    skill: params.skill,
    duration: normalizeDuration(params.duration),
    resolutionText: params.resolutionText,
    customerSentiment: params.sentiment,
    statusLabel: statusLabel(params.status),
    turnCount: turnCount(params.contact),
    flags: Math.max(1, params.flags),
    status: params.status,
    metrics: params.metrics,
  };
}

function sentimentFromCategory(category: string): CopilotTranscriptSentiment {
  const normalized = category.trim().toLowerCase();
  if (normalized.includes("high_escalation") || normalized.includes("low_rating") || normalized.includes("low_intent_score")) {
    return "negative";
  }
  if (normalized.includes("missing_slots")) return "mixed";
  if (normalized.includes("long_duration")) return "neutral";
  return "neutral";
}

export function fromAIAgentsOverviewSessionRow(
  row: AIAgentsOverviewSessionRow,
): CopilotTranscriptSessionContext {
  const contact = row.id;
  const escalations = row.escalations ?? 0;
  const rating = row.rating ?? 0;
  const categoryText = row.categoryLabel ?? titleCase(row.categoryKind ?? "Session Review");
  const status: SessionStatus = escalations > 0 ? "needs follow-up" : "in progress";
  const sentiment: CopilotTranscriptSentiment =
    row.categoryKind === "high_escalation"
      ? "negative"
      : row.categoryKind === "low_rating"
        ? "negative"
        : "mixed";

  return contextFromBase({
    contact,
    source: "ai-agents-overview",
    channel: row.channel,
    duration: row.duration,
    agentDisplayName: "AI Agent",
    agent: "AI Agent",
    skill: "Overview Monitoring",
    issueLabel: categoryText,
    sentiment,
    status,
    flags: Math.max(1, escalations),
    resolutionText: statusLabel(status),
    metrics: [
      { label: "Category", value: categoryText },
      { label: "Customer Rating", value: rating > 0 ? `${rating}/5` : "N/A" },
      { label: "Escalations", value: String(escalations) },
    ],
  });
}

export function fromAIAgentsGoalsOutcomesSessionRow(
  row: AIAgentsGoalsOutcomesSessionRow,
): CopilotTranscriptSessionContext {
  const contact = row.id;
  const status: SessionStatus = row.escalated ? "needs follow-up" : "resolved";

  return contextFromBase({
    contact,
    source: "ai-agents-goals-outcomes",
    channel: row.channel,
    duration: row.duration,
    agentDisplayName: "AI Agent",
    agent: "AI Agent",
    skill: "Goals & Outcomes",
    issueLabel: titleCase(row.topIntent),
    sentiment: sentimentFromCategory(row.category),
    status,
    flags: row.escalated ? 2 : 1,
    resolutionText: statusLabel(status),
    metrics: [
      { label: "Top Intent", value: titleCase(row.topIntent) },
      { label: "Intent Score", value: row.intentScore.toFixed(2) },
      { label: "Rating", value: `${row.rating}/5` },
      { label: "Escalated", value: row.escalated ? "Yes" : "No" },
    ],
  });
}

export function fromAIAgentsIntentNluSessionRow(
  row: AIAgentsIntentNluSessionRow,
): CopilotTranscriptSessionContext {
  const contact = row.id;
  const status: SessionStatus = row.escalated ? "needs follow-up" : "resolved";

  return contextFromBase({
    contact,
    source: "ai-agents-intent-nlu",
    channel: row.channel,
    duration: row.duration,
    agentDisplayName: "AI Agent",
    agent: "AI Agent",
    skill: "Intent & NLU",
    issueLabel: titleCase(row.topIntent),
    sentiment: sentimentFromCategory(row.category),
    status,
    flags: row.escalated ? 2 : 1,
    resolutionText: statusLabel(status),
    metrics: [
      { label: "Top Intent", value: titleCase(row.topIntent) },
      { label: "Intent Score", value: row.intentScore.toFixed(2) },
      { label: "Rating", value: `${row.rating}/5` },
      { label: "Escalated", value: row.escalated ? "Yes" : "No" },
    ],
  });
}

export function fromAIAgentsEvaluationSessionRow(
  row: AIAgentsEvaluationSessionRow,
): CopilotTranscriptSessionContext {
  const contact = row.conversationId;
  const status: SessionStatus = row.successful && row.containment === "contained" ? "resolved" : "needs follow-up";

  return contextFromBase({
    contact,
    source: "ai-agents-evaluation",
    channel: row.channel,
    duration: "8m 00s",
    agentDisplayName: row.agent || "AI Agent",
    agent: row.agent || "AI Agent",
    skill: "AI Evaluation",
    issueLabel: "Evaluation Session",
    sentiment: row.sentiment,
    status,
    flags: row.containment === "escalated" ? 2 : 1,
    resolutionText: statusLabel(status),
    metrics: [
      { label: "Timestamp", value: row.timestamp },
      { label: "Containment", value: titleCase(row.containment) },
      { label: "Successful", value: row.successful ? "Yes" : "No" },
      { label: "Compliance", value: titleCase(row.compliance) },
      { label: "Avg Confidence", value: titleCase(row.avgConfidence) },
    ],
  });
}
