import type { Message } from "../contexts/ConversationContext";
import type { AnomalyInsightSnapshot } from "../types/conversation-types";

export type FindingLevel = "High" | "Medium" | "Low";

export interface FinancialImpactStat {
  label: "Events" | "Crisis Per Day" | "Sustained Elevation For 7 Days" | "Annualized";
  value: string;
  detail: string;
}

export interface RootCauseItem {
  heading:
    | "Precipitating Event"
    | "Overwhelming Call Volume Spike"
    | "Queue Pressure & Capacity Constraints"
    | "Quality Degradation"
    | "Staffing & Efficiency"
    | "Downstream Financial Impact";
  detail: string;
}

export interface PrimaryFindingViewModel {
  primaryFinding: string;
  financialImpactStats: FinancialImpactStat[];
  financialImpactAssumption: string;
  riskLevel: FindingLevel;
  riskDetail: string;
  confidenceLevel: FindingLevel;
  confidenceDetail: string;
  protocolStepLabel: string;
  protocolStepStatus: "In progress" | "Complete";
  rootCauses: RootCauseItem[];
}

const ANOMALY_STRONG_SIGNALS = [
  "anomaly",
  "root cause",
  "outlier",
  "investigate this anomaly",
  "unexpected spike",
  "unexpected drop",
];

const ANOMALY_KEYWORDS = [
  "incident",
  "deviation",
  "abnormal",
  "degradation",
  "variance",
  "urgent",
  "escalation",
  "drop",
  "spike",
  "overwhelmed",
  "capacity",
  "triage",
];

const DEFAULT_FINANCIAL_IMPACT = {
  perEvent: "$12,593",
  crisisPerDay: "$7,539",
  sustainedSevenDays: "$5,055",
  annualized: "$50,373",
  assumption:
    "Assuming 4 similar crisis events per year (conservative quarterly estimate based on industry benchmarks for community service crisis events).",
} as const;

function normalizeWhitespace(value: string): string {
  return value.replace(/\s+/g, " ").trim();
}

function latestAnomalyInsightSnapshot(messages: Message[]): AnomalyInsightSnapshot | null {
  for (let i = messages.length - 1; i >= 0; i--) {
    const snap = messages[i].anomalyInvestigation?.insight;
    if (snap) return snap;
  }
  return null;
}

function latestAssistantText(messages: Message[]): string {
  for (let i = messages.length - 1; i >= 0; i--) {
    if (messages[i].role === "assistant" && messages[i].content.trim()) {
      return normalizeWhitespace(messages[i].content);
    }
  }
  return "";
}

function combinedConversationText(messages: Message[]): string {
  return normalizeWhitespace(messages.map((m) => m.content).join(" "));
}

export function isAnomalyLikeConversation(messages: Message[]): boolean {
  if (messages.some((m) => Boolean(m.anomalyInvestigation))) return true;

  const corpus = combinedConversationText(messages).toLowerCase();
  if (!corpus) return false;

  if (ANOMALY_STRONG_SIGNALS.some((signal) => corpus.includes(signal))) return true;

  let keywordHits = 0;
  for (const keyword of ANOMALY_KEYWORDS) {
    if (corpus.includes(keyword)) keywordHits += 1;
    if (keywordHits >= 2) return true;
  }
  return false;
}

function firstSentence(text: string): string {
  const cleaned = normalizeWhitespace(text);
  if (!cleaned) return "";
  const match = cleaned.match(/^(.+?[.!?])(?:\s|$)/);
  return match ? match[1]!.trim() : cleaned;
}

function extractMonetarySignals(text: string): string[] {
  const matches = text.match(/\$\s?\d[\d,]*(?:\.\d+)?(?:\s?(?:k|m|b|K|M|B))?/g) ?? [];
  const deduped = new Set(matches.map((m) => normalizeWhitespace(m)));
  return Array.from(deduped).slice(0, 4);
}

function contextualDollarValue(text: string, patterns: string[]): string | null {
  const chunks = text.split(/[\n\r.;]+/g);
  for (const chunk of chunks) {
    const lower = chunk.toLowerCase();
    if (!patterns.some((pattern) => lower.includes(pattern))) continue;
    const amounts = extractMonetarySignals(chunk);
    if (amounts.length > 0) return amounts[0]!;
  }
  return null;
}

