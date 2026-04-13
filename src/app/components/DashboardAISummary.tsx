import { useState, useEffect, useCallback, type ReactNode } from "react";
import {
  Zap,
  BellOff,
  Sparkles,
  List,
  Clock,
  MoreVertical,
  RefreshCw,
  Copy,
  ChevronDown,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Skeleton } from "./ui/skeleton";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { Tooltip, TooltipContent, TooltipTrigger } from "./ui/tooltip";
import {
  recommendedActionsData,
  highPriorityRecommendedActions,
  type RecommendedAction,
} from "../data/recommended-actions";
import { RecommendedActionSheet } from "./RecommendedActionSheet";
import type { DashboardData } from "../contexts/ConversationContext";
import { cn } from "./ui/utils";
import { useContainerBreakpoint } from "../hooks/useContainerBreakpoint";

/** Matches `DashboardChartGrid` / `ChartVariants` `stackedBelowWidth` (768). */
const RECOMMENDED_ACTIONS_STACK_BELOW_PX = 768;

// ── AI Insights panel open state (expand/collapse in summary card) ──

const AI_INSIGHTS_OPEN_KEY = "ai-insights-panel-open";

function readInsightsPanelOpen(fallback: boolean): boolean {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(AI_INSIGHTS_OPEN_KEY);
    if (raw === null) return fallback;
    return raw === "true";
  } catch {
    return fallback;
  }
}

function writeInsightsPanelOpen(open: boolean) {
  try {
    window.localStorage.setItem(AI_INSIGHTS_OPEN_KEY, String(open));
  } catch {
    /* ignore quota / private mode */
  }
}

// ── localStorage helpers for dismissed actions ──

const DISMISSED_KEY = "ai-summary-dismissed-actions";

function getDismissedMap(): Record<string, number> {
  try {
    return JSON.parse(localStorage.getItem(DISMISSED_KEY) || "{}");
  } catch {
    return {};
  }
}

function dismissAction(dashboardId: string) {
  const map = getDismissedMap();
  map[dashboardId] = Date.now();
  localStorage.setItem(DISMISSED_KEY, JSON.stringify(map));
}

function undismissAction(dashboardId: string) {
  const map = getDismissedMap();
  delete map[dashboardId];
  localStorage.setItem(DISMISSED_KEY, JSON.stringify(map));
}

function isActionDismissed(dashboardId: string): boolean {
  return dashboardId in getDismissedMap();
}

// ── Per-action dismissals within the recommended-actions list (per dashboard) ──

const PER_ACTION_DISMISSED_KEY = "ai-summary-dismissed-action-ids";

function getPerActionDismissedMap(): Record<string, number[]> {
  try {
    return JSON.parse(localStorage.getItem(PER_ACTION_DISMISSED_KEY) || "{}");
  } catch {
    return {};
  }
}

function getDismissedActionIdsForDashboard(dashboardId: string): Set<number> {
  const map = getPerActionDismissedMap();
  return new Set(map[dashboardId] ?? []);
}

function dismissSingleActionId(dashboardId: string, actionId: number) {
  const map = getPerActionDismissedMap();
  const list = new Set(map[dashboardId] ?? []);
  list.add(actionId);
  map[dashboardId] = Array.from(list);
  localStorage.setItem(PER_ACTION_DISMISSED_KEY, JSON.stringify(map));
}

function undismissSingleActionId(dashboardId: string, actionId: number) {
  const map = getPerActionDismissedMap();
  const next = (map[dashboardId] ?? []).filter((id) => id !== actionId);
  if (next.length === 0) {
    delete map[dashboardId];
  } else {
    map[dashboardId] = next;
  }
  localStorage.setItem(PER_ACTION_DISMISSED_KEY, JSON.stringify(map));
}

// ── localStorage helpers for generation timestamps ──

const GEN_TS_KEY = "ai-summary-gen-ts";

function getGenTimestamps(): Record<string, number> {
  try {
    return JSON.parse(localStorage.getItem(GEN_TS_KEY) || "{}");
  } catch {
    return {};
  }
}

function getOrSetGenTimestamp(dashboardId: string): number {
  const map = getGenTimestamps();
  if (!map[dashboardId]) {
    map[dashboardId] = Date.now() - (2 + Math.floor(Math.random() * 23)) * 60 * 1000;
    localStorage.setItem(GEN_TS_KEY, JSON.stringify(map));
  }
  return map[dashboardId];
}

function formatRelativeTime(ts: number): string {
  const diffMs = Date.now() - ts;
  const diffSec = Math.floor(diffMs / 1000);
  if (diffSec < 60) return "just now";
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  const diffDay = Math.floor(diffHr / 24);
  return `${diffDay}d ago`;
}

function hashStringToPositiveInt(input: string): number {
  // Simple deterministic hash (djb2-ish) for stable per-dashboard randomness.
  let hash = 5381;
  for (let i = 0; i < input.length; i++) {
    hash = ((hash << 5) + hash) ^ input.charCodeAt(i);
  }
  return Math.abs(hash);
}

function getPurposeTitle(action: RecommendedAction): string {
  const impact = action.impactValue.toLowerCase();
  if (impact.includes("containment")) return `Boost containment for ${action.affectedIntent}`;
  if (impact.includes("handle time")) return `Reduce handle time for ${action.affectedIntent}`;
  if (impact.includes("transfer")) return `Reduce transfers for ${action.affectedIntent}`;
  return `Improve ${action.affectedIntent}`;
}

