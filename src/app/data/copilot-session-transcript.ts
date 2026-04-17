import type { SessionInvestigateRow } from "./copilot-auto-summary";
import type { CopilotSessionRow } from "./copilot-overview";
import type { CopilotRealTimeSessionRow } from "./copilot-real-time-summary";
import type { RulesEngineSessionRow } from "./copilot-rules-engine";

export type CopilotTranscriptMetric = {
  label: string;
  value: string;
};

export type CopilotTaskAssistSessionRow = {
  contact: string;
  channel: string;
  agent: string;
  skill: string;
  tasks: number;
  duration: string;
  intent: string;
  outcome: string;
};

export type CopilotTranscriptSessionContext = {
  contact: string;
  customerName: string;
  agentDisplayName: string;
  issueLabel: string;
  sessionCode: string;
  channel: string;
  agent: string;
  skill: string;
  duration: string;
  resolutionText: string;
  customerSentiment: CopilotTranscriptSentiment;
  statusLabel: string;
  turnCount: number;
  flags: number;
  status: string;
  metrics: CopilotTranscriptMetric[];
};

export type CopilotTranscriptMessage = {
  id: string;
  speaker: "agent" | "customer";
  speakerLabel: string;
  time: string;
  text: string;
  category: CopilotTranscriptMessageCategory;
};

export type CopilotTranscriptMessageCategory =
  | "tasks"
  | "rules-notifications"
  | "generative-suggestions"
  | "summaries";

type AgentTranscriptMessageCategory = Exclude<CopilotTranscriptMessageCategory, "tasks">;

export type CopilotTranscriptSentiment =
  | "positive"
  | "neutral"
  | "mixed"
  | "negative";

export type CopilotTranscriptCallSummary = {
  duration: string;
  resolution: string;
  customerSentiment: CopilotTranscriptSentiment;
};

export type CopilotTranscriptPerformanceCardId =
  | "generative-suggestion"
  | "tasks"
  | "rules-notification"
  | "autosummary";

export type CopilotTranscriptPerformanceTone =
  | "magenta"
  | "indigo"
  | "amber"
  | "purple";

export type CopilotTranscriptPerformanceIcon =
  | "sparkles"
  | "square-check-big"
  | "triangle-alert"
  | "list-checks";

export type CopilotTranscriptPerformanceCard = {
  id: CopilotTranscriptPerformanceCardId;
  title: string;
  primaryValue: string;
  secondaryValue: string;
  tone: CopilotTranscriptPerformanceTone;
  icon: CopilotTranscriptPerformanceIcon;
  adherence?: {
    label: string;
    value: string;
  };
};

export type CopilotTranscriptPayload = {
  session: CopilotTranscriptSessionContext;
  messages: CopilotTranscriptMessage[];
  summary: string;
  summaryTitle: string;
  summaryPoints: CopilotTranscriptMetric[];
  callSummary: CopilotTranscriptCallSummary;
  copilotPerformance: CopilotTranscriptPerformanceCard[];
  keyHighlights: string[];
};

const FIRST_NAMES = [
  "Emma",
  "Noah",
  "Sophia",
  "Liam",
  "Olivia",
  "Mason",
  "Ava",
  "Isabella",
  "Lucas",
  "Mia",
] as const;

const LAST_NAMES = [
  "Rodriguez",
  "Nguyen",
  "Martinez",
  "Clark",
  "Patel",
  "Anderson",
  "Brown",
  "Davis",
  "Johnson",
  "Taylor",
] as const;

const ISSUE_LABELS = [
  "Unrecognized Charge",
  "Plan Upgrade",
  "Account Access",
  "Cancellation Request",
  "Password Reset",
  "Billing Inquiry",
  "Service Follow-up",
] as const;

const TRANSCRIPT_MIN_MESSAGES = 14;
const TRANSCRIPT_MAX_MESSAGES = 21;
const TRANSCRIPT_MIN_DURATION_SECONDS = 4 * 60;
const TRANSCRIPT_MAX_DURATION_SECONDS = 14 * 60;
const AGENT_CATEGORY_BLUEPRINT: AgentTranscriptMessageCategory[] = [
  "generative-suggestions",
  "generative-suggestions",
  "rules-notifications",
  "generative-suggestions",
  "summaries",
  "rules-notifications",
  "generative-suggestions",
  "summaries",
  "rules-notifications",
  "generative-suggestions",
  "summaries",
] as const;

