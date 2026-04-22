/** Page-specific data for Automation Opportunities (Figma: Auto-Insight UX). */
import { automationOpportunityReferences } from "./automation-opportunity-references";

export type AutomationScopeTab = "categories" | "topics" | "subtopics";

export type AutomationPeriodStat = {
  label: string;
  value: string;
};

export const automationAnalyzedPeriodStats: AutomationPeriodStat[] = [
  { label: "Interactions analyzed", value: "143K" },
  { label: "Major categories", value: "3" },
  { label: "Automatable workload", value: "3%" },
  { label: "Projected savings", value: "$39K / yr" },
  { label: "Top category (auto. share)", value: "68%" },
  { label: "Card services automation", value: "90%" },
];

/** Topics tab — Analyzed Period KPIs (Figma: Topics overview). */
export const automationTopicsTabPeriodStats: AutomationPeriodStat[] = [
  { label: "Total Interactions", value: "26,666" },
  { label: "Avg. Duration", value: "3:20" },
  { label: "Avg. Sentiment", value: "4.67" },
  { label: "Intents Identified", value: "191" },
  { label: "Actions Identified", value: "536" },
  { label: "Agents", value: "127" },
];

export const AUTOMATION_TOPICS_ANALYZED_PERIOD_SUBTITLE =
  "Monthly Analysis: 1–31 Jul 2025";

/** Sub-topics tab — same period subtitle pattern as Topics (Figma). */
export const AUTOMATION_SUBTOPICS_ANALYZED_PERIOD_SUBTITLE =
  "Monthly Analysis: 1–31 Jul 2025";

/** Sub-topics tab — Analyzed Period KPIs (Figma: Sub-topics overview). */
export const automationSubtopicsTabPeriodStats: AutomationPeriodStat[] = [
  { label: "Total Interactions", value: "26,666" },
  { label: "Avg. Duration", value: "3:20" },
  { label: "Avg. Sentiment", value: "4.67" },
  { label: "Intents Identified", value: "191" },
  { label: "Actions Identified", value: "536" },
  { label: "Agents", value: "127" },
];

export type AutomationOpportunityMetric = {
  label: string;
  value: string;
};

export type AutomationOpportunityRow = {
  id: string;
  title: string;
  description: string;
  metrics: AutomationOpportunityMetric[];
};

// ── Top Opportunities (Figma: Automation Impact Overview - Clean) ────────────

export type TopOpportunityMetricKey =
  | "totalCalls"
  | "categoryVolume"
  | "automatableVolume"
  | "automatablePercent"
  | "duration"
  | "sentiment"
  | "annualSavings";

export type TopOpportunityMetric = {
  key: TopOpportunityMetricKey;
  label: string;
  value: string;
  tone?: "default" | "positive";
};

export type TopOpportunityBarItem = {
  label: string;
  /** Numeric scale for progress (e.g. 0–100 for percentages). */
  value: number;
  /** When set, shown on the right instead of a formatted count. */
  display?: string;
};

export type TopOpportunityTopic = {
  id: string;
  title: string;
  subtitle: string;
  metrics: TopOpportunityMetric[];
  bars?: {
    title: string;
    items: TopOpportunityBarItem[];
  };
  subTopics?: TopOpportunityTopic[];
  /** When present, render a secondary CTA under the bar list (Figma deep state). */
  secondaryCta?: {
    label: string;
  };
};

export type TopOpportunityCategory = {
  id: string;
  title: string;
  subtitle: string;
  metrics: TopOpportunityMetric[];
  /** Category-level action bars shown in expanded state. */
  bars?: {
    title: string;
    items: TopOpportunityBarItem[];
  };
  topics: TopOpportunityTopic[];
};

const categoryMetricLabels: Record<TopOpportunityMetricKey, string> = {
  totalCalls: "Total Call (CC)",
  categoryVolume: "Category Volume",
  automatableVolume: "Automatable Volume",
  automatablePercent: "Automatable % (CC)",
  duration: "Duration",
  sentiment: "Sentiment",
  annualSavings: "Annual Savings",
};

function metric(
  key: TopOpportunityMetricKey,
  value: string,
  tone?: TopOpportunityMetric["tone"],
): TopOpportunityMetric {
  return { key, label: categoryMetricLabels[key], value, tone };
}

function topicsTabChip(
  key: TopOpportunityMetricKey,
  label: string,
  value: string,
  tone?: TopOpportunityMetric["tone"],
): TopOpportunityMetric {
  return { key, label, value, tone };
}