function buildActionCardParagraph(action: RecommendedAction): string {
  const type = action.type.toLowerCase();
  const base = `${getPurposeTitle(action)} by implementing ${action.title.toLowerCase()}. ${action.description}`;

  let contextTail =
    " This keeps execution focused on measurable customer outcomes and faster, more consistent resolution.";

  if (type.includes("ai")) {
    contextTail =
      " This gives agents and customers faster answers with consistent policy handling and fewer avoidable escalations.";
  } else if (type.includes("tool")) {
    contextTail =
      " This equips teams with stronger in-workflow tooling so repeat requests are resolved quickly and reliably at scale.";
  } else if (type.includes("process")) {
    contextTail =
      " This streamlines the workflow so handoffs are reduced and resolution quality remains consistent across teams.";
  }

  const combined = `${base}${contextTail}`.replace(/\s+/g, " ").trim();
  // Keep card copy concise; UI enforces max three visible lines.
  return combined.length > 240 ? `${combined.slice(0, 237).trimEnd()}...` : combined;
}

const GLOBAL_SUGGESTED_ACTION_POOL: RecommendedAction[] = (() => {
  // Limit to 2–3 items across the whole app surface.
  const pool = (highPriorityRecommendedActions.length ? highPriorityRecommendedActions : recommendedActionsData).slice(0, 3);
  return pool.length >= 2 ? pool : recommendedActionsData.slice(0, 2);
})();

// --- Per-dashboard AI summary data ---

interface AISummaryData {
  summary: string;
  bullets: { label: string; detail: string }[];
  linkedActionId: number;
  opportunity: string;
  actionText: string;
}

