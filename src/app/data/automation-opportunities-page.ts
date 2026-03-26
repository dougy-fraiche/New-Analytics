/** Page-specific data for Automation Opportunities (Figma: Auto-Insight UX). */

export type AutomationScopeTab = "categories" | "topics" | "subtopics";

export const automationAnalysisPeriodSubtitle = "Monthly Analysis: 1–31 Jul 2025";
export const automationImpactProjectionSubtitle = "Yearly Impact Projection: Aug 2025 - Jul 2026";

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

const categoryOpportunities: AutomationOpportunityRow[] = [
  {
    id: "cat-billing",
    title: "Billing & Payment Inquiries",
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
    title: "Card Services & Management",
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
    title: "Bill Explanation",
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