export type TopicsTabTopicRow = {
  id: string;
  title: string;
  description: string;
  chipMetrics: TopOpportunityMetric[];
  bars?: {
    title: string;
    items: TopOpportunityBarItem[];
  };
  /** Passed to sample interactions and overflow actions context. */
  sampleInteractionsLabel: string;
};

const billingPaymentsRef = automationOpportunityReferences.billingPayments;
const billExplanationRef = automationOpportunityReferences.billExplanation;
const chargeBreakdownRef = automationOpportunityReferences.chargeBreakdown;
const cardServicesRef = automationOpportunityReferences.cardServices;
const cardActivationRef = automationOpportunityReferences.cardActivation;
const addPaymentMethodRef = automationOpportunityReferences.addPaymentMethod;

export const automationTopicsTabTopicRows: TopicsTabTopicRow[] = [
  {
    id: billExplanationRef.id,
    title: billExplanationRef.title,
    description:
      "40,501 card clearance requests hit your team every month — most follow repetitive verification and document patterns.",
    sampleInteractionsLabel: billExplanationRef.title,
    chipMetrics: [
      topicsTabChip("totalCalls", "Total Calls", "48,000"),
      topicsTabChip("categoryVolume", "Category Volume", "40,501"),
      topicsTabChip("automatableVolume", "Automatable Volume", "34,426"),
      topicsTabChip("automatablePercent", "Auto. Potential", "10.5%"),
      topicsTabChip("duration", "Duration", "3:50"),
      topicsTabChip("sentiment", "Sentiment", "4.67"),
    ],
    bars: {
      title: "Agent Actions for This Topic",
      items: [
        { label: "Making a payment", value: 64, display: "64%" },
        { label: "Inquiring about Payment", value: 51, display: "51%" },
        { label: "Payment Arrangement", value: 8, display: "8%" },
      ],
    },
  },
  {
    id: cardActivationRef.id,
    title: cardActivationRef.title,
    description:
      "24,509 activation and verification requests are highly standardized — strong fit for guided self-serve and AI assist steps.",
    sampleInteractionsLabel: cardActivationRef.title,
    chipMetrics: [
      topicsTabChip("totalCalls", "Total Calls", "48,000"),
      topicsTabChip("categoryVolume", "Category Volume", "24,509"),
      topicsTabChip("automatableVolume", "Automatable Volume", "20,833"),
      topicsTabChip("automatablePercent", "Auto. Potential", "6.4%"),
      topicsTabChip("duration", "Duration", "4:20"),
      topicsTabChip("sentiment", "Sentiment", "4.67"),
    ],
    bars: {
      title: "Agent Actions for This Topic",
      items: [
        { label: "Activating card", value: 74, display: "74%" },
        { label: "Replacing a card", value: 40, display: "40%" },
        { label: "Lost Stolen card", value: 16, display: "16%" },
      ],
    },
  },
  {
    id: "topics-payment-methods",
    title: "Payment Methods",
    description:
      "18,204 payment-method and funding questions map to a small number of policy templates ideal for instant, consistent answers.",
    sampleInteractionsLabel: "Payment Methods",
    chipMetrics: [
      topicsTabChip("totalCalls", "Total Calls", "48,000"),
      topicsTabChip("categoryVolume", "Category Volume", "18,204"),
      topicsTabChip("automatableVolume", "Automatable Volume", "15,473"),
      topicsTabChip("automatablePercent", "Auto. Potential", "4.8%"),
      topicsTabChip("duration", "Duration", "3:05"),
      topicsTabChip("sentiment", "Sentiment", "4.67"),
    ],
    bars: {
      title: "Agent Actions for This Topic",
      items: [
        { label: "Paying off balance", value: 65, display: "65%" },
        { label: "Selecting Payment", value: 8, display: "8%" },
      ],
    },
  },
];