const dashboardSummaries: Record<string, AISummaryData> = {
  "dash-1": {
    summary:
      "Escalations rose 12% this quarter, driven primarily by misrouted tickets adding an average of 12 minutes to resolution. Here's the breakdown:",
    bullets: [
      { label: "Top escalation driver: Account Access", detail: "38% of all escalations stem from account lockout and verification failures" },
      { label: "Misrouted tickets: 23%", detail: "Nearly 1 in 4 tickets reach the wrong team before resolution" },
      { label: "Peak escalation window: 2\u20135 PM", detail: "Afternoon surge correlates with end-of-business-day account issues" },
      { label: "Average re-routing time: 12m", detail: "Each misroute adds significant delay to customer resolution" },
    ],
    linkedActionId: 6,
    opportunity:
      "23% of escalations are caused by misrouted tickets, adding 12 minutes per case to resolution time.",
    actionText:
      "Deploy a smart routing engine to classify and direct cases to specialized agents, reducing transfer rate by 22%.",
  },
  "dash-2": {
    summary:
      "Self-service adoption is at 62%, but account verification remains the #1 reason customers abandon and call a live agent. Key findings:",
    bullets: [
      { label: "Self-service completion rate: 62%", detail: "Up 4% from last quarter but still below the 75% industry benchmark" },
      { label: "Top drop-off point: Account verification", detail: "34% of users abandon at the identity check step" },
      { label: "Password reset containment: 41%", detail: "More than half of password reset attempts require human assistance" },
      { label: "Chatbot CSAT: 78%", detail: "Satisfaction rises to 91% when verification is handled instantly" },
    ],
    linkedActionId: 1,
    opportunity:
      "Account verification is the #1 self-service drop-off point \u2014 34% of users abandon and escalate to a live agent.",
    actionText:
      "Deploy an AI verification agent to handle identity checks automatically, improving self-service containment by 23%.",
  },
  "dash-10": {
    summary:
      "Average handle time is 6m 24s across your team, but agents without AI co-pilot support average 38% longer interactions. Here's the detail:",
    bullets: [
      { label: "Overall AHT: 6m 24s", detail: "Up slightly from 6m 10s last period" },
      { label: "With AI co-pilot: 4m 02s", detail: "Agents using the co-pilot are significantly faster" },
      { label: "Without AI co-pilot: 8m 46s", detail: "Manual research and knowledge lookups drive the gap" },
      { label: "Co-pilot adoption: 50%", detail: "Only half of agents currently have it activated" },
    ],
    linkedActionId: 3,
    opportunity:
      "Agents without AI co-pilot average 8m 46s handle time vs 4m 02s with it \u2014 only 50% of agents have it enabled.",
    actionText:
      "Enable AI co-pilot for all agents to reduce average handle time by 38% and improve first-contact resolution.",
  },
  "dash-3": {
    summary:
      "Feature adoption for the new billing portal is at 44%, with most non-adopters citing difficulty finding billing info. Summary:",
    bullets: [
      { label: "Billing portal adoption: 44%", detail: "Below the 60% target set for this quarter" },
      { label: "Top barrier: 'Can't find my invoice'", detail: "31% of support tickets about billing are simple lookup requests" },
      { label: "Mobile adoption: 28%", detail: "Significantly lower than desktop, suggesting UX friction on mobile" },
      { label: "Power users: 12%", detail: "Actively using autopay, download, and dispute features" },
    ],
    linkedActionId: 7,
    opportunity:
      "31% of billing-related tickets are simple lookup requests that could be fully automated, representing 18% of total volume.",
    actionText:
      "Deploy billing inquiry automation to handle balance checks and invoice requests, boosting containment by 31%.",
  },
  "dash-11": {
    summary:
      "Bug report volume dropped 14% this month, but password-related issues remain the most frequently reported category:",
    bullets: [
      { label: "Total bug reports: 412", detail: "Down from 479 last month \u2014 14% improvement" },
      { label: "Top category: Password & auth issues", detail: "28% of all bugs involve login, reset, or session expiry" },
      { label: "Avg time to first response: 3.2h", detail: "Meeting the SLA target of < 4 hours" },
      { label: "Repeat reporters: 18%", detail: "These users encounter the same password issue multiple times" },
    ],
    linkedActionId: 4,
    opportunity:
      "Password-related issues are the #1 bug category (28%), and 18% of reporters encounter the same issue repeatedly.",
    actionText:
      "Add a self-service password reset tool to eliminate the most common bug report category and reduce escalations by 672/day.",
  },
  "dash-12": {
    summary:
      "Overall NPS is 42, but the Account Management area scores only 28 due to frustration with locked-out account recovery:",
    bullets: [
      { label: "Overall NPS: 42", detail: "Stable from last quarter, but Account Management is dragging it down" },
      { label: "Account Management NPS: 28", detail: "Lowest of all product areas, driven by lockout frustration" },
      { label: "Billing NPS: 51", detail: "Highest area \u2014 customers appreciate the new invoice UI" },
      { label: "Detractor theme: 'Couldn't unlock my account'", detail: "Mentioned in 42% of negative verbatim responses" },
    ],
    linkedActionId: 5,
    opportunity:
      "Account lockout frustration is the #1 NPS detractor \u2014 42% of negative verbatims mention inability to unlock accounts.",
    actionText:
      "Add an account unlock tool so AI can unlock accounts after identity verification, improving containment by 15%.",
  },
  "dash-4": {
    summary:
      "This week's KPIs show strong volume growth (+8%) but verification bottlenecks are holding back containment rates:",
    bullets: [
      { label: "Total interactions: 40,359", detail: "Up 8% from last week \u2014 consistent growth trend" },
      { label: "Containment rate: 64%", detail: "Below the 70% target, dragged down by manual verification steps" },
      { label: "CSAT: 91.4%", detail: "Team average remains solid, with top agents exceeding 94%" },
      { label: "Manual lookups: 23% of interactions", detail: "Agents still need to do system lookups that could be automated" },
    ],
    linkedActionId: 2,
    opportunity:
      "23% of all interactions require manual system lookups for identity verification, reducing containment rate below target.",
    actionText:
      "Build an automated verification API to replace manual lookups with real-time identity checks, boosting containment by 19%.",
  },
  "dash-5": {
    summary:
      "Monthly review shows operational efficiency improving, but handle time remains elevated for agents without AI assistance:",
    bullets: [
      { label: "Monthly resolution volume: 168,420", detail: "Up 5% month-over-month with stable team size" },
      { label: "Cost per interaction: $4.12", detail: "Down from $4.38 \u2014 driven by better tooling for Tier 1 agents" },
      { label: "Agent utilization: 78%", detail: "Team has capacity for 11,200 more interactions before needing headcount" },
      { label: "AI co-pilot ROI: $5,800/wk", detail: "Measured across the 50% of agents currently using it" },
    ],
    linkedActionId: 3,
    opportunity:
      "AI co-pilot delivers $5,800/wk in savings but only 50% of agents use it \u2014 full rollout could nearly double the ROI.",
    actionText:
      "Enable AI co-pilot for all agents to reduce handle time by 38% and project an additional $5,800/wk in cost savings.",
  },
  "dash-13": {
    summary:
      "Quarterly metrics are board-ready, with strong top-line growth but a notable gap in account security automation:",
    bullets: [
      { label: "Quarterly interaction volume: 520K+", detail: "12% year-over-year growth with flat headcount" },
      { label: "Automated resolution rate: 58%", detail: "Up from 51% last quarter \u2014 AI agents driving gains" },
      { label: "Biggest gap: Account access automation", detail: "Still requires human agent for 77% of verification requests" },
      { label: "Projected annual savings: $312K", detail: "If top recommended actions are implemented this quarter" },
    ],
    linkedActionId: 1,
    opportunity:
      "Account access still requires human agents 77% of the time \u2014 the largest remaining automation gap for the board to review.",
    actionText:
      "Deploy an account verification AI agent to automate identity checks and add 23% containment to the biggest gap.",
  },
  // ── Automation Opportunities (standalone page) ─────────────────────────
  "automation-opportunities": {
    summary:
      "I analyzed 143,000 interactions across 3 major categories and identified opportunities to automate 3% of your workload, saving $39K annually. Here's what I found:",
    bullets: [
      {
        label: "Billing & Payment Inquiries leads automation potential",
        detail:
          "This category accounts for 68% of total automatable volume with $33K in annual savings. The category includes high-volume topics like Bill Explanation, Payment Arrangement, and Refund Requests.",
      },
      {
        label: "Card Services & Management shows high efficiency",
        detail:
          "With a 90% automation rate and 4.2/5 sentiment score, this category demonstrates that card-related inquiries are well-suited for AI automation with positive customer experiences.",
      },
      {
        label: "Account Management & Support offers steady opportunity",
        detail:
          "While smaller in volume, this category maintains consistent automation rates and handles critical account operations with 6m average handle times.",
      },
    ],
    linkedActionId: 7,
    opportunity:
      "Billing & Payment Inquiries accounts for 68% of automatable volume with $33K in annual savings — the highest-impact lever in this analysis window.",
    actionText:
      "Prioritize Billing & Payment Inquiries automation to capture the majority of high-volume customer inquiries across billing topics.",
  },
  // ── Conversation-generated dashboards ──────────────────────────────────
  "mock-dash-escalation": {
    summary:
      "Escalations are down 8% quarter-over-quarter overall, but billing disputes have spiked to 31% of all escalations — up 7 points driven by the January billing migration. Key findings:",
    bullets: [
      { label: "Billing disputes: 31% of escalations", detail: "Up from 24% last quarter, concentrated in the Jan 20–26 migration window" },
      { label: "Technical outages: 22%", detail: "Clustered around the Jan 18–20 incident — now resolved with no recurrence" },
      { label: "Account security: 17%", detail: "Stable quarter over quarter — no material increase" },
      { label: "Refund requests: 14%", detail: "Slightly down from 16% — improved post-purchase clarity is helping" },
    ],
    linkedActionId: 7,
    opportunity:
      "Billing disputes represent 31% of all escalations and are trending up — most are simple lookup requests that could be fully automated.",
    actionText:
      "Deploy billing inquiry automation to handle balance checks, invoice lookups, and payment status instantly, reducing escalation rate by an estimated 22%.",
  },
  "mock-dash-csat": {
    summary:
      "Overall CSAT sits at 4.3/5, but email channel satisfaction at 3.9/5 is dragging the average down — driven by long first-response times and resolution loops. Here's the breakdown:",
    bullets: [
      { label: "Chat CSAT: 4.6 / 5 (best channel)", detail: "45-second median response and 1.8 messages to resolution drives high satisfaction" },
      { label: "Email CSAT: 3.9 / 5 (worst channel)", detail: "6.2h median first response — users waiting >4h rate satisfaction 1.2pts lower" },
      { label: "Resolution loops add friction", detail: "Email averages 3.4 exchanges vs 1.8 for chat before resolution" },
      { label: "Triage templates: +0.3 pts improvement", detail: "Teams using the new email templates saw the biggest CSAT gains" },
    ],
    linkedActionId: 3,
    opportunity:
      "Email CSAT lags chat by 0.7pts — AI co-pilot adoption is the clearest lever to close the gap through faster drafting and knowledge surfacing.",
    actionText:
      "Enable AI co-pilot for all email agents to accelerate first response and reduce back-and-forth resolution loops, improving overall CSAT by an estimated +0.4 pts.",
  },
};

