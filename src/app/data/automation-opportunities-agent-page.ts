import { formatAgentCreatedAt } from "../lib/create-ai-agent-jobs";

export type AgentToolDraft = {
  id: string;
  name: string;
  description: string;
  cognigyNodes: string;
  placeholderValue: string;
  parameters: string;
};

export type AgentJobDraft = {
  id: string;
  name: string;
  description: string;
  instruction: string;
  tools: AgentToolDraft[];
};

export type AgentConfigDraft = {
  intentTitle: string;
  agentName: string;
  projectName: string;
  createdBy: string;
  creationDate: string;
  status: "Draft";
  jobs: AgentJobDraft[];
};

export type AgentFlowStep = {
  id: string;
  title: string;
  description: string;
  type: "start" | "decision" | "tool" | "action" | "end";
};

function slug(input: string): string {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
}

function makeTool(
  key: string,
  value: Omit<AgentToolDraft, "id">,
): AgentToolDraft {
  return { ...value, id: key };
}

function makeJob(
  key: string,
  value: Omit<AgentJobDraft, "id">,
): AgentJobDraft {
  return { ...value, id: key };
}

function titleCaseWords(input: string): string {
  return input
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(" ");
}

function billingTemplate(intentTitle: string): AgentConfigDraft {
  return {
    intentTitle,
    agentName: "Charge and Refund Specialist Agent",
    projectName: "Project Alpha",
    createdBy: "Auto Insight",
    creationDate: formatAgentCreatedAt(Date.now()),
    status: "Draft",
    jobs: [
      makeJob("job-charge-refund-specialist", {
        name: "Charge and Refund Specialist Agent",
        description:
          "You answer questions related to charges, fees, and payment corrections, including duplicate billing, unknown charges, and refund eligibility checks.",
        instruction:
          "Retrieve charge details, explain calculations clearly, and apply credit or reversal paths when policy and tooling allow. Escalate only when policy thresholds or missing evidence require specialist review.",
        tools: [
          makeTool("tool-evaluate-charges", {
            name: "evaluate_charges",
            description:
              "Validate disputed charges and identify duplicates, unauthorized activity, and eligible reversal reasons.",
            cognigyNodes: "Validate Charge > Resolve Tool Action",
            placeholderValue: "Evaluate retrieved charges for duplication or unusual activity",
            parameters: "customer_id, charge_id, dispute_reason",
          }),
          makeTool("tool-initiate-refund", {
            name: "initiate_credit_or_refund",
            description:
              "Create a provisional credit or refund workflow when validation confirms corrective action is required.",
            cognigyNodes: "Issue Credit > Notify Customer",
            placeholderValue: "Initiate credit or refund workflow",
            parameters: "charge_id, amount, reason_code",
          }),
        ],
      }),
      makeJob("job-payment-explanations", {
        name: "Payment Explanation Agent",
        description:
          "You explain billing line items, payment timing, and fee outcomes in clear, policy-grounded language.",
        instruction:
          "Use transaction metadata and statement artifacts to provide concise explanations, then route to dispute intake only when eligibility conditions are met.",
        tools: [
          makeTool("tool-explain-line-items", {
            name: "explain_line_items",
            description:
              "Summarize invoice line items and payment allocations in customer-friendly wording.",
            cognigyNodes: "Invoice Parser > Explain Charges",
            placeholderValue: "Explain line items and payment allocations",
            parameters: "statement_id, locale",
          }),
        ],
      }),
    ],
  };
}

function cardTemplate(intentTitle: string): AgentConfigDraft {
  return {
    intentTitle,
    agentName: "Card Services Specialist Agent",
    projectName: "Project Atlas",
    createdBy: "Auto Insight",
    creationDate: formatAgentCreatedAt(Date.now()),
    status: "Draft",
    jobs: [
      makeJob("job-card-services", {
        name: "Card Services Specialist Agent",
        description:
          "You support card activation, replacement, and card-control requests while maintaining policy and fraud safeguards.",
        instruction:
          "Guide users through verification, run card-state checks, and complete the lowest-friction resolution path available for each request type.",
        tools: [
          makeTool("tool-card-state", {
            name: "check_card_state",
            description:
              "Retrieve card activation, lock status, expiration details, and replacement eligibility.",
            cognigyNodes: "Card Status > Resolve Action",
            placeholderValue: "Check card status and eligibility",
            parameters: "customer_id, card_reference",
          }),
          makeTool("tool-replacement", {
            name: "start_replacement_flow",
            description:
              "Initiate replacement workflows for lost, stolen, or damaged cards and return timeline expectations.",
            cognigyNodes: "Replacement Intake > Fulfillment Queue",
            placeholderValue: "Start replacement and provide timeline",
            parameters: "card_reference, replacement_reason",
          }),
        ],
      }),
      makeJob("job-pin-access", {
        name: "PIN and Access Recovery",
        description:
          "You resolve PIN reset, lockout, and access recovery requests across supported channels.",
        instruction:
          "Confirm identity, evaluate lockout cause, and offer secure reset or escalation paths based on account risk level.",
        tools: [
          makeTool("tool-pin-reset", {
            name: "trigger_pin_reset",
            description: "Send PIN reset options and validate completion status.",
            cognigyNodes: "Verify Identity > PIN Reset",
            placeholderValue: "Trigger PIN reset and confirm completion",
            parameters: "customer_id, verification_token",
          }),
        ],
      }),
    ],
  };
}