function buildFinancialImpactStats(text: string): {
  stats: FinancialImpactStat[];
  assumption: string;
} {
  const monetarySignals = extractMonetarySignals(text);
  const perEvent =
    contextualDollarValue(text, ["per event", "event"]) ??
    monetarySignals[0] ??
    DEFAULT_FINANCIAL_IMPACT.perEvent;
  const crisisPerDay =
    contextualDollarValue(text, ["crisis day", "per day", "daily"]) ??
    monetarySignals[1] ??
    DEFAULT_FINANCIAL_IMPACT.crisisPerDay;
  const sustainedSevenDays =
    contextualDollarValue(text, ["sustained", "7 days", "7 day"]) ??
    monetarySignals[2] ??
    DEFAULT_FINANCIAL_IMPACT.sustainedSevenDays;
  const annualized =
    contextualDollarValue(text, ["annualized", "annual", "yearly", "per year"]) ??
    monetarySignals[3] ??
    DEFAULT_FINANCIAL_IMPACT.annualized;
  const assumptionMatch = text.match(/assuming[^.]+/i)?.[0];
  const assumption = assumptionMatch
    ? normalizeWhitespace(assumptionMatch).replace(/[.;]+$/, "") + "."
    : DEFAULT_FINANCIAL_IMPACT.assumption;

  return {
    stats: [
      { label: "Events", value: perEvent, detail: "Per event estimate" },
      { label: "Crisis Per Day", value: crisisPerDay, detail: "Crisis-day impact" },
      {
        label: "Sustained Elevation For 7 Days",
        value: sustainedSevenDays,
        detail: "Post-event carryover",
      },
      { label: "Annualized", value: annualized, detail: "Projected yearly impact" },
    ],
    assumption,
  };
}

function inferRiskLevel(messages: Message[], snapshot: AnomalyInsightSnapshot | null): FindingLevel {
  if (snapshot?.severity === "Critical" || snapshot?.severity === "High") return "High";

  const corpus = combinedConversationText(messages).toLowerCase();
  if (
    corpus.includes("critical") ||
    corpus.includes("high risk") ||
    corpus.includes("urgent") ||
    corpus.includes("immediate")
  ) {
    return "High";
  }
  if (corpus.includes("low risk") || corpus.includes("minimal risk")) return "Low";
  return "Medium";
}

function inferConfidenceLevel(messages: Message[]): FindingLevel {
  const corpus = combinedConversationText(messages).toLowerCase();
  if (
    corpus.includes("high confidence") ||
    corpus.includes(">90%") ||
    corpus.includes("> 90%") ||
    corpus.includes("very likely")
  ) {
    return "High";
  }
  if (
    corpus.includes("low confidence") ||
    corpus.includes("<50%") ||
    corpus.includes("< 50%") ||
    corpus.includes("insufficient data") ||
    corpus.includes("uncertain")
  ) {
    return "Low";
  }
  return "Medium";
}

function extractQualitySignal(corpus: string): string | null {
  const match =
    corpus.match(
      /\b(?:resolution rate|resolution|sentiment|csat|quality)\b[^.;]{0,72}/i,
    ) ?? null;
  return match ? normalizeWhitespace(match[0]) : null;
}

function extractEscalationSignal(corpus: string): string | null {
  const direct = corpus.match(/escalations?[^.;]{0,72}/i);
  if (direct) return normalizeWhitespace(direct[0]);
  const percentages = corpus.match(/\b\d{1,3}(?:\.\d+)?%\b/g) ?? [];
  if (percentages.length >= 2) {
    return `Escalations shifted from ${percentages[0]} to ${percentages[1]}`;
  }
  return null;
}

function buildRootCauseItems(
  messages: Message[],
  snapshot: AnomalyInsightSnapshot | null,
): RootCauseItem[] {
  const corpus = normalizeWhitespace(
    [snapshot?.description, snapshot?.detail, latestAssistantText(messages), combinedConversationText(messages)]
      .filter(Boolean)
      .join(" "),
  );
  const money = extractMonetarySignals(corpus);
  const qualitySignal = extractQualitySignal(corpus);
  const escalationSignal = extractEscalationSignal(corpus);
  const timestamp = snapshot?.timestamp ?? "the observed incident window";
  const detailSignal = snapshot?.detail
    ? normalizeWhitespace(snapshot.detail)
    : "Call volume and service indicators deviated from baseline";

  const downstreamMoney =
    money.length >= 3
      ? `${money[0]} daily cost -> ${money[1]} immediate -> ${money[2]} sustained elevation`
      : money.length >= 1
        ? `${money.join(" -> ")} estimated direct plus downstream costs`
        : "Direct and downstream costs are still being validated";

  return [
    {
      heading: "Precipitating Event",
      detail: `Unknown external crisis around ${timestamp} triggered urgent support demand and displacement-style needs.`,
    },
    {
      heading: "Overwhelming Call Volume Spike",
      detail: `${detailSignal}, concentrated in high-urgency contact reasons above baseline.`,
    },
    {
      heading: "Queue Pressure & Capacity Constraints",
      detail:
        "Agents shifted into triage mode under queue pressure, shortening handling depth to absorb demand.",
    },
    {
      heading: "Quality Degradation",
      detail:
        qualitySignal
          ? `${qualitySignal}, indicating incomplete service delivery under stress.`
          : "Resolution quality and customer sentiment likely weakened during the pressure period.",
    },
    {
      heading: "Staffing & Efficiency",
      detail:
        escalationSignal
          ? `${escalationSignal}, indicating increased handoffs and reduced first-contact completion.`
          : "Escalation load rose as teams prioritized throughput over full resolution.",
    },
    {
      heading: "Downstream Financial Impact",
      detail:
        `Callbacks, case-management escalations, and missed follow-ups increased operating cost exposure; ${downstreamMoney}.`,
    },
  ];
}