// ── Fallback summary generator for dynamically-created conversation dashboards ──

function generateFallbackSummary(dashboard: DashboardData): AISummaryData {
  const lower = (dashboard.title + " " + dashboard.description).toLowerCase();

  if (lower.includes("escalation")) {
    return {
      summary: `${dashboard.title} reveals escalation patterns driven by routing gaps and ticket misclassification. Top findings:`,
      bullets: [
        { label: "Top driver: Misrouted tickets (23%)", detail: "Nearly 1 in 4 tickets reaches the wrong team before resolution" },
        { label: "Peak escalation window: 2–5 PM", detail: "Afternoon surge correlates with end-of-business account issues" },
        { label: "Re-routing overhead: +12 min per case", detail: "Each misroute adds significant delay and degrades CSAT" },
        { label: "Post-re-route resolution: 94%", detail: "High eventual resolution — gap is in routing speed, not agent skill" },
      ],
      linkedActionId: 6,
      opportunity: "23% of escalations stem from misrouted tickets, adding 12 minutes per case and reducing overall containment.",
      actionText: "Implement a smart routing engine to classify cases at intake and direct them to specialized agents, reducing transfer rate by 22%.",
    };
  }

  if (lower.includes("csat") || lower.includes("satisfaction")) {
    return {
      summary: `${dashboard.title} shows satisfaction gaps concentrated in async channels where response latency creates compounding friction:`,
      bullets: [
        { label: "Email CSAT gap: -0.7 pts vs chat", detail: "6.2h median first response vs 45s for chat drives the gap" },
        { label: "Resolution loops: 3.4 exchanges (email)", detail: "vs 1.8 for chat — more back-and-forth creates frustration" },
        { label: "AI co-pilot teams: +0.3 CSAT pts", detail: "Teams using AI assistance close cases faster and more accurately" },
        { label: "Key lever: first response time", detail: "Users waiting >4h consistently rate satisfaction 1.2pts lower" },
      ],
      linkedActionId: 3,
      opportunity: "Email channel CSAT lags chat by 0.7pts — AI co-pilot deployment is the highest-leverage improvement available.",
      actionText: "Enable AI co-pilot for all email agents to accelerate first response and reduce resolution loops, targeting a +0.4 CSAT improvement.",
    };
  }

  if (lower.includes("knowledge") || lower.includes("article")) {
    return {
      summary: `${dashboard.title} highlights content gaps and deflection opportunities in the current knowledge base:`,
      bullets: [
        { label: "Article deflection rate: 62%", detail: "Up 4% this quarter but still below the 75% industry benchmark" },
        { label: "Top gap: Enterprise Features", detail: "1,240 unresolved queries/month — highest gap by volume" },
        { label: "AI-suggested articles: 78% acceptance", detail: "Content authors accepting the majority of AI-generated suggestions" },
        { label: "Avg time to publish: 6.2 days", detail: "Down from 9.1 days — AI drafts accelerating the content pipeline" },
      ],
      linkedActionId: 3,
      opportunity: "Knowledge gaps in top-3 categories drive 8.4% of unresolved queries — closing them would directly improve containment rate.",
      actionText: "Enable AI co-pilot to surface knowledge gaps in real-time and auto-suggest article drafts, accelerating the content pipeline by 32%.",
    };
  }

  if (lower.includes("agent") || lower.includes("performance") || lower.includes("copilot") || lower.includes("co-pilot")) {
    return {
      summary: `${dashboard.title} shows a significant performance gap between agents with and without AI assistance:`,
      bullets: [
        { label: "With AI co-pilot: 4m 02s AHT", detail: "Agents using the co-pilot are 38% faster than the team average" },
        { label: "Without AI co-pilot: 8m 46s AHT", detail: "Manual knowledge lookups and research drive the gap" },
        { label: "Co-pilot adoption: 50%", detail: "Half of eligible agents still do not have it activated" },
        { label: "Co-pilot ROI: $5,800/wk", detail: "Measured across current 50% adoption — full rollout would double this" },
      ],
      linkedActionId: 3,
      opportunity: "Only 50% of agents use the AI co-pilot, leaving $5,800/wk of measured savings unrealized from the other half.",
      actionText: "Enable AI co-pilot for all agents to cut average handle time by 38% and nearly double the weekly cost savings.",
    };
  }

  if (lower.includes("ticket") || lower.includes("volume")) {
    return {
      summary: `${dashboard.title} shows strong volume growth, but verification bottlenecks are limiting containment rates:`,
      bullets: [
        { label: "Total interactions: +8% week over week", detail: "Consistent growth trend with current capacity holding" },
        { label: "Containment rate: 64%", detail: "Below the 70% target — dragged down by manual verification steps" },
        { label: "Manual lookups: 23% of interactions", detail: "Agents performing system lookups that could be fully automated" },
        { label: "CSAT: 91.4%", detail: "Team average remains solid — top agents exceeding 94%" },
      ],
      linkedActionId: 2,
      opportunity: "23% of all interactions require manual system lookups for identity verification, holding containment below target.",
      actionText: "Build an automated verification API to replace manual lookups with real-time identity checks, boosting containment rate by 19%.",
    };
  }

  if (lower.includes("channel")) {
    return {
      summary: `${dashboard.title} reveals meaningful performance differences across support channels with clear optimization opportunities:`,
      bullets: [
        { label: "Chat containment: 78%", detail: "Highest of all channels — AI-first design drives self-service success" },
        { label: "Phone escalation rate: 31%", detail: "Above the 25% target — complex issues arriving without context" },
        { label: "Email response time: 6.2h median", detail: "Significantly above the 4h SLA target" },
        { label: "Social volume: +18% this quarter", detail: "Fastest-growing channel with the least automation coverage" },
      ],
      linkedActionId: 1,
      opportunity: "Phone and email channels have the highest escalation rates and slowest response times — both are addressable through AI deployment.",
      actionText: "Deploy an Account Verification AI Agent across phone and email channels to reduce escalation rate by 23% and cut response latency.",
    };
  }

  // Generic fallback using available metric data
  const metricBullets = dashboard.metrics?.slice(0, 4).map((m) => ({
    label: m.label,
    detail: `Current value: ${m.value} — tracked in this analysis period`,
  })) ?? [
    { label: "Data quality: High confidence", detail: "Sufficient signal across all dimensions for AI recommendations" },
    { label: "Overall trend: Positive", detail: "Core metrics improving quarter over quarter" },
    { label: "Automation gap identified", detail: "High-volume intent category lacks self-service tooling" },
    { label: "Recommended priority: High", detail: "Estimated ROI places this in the top actions for this period" },
  ];

  return {
    summary: `AI analysis of ${dashboard.title} has identified actionable opportunities to improve containment and customer satisfaction:`,
    bullets: metricBullets,
    linkedActionId: 1,
    opportunity: "There is a measurable containment gap in high-volume customer intent categories addressable through targeted automation.",
    actionText: "Deploy an Account Verification AI Agent to handle the most common verification requests, adding 23% containment to the top intent.",
  };
}