function hashString(value: string): number {
  let hash = 0;
  for (let i = 0; i < value.length; i++) {
    hash = (Math.imul(31, hash) + value.charCodeAt(i)) | 0;
  }
  return Math.abs(hash);
}

function mulberry32(seed: number): () => number {
  return () => {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function pick<T>(rng: () => number, values: readonly T[]): T {
  return values[Math.floor(rng() * values.length)] as T;
}

function titleCaseFromSnake(value: string): string {
  return value
    .replace(/[_-]+/g, " ")
    .split(" ")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function parseDurationToSeconds(value: string): number {
  const match = value.match(/(?:(\d+)m)?\s*(?:(\d+)s)?/i);
  if (!match) return 8 * 60;

  const minutes = Number(match[1] ?? 0);
  const seconds = Number(match[2] ?? 0);
  const total = minutes * 60 + seconds;
  return total > 0 ? total : 8 * 60;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function transcriptMessageCount(totalSeconds: number): number {
  const ratio = clamp(
    (totalSeconds - TRANSCRIPT_MIN_DURATION_SECONDS) /
      (TRANSCRIPT_MAX_DURATION_SECONDS - TRANSCRIPT_MIN_DURATION_SECONDS),
    0,
    1,
  );
  return Math.round(TRANSCRIPT_MIN_MESSAGES + ratio * (TRANSCRIPT_MAX_MESSAGES - TRANSCRIPT_MIN_MESSAGES));
}

function transcriptCheckpoints(totalSeconds: number, messageCount: number): number[] {
  if (messageCount <= 1) return [0];

  const checkpoints: number[] = [0];
  for (let index = 1; index < messageCount; index++) {
    const evenlySpaced = Math.round((index / (messageCount - 1)) * totalSeconds);
    checkpoints.push(Math.max((checkpoints[index - 1] ?? 0) + 1, evenlySpaced));
  }

  return checkpoints;
}

function formatClock(totalSeconds: number): string {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

function customerNameForContact(contact: string): string {
  const rng = mulberry32(hashString(contact));
  return `${pick(rng, FIRST_NAMES)} ${pick(rng, LAST_NAMES)}`;
}

function buildSessionCode(contact: string, seedText: string): string {
  const seed = hashString(seedText);
  const suffix = seed.toString(16).slice(-4).toUpperCase().padStart(4, "0");
  return `EVAL-${contact.replace("CNT-", "")}-${suffix}`;
}

function normalizeStatus(rawStatus: string): string {
  const normalized = rawStatus.trim().toLowerCase();
  if (!normalized) return "in progress";
  if (normalized.includes("resolved") || normalized.includes("satisfied")) return "resolved";
  if (normalized.includes("follow") || normalized.includes("pending")) return "needs follow-up";
  if (normalized.includes("closed")) return "closed";
  return normalized;
}

function statusLabelFromNormalized(status: string): string {
  if (status === "needs follow-up") return "Needs Follow-up";
  if (status === "in progress") return "In Progress";
  return titleCaseFromSnake(status);
}

function sentimentFromStatusText(statusText: string): CopilotTranscriptSentiment {
  const normalized = normalizeStatus(statusText);
  if (normalized.includes("negative")) return "negative";
  if (normalized.includes("mixed")) return "mixed";
  if (normalized.includes("resolved") || normalized.includes("satisfied")) return "positive";
  return "neutral";
}

function defaultIssueLabel(skill: string, seedText: string): string {
  const normalizedSkill = skill.trim().toLowerCase();
  if (normalizedSkill.includes("billing")) return "Billing Inquiry";
  if (normalizedSkill.includes("retention")) return "Cancellation Request";
  if (normalizedSkill.includes("tech")) return "Account Access";
  if (normalizedSkill.includes("sales")) return "Plan Upgrade";
  const rng = mulberry32(hashString(seedText));
  return pick(rng, ISSUE_LABELS);
}

function sessionTurns(seedText: string): number {
  return 11 + (hashString(seedText) % 10);
}

function sessionFlags(seedText: string): number {
  return 1 + (hashString(`${seedText}:flags`) % 3);
}

function metricValue(session: CopilotTranscriptSessionContext, contains: string): string | null {
  const found = session.metrics.find((metric) =>
    metric.label.toLowerCase().includes(contains.toLowerCase()),
  );
  return found?.value ?? null;
}

function parseFirstNumber(value: string | null): number | null {
  if (!value) return null;
  const match = value.match(/-?\d+(\.\d+)?/);
  if (!match) return null;
  const parsed = Number(match[0]);
  return Number.isFinite(parsed) ? parsed : null;
}

function copilotPerformanceCards(
  session: CopilotTranscriptSessionContext,
  seedText: string,
  similarity: number | null,
): CopilotTranscriptPerformanceCard[] {
  const rng = mulberry32(hashString(`${seedText}:performance`));
  const generatedSuggestions = Math.max(3, Math.min(8, Math.round(session.turnCount / 2.4)));
  const taskTotal = 4 + (hashString(`${seedText}:task-total`) % 2);
  const featuresValue = metricValue(session, "feature")?.toLowerCase() ?? "";
  const hasTaskSignal = featuresValue.includes("task") || session.skill.toLowerCase().includes("tech");
  const taskExecuted = hasTaskSignal
    ? Math.max(2, taskTotal - (hashString(`${seedText}:task-delta`) % 2))
    : Math.max(1, taskTotal - 2);
  const rulesNotificationCount = Math.max(1, session.flags);
  const autoSummaryCount = Math.max(1, Math.min(4, Math.round(session.turnCount / 4.5)));
  const adherencePercent = similarity !== null
    ? Math.round(Math.max(0, Math.min(1, similarity)) * 100)
    : 82 + Math.floor(rng() * 14);

  return [
    {
      id: "generative-suggestion",
      title: "Generative Suggestion",
      primaryValue: `${generatedSuggestions} suggestions`,
      secondaryValue: "",
      tone: "magenta",
      icon: "sparkles",
    },
    {
      id: "tasks",
      title: "Tasks",
      primaryValue: `${taskExecuted} tasks executed out of ${taskTotal}`,
      secondaryValue: "",
      tone: "indigo",
      icon: "square-check-big",
    },
    {
      id: "rules-notification",
      title: "Rules Notification",
      primaryValue: `${rulesNotificationCount} notifications`,
      secondaryValue: "",
      tone: "amber",
      icon: "triangle-alert",
    },
    {
      id: "autosummary",
      title: "Autosummary",
      primaryValue: `${autoSummaryCount} Summaries`,
      secondaryValue: "",
      tone: "purple",
      icon: "list-checks",
      adherence: {
        label: "Avg. Adherence:",
        value: `${adherencePercent}% As Is`,
      },
    },
  ];
}

function keyHighlights(
  session: CopilotTranscriptSessionContext,
  callSummary: CopilotTranscriptCallSummary,
  cards: CopilotTranscriptPerformanceCard[],
  similarity: number | null,
): string[] {
  const ackMinutes = Math.max(1, Math.min(4, Math.round(parseDurationToSeconds(session.duration) / 120)));
  const similarityText = similarity !== null
    ? `${Math.round(Math.max(0, Math.min(1, similarity)) * 100)}%`
    : cards.find((card) => card.id === "autosummary")?.adherence?.value ?? "N/A";
  const taskValue = cards.find((card) => card.id === "tasks")?.primaryValue ?? "task workflow executed";

  return [
    `Issue identified and acknowledged within first ${ackMinutes} minutes (compliance met)`,
    `${titleCaseFromSnake(session.skill)} workflow completed on ${session.channel.toLowerCase()} with outcome: ${titleCaseFromSnake(session.status)}`,
    `Resolution applied: ${callSummary.resolution}`,
    `AI support performance: ${taskValue}; Autosummary adherence at ${similarityText}`,
  ];
}

export function fromCopilotOverviewRow(row: CopilotSessionRow): CopilotTranscriptSessionContext {
  const seedText = `${row.contact}|overview|${row.agent}|${row.skill}`;
  const normalizedStatus = normalizeStatus(row.disposition);
  return {
    contact: row.contact,
    customerName: customerNameForContact(row.contact),
    agentDisplayName: row.agent,
    issueLabel: defaultIssueLabel(row.skill, seedText),
    sessionCode: buildSessionCode(row.contact, seedText),
    channel: row.channel,
    agent: row.agent,
    skill: row.skill,
    duration: row.duration,
    resolutionText: row.disposition,
    customerSentiment: row.sentiment,
    statusLabel: row.disposition,
    turnCount: sessionTurns(seedText),
    flags: sessionFlags(seedText),
    status: normalizedStatus,
    metrics: [
      { label: "Handle Time", value: row.handleTime },
      { label: "Features", value: row.features },
      { label: "Sentiment", value: titleCaseFromSnake(row.sentiment) },
      { label: "Rating", value: row.rating },
    ],
  };
}

export function fromCopilotAutoSummaryRow(row: SessionInvestigateRow): CopilotTranscriptSessionContext {
  const seedText = `${row.contact}|auto-summary|${row.agent}|${row.intent}`;
  const normalizedStatus = row.sentiment === "negative" ? "needs follow-up" : "resolved";
  const statusLabel = statusLabelFromNormalized(normalizedStatus);
  return {
    contact: row.contact,
    customerName: customerNameForContact(row.contact),
    agentDisplayName: row.agent,
    issueLabel: titleCaseFromSnake(row.intent),
    sessionCode: buildSessionCode(row.contact, seedText),
    channel: row.channel,
    agent: row.agent,
    skill: row.skill,
    duration: row.duration,
    resolutionText: statusLabel,
    customerSentiment: row.sentiment,
    statusLabel,
    turnCount: sessionTurns(seedText),
    flags: sessionFlags(seedText),
    status: normalizedStatus,
    metrics: [
      { label: "Similarity", value: row.similarity.toFixed(3) },
      { label: "Intent", value: titleCaseFromSnake(row.intent) },
      { label: "Sentiment", value: titleCaseFromSnake(row.sentiment) },
    ],
  };
}

export function fromCopilotRealTimeSummaryRow(row: CopilotRealTimeSessionRow): CopilotTranscriptSessionContext {
  const seedText = `${row.contact}|real-time-summary|${row.agent}|${row.intent}`;
  const normalizedStatus = row.sentiment === "negative" ? "needs follow-up" : "resolved";
  const statusLabel = statusLabelFromNormalized(normalizedStatus);
  return {
    contact: row.contact,
    customerName: customerNameForContact(row.contact),
    agentDisplayName: row.agent,
    issueLabel: titleCaseFromSnake(row.intent),
    sessionCode: buildSessionCode(row.contact, seedText),
    channel: row.channel,
    agent: row.agent,
    skill: row.skill,
    duration: row.duration,
    resolutionText: statusLabel,
    customerSentiment: row.sentiment,
    statusLabel,
    turnCount: sessionTurns(seedText),
    flags: sessionFlags(seedText),
    status: normalizedStatus,
    metrics: [
      { label: "Similarity", value: row.similarity.toFixed(3) },
      { label: "Intent", value: titleCaseFromSnake(row.intent) },
      { label: "Sentiment", value: titleCaseFromSnake(row.sentiment) },
    ],
  };
}

export function fromCopilotRulesEngineRow(row: RulesEngineSessionRow): CopilotTranscriptSessionContext {
  const seedText = `${row.contact}|rules-engine|${row.agent}|${row.outcome}`;
  const normalizedStatus = normalizeStatus(row.outcome);
  return {
    contact: row.contact,
    customerName: customerNameForContact(row.contact),
    agentDisplayName: row.agent,
    issueLabel: defaultIssueLabel(row.skill, seedText),
    sessionCode: buildSessionCode(row.contact, seedText),
    channel: row.channel,
    agent: row.agent,
    skill: row.skill,
    duration: row.duration,
    resolutionText: row.outcome,
    customerSentiment: sentimentFromStatusText(row.outcome),
    statusLabel: row.outcome,
    turnCount: sessionTurns(seedText),
    flags: Math.max(row.ruleFires, 1),
    status: normalizedStatus,
    metrics: [
      { label: "Rule Fires", value: String(row.ruleFires) },
      { label: "Outcome", value: row.outcome },
      { label: "Transferred", value: row.transferred },
    ],
  };
}

export function fromCopilotTaskAssistRow(row: CopilotTaskAssistSessionRow): CopilotTranscriptSessionContext {
  const seedText = `${row.contact}|task-assist|${row.agent}|${row.intent}|${row.skill}`;
  const normalizedStatus = normalizeStatus(row.outcome);
  return {
    contact: row.contact,
    customerName: customerNameForContact(row.contact),
    agentDisplayName: row.agent,
    issueLabel: titleCaseFromSnake(row.intent),
    sessionCode: buildSessionCode(row.contact, seedText),
    channel: row.channel,
    agent: row.agent,
    skill: row.skill,
    duration: row.duration,
    resolutionText: row.outcome,
    customerSentiment: sentimentFromStatusText(row.outcome),
    statusLabel: row.outcome,
    turnCount: sessionTurns(seedText),
    flags: Math.max(1, Math.min(3, Math.round(row.tasks / 2))),
    status: normalizedStatus,
    metrics: [
      { label: "Tasks", value: String(row.tasks) },
      { label: "Intent", value: titleCaseFromSnake(row.intent) },
      { label: "Outcome", value: row.outcome },
    ],
  };
}

export function buildCopilotTranscriptPayload(session: CopilotTranscriptSessionContext): CopilotTranscriptPayload {
  const seedText = `${session.contact}|${session.agent}|${session.issueLabel}|${session.skill}`;
  const rng = mulberry32(hashString(seedText));
  const similarityValue = parseFirstNumber(metricValue(session, "similarity"));
  const customerFirstName = session.customerName.split(" ")[0] ?? session.customerName;

  const customerStatements = [
    `Hi, I noticed an issue related to ${session.issueLabel.toLowerCase()} and want to make sure my account is correct.`,
    `I'm seeing something unexpected with ${session.issueLabel.toLowerCase()} and need help understanding next steps.`,
    `Can you help me resolve a ${session.issueLabel.toLowerCase()} problem on this conversation?`,
  ] as const;

  const agentAcknowledgements = [
    `Absolutely. I can review this now and confirm what happened before we decide on the next action.`,
    `Thanks for calling this out. I'll walk through the details with you and make sure we close this properly.`,
    `I can help with that. Let me verify your account details and summarize the path to resolution.`,
  ] as const;

  const customerDetails = [
    `The latest event in this conversation happened earlier today, and the behavior didn't match what I expected.`,
    `The issue started after I changed a setting, and now the flow feels inconsistent.`,
    `I can share what I saw step-by-step if that helps confirm the root cause quickly.`,
  ] as const;

  const customerFollowUps = [
    `I checked the latest status and still noticed a gap, so I want to confirm we're fixing the right thing.`,
    `I can confirm the issue path if you want me to walk through the exact sequence one more time.`,
    `That context helps. I mainly want to make sure this doesn't repeat in the next interaction.`,
  ] as const;

  const agentResolutions = [
    `I found the source and applied an update. I'll send a quick recap and keep this tagged for follow-up if needed.`,
    `I've documented the issue and completed the required changes. You should see the update reflected shortly.`,
    `Everything is now aligned with policy for ${session.skill.toLowerCase()}. I'll attach the resolution summary.`,
  ] as const;

  const agentInvestigations = [
    `I traced the event timeline and can see where the behavior diverged. I'll validate each step and confirm the correction.`,
    `I'm reviewing the full interaction log now and will call out exactly what changed versus expected behavior.`,
    `I'm cross-checking this with the ${session.skill.toLowerCase()} workflow so we can close the root cause, not just the symptom.`,
  ] as const;

  const agentLateGuidance = [
    `Next, I'll confirm the final account state and share a clear recap so you have the exact resolution details.`,
    `I'll run one final verification pass and then post the final notes with actions completed and follow-up owner.`,
    `I'll complete a final quality check before closing so the transcript shows every update in order.`,
  ] as const;

  const agentRulesUpdates = [
    `Policy check complete: this interaction now matches ${session.status} handling requirements for ${session.skill.toLowerCase()}.`,
    `Rules notification: compliance checks passed, and I've documented the control points applied during this update.`,
    `I logged the required rule notifications and linked the relevant policy references in the session notes.`,
  ] as const;

  const agentSummaryCheckpoints = [
    `Quick summary so far: we confirmed the issue pattern, applied corrections, and validated the expected behavior path.`,
    `Progress summary: account updates are in place, rule checks are complete, and we're on track to close this cleanly.`,
    `Current summary: the core issue has been addressed, and I'm finalizing the action log for your reference.`,
  ] as const;

  const customerClosers = [
    `Thanks, that explanation helps. Please send the recap so I can reference it later.`,
    `Perfect, that solves it for now. I appreciate the quick turnaround.`,
    `That makes sense. I can confirm the result on my side now.`,
  ] as const;

  const agentCloser = [
    `You're all set. I'll mark this interaction as ${session.status} and include the full notes.`,
    `Happy to help. I'll keep this under observation and document every step in the transcript.`,
    `Great, thanks for confirming. I'll close this with a final summary and action log.`,
  ] as const;

  const totalSeconds = parseDurationToSeconds(session.duration);
  const messageCount = transcriptMessageCount(totalSeconds);
  const checkpoints = transcriptCheckpoints(totalSeconds, messageCount);

  const messages: CopilotTranscriptMessage[] = Array.from({ length: messageCount }, (_, index) => {
    const isAgent = index % 2 === 0;
    const agentTurnIndex = Math.floor(index / 2);
    const progress = messageCount > 1 ? index / (messageCount - 1) : 1;
    const category: CopilotTranscriptMessageCategory = isAgent
      ? (AGENT_CATEGORY_BLUEPRINT[agentTurnIndex] ?? "summaries")
      : "tasks";

    let text = "";
    if (isAgent && index === 0) {
      text = `Hello ${customerFirstName}, I'm assisting with ${session.issueLabel.toLowerCase()}. How can I help today?`;
    } else if (!isAgent) {
      if (progress < 0.25) {
        text = pick(rng, customerStatements);
      } else if (progress < 0.55) {
        text = pick(rng, customerDetails);
      } else if (progress < 0.82) {
        text = pick(rng, customerFollowUps);
      } else {
        text = pick(rng, customerClosers);
      }
    } else if (category === "generative-suggestions") {
      if (progress < 0.35) {
        text = pick(rng, agentAcknowledgements);
      } else if (progress < 0.75) {
        text = pick(rng, agentInvestigations);
      } else {
        text = pick(rng, agentLateGuidance);
      }
    } else if (category === "rules-notifications") {
      text = progress < 0.7 ? pick(rng, agentResolutions) : pick(rng, agentRulesUpdates);
    } else {
      text = progress < 0.85 ? pick(rng, agentSummaryCheckpoints) : pick(rng, agentCloser);
    }

    return {
      id: `m-${index + 1}`,
      speaker: isAgent ? "agent" : "customer",
      speakerLabel: isAgent ? (index === 0 ? "Bot Agent" : session.agent) : session.customerName,
      time: formatClock(checkpoints[index] ?? 0),
      text,
      category,
    };
  });

  const summary = `${session.customerName} contacted support on ${session.channel.toLowerCase()} for ${session.issueLabel.toLowerCase()}. ${session.agent} managed the ${session.duration.toLowerCase()} interaction for ${session.skill.toLowerCase()} and closed it as ${session.status}.`;
  const callSummary: CopilotTranscriptCallSummary = {
    duration: session.duration,
    resolution: session.resolutionText,
    customerSentiment: session.customerSentiment,
  };
  const copilotPerformance = copilotPerformanceCards(session, seedText, similarityValue);
  const highlights = keyHighlights(session, callSummary, copilotPerformance, similarityValue);

  return {
    session,
    messages,
    summary,
    summaryTitle: "Autosummary",
    summaryPoints: [
      { label: "Status", value: session.statusLabel },
      { label: "Turns", value: String(session.turnCount) },
      { label: "Flags", value: String(session.flags) },
    ],
    callSummary,
    copilotPerformance,
    keyHighlights: highlights,
  };
}

export function buildTranscriptExportText(payload: CopilotTranscriptPayload, sourceLabel: string): string {
  const lines = [
    `Transcript Viewer Export`,
    `Source: ${sourceLabel}`,
    `Contact: ${payload.session.contact}`,
    `Customer: ${payload.session.customerName}`,
    `Agent: ${payload.session.agent}`,
    `Channel: ${payload.session.channel}`,
    `Skill: ${payload.session.skill}`,
    `Issue: ${payload.session.issueLabel}`,
    `Session: ${payload.session.sessionCode}`,
    `Duration: ${payload.session.duration}`,
    `Status: ${payload.session.statusLabel}`,
    "",
    "Transcript",
    ...payload.messages.map((message) => `[${message.time}] ${message.speakerLabel}: ${message.text}`),
    "",
    `${payload.summaryTitle}`,
    payload.summary,
  ];

  return lines.join("\n");
}