/** Hand-authored rows for the Sub-topics tab (Figma: Sub-topics 1 / Sub-topics 2). */
const automationSubtopicsHandAuthoredRows: TopicsTabTopicRow[] = [
  {
    id: chargeBreakdownRef.id,
    title: chargeBreakdownRef.title,
    description:
      "Line-item and clearance questions repeat the same authentication and document paths — a strong candidate for deterministic triage before agent review.",
    sampleInteractionsLabel: chargeBreakdownRef.title,
    chipMetrics: [
      topicsTabChip("totalCalls", "Total Calls", "48,000"),
      topicsTabChip("categoryVolume", "Sub-topic Volume", "9,420"),
      topicsTabChip("automatableVolume", "Automatable Volume", "8,010"),
      topicsTabChip("automatablePercent", "Auto. Potential", "2.4%"),
      topicsTabChip("duration", "Duration", "4:05"),
      topicsTabChip("sentiment", "Sentiment", "4.52"),
    ],
    bars: {
      title: "Agent Actions for This Sub-topic",
      items: [
        { label: "Making a payment", value: 64, display: "64%" },
        { label: "Inquiring about Payment", value: 51, display: "51%" },
        { label: "Payment Arrangement", value: 8, display: "8%" },
      ],
    },
  },
  {
    id: addPaymentMethodRef.id,
    title: addPaymentMethodRef.title,
    description:
      "Customers adding cards or bank accounts follow predictable verification flows; most steps are read-only confirmations in core banking systems.",
    sampleInteractionsLabel: addPaymentMethodRef.title,
    chipMetrics: [
      topicsTabChip("totalCalls", "Total Calls", "48,000"),
      topicsTabChip("categoryVolume", "Sub-topic Volume", "6,110"),
      topicsTabChip("automatableVolume", "Automatable Volume", "5,356"),
      topicsTabChip("automatablePercent", "Auto. Potential", "1.6%"),
      topicsTabChip("duration", "Duration", "3:42"),
      topicsTabChip("sentiment", "Sentiment", "4.48"),
    ],
    bars: {
      title: "Agent Actions for This Sub-topic",
      items: [
        { label: "Payment method verified", value: 58, display: "58%" },
        { label: "Enrollment steps explained", value: 44, display: "44%" },
        { label: "Wallet or device issue triaged", value: 19, display: "19%" },
      ],
    },
  },
  {
    id: "subtopics-update-payment",
    title: "Update Payment",
    description:
      "Updates to funding sources are policy-light and audit-friendly — ideal for guided self-serve with a short human fallback on exceptions.",
    sampleInteractionsLabel: "Update Payment",
    chipMetrics: [
      topicsTabChip("totalCalls", "Total Calls", "48,000"),
      topicsTabChip("categoryVolume", "Sub-topic Volume", "5,280"),
      topicsTabChip("automatableVolume", "Automatable Volume", "4,485"),
      topicsTabChip("automatablePercent", "Auto. Potential", "1.3%"),
      topicsTabChip("duration", "Duration", "3:28"),
      topicsTabChip("sentiment", "Sentiment", "4.41"),
    ],
    bars: {
      title: "Agent Actions for This Sub-topic",
      items: [
        { label: "Confirming new account details", value: 62, display: "62%" },
        { label: "Removing old payment method", value: 35, display: "35%" },
        { label: "Scheduling next debit date", value: 22, display: "22%" },
      ],
    },
  },
  {
    id: "subtopics-fee-questions",
    title: "Fee Questions",
    description:
      "Fee and interest explanations draw from a small library of rate tables and disclosure text — well suited to templated responses with links to statements.",
    sampleInteractionsLabel: "Fee Questions",
    chipMetrics: [
      topicsTabChip("totalCalls", "Total Calls", "48,000"),
      topicsTabChip("categoryVolume", "Sub-topic Volume", "4,890"),
      topicsTabChip("automatableVolume", "Automatable Volume", "4,058"),
      topicsTabChip("automatablePercent", "Auto. Potential", "1.2%"),
      topicsTabChip("duration", "Duration", "3:55"),
      topicsTabChip("sentiment", "Sentiment", "4.39"),
    ],
    bars: {
      title: "Agent Actions for This Sub-topic",
      items: [
        { label: "Explaining fee line items", value: 71, display: "71%" },
        { label: "Waive or credit eligibility check", value: 28, display: "28%" },
        { label: "Redirecting to dispute flow", value: 14, display: "14%" },
      ],
    },
  },
  {
    id: "subtopics-billing-cycle",
    title: "Billing Cycle",
    description:
      "Cycle dates and grace-period questions are highly repetitive; surfacing billing calendars and next statement dates removes most live-agent load.",
    sampleInteractionsLabel: "Billing Cycle",
    chipMetrics: [
      topicsTabChip("totalCalls", "Total Calls", "48,000"),
      topicsTabChip("categoryVolume", "Sub-topic Volume", "4,015"),
      topicsTabChip("automatableVolume", "Automatable Volume", "3,411"),
      topicsTabChip("automatablePercent", "Auto. Potential", "1.0%"),
      topicsTabChip("duration", "Duration", "3:18"),
      topicsTabChip("sentiment", "Sentiment", "4.55"),
    ],
    bars: {
      title: "Agent Actions for This Sub-topic",
      items: [
        { label: "Confirming statement close date", value: 66, display: "66%" },
        { label: "Explaining grace period", value: 39, display: "39%" },
        { label: "Adjusting due date request", value: 12, display: "12%" },
      ],
    },
  },
];

