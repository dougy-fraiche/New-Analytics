// Shared recommended actions data & types

import { ShieldCheck, Code, Cpu, Wrench, Route, CreditCard, Bot } from "lucide-react";
import type { ComponentType } from "react";

export type ActionType = "Tool Build" | "AI Agent" | "Process Change";
export type PriorityLevel = "High" | "Medium" | "Low";

export interface RecommendedAction {
  id: number;
  title: string;
  description: string;
  note: string;
  type: ActionType;
  priority: PriorityLevel;
  impactValue: string;
  impactLabel: string;
  projectedROI: string;
  // Detail-sheet fields
  handoffsPerDay: number;
  affectedIntent: string;
  escalationsToday: number;
  csatImpact: string;
  estFixTime: string;
  whatWillHappen: string;
}

export const recommendedActionsData: RecommendedAction[] = [
  {
    id: 1,
    title: "Deploy Account Verification AI Agent",
    description:
      "Enable AI to verify customer identity using 2FA and security questions",
    note: "Account verification taking 4m 18s - lacks automated tools",
    type: "Tool Build",
    priority: "High",
    impactValue: "+23% Containment",
    impactLabel: "Account Access intent",
    projectedROI: "$4,200/wk",
    handoffsPerDay: 1247,
    affectedIntent: "Account Access & Security",
    escalationsToday: 1247,
    csatImpact: "-8.2%",
    estFixTime: "< 15 min",
    whatWillHappen:
      "A new AI agent will be deployed with secure account verification capabilities. Customers will receive instant password reset links and account unlock confirmations via SMS/email, reducing wait times from 6m to under 30s.",
  },
  {
    id: 2,
    title: "Build Automated Verification API",
    description:
      "Create API for real-time identity verification and authentication",
    note: "23% of interactions require manual system lookups",
    type: "Tool Build",
    priority: "High",
    impactValue: "+19% Containment",
    impactLabel: "Verification requests",
    projectedROI: "$2,900/wk",
    handoffsPerDay: 893,
    affectedIntent: "Identity Verification",
    escalationsToday: 893,
    csatImpact: "-5.4%",
    estFixTime: "< 30 min",
    whatWillHappen:
      "An automated verification API will be integrated into the agent workflow. Manual system lookups will be replaced with real-time identity checks, reducing verification time from 4m to under 10s per interaction.",
  },
  {
    id: 3,
    title: "Enable AI Co-pilot for All Agents",
    description:
      "Activate AI assistance for all customer service representatives",
    note: "AI co-pilot reduces human agent time by 38% when active",
    type: "AI Agent",
    priority: "High",
    impactValue: "-38% Handle Time",
    impactLabel: "All human-handled interactions",
    projectedROI: "$5,800/wk",
    handoffsPerDay: 2340,
    affectedIntent: "All Support Categories",
    escalationsToday: 2340,
    csatImpact: "+4.1%",
    estFixTime: "< 1 hour",
    whatWillHappen:
      "AI co-pilot will be activated across all agent desktops, providing real-time suggestions, auto-drafted responses, and contextual knowledge lookups. Expected to reduce average handle time by 38% while improving first-contact resolution.",
  },
  {
    id: 4,
    title: "Add Password Reset Tool",
    description: "Self-service password reset via email/SMS verification",
    note: "Missing critical self-service capability",
    type: "Tool Build",
    priority: "Medium",
    impactValue: "+28% Containment",
    impactLabel: "Password Reset intent",
    projectedROI: "$2,800/wk",
    handoffsPerDay: 672,
    affectedIntent: "Password Reset",
    escalationsToday: 672,
    csatImpact: "-6.7%",
    estFixTime: "< 10 min",
    whatWillHappen:
      "A self-service password reset flow will be added to the AI agent. Customers can reset passwords instantly via email or SMS verification without waiting for a human agent, eliminating the #2 reason for live agent escalation.",
  },
  {
    id: 5,
    title: "Add Account Unlock Tool",
    description: "Allow AI to unlock accounts after identity verification",
    note: "Frequently escalated to live agents",
    type: "Tool Build",
    priority: "Medium",
    impactValue: "+15% Containment",
    impactLabel: "Account Unlock intent",
    projectedROI: "$1,700/wk",
    handoffsPerDay: 418,
    affectedIntent: "Account Unlock",
    escalationsToday: 418,
    csatImpact: "-3.9%",
    estFixTime: "< 20 min",
    whatWillHappen:
      "The AI agent will gain the ability to unlock customer accounts after successful identity verification. This removes the need for live agent involvement in straightforward account lockout scenarios.",
  },
  {
    id: 6,
    title: "Implement Smart Routing Engine",
    description:
      "Route complex cases to specialized agents based on issue taxonomy",
    note: "Misrouted tickets add 12m avg to resolution time",
    type: "Process Change",
    priority: "Medium",
    impactValue: "-22% Transfer Rate",
    impactLabel: "All routed interactions",
    projectedROI: "$3,100/wk",
    handoffsPerDay: 1560,
    affectedIntent: "All Routed Interactions",
    escalationsToday: 1560,
    csatImpact: "-4.5%",
    estFixTime: "< 2 hours",
    whatWillHappen:
      "A smart routing engine will classify incoming cases and direct them to the most qualified agent or team. This eliminates misrouted tickets that currently add an average of 12 minutes to resolution time.",
  },
  {
    id: 7,
    title: "Deploy Billing Inquiry Automation",
    description:
      "Automate common billing questions and payment status lookups",
    note: "Billing inquiries represent 18% of total volume",
    type: "Tool Build",
    priority: "Low",
    impactValue: "+31% Containment",
    impactLabel: "Billing intent",
    projectedROI: "$1,500/wk",
    handoffsPerDay: 534,
    affectedIntent: "Billing & Payments",
    escalationsToday: 534,
    csatImpact: "-2.8%",
    estFixTime: "< 45 min",
    whatWillHappen:
      "Common billing inquiries (balance checks, payment status, invoice requests) will be fully automated. The AI agent will connect to the billing system API to provide instant, accurate responses to 18% of total support volume.",
  },
];