// ── Main component ──

interface DashboardAISummaryProps {
  dashboardId: string;
  /** Optional dashboard data used to generate a contextual fallback when dashboardId is not in the static map */
  dashboardData?: DashboardData;
  /** Hide the top "AI Insights" row when used inside another section header */
  hideSectionHeader?: boolean;
  /**
   * When true, the summary card shows an Expand/Collapse AI Insights bar (persisted).
   * Defaults to the same value as hideSectionHeader when omitted.
   */
  insightsCollapsible?: boolean;
  /** Initial open state when no value is stored (see insightsCollapsible) */
  defaultInsightsOpen?: boolean;
  /** Optional override for the recommended-actions block title */
  recommendedActionsTitle?: string;
  /** Hide the dismiss-all button in the recommended-actions block */
  hideDismissAll?: boolean;
  /** Optional custom content to render in place of suggested action cards */
  recommendedActionsContent?: ReactNode;
}

export function DashboardAISummary({
  dashboardId,
  dashboardData,
  hideSectionHeader = false,
  insightsCollapsible: insightsCollapsibleProp,
  defaultInsightsOpen = false,
  recommendedActionsTitle = "Recommended actions",
  hideDismissAll = false,
  recommendedActionsContent,
}: DashboardAISummaryProps) {
  const insightsCollapsible = insightsCollapsibleProp ?? hideSectionHeader;
  const [insightsOpen, setInsightsOpen] = useState(() =>
    insightsCollapsible ? readInsightsPanelOpen(defaultInsightsOpen) : true
  );
  const handleInsightsOpenChange = useCallback((next: boolean) => {
    setInsightsOpen(next);
    writeInsightsPanelOpen(next);
  }, []);

  const data = dashboardSummaries[dashboardId] ?? (dashboardData ? generateFallbackSummary(dashboardData) : null);
  const [sheetAction, setSheetAction] = useState<RecommendedAction | null>(null);
  const [actionDismissed, setActionDismissed] = useState(() => isActionDismissed(dashboardId));
  const [dismissedActionIds, setDismissedActionIds] = useState<Set<number>>(() =>
    getDismissedActionIdsForDashboard(dashboardId)
  );
  const [relativeTime, setRelativeTime] = useState("");
  const [isRefreshing, setIsRefreshing] = useState(false);

  const { ref: recommendedActionsGridRef, isBelowBreakpoint: stackRecommendedActionCards } =
    useContainerBreakpoint<HTMLDivElement>(RECOMMENDED_ACTIONS_STACK_BELOW_PX);

  // Live-updating relative timestamp
  useEffect(() => {
    if (!data) return;
    const ts = getOrSetGenTimestamp(dashboardId);
    setRelativeTime(formatRelativeTime(ts));
    const interval = setInterval(() => {
      setRelativeTime(formatRelativeTime(ts));
    }, 30_000);
    return () => clearInterval(interval);
  }, [dashboardId, data]);

  // Sync dismissed state when dashboardId changes
  useEffect(() => {
    setActionDismissed(isActionDismissed(dashboardId));
    setDismissedActionIds(getDismissedActionIdsForDashboard(dashboardId));
  }, [dashboardId]);

  const handleDismissAction = useCallback(() => {
    dismissAction(dashboardId);
    setActionDismissed(true);
    const linkedAction = recommendedActionsData.find(
      (a) => a.id === data?.linkedActionId
    );
    toast.success("Action dismissed", {
      description: linkedAction
        ? `"${linkedAction.title}" has been dismissed.`
        : "Action dismissed.",
      action: {
        label: "Undo",
        onClick: () => {
          undismissAction(dashboardId);
          setActionDismissed(false);
        },
      },
    });
  }, [dashboardId, data]);

  const handleDismissSingleAction = useCallback(
    (action: RecommendedAction) => {
      dismissSingleActionId(dashboardId, action.id);
      setDismissedActionIds((prev) => new Set([...prev, action.id]));
      toast.success("Action dismissed", {
        description: `"${action.title}" has been dismissed.`,
        action: {
          label: "Undo",
          onClick: () => {
            undismissSingleActionId(dashboardId, action.id);
            setDismissedActionIds((prev) => {
              const next = new Set(prev);
              next.delete(action.id);
              return next;
            });
          },
        },
      });
    },
    [dashboardId]
  );

  const handleRegenerate = useCallback(() => {
    if (insightsCollapsible) {
      handleInsightsOpenChange(true);
    }

    // Show a quick loading state to mimic regeneration latency.
    setIsRefreshing(true);

    // Reset the generation timestamp
    const map = getGenTimestamps();
    map[dashboardId] = Date.now();
    localStorage.setItem(GEN_TS_KEY, JSON.stringify(map));
    setRelativeTime(formatRelativeTime(Date.now()));

    // Reset dismissed recommended actions for this dashboard.
    undismissAction(dashboardId);
    setActionDismissed(false);
    const perActionMap = getPerActionDismissedMap();
    delete perActionMap[dashboardId];
    localStorage.setItem(PER_ACTION_DISMISSED_KEY, JSON.stringify(perActionMap));
    setDismissedActionIds(new Set());

    window.setTimeout(() => {
      setIsRefreshing(false);
      toast.success("Summary regenerated", {
        description: "AI summary has been refreshed with the latest data.",
      });
    }, 650);
  }, [dashboardId, insightsCollapsible, handleInsightsOpenChange]);

  const handleCopyInsights = useCallback(() => {
    if (!data) return;
    const lines = [
      data.summary,
      "",
      ...data.bullets.map((b) => `• ${b.label} — ${b.detail}`),
    ];
    if (!actionDismissed) {
      lines.push("", `Opportunity: ${data.opportunity}`, `Action: ${data.actionText}`);
    }
    navigator.clipboard.writeText(lines.join("\n")).then(() => {
      toast.success("Copied to clipboard", {
        description: "AI summary insights have been copied.",
      });
    });
  }, [data, actionDismissed]);

  if (!data) return null;

  const showMetaOnGeneratedRowOnly = hideSectionHeader && !insightsCollapsible;
  const generatedTimestampBadge =
    relativeTime ? (
      <Badge variant="secondary" className="shrink-0 gap-1.5 text-muted-foreground">
        <Clock className="h-3 w-3 shrink-0" aria-hidden />
        Generated {relativeTime}
      </Badge>
    ) : null;

  const insightsPanelId = `ai-insights-panel-content-${dashboardId}`;
  const seed = hashStringToPositiveInt(dashboardId);
  const pool = GLOBAL_SUGGESTED_ACTION_POOL.length ? GLOBAL_SUGGESTED_ACTION_POOL : recommendedActionsData.slice(0, 3);
  const optionCount = Math.max(1, Math.min(1 + (seed % 3), pool.length));
  const startIdx = pool.length ? seed % pool.length : 0;
  const suggestedActions: RecommendedAction[] = pool.length
    ? Array.from({ length: optionCount }, (_, i) => pool[(startIdx + i) % pool.length])
    : [];
  const visibleSuggestedActions = suggestedActions.filter((a) => !dismissedActionIds.has(a.id));
  const suggestedActionGridCount = visibleSuggestedActions.length;
  const recommendedActionsGridClass = cn(
    "grid w-full min-w-0 items-stretch gap-4",
    stackRecommendedActionCards || suggestedActionGridCount <= 1
      ? "grid-cols-1"
      : suggestedActionGridCount === 2
        ? "grid-cols-2"
        : "grid-cols-3",
  );
  const recommendedActionsSkeletonGridClass = cn(
    "grid w-full min-w-0 items-stretch gap-4",
    stackRecommendedActionCards ? "grid-cols-1" : "grid-cols-2",
  );

  return (
    <>
      <div className="space-y-3">
        {!hideSectionHeader && (
          <div className="flex items-center gap-3">
            <h3 className="mt-8 flex-1 tracking-tight">AI Insights</h3>
            <div className="flex shrink-0 items-center gap-2">
              {generatedTimestampBadge}
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="icon-xs"
                    onClick={handleRegenerate}
                  >
                    <RefreshCw />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="bottom">Refresh summary</TooltipContent>
              </Tooltip>
              <DropdownMenu>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" size="icon" className="h-8 w-8">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                  </TooltipTrigger>
                  <TooltipContent side="bottom">Summary options</TooltipContent>
                </Tooltip>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem onSelect={handleCopyInsights}>
                    <Copy className="h-4 w-4" />
                    Copy insights
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        )}

        <Card className="group/widget mb-8 gap-0 shadow-none transition-[box-shadow,border-color] hover:border-primary/30 hover:shadow-md">
          {insightsCollapsible ? (
            <CardHeader
              className={cn(
                "flex flex-row flex-wrap items-center justify-between gap-2 space-y-0 p-4",
                insightsOpen && "border-b border-border/60",
              )}
            >
              <div className="flex min-w-0 flex-1 items-center gap-2">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 shrink-0"
                      aria-expanded={insightsOpen}
                      aria-controls={insightsPanelId}
                      aria-label={insightsOpen ? "Collapse AI insights" : "Expand AI insights"}
                      onClick={() => handleInsightsOpenChange(!insightsOpen)}
                    >
                      <ChevronDown
                        className={cn(
                          "h-4 w-4 text-muted-foreground transition-transform",
                          insightsOpen && "rotate-180"
                        )}
                        aria-hidden
                      />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="bottom">
                    {insightsOpen ? "Hide AI insights" : "Show AI insights"}
                  </TooltipContent>
                </Tooltip>
                <CardTitle className="inline-flex min-w-0 flex-1 items-center gap-2 text-base font-medium">
                  <Sparkles className="h-4 w-4 shrink-0 text-primary" aria-hidden />
                  AI Insights
                </CardTitle>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                {generatedTimestampBadge}
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-xs"
                      onClick={handleRegenerate}
                    >
                      <RefreshCw />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="bottom">Refresh summary</TooltipContent>
                </Tooltip>
              </div>
            </CardHeader>
          ) : null}
          {insightsCollapsible && !insightsOpen ? null : (
            <div
              id={insightsCollapsible ? insightsPanelId : undefined}
              className={insightsCollapsible ? "flex min-w-0 flex-col" : "contents"}
            >
              <CardContent className="space-y-6 bg-muted/20 pt-4">
                <section>
                  <div className="flex flex-wrap items-center gap-2">
                    <div className="flex min-w-0 flex-1 items-center gap-2">
                      <List className="h-4 w-4 shrink-0 text-primary" aria-hidden />
                      <span className="text-sm font-medium text-foreground">Generated Summary</span>
                    </div>
                    {showMetaOnGeneratedRowOnly ? (
                      <div className="flex shrink-0 flex-wrap items-center gap-2">
                        {generatedTimestampBadge}
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon-xs"
                              onClick={handleRegenerate}
                            >
                              <RefreshCw />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent side="bottom">Refresh summary</TooltipContent>
                        </Tooltip>
                      </div>
                    ) : null}
                  </div>
                  <div className="mt-4 flex min-h-0 items-stretch gap-2">
                    <div
                      className="flex w-4 shrink-0 justify-center self-stretch"
                      aria-hidden
                    >
                      <div className="h-full min-h-[2.5rem] w-px shrink-0 bg-sidebar-border" />
                    </div>
                    <div className="min-w-0 flex-1 space-y-4">
                  {isRefreshing ? (
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-[92%]" />
                      <Skeleton className="h-4 w-[88%]" />
                      <Skeleton className="h-4 w-[76%]" />
                    </div>
                  ) : (
                    <p className="text-sm leading-relaxed text-foreground">{data.summary}</p>
                  )}

                  {isRefreshing ? (
                    <div className="space-y-2.5">
                      <Skeleton className="h-4 w-[86%]" />
                      <Skeleton className="h-4 w-[82%]" />
                      <Skeleton className="h-4 w-[78%]" />
                      <Skeleton className="h-4 w-[74%]" />
                    </div>
                  ) : (
                    <ul className="space-y-2.5">
                      {data.bullets.map((bullet) => (
                        <li key={bullet.label} className="relative pl-4 text-sm">
                          <span className="absolute left-0 top-[0.55rem] h-1.5 w-1.5 rounded-full bg-primary" />
                          <span>
                            <span className="font-medium">{bullet.label}</span>
                            <span className="text-muted-foreground"> — {bullet.detail}</span>
                          </span>
                        </li>
                      ))}
                    </ul>
                  )}
                    </div>
                  </div>
                </section>

                {(isRefreshing ||
                  recommendedActionsContent ||
                  (!actionDismissed && visibleSuggestedActions.length > 0)) && (
                  <div
                    ref={recommendedActionsGridRef}
                    className="flex min-w-0 w-full flex-col gap-4"
                  >
                    {isRefreshing ? (
                      <div className="flex flex-wrap items-center gap-2">
                        <Skeleton className="h-4 w-40" />
                        <Skeleton className="h-8 w-24 rounded-md" />
                      </div>
                    ) : (
                      <div className="flex flex-wrap items-center gap-2">
                        <div className="flex min-w-0 flex-1 items-center gap-2">
                          <Zap className="h-4 w-4 shrink-0 text-amber-500" aria-hidden />
                          <span className="text-sm font-medium text-foreground">
                            {recommendedActionsTitle}
                          </span>
                        </div>
                        {!hideDismissAll ? (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="h-8 shrink-0 gap-1.5 px-3 text-xs"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDismissAction();
                            }}
                          >
                            <BellOff className="h-3.5 w-3.5" />
                            Dismiss all
                          </Button>
                        ) : null}
                      </div>
                    )}

                    {isRefreshing ? (
                      <div className={recommendedActionsSkeletonGridClass}>
                        {Array.from({ length: 2 }).map((_, i) => (
                          <div
                            key={i}
                            className="flex min-w-0 flex-col gap-2 rounded-xl border border-primary/30 bg-primary/[0.02] p-4 transition-[box-shadow,border-color] hover:border-primary/30 hover:shadow-md"
                          >
                            <div className="flex flex-col gap-2.5">
                              <div className="flex items-start justify-between gap-2">
                                <Skeleton className="h-5 w-[70%]" />
                                <Skeleton className="h-8 w-8 rounded-md" />
                              </div>
                              <Skeleton className="h-5 w-24 rounded-md" />
                              <Skeleton className="h-4 w-[92%]" />
                              <Skeleton className="h-4 w-[84%]" />
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : recommendedActionsContent ? (
                      recommendedActionsContent
                    ) : (
                      <div className={recommendedActionsGridClass}>
                          {visibleSuggestedActions.map((action) => (
                            <div
                              key={action.id}
                              id={`ai-summary-action-${dashboardId}-${action.id}`}
                              className="flex min-w-0 flex-col gap-2 rounded-xl border border-primary/40 bg-primary/[0.03] p-4 transition-[box-shadow,border-color,background-color] hover:border-primary/55 hover:bg-primary/[0.05] hover:shadow-md"
                            >
                              <button
                                type="button"
                                className="min-w-0 w-full rounded-sm text-left outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                                onClick={() => setSheetAction(action)}
                              >
                                <div className="flex flex-col gap-2.5">
                                    <div className="flex items-start justify-between gap-2">
                                      <span className="line-clamp-2 text-base font-medium leading-6 text-foreground">
                                        {action.title}
                                      </span>
                                      <div
                                        className="flex shrink-0 items-center gap-0"
                                        onClick={(e) => e.stopPropagation()}
                                        onPointerDown={(e) => e.stopPropagation()}
                                      >
                                        <DropdownMenu>
                                          <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" size="icon-xs">
                                              <MoreVertical />
                                            </Button>
                                          </DropdownMenuTrigger>
                                          <DropdownMenuContent align="end">
                                            <DropdownMenuItem
                                              onSelect={() => handleDismissSingleAction(action)}
                                            >
                                              <BellOff className="h-4 w-4" />
                                              Dismiss action
                                            </DropdownMenuItem>
                                          </DropdownMenuContent>
                                        </DropdownMenu>
                                      </div>
                                    </div>
                                    <Badge
                                      variant="outline"
                                      className="w-fit border-green-500/50 bg-emerald-50 px-2 py-0.5 text-xs font-normal text-emerald-800 dark:border-green-700 dark:bg-emerald-950/40 dark:text-emerald-300"
                                    >
                                      {action.impactValue}
                                    </Badge>
                                    <p className="line-clamp-3 text-sm font-normal leading-snug text-foreground/80">
                                      {buildActionCardParagraph(action)}
                                    </p>
                                </div>
                              </button>
                            </div>
                          ))}
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </div>
          )}
        </Card>
      </div>

      <RecommendedActionSheet
        action={sheetAction}
        open={!!sheetAction}
        onOpenChange={(open) => { if (!open) setSheetAction(null); }}
        onDismiss={(id) => {
          const action = sheetAction && sheetAction.id === id ? sheetAction : null;
          if (action) {
            handleDismissSingleAction(action);
          }
          setSheetAction(null);
        }}
      />
    </>
  );
}