const SUBTOPICS_EXTRA_TITLES = [
  "Payment Posting Delay",
  "Refund Status Inquiry",
  "Autopay Setup",
  "Minimum Payment Questions",
  "Credit Limit Review",
  "Dispute Initial Filing",
  "Paperless Enrollment",
  "Statement Delivery Options",
  "Interest Rate Inquiry",
  "Payment Reversal Request",
  "Split Payment Arrangements",
  "Foreign Transaction Fees",
  "Cash Advance Limits",
  "Rewards Redemption",
  "Merchant Charge Inquiry",
  "Card Replacement Status",
  "PIN Reset Request",
  "Travel Notification",
  "Authorized User Changes",
  "Balance Transfer Offers",
  "Delinquency Notices",
  "Payment Extension Request",
  "Tax Document Request",
  "ACH Return Handling",
] as const;

function buildAutomationSubtopicsExtraRow(seed: number): TopicsTabTopicRow {
  const title = SUBTOPICS_EXTRA_TITLES[seed]!;
  const subVol = Math.max(800, 3900 - seed * 115);
  const autoVol = Math.round(subVol * (0.82 + (seed % 7) * 0.02));
  const autoPct = `${(0.45 + (seed % 18) * 0.06).toFixed(1)}%`;
  const durM = 3 + (seed % 4);
  const durS = 10 + (seed * 11) % 50;
  const sent = (4.2 + (seed % 35) / 100).toFixed(2);

  return {
    id: `subtopics-extra-${seed + 1}`,
    title,
    description: `${title} interactions cluster around a narrow set of policy answers and system lookups — strong fit for guided flows, snippets, and exception routing to specialists when rules don’t apply (variant ${seed + 1}).`,
    sampleInteractionsLabel: title,
    chipMetrics: [
      topicsTabChip("totalCalls", "Total Calls", "48,000"),
      topicsTabChip("categoryVolume", "Sub-topic Volume", subVol.toLocaleString("en-US")),
      topicsTabChip("automatableVolume", "Automatable Volume", autoVol.toLocaleString("en-US")),
      topicsTabChip("automatablePercent", "Auto. Potential", autoPct),
      topicsTabChip("duration", "Duration", `${durM}:${String(durS).padStart(2, "0")}`),
      topicsTabChip("sentiment", "Sentiment", sent),
    ],
    bars: {
      title: "Agent Actions for This Sub-topic",
      items: [
        {
          label: "Policy or fee explanation",
          value: 55 + (seed % 25),
          display: `${55 + (seed % 25)}%`,
        },
        {
          label: "Account or card lookup",
          value: 30 + (seed % 20),
          display: `${30 + (seed % 20)}%`,
        },
        {
          label: "Escalation or exception",
          value: 8 + (seed % 12),
          display: `${8 + (seed % 12)}%`,
        },
      ],
    },
  };
}

/** Flat list rows for the Sub-topics tab — 5 curated + 24 generated (29 total). */
export const automationSubtopicsTabTopicRows: TopicsTabTopicRow[] = [
  ...automationSubtopicsHandAuthoredRows,
  ...Array.from({ length: 24 }, (_, i) => buildAutomationSubtopicsExtraRow(i)),
];