/** Critical recommended actions (High priority) — shown in AI assistant panel */
export const highPriorityRecommendedActions: RecommendedAction[] =
  recommendedActionsData.filter((a) => a.priority === "High");

export const typeColors: Record<ActionType, string> = {
  "Tool Build": "bg-indigo-100 text-indigo-700 border-indigo-200",
  "AI Agent": "bg-violet-100 text-violet-700 border-violet-200",
  "Process Change": "bg-amber-100 text-amber-700 border-amber-200",
};

export const priorityColors: Record<PriorityLevel, string> = {
  High: "bg-red-100 text-red-700 border-red-200",
  Medium: "bg-orange-100 text-orange-700 border-orange-200",
  Low: "bg-gray-100 text-gray-600 border-gray-200",
};

// Contextual icon per action (keyed by action id)
export const actionIconMap: Record<number, ComponentType<{ className?: string }>> = {
  1: ShieldCheck,   // Account Verification AI Agent
  2: Code,          // Automated Verification API
  3: Cpu,           // AI Co-pilot for All Agents
  4: Wrench,        // Password Reset Tool
  5: ShieldCheck,   // Account Unlock Tool
  6: Route,         // Smart Routing Engine
  7: CreditCard,    // Billing Inquiry Automation
};

export const actionIconColors: Record<number, { bg: string; text: string }> = {
  1: { bg: "bg-violet-100 dark:bg-violet-950/30", text: "text-violet-600 dark:text-violet-400" },
  2: { bg: "bg-indigo-100 dark:bg-indigo-950/30", text: "text-indigo-600 dark:text-indigo-400" },
  3: { bg: "bg-sky-100 dark:bg-sky-950/30", text: "text-sky-600 dark:text-sky-400" },
  4: { bg: "bg-amber-100 dark:bg-amber-950/30", text: "text-amber-600 dark:text-amber-400" },
  5: { bg: "bg-violet-100 dark:bg-violet-950/30", text: "text-violet-600 dark:text-violet-400" },
  6: { bg: "bg-emerald-100 dark:bg-emerald-950/30", text: "text-emerald-600 dark:text-emerald-400" },
  7: { bg: "bg-rose-100 dark:bg-rose-950/30", text: "text-rose-600 dark:text-rose-400" },
};

// Fallback icon for actions not in the map
export const defaultActionIcon = Bot;
export const defaultActionIconColors = { bg: "bg-muted", text: "text-muted-foreground" };

export const typeIcons: Record<ActionType, string> = {
  "Tool Build": "\uD83E\uDD16",
  "AI Agent": "\uD83E\uDD16",
  "Process Change": "\u2699\uFE0F",
};