function disputeTemplate(intentTitle: string): AgentConfigDraft {
  return {
    intentTitle,
    agentName: "Dispute Intake Specialist Agent",
    projectName: "Project Nova",
    createdBy: "Auto Insight",
    creationDate: formatAgentCreatedAt(Date.now()),
    status: "Draft",
    jobs: [
      makeJob("job-dispute-intake", {
        name: "Dispute Intake Specialist Agent",
        description:
          "You collect and validate dispute details, classify reason codes, and prepare complete case handoff packets.",
        instruction:
          "Capture required evidence, classify dispute type, and route to the right queue with confidence and SLA context.",
        tools: [
          makeTool("tool-dispute-intake", {
            name: "collect_dispute_intake",
            description:
              "Capture transaction context, reason codes, and supporting details for dispute initiation.",
            cognigyNodes: "Dispute Intake > Case Router",
            placeholderValue: "Collect complete dispute context",
            parameters: "transaction_id, reason_code, evidence_refs",
          }),
          makeTool("tool-case-routing", {
            name: "route_dispute_case",
            description:
              "Route disputes to fraud, merchant, or billing operations queues based on policy and confidence rules.",
            cognigyNodes: "Policy Rules > Queue Routing",
            placeholderValue: "Route case to proper operations queue",
            parameters: "case_id, queue_hint, priority",
          }),
        ],
      }),
    ],
  };
}

function genericTemplate(intentTitle: string): AgentConfigDraft {
  const normalized = titleCaseWords(intentTitle.replace(/[-_]/g, " ").trim()) || "Support";
  return {
    intentTitle,
    agentName: `${normalized} Specialist Agent`,
    projectName: "Project Alpha",
    createdBy: "Auto Insight",
    creationDate: formatAgentCreatedAt(Date.now()),
    status: "Draft",
    jobs: [
      makeJob(`job-${slug(normalized) || "specialist"}`, {
        name: `${normalized} Specialist Agent`,
        description:
          "You provide accurate, policy-aligned support for this intent area and guide users to resolution quickly.",
        instruction:
          "Gather the minimum required context, execute validated tools, and escalate only when confidence or policy constraints require a specialist handoff.",
        tools: [
          makeTool(`tool-${slug(normalized) || "specialist"}-lookup`, {
            name: `${slug(normalized) || "specialist"}_lookup`,
            description:
              "Retrieve relevant account and workflow context for this request type.",
            cognigyNodes: "Intent Router > Context Lookup",
            placeholderValue: "Load context needed to resolve this request",
            parameters: "customer_id, request_context",
          }),
        ],
      }),
    ],
  };
}

export function deriveAgentConfigFromTitle(title: string): AgentConfigDraft {
  const intentTitle = title.trim() || "AI Agent";
  const lower = intentTitle.toLowerCase();

  if (
    /billing|payment|refund|charge|invoice|autopay|fee/.test(lower)
  ) {
    return billingTemplate(intentTitle);
  }

  if (
    /card|pin|activation|replacement|wallet|credit limit|lost|stolen/.test(lower)
  ) {
    return cardTemplate(intentTitle);
  }

  if (
    /dispute|fraud|chargeback|unauthorized|risk/.test(lower)
  ) {
    return disputeTemplate(intentTitle);
  }

  return genericTemplate(intentTitle);
}

export function buildFlowFromJob(job: AgentJobDraft): AgentFlowStep[] {
  const toolNames = job.tools.map((tool) => tool.name).join(", ");
  return [
    {
      id: `${job.id}-start`,
      title: "Intent Received",
      description: `Route conversation into "${job.name}".`,
      type: "start",
    },
    {
      id: `${job.id}-triage`,
      title: "Collect Context",
      description:
        "Gather account, interaction, and policy context required for confident resolution.",
      type: "decision",
    },
    {
      id: `${job.id}-tooling`,
      title: "Run Tools",
      description: toolNames
        ? `Execute configured tools: ${toolNames}.`
        : "Execute configured tools for this job.",
      type: "tool",
    },
    {
      id: `${job.id}-resolve`,
      title: "Generate Resolution",
      description:
        "Apply validated actions, summarize outcome, and provide next-step guidance.",
      type: "action",
    },
    {
      id: `${job.id}-handoff`,
      title: "Escalate or Complete",
      description:
        "Escalate with full context when required; otherwise complete and log the interaction.",
      type: "end",
    },
  ];
}