const topCategories: TopOpportunityCategory[] = [
  {
    id: billingPaymentsRef.id,
    title: billingPaymentsRef.title,
    subtitle: "3 Related Topics",
    metrics: [
      metric("totalCalls", "45,000"),
      metric("categoryVolume", "4,200"),
      metric("automatableVolume", "3,400"),
      metric("automatablePercent", "7.6%"),
      metric("duration", "3:45"),
      metric("sentiment", "3.5"),
      metric("annualSavings", "$26K", "positive"),
    ],
    bars: {
      title: "Agent Actions in This Category",
      items: [
        { label: "Caller Was Authenticated", value: 2840 },
        { label: "Billing Was Discussed", value: 2520 },
        { label: "Account Was Reviewed", value: 1890 },
        { label: "Assisted With Payment", value: 1680 },
        { label: "Agent Provided Information About...", value: 1260 },
      ],
    },
    topics: [
      {
        id: "bill-explanation",
        title: "Bill Explanation",
        subtitle: "3 Related sub-topics",
        metrics: [
          metric("totalCalls", "45,000"),
          metric("categoryVolume", "1,800"),
          metric("automatableVolume", "1,620"),
          metric("automatablePercent", "3.6%"),
          metric("duration", "4:00"),
          metric("sentiment", "3.6"),
          metric("annualSavings", "$13K", "positive"),
        ],
        subTopics: [
          {
            id: "charge-breakdown-1",
            title: "Charge Breakdown",
            subtitle: "",
            metrics: [
              metric("totalCalls", "45,000"),
              metric("categoryVolume", "900"),
              metric("automatableVolume", "855"),
              metric("automatablePercent", "1.9%"),
              metric("duration", "4:00"),
              metric("sentiment", "3.6"),
              metric("annualSavings", "$7K", "positive"),
            ],
            bars: {
              title: "Agent Actions in This Sub-topic",
              items: [
                { label: "Billing Was Discussed", value: 810 },
                { label: "Agent Provided Information About...", value: 720 },
                { label: "Account Was Reviewed...", value: 630 },
              ],
            },
            secondaryCta: { label: "Create Deterministic Process" },
          },
          {
            id: "charge-breakdown-2",
            title: "Charge Breakdown",
            subtitle: "",
            metrics: [
              metric("totalCalls", "45,000"),
              metric("categoryVolume", "600"),
              metric("automatableVolume", "522"),
              metric("automatablePercent", "1.2%"),
              metric("duration", "4:00"),
              metric("sentiment", "3.6"),
              metric("annualSavings", "$4K", "positive"),
            ],
            bars: {
              title: "Agent Actions in This Sub-topic",
              items: [
                { label: "Billing Was Discussed", value: 540 },
                { label: "Agent Provided Information About...", value: 480 },
                { label: "Account Was Reviewed", value: 360 },
              ],
            },
            secondaryCta: { label: "Create Deterministic Process" },
          },
          {
            id: "charge-breakdown-3",
            title: "Charge Breakdown",
            subtitle: "",
            metrics: [
              metric("totalCalls", "45,000"),
              metric("categoryVolume", "300"),
              metric("automatableVolume", "252"),
              metric("automatablePercent", "0.6%"),
              metric("duration", "4:00"),
              metric("sentiment", "3.4"),
              metric("annualSavings", "$2K", "positive"),
            ],
            bars: {
              title: "Agent Actions in This Sub-topic",
              items: [
                { label: "Billing Was Discussed...", value: 270 },
                { label: "Agent Explained Billing Cycle", value: 240 },
              ],
            },
            secondaryCta: { label: "Create Deterministic Process" },
          },
        ],
      },
      {
        id: "payment-methods",
        title: "Payment Methods",
        subtitle: "3 Related sub-topics",
        metrics: [
          metric("totalCalls", "45,000"),
          metric("categoryVolume", "1,500"),
          metric("automatableVolume", "1,290"),
          metric("automatablePercent", "2.9%"),
          metric("duration", "3:30"),
          metric("sentiment", "3.5"),
          metric("annualSavings", "$9K", "positive"),
        ],
        subTopics: [
          {
            id: "pm-autopay",
            title: "Autopay & Scheduled Payments",
            subtitle: "",
            metrics: [
              metric("totalCalls", "45,000"),
              metric("categoryVolume", "520"),
              metric("automatableVolume", "452"),
              metric("automatablePercent", "1.0%"),
              metric("duration", "3:25"),
              metric("sentiment", "3.5"),
              metric("annualSavings", "$3.2K", "positive"),
            ],
            bars: {
              title: "Agent Actions in This Sub-topic",
              items: [
                { label: "Caller Was Authenticated", value: 420 },
                { label: "Payment Method Was Verified", value: 380 },
                { label: "Autopay Terms Were Explained", value: 310 },
              ],
            },
            secondaryCta: { label: "Create Deterministic Process" },
          },
          {
            id: "pm-digital-wallet",
            title: "Digital Wallets & Contactless",
            subtitle: "",
            metrics: [
              metric("totalCalls", "45,000"),
              metric("categoryVolume", "490"),
              metric("automatableVolume", "421"),
              metric("automatablePercent", "0.9%"),
              metric("duration", "3:20"),
              metric("sentiment", "3.6"),
              metric("annualSavings", "$2.9K", "positive"),
            ],
            bars: {
              title: "Agent Actions in This Sub-topic",
              items: [
                { label: "Wallet Enrollment Was Discussed", value: 360 },
                { label: "Card on File Was Updated", value: 320 },
                { label: "Agent Provided Step-by-Step Guidance", value: 275 },
              ],
            },
            secondaryCta: { label: "Create Deterministic Process" },
          },
          {
            id: "pm-pay-by-phone",
            title: "Pay-by-Phone & Agent-Assisted Payments",
            subtitle: "",
            metrics: [
              metric("totalCalls", "45,000"),
              metric("categoryVolume", "490"),
              metric("automatableVolume", "417"),
              metric("automatablePercent", "0.9%"),
              metric("duration", "3:45"),
              metric("sentiment", "3.4"),
              metric("annualSavings", "$2.9K", "positive"),
            ],
            bars: {
              title: "Agent Actions in This Sub-topic",
              items: [
                { label: "Payment Channel Was Confirmed", value: 340 },
                { label: "Account Was Authenticated", value: 300 },
                { label: "Receipt or Confirmation Sent", value: 260 },
              ],
            },
            secondaryCta: { label: "Create Deterministic Process" },
          },
        ],
      },
      {
        id: "payment-issues",
        title: "Payment Issues",
        subtitle: "2 Related sub-topics",
        metrics: [
          metric("totalCalls", "45,000"),
          metric("categoryVolume", "900"),
          metric("automatableVolume", "585"),
          metric("automatablePercent", "1.3%"),
          metric("duration", "4:45"),
          metric("sentiment", "3.4"),
          metric("annualSavings", "$6K", "positive"),
        ],
        subTopics: [
          {
            id: "pi-declined",
            title: "Declined & Failed Payments",
            subtitle: "",
            metrics: [
              metric("totalCalls", "45,000"),
              metric("categoryVolume", "480"),
              metric("automatableVolume", "312"),
              metric("automatablePercent", "0.7%"),
              metric("duration", "5:10"),
              metric("sentiment", "3.3"),
              metric("annualSavings", "$3.2K", "positive"),
            ],
            bars: {
              title: "Agent Actions in This Sub-topic",
              items: [
                { label: "Decline Reason Was Explained", value: 400 },
                { label: "Customer Retried or Updated Method", value: 340 },
                { label: "Escalation or Ticket Created", value: 260 },
              ],
            },
            secondaryCta: { label: "Create Deterministic Process" },
          },
          {
            id: "pi-refunds",
            title: "Refunds & Posting Delays",
            subtitle: "",
            metrics: [
              metric("totalCalls", "45,000"),
              metric("categoryVolume", "420"),
              metric("automatableVolume", "273"),
              metric("automatablePercent", "0.6%"),
              metric("duration", "4:15"),
              metric("sentiment", "3.5"),
              metric("annualSavings", "$2.8K", "positive"),
            ],
            bars: {
              title: "Agent Actions in This Sub-topic",
              items: [
                { label: "Refund Timeline Was Communicated", value: 330 },
                { label: "Payment History Was Reviewed", value: 290 },
              ],
            },
            secondaryCta: { label: "Create Deterministic Process" },
          },
        ],
      },
    ],
  },
  {
    id: cardServicesRef.id,
    title: cardServicesRef.title,
    subtitle: "2 Related Topics",
    metrics: [
      metric("totalCalls", "48,000"),
      metric("categoryVolume", "3,800"),
      metric("automatableVolume", "3,230"),
      metric("automatablePercent", "6.7%"),
      metric("duration", "4:15"),
      metric("sentiment", "3.7"),
      metric("annualSavings", "$27K", "positive"),
    ],
    bars: {
      title: "Agent Actions in This Category",
      items: [
        { label: "Caller Was Authenticated", value: 2980 },
        { label: "Card Details Were Verified", value: 2620 },
        { label: "Self-Service Option Was Offered", value: 2240 },
        { label: "Card Status or Limits Were Discussed", value: 1960 },
        { label: "Follow-up or Confirmation Provided", value: 1580 },
      ],
    },
    topics: [
      {
        id: "card-activation",
        title: "Card Activation & PIN",
        subtitle: "3 Related sub-topics",
        metrics: [
          metric("totalCalls", "48,000"),
          metric("categoryVolume", "2,100"),
          metric("automatableVolume", "1,785"),
          metric("automatablePercent", "3.7%"),
          metric("duration", "3:55"),
          metric("sentiment", "3.7"),
          metric("annualSavings", "$15K", "positive"),
        ],
        subTopics: [
          {
            id: "ca-first-use",
            title: "First-Use Activation",
            subtitle: "",
            metrics: [
              metric("totalCalls", "48,000"),
              metric("categoryVolume", "740"),
              metric("automatableVolume", "630"),
              metric("automatablePercent", "1.3%"),
              metric("duration", "3:40"),
              metric("sentiment", "3.8"),
              metric("annualSavings", "$5.4K", "positive"),
            ],
            bars: {
              title: "Agent Actions in This Sub-topic",
              items: [
                { label: "Activation Steps Were Walked Through", value: 580 },
                { label: "Card Delivery Status Was Confirmed", value: 510 },
                { label: "Channel or App Guidance Provided", value: 440 },
              ],
            },
            secondaryCta: { label: "Create Deterministic Process" },
          },
          {
            id: "ca-pin",
            title: "PIN Set, Reset & Lockouts",
            subtitle: "",
            metrics: [
              metric("totalCalls", "48,000"),
              metric("categoryVolume", "720"),
              metric("automatableVolume", "612"),
              metric("automatablePercent", "1.3%"),
              metric("duration", "4:05"),
              metric("sentiment", "3.6"),
              metric("annualSavings", "$5.1K", "positive"),
            ],
            bars: {
              title: "Agent Actions in This Sub-topic",
              items: [
                { label: "Identity Was Verified", value: 550 },
                { label: "PIN Mailer or IVR Path Explained", value: 480 },
                { label: "Lockout or Retry Rules Clarified", value: 400 },
              ],
            },
            secondaryCta: { label: "Create Deterministic Process" },
          },
          {
            id: "ca-digital",
            title: "Digital Cards & Mobile Wallet",
            subtitle: "",
            metrics: [
              metric("totalCalls", "48,000"),
              metric("categoryVolume", "640"),
              metric("automatableVolume", "543"),
              metric("automatablePercent", "1.1%"),
              metric("duration", "3:50"),
              metric("sentiment", "3.7"),
              metric("annualSavings", "$4.5K", "positive"),
            ],
            bars: {
              title: "Agent Actions in This Sub-topic",
              items: [
                { label: "Provisioning Steps Were Confirmed", value: 470 },
                { label: "Wallet or Device Issue Triaged", value: 410 },
              ],
            },
            secondaryCta: { label: "Create Deterministic Process" },
          },
        ],
      },
      {
        id: "card-replacement",
        title: "Limits, Replacement & Disputes",
        subtitle: "2 Related sub-topics",
        metrics: [
          metric("totalCalls", "48,000"),
          metric("categoryVolume", "1,700"),
          metric("automatableVolume", "1,445"),
          metric("automatablePercent", "3.0%"),
          metric("duration", "4:35"),
          metric("sentiment", "3.6"),
          metric("annualSavings", "$12K", "positive"),
        ],
        subTopics: [
          {
            id: "cr-limits",
            title: "Credit Limits & Holds",
            subtitle: "",
            metrics: [
              metric("totalCalls", "48,000"),
              metric("categoryVolume", "920"),
              metric("automatableVolume", "782"),
              metric("automatablePercent", "1.6%"),
              metric("duration", "4:20"),
              metric("sentiment", "3.6"),
              metric("annualSavings", "$6.5K", "positive"),
            ],
            bars: {
              title: "Agent Actions in This Sub-topic",
              items: [
                { label: "Limit Rules and Timing Explained", value: 680 },
                { label: "Available Credit or Hold Details Shared", value: 590 },
                { label: "Increase or Review Path Offered", value: 520 },
              ],
            },
            secondaryCta: { label: "Create Deterministic Process" },
          },
          {
            id: "cr-lost-stolen",
            title: "Lost, Stolen & Damaged Replacement",
            subtitle: "",
            metrics: [
              metric("totalCalls", "48,000"),
              metric("categoryVolume", "780"),
              metric("automatableVolume", "663"),
              metric("automatablePercent", "1.4%"),
              metric("duration", "4:55"),
              metric("sentiment", "3.5"),
              metric("annualSavings", "$5.5K", "positive"),
            ],
            bars: {
              title: "Agent Actions in This Sub-topic",
              items: [
                { label: "Card Was Blocked or Frozen", value: 610 },
                { label: "Replacement Timeline Communicated", value: 540 },
                { label: "Fraud or Dispute Route Confirmed", value: 460 },
              ],
            },
            secondaryCta: { label: "Create Deterministic Process" },
          },
        ],
      },
    ],
  },
];