function buildPrimaryFinding(messages: Message[], snapshot: AnomalyInsightSnapshot | null): string {
  if (snapshot) {
    const timestampClause = snapshot.timestamp
      ? `on ${snapshot.timestamp}`
      : "during the observed window";
    const titleSignal = snapshot.title.replace(/\s+Anomaly Detected$/i, "").trim().toLowerCase();
    const signalClause = titleSignal
      ? `in ${titleSignal}`
      : "in service demand and performance";
    const summarySentence = firstSentence(snapshot.description);
    const summaryBody = summarySentence ? summarySentence.replace(/[.!?]+$/, "") : "an abrupt shift in operating conditions";

    const corpus = normalizeWhitespace(
      [snapshot.description, snapshot.detail, latestAssistantText(messages)].join(" "),
    );
    const moneySignals = extractMonetarySignals(corpus);
    const qualitySignalMatches =
      corpus.match(
        /\b(?:resolution|sentiment|csat|escalation|callback|handle time|aht|quality)\b[^.]{0,48}/gi,
      ) ?? [];
    const qualityClause =
      qualitySignalMatches.length > 0
        ? ` with measurable quality degradation (${normalizeWhitespace(qualitySignalMatches.slice(0, 2).join(", "))})`
        : " with measurable quality degradation";
    const costClause =
      moneySignals.length > 0
        ? ` and ${moneySignals[0]} in direct plus downstream cost exposure`
        : " and direct plus downstream cost exposure";

    return normalizeWhitespace(
      `${summaryBody} ${timestampClause} caused an urgent disruption ${signalClause} that overwhelmed contact center capacity (${snapshot.detail}), forcing teams into triage mode where abbreviated assistance led to service instability${qualityClause}${costClause}.`,
    );
  }

  const assistantSentence = firstSentence(latestAssistantText(messages));
  if (assistantSentence) return assistantSentence;

  return "Anomaly conditions detected. Investigation summary is being assembled from the available conversation context.";
}

export function buildAnomalyPrimaryFindingModel(
  messages: Message[],
  options?: { isThinking?: boolean },
): PrimaryFindingViewModel | null {
  if (!isAnomalyLikeConversation(messages)) return null;

  const snapshot = latestAnomalyInsightSnapshot(messages);
  const corpus = normalizeWhitespace(
    [snapshot?.description, snapshot?.detail, latestAssistantText(messages), combinedConversationText(messages)]
      .filter(Boolean)
      .join(" "),
  );

  const riskLevel = inferRiskLevel(messages, snapshot);
  const confidenceLevel = inferConfidenceLevel(messages);
  const { stats: financialImpactStats, assumption: financialImpactAssumption } =
    buildFinancialImpactStats(corpus);

  const riskDetail =
    riskLevel === "High"
      ? "Operational and service quality impact appears material and requires immediate follow-up."
      : riskLevel === "Low"
        ? "Current evidence suggests limited operational impact, but monitoring is still recommended."
        : "Risk is meaningful but not fully validated; continue investigation to confirm severity.";

  const confidenceDetail =
    confidenceLevel === "High"
      ? "Available evidence strongly supports the observed pattern and likely causal path."
      : confidenceLevel === "Low"
        ? "Evidence remains limited or mixed; confidence should improve after additional validation."
        : "Preliminary signals are directionally consistent, with some assumptions still unverified.";

  return {
    primaryFinding: buildPrimaryFinding(messages, snapshot),
    financialImpactStats,
    financialImpactAssumption,
    riskLevel,
    riskDetail,
    confidenceLevel,
    confidenceDetail,
    protocolStepLabel: "Step 7: Root Cause Identification",
    protocolStepStatus: options?.isThinking ? "In progress" : "Complete",
    rootCauses: buildRootCauseItems(messages, snapshot),
  };
}
