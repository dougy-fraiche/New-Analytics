export type AutomationOpportunityScope = "categories" | "topics" | "subtopics";

export type AutomationOpportunityReference = {
  scope: AutomationOpportunityScope;
  id: string;
  title: string;
  description: string;
  detail: string;
  annualSavingsBadge: string;
  cardBody: string;
};

export const automationOpportunityReferences = {
  billingPayments: {
    scope: "categories",
    id: "billing-payments",
    title: "Billing & Payment Inquiries",
    description: "High-volume category with repeatable verification and lookup steps.",
    detail: "40.5K monthly interactions · strong automation potential",
    annualSavingsBadge: "$26K Annual Savings",
    cardBody:
      "Automating this topic could save $26K annually across 40.5K monthly interactions. Agents are commonly verifying account details, explaining posted charges, and routing payment resolutions.",
  },
  billExplanation: {
    scope: "topics",
    id: "topics-bill-explanation",
    title: "Bill Explanation",
    description: "1,620 automatable calls · 3.6% of total mix.",
    detail: "$13K annual savings · 4:00 avg duration",
    annualSavingsBadge: "$13K Annual Savings",
    cardBody:
      "Automating this topic could save $13K annually across 1,620 interactions. Agents are commonly reviewing statement line items, validating fee logic, and clarifying due-date and balance changes.",
  },
  chargeBreakdown: {
    scope: "subtopics",
    id: "subtopics-charge-breakdown",
    title: "Charge Breakdown",
    description: "Repeat line-item and clearance questions fit deterministic triage.",
    detail: "9.4K sub-topic volume · 2.4% automation potential",
    annualSavingsBadge: "$7K Annual Savings",
    cardBody:
      "Automating this topic could save $7K annually across 9,420 interactions. Agents are commonly pulling line-item histories, validating charge legitimacy, and explaining clearance decisions.",
  },
  cardServices: {
    scope: "categories",
    id: "card-services",
    title: "Card Services & Management",
    description: "Highly standardized activation, limit, and replacement flows.",
    detail: "3,230 automatable volume · $27K annual savings",
    annualSavingsBadge: "$27K Annual Savings",
    cardBody:
      "Automating this topic could save $27K annually across 3,230 interactions. Agents are commonly handling activation checks, limit validations, and replacement-card workflows.",
  },
  cardActivation: {
    scope: "topics",
    id: "topics-card-activation",
    title: "Card Activation",
    description: "Activation and verification requests are ideal for guided self-serve.",
    detail: "20,833 automatable volume · 6.4% automation potential",
    annualSavingsBadge: "$15K Annual Savings",
    cardBody:
      "Automating this topic could save $15K annually across 20,833 interactions. Agents are commonly confirming identity signals, walking activation steps, and handling PIN or lockout follow-ups.",
  },
  addPaymentMethod: {
    scope: "subtopics",
    id: "subtopics-add-payment-method",
    title: "Add Payment Method",
    description: "Predictable verification flow with strong deterministic coverage.",
    detail: "5,356 automatable volume · 1.6% automation potential",
    annualSavingsBadge: "$6K Annual Savings",
    cardBody:
      "Automating this topic could save $6K annually across 5,356 interactions. Agents are commonly verifying funding credentials, validating account ownership, and confirming enrollment success.",
  },
} as const satisfies Record<string, AutomationOpportunityReference>;

export const automationTopInsightReferenceOrder = [
  automationOpportunityReferences.billingPayments,
  automationOpportunityReferences.billExplanation,
  automationOpportunityReferences.chargeBreakdown,
  automationOpportunityReferences.cardServices,
  automationOpportunityReferences.cardActivation,
  automationOpportunityReferences.addPaymentMethod,
] as const;

export const automationSummaryReference = {
  primaryCategoryTitle: automationOpportunityReferences.billingPayments.title,
  primaryCategoryShare: "68%",
  primaryCategoryAnnualSavings: "$33K",
  secondaryCategoryTitle: automationOpportunityReferences.cardServices.title,
  secondaryCategoryAutomationRate: "90%",
  secondaryCategorySentiment: "4.2/5",
} as const;