export const topOpportunitiesByScope: Record<AutomationScopeTab, TopOpportunityCategory[]> =
  {
    categories: topCategories,
    topics: topCategories,
    subtopics: topCategories,
  };

const categoryOpportunities: AutomationOpportunityRow[] = [
  {
    id: "cat-billing",
    title: billingPaymentsRef.title,
    description:
      "40,501 card clearance and billing lookup requests hit your team every month — most follow repetitive verification and document patterns.",
    metrics: [
      { label: "Monthly volume", value: "40.5K" },
      { label: "Auto. potential", value: "68%" },
      { label: "Annual savings", value: "$33K" },
      { label: "Avg handle time", value: "5m 12s" },
      { label: "Containment today", value: "41%" },
      { label: "Sentiment", value: "3.9/5" },
      { label: "Priority", value: "Critical" },
    ],
  },
  {
    id: "cat-card",
    title: cardServicesRef.title,
    description:
      "Card activation, limits, and replacement flows are highly standardized — strong fit for end-to-end AI with minimal escalation.",
    metrics: [
      { label: "Monthly volume", value: "28.2K" },
      { label: "Automation rate", value: "90%" },
      { label: "Annual savings", value: "$12K" },
      { label: "Avg handle time", value: "3m 40s" },
      { label: "Containment today", value: "76%" },
      { label: "Sentiment", value: "4.2/5" },
      { label: "Priority", value: "High" },
    ],
  },
];

