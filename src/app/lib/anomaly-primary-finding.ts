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

export interface SummaryStat {
  label: "Peak Time" | "Duration" | "Financial Impact" | "Anomalies";
  value: string;
  sublabel?: string;
}

export interface RelatedAnomalyItem {
  label: string;
  detail: string;
  timestamp?: string;
}

export interface PrimaryFindingViewModel {
  headingSubtitle: string;
  summaryStats: SummaryStat[];
  confidenceScorePct: number;
  relatedAnomalies: RelatedAnomalyItem[];
  recommendedActions: string[];
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

const DEFAULT_RECOMMENDED_ACTIONS = [
  "Immediately restore known-good routing and queue distribution controls for impacted channels.",
  "Add deployment validation checks to prevent invalid route mappings from being promoted.",
  "Configure real-time anomaly alerts for volume spikes, queue pressure, and quality degradation.",
  "Run a post-incident review to formalize escalation, triage, and rollback playbooks.",
] as const;

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

function findDuration(text: string): string | null {
  const patterns = [
    /\b\d+\s*h(?:ours?)?\s*\d+\s*m(?:in(?:utes?)?)?\b/i,
    /\b\d+\s*h(?:ours?)?\b/i,
    /\b\d+\s*m(?:in(?:utes?)?)\b/i,
    /\b\d+\s*days?\b/i,
  ];
  for (const pattern of patterns) {
    const match = text.match(pattern)?.[0];
    if (match) return normalizeWhitespace(match);
  }
  return null;
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

function confidenceScoreForLevel(level: FindingLevel): number {
  if (level === "High") return 87;
  if (level === "Low") return 42;
  return 68;
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

function buildHeadingSubtitle(messages: Message[], snapshot: AnomalyInsightSnapshot | null): string {
  if (snapshot?.description?.trim()) return normalizeWhitespace(snapshot.description);

  const assistantSentence = firstSentence(latestAssistantText(messages));
  if (assistantSentence) return assistantSentence;

  return "Anomaly conditions detected. Investigation summary is being assembled from the available conversation context.";
}

function buildSummaryStats(
  corpus: string,
  snapshot: AnomalyInsightSnapshot | null,
  financialImpactStats: FinancialImpactStat[],
  relatedAnomalies: RelatedAnomalyItem[],
): SummaryStat[] {
  const eventsValue =
    financialImpactStats.find((stat) => stat.label === "Events")?.value ??
    DEFAULT_FINANCIAL_IMPACT.perEvent;
  const annualizedValue = financialImpactStats.find((stat) => stat.label === "Annualized")?.value;
  const anomalyCountMatch = corpus.match(/\b(\d+)\s+(?:related|correlated)?\s*anomal(?:y|ies)\b/i);
  const anomalyCount = anomalyCountMatch?.[1]
    ? Number.parseInt(anomalyCountMatch[1], 10)
    : Math.max(relatedAnomalies.length, 1);

  return [
    {
      label: "Peak Time",
      value: snapshot?.timestamp || "Pending",
      sublabel: snapshot?.timestamp ? "Detected window" : "Awaiting source timestamp",
    },
    {
      label: "Duration",
      value: findDuration(corpus) || "Pending",
      sublabel: "Estimated incident duration",
    },
    {
      label: "Financial Impact",
      value: eventsValue,
      sublabel: annualizedValue ? `${annualizedValue} annualized projection` : "Annualized projection pending",
    },
    {
      label: "Anomalies",
      value: `${anomalyCount}`,
      sublabel: "Correlated metrics",
    },
  ];
}

function extractSignalSnippet(
  corpus: string,
  pattern: RegExp,
  fallback: string,
): string {
  const match = corpus.match(pattern)?.[0];
  return match ? normalizeWhitespace(match) : fallback;
}

function buildRelatedAnomalies(
  messages: Message[],
  snapshot: AnomalyInsightSnapshot | null,
): RelatedAnomalyItem[] {
  const corpus = normalizeWhitespace(
    [snapshot?.description, snapshot?.detail, latestAssistantText(messages), combinedConversationText(messages)]
      .filter(Boolean)
      .join(" "),
  );
  const related: RelatedAnomalyItem[] = [];

  if (snapshot) {
    related.push({
      label: snapshot.title.replace(/\s+Anomaly Detected$/i, "").trim() || "Primary anomaly",
      detail: snapshot.detail || snapshot.description,
      timestamp: snapshot.timestamp,
    });
  }

  const candidates: RelatedAnomalyItem[] = [
    {
      label: "Call Volume",
      detail: extractSignalSnippet(
        corpus,
        /(?:call|volume)[^.]{0,80}(?:spike|increase|drop|variance)[^.]{0,80}/i,
        "Inbound volume deviated from baseline during the anomaly window.",
      ),
    },
    {
      label: "CSAT",
      detail: extractSignalSnippet(
        corpus,
        /(?:csat|sentiment|customer satisfaction)[^.]{0,80}(?:drop|decline|shift|change)[^.]{0,80}/i,
        "Customer sentiment shifted in parallel with operational pressure.",
      ),
    },
    {
      label: "AHT",
      detail: extractSignalSnippet(
        corpus,
        /(?:aht|handle time|average handle time)[^.]{0,80}(?:increase|drop|change|variance)[^.]{0,80}/i,
        "Handle-time behavior changed materially during triage conditions.",
      ),
    },
  ];

  for (const candidate of candidates) {
    if (related.some((item) => item.label.toLowerCase() === candidate.label.toLowerCase())) continue;
    related.push(candidate);
    if (related.length >= 2) break;
  }

  if (related.length === 0) {
    return [
      {
        label: "Primary anomaly",
        detail: "Anomaly signal remains under investigation; correlated metrics are being confirmed.",
      },
      {
        label: "Service quality",
        detail: "Quality and operational efficiency indicators moved outside expected baseline.",
      },
    ];
  }

  if (related.length === 1) {
    related.push({
      label: "Service quality",
      detail: "Quality and operational efficiency indicators moved outside expected baseline.",
    });
  }

  return related.slice(0, 2);
}

function buildRecommendedActions(rootCauses: RootCauseItem[]): string[] {
  const actions: string[] = [];

  const hasQueuePressure = rootCauses.some((item) =>
    item.heading === "Queue Pressure & Capacity Constraints" || /queue|triage|capacity/i.test(item.detail),
  );
  if (hasQueuePressure) {
    actions.push("Stabilize routing and queue policies immediately to return distribution to baseline behavior.");
  }

  const hasQualitySignal = rootCauses.some((item) =>
    item.heading === "Quality Degradation" || /resolution|sentiment|quality|csat/i.test(item.detail),
  );
  if (hasQualitySignal) {
    actions.push("Deploy focused QA guardrails and escalation criteria to protect resolution quality during surges.");
  }

  const hasStaffingSignal = rootCauses.some((item) =>
    item.heading === "Staffing & Efficiency" || /escalation|handoff|staffing/i.test(item.detail),
  );
  if (hasStaffingSignal) {
    actions.push("Rebalance staffing and escalation playbooks to reduce avoidable handoffs and backlog growth.");
  }

  const hasCostSignal = rootCauses.some((item) =>
    item.heading === "Downstream Financial Impact" || /cost|callbacks|follow-up|case-management/i.test(item.detail),
  );
  if (hasCostSignal) {
    actions.push("Track downstream cost drivers weekly and prioritize remediation for the top loss contributors.");
  }

  for (const fallback of DEFAULT_RECOMMENDED_ACTIONS) {
    if (actions.length >= 4) break;
    if (!actions.includes(fallback)) actions.push(fallback);
  }

  return actions.slice(0, 4);
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
  const confidenceScorePct = confidenceScoreForLevel(confidenceLevel);
  const { stats: financialImpactStats, assumption: financialImpactAssumption } =
    buildFinancialImpactStats(corpus);
  const rootCauses = buildRootCauseItems(messages, snapshot);
  const relatedAnomalies = buildRelatedAnomalies(messages, snapshot);
  const summaryStats = buildSummaryStats(corpus, snapshot, financialImpactStats, relatedAnomalies);
  const headingSubtitle = buildHeadingSubtitle(messages, snapshot);
  const recommendedActions = buildRecommendedActions(rootCauses);

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
    headingSubtitle,
    summaryStats,
    confidenceScorePct,
    relatedAnomalies,
    recommendedActions,
    primaryFinding: buildPrimaryFinding(messages, snapshot),
    financialImpactStats,
    financialImpactAssumption,
    riskLevel,
    riskDetail,
    confidenceLevel,
    confidenceDetail,
    protocolStepLabel: "Step 7: Root Cause Identification",
    protocolStepStatus: options?.isThinking ? "In progress" : "Complete",
    rootCauses,
  };
}