const topicOpportunities: AutomationOpportunityRow[] = [
  {
    id: "topic-bill-expl",
    title: billExplanationRef.title,
    description:
      "Customers asking what charges mean cluster into a small set of line-item templates — ideal for scripted explanations plus PDF links.",
    metrics: [
      { label: "Weekly volume", value: "9.1K" },
      { label: "Deflection headroom", value: "+24%" },
      { label: "Est. savings", value: "$18K / yr" },
      { label: "Parent category", value: "Billing" },
      { label: "Repeat rate", value: "31%" },
      { label: "SLA risk", value: "Low" },
      { label: "Priority", value: "Critical" },
    ],
  },
  {
    id: "topic-pay-arr",
    title: "Payment Arrangement",
    description:
      "Arrangement eligibility and schedule setup are rule-heavy; agents repeat the same policy checks on nearly every conversation.",
    metrics: [
      { label: "Weekly volume", value: "6.4K" },
      { label: "Auto. potential", value: "61%" },
      { label: "Est. savings", value: "$14K / yr" },
      { label: "Avg handle time", value: "7m 05s" },
      { label: "Escalation rate", value: "18%" },
      { label: "Sentiment", value: "3.7/5" },
      { label: "Priority", value: "High" },
    ],
  },
  {
    id: "topic-refund",
    title: "Refund Requests",
    description:
      "Most refunds are policy-bound lookups and timing questions; fewer than 8% need manual finance review once data is surfaced.",
    metrics: [
      { label: "Weekly volume", value: "5.2K" },
      { label: "Straight-through", value: "52%" },
      { label: "Est. savings", value: "$11K / yr" },
      { label: "Chargeback link", value: "12%" },
      { label: "Containment", value: "48%" },
      { label: "Sentiment", value: "3.6/5" },
      { label: "Priority", value: "High" },
    ],
  },
];

const subtopicOpportunities: AutomationOpportunityRow[] = [
  {
    id: "sub-invoice-pdf",
    title: "Invoice PDF & line items",
    description:
      "Users cannot locate downloadable invoices; providing authenticated PDF retrieval and charge breakdown removes a top billing drop-off.",
    metrics: [
      { label: "Daily volume", value: "1.8K" },
      { label: "Resolution path", value: "2-step" },
      { label: "Est. savings", value: "$6K / yr" },
      { label: "Topic", value: "Bill Explanation" },
      { label: "Channel mix", value: "58% chat" },
      { label: "Error rate", value: "1.1%" },
      { label: "Priority", value: "Medium" },
    ],
  },
  {
    id: "sub-autopay",
    title: "Autopay enrollment status",
    description:
      "Confirming enrollment and next debit dates is read-only in core systems — safe for instant bot resolution with audit logging.",
    metrics: [
      { label: "Daily volume", value: "1.2K" },
      { label: "Auto. potential", value: "88%" },
      { label: "Est. savings", value: "$4K / yr" },
      { label: "Topic", value: "Payment Arrangement" },
      { label: "Avg handle time", value: "2m 10s" },
      { label: "Containment", value: "71%" },
      { label: "Priority", value: "Medium" },
    ],
  },
  {
    id: "sub-dispute",
    title: "Dispute a charge — intake",
    description:
      "Initial dispute classification is repetitive; automation can capture reason codes and evidence before a specialist reviews edge cases.",
    metrics: [
      { label: "Daily volume", value: "890" },
      { label: "Triage coverage", value: "74%" },
      { label: "Est. savings", value: "$5K / yr" },
      { label: "Topic", value: "Refund Requests" },
      { label: "Finance review", value: "8%" },
      { label: "Sentiment", value: "3.4/5" },
      { label: "Priority", value: "High" },
    ],
  },
];

export const automationOpportunitiesByScope: Record<
  AutomationScopeTab,
  AutomationOpportunityRow[]
> = {
  categories: categoryOpportunities,
  topics: topicOpportunities,
  subtopics: subtopicOpportunities,
};
