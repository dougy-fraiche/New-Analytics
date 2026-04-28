import {
  useState,
  useCallback,
  useRef,
  useEffect,
  useMemo,
  type Dispatch,
  type ReactNode,
  type SetStateAction,
} from "react";
import {
  RotateCcw,
  ArrowUp,
  Square,
  Loader2,
  ChevronDown,
  Check,
  Sparkles,
  Bot,
} from "lucide-react";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Textarea } from "./ui/textarea";
import { ResizeHandle } from "./ResizeHandle";
import { useVoiceInput } from "../hooks/useVoiceInput";
import { toast } from "sonner";
import {
  useDashboardChat,
  useDashboardMessages,
  conversationNameFromPrompt,
  type ChatMessage,
} from "../contexts/DashboardChatContext";
import { useAiAssistantExploreBridge } from "../contexts/AiAssistantExploreBridgeContext";
import {
  EXPLORE_THREAD_USER_TURN_EVENT,
  GLOBAL_AI_ASSISTANT_KEY,
} from "../lib/ai-assistant-global";
import { Link, useLocation, useNavigate } from "react-router";
import { ROUTES } from "../routes";
import { getChartIconForWidgetType } from "./ChartVariants";
import { Tooltip, TooltipContent, TooltipTrigger } from "./ui/tooltip";
import { cn } from "./ui/utils";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "./ui/collapsible";
import {
  buildMockAssistantFields,
  defaultPhasedToolSteps,
} from "../lib/mock-assistant-structure";
import {
  buildCreateAIAgentReplyPayload,
  CREATE_AI_AGENT_IN_CHAT_EVENT,
  CREATE_AI_AGENT_IN_CHAT_PROGRESS_EVENT,
  CREATE_AI_AGENT_IN_CHAT_FINISHED_EVENT,
  type CreateAIAgentInChatDetail,
} from "../lib/create-ai-agent-chat";
import {
  buildOpportunityInvestigationAssistantPayload,
  PENDING_OPPORTUNITY_INVESTIGATION_CHAT_STORAGE_KEY,
  START_OPPORTUNITY_INVESTIGATION_CHAT_EVENT,
  type StartOpportunityInvestigationChatDetail,
} from "../lib/start-opportunity-investigation-chat";
import { AI_AGENT_JOB_STEP_MS } from "../lib/create-ai-agent-jobs";
import { syntheticAssistantReasoningText } from "../lib/assistant-synthetic-reasoning";
import { runPhasedAssistantReply } from "../lib/run-phased-assistant-reply";
import type { AssistantReplyPayload } from "../types/conversation-types";
import { normalizeAskAiWidgetTitle } from "../lib/normalize-ask-ai-widget-title";

interface DashboardChatPanelProps {
  /** Route / page context id (saved id, OOTB id, etc.) — not used for message persistence in global mode */
  dashboardId?: string;
  /**
   * Source OOTB dashboard type ID — used to resolve suggested prompts and AI
   * response context for saved/custom dashboards that don't have an OOTB dashboardId.
   * Falls back to dashboardId when not provided.
   */
  sourceOotbId?: string;
  /** Chat store key for the assistant panel thread (global or route-scoped). */
  assistantPersistKey: string;
  /** Hide reset in routes where thread reset is disallowed (e.g. conversation pages). */
  showResetButton?: boolean;
  placeholder?: string;
  /** Human-readable current page title for the input context pill (from route / breadcrumbs). */
  pageContextLabel?: string;
  /** Lets the app shell disable width transitions while the user drags the panel edge. */
  onAssistantPanelResizeStart?: () => void;
  onAssistantPanelResizeEnd?: () => void;
}

// ─── Dashboard-specific suggested questions ──────────────────────────────────

const dashboardSuggestedQuestions: Record<string, string[]> = {
  "agent-queries": [
    "What are the top query categories this week?",
    "Show agent query volume trends",
    "Which queries have the lowest response rate?",
    "Compare query volumes across teams",
  ],
  "auto-summary": [
    "How accurate are auto-generated summaries?",
    "Show summary generation trends",
    "Which conversation types produce the best summaries?",
    "What's the average summary length over time?",
  ],
  "rules-engine": [
    "Which rules trigger most frequently?",
    "Show rule execution success rates",
    "Are there any failing automation rules?",
    "Compare rule performance this month vs last",
  ],
  "task-assist": [
    "What's the task assist adoption rate?",
    "Show completion rate trends",
    "Which tasks save agents the most time?",
    "Compare task assist usage across teams",
  ],
  "intent-nlu": [
    "Which intents have the lowest confidence scores?",
    "Show NLU accuracy trends over time",
    "What are the most misclassified intents?",
    "Compare intent recognition across languages",
  ],
  "goals-outcomes": [
    "What's the overall goal completion rate?",
    "Show resolution path analysis",
    "Which goals have the highest drop-off?",
    "Compare outcomes across bot versions",
  ],
  "ai-agents-overview": [
    "What's the current agent uptime?",
    "Show throughput trends this week",
    "Are there any agents with degraded health?",
    "Compare operational metrics across regions",
  ],
  "ai-agents-copilot": [
    "What's Copilot adoption across teams?",
    "Show suggestion acceptance rate trends",
    "Which intents get the most Copilot assists?",
    "Compare handle time with Copilot enabled vs disabled",
  ],
  "ai-agent-evaluation": [
    "Which tools are invoked most often and how reliable are they?",
    "How are self-learning loops affecting model quality?",
    "What's the tool success vs failure rate this period?",
    "Compare agent performance before vs after recent updates",
  ],
  "automation-opportunities": [
    "Which category has the highest automation ROI this period?",
    "What topics should we automate first under Billing & Payment?",
    "How much could we save if we fully automated bill explanation?",
    "Compare containment for card services vs billing inquiries",
  ],
  "knowledge-responses": [
    "What's the knowledge base coverage rate?",
    "Show response quality trends",
    "Which articles are most referenced?",
    "What queries return no knowledge results?",
  ],
  "improve-knowledge": [
    "What are the top knowledge gaps?",
    "Show suggested article trends",
    "Which topics need the most improvement?",
    "What's the gap closure rate over time?",
  ],
  "llm-ai-agent": [
    "What's the total LLM token usage this month?",
    "Show cost trends for AI agent interactions",
    "Which models have the best cost-to-performance ratio?",
    "Compare token usage across conversation types",
  ],
  "llm-agent": [
    "How much LLM usage comes from agent-assist?",
    "Show copilot integration usage trends",
    "What's the cost per agent-assist interaction?",
    "Compare LLM usage across agent teams",
  ],
  "all-insights": [
    "Which widgets appear across the most dashboards?",
    "Summarize the key trends across all insights",
    "Which chart types are used most frequently?",
    "What metrics should I focus on first?",
  ],
};

const defaultSuggestedQuestions = [
  "What are the key insights here?",
  "What should I focus on first?",
  "What changed recently?",
  "What actions do you recommend?",
];

// ─── Dashboard-specific AI response handlers ─────────────────────────────────

const dashboardResponseHandlers: Record<string, (msg: string) => string | null> = {
  "agent-queries": (msg) => {
    if (msg.includes("top") || msg.includes("categor")) return "Based on current data, the top query categories are: Account Access (28%), Billing (22%), Technical Issues (18%), and Product Info (15%). Account Access queries have surged 14% this week. Want me to drill down into any specific category?";
    if (msg.includes("volume") || msg.includes("trend")) return "Agent query volume shows a steady upward trend, averaging 1,450 queries/day this month \u2014 up 11% from last month. Peak hours are 10am\u20132pm EST. Shall I break this down by team or channel?";
    if (msg.includes("lowest") || msg.includes("response rate")) return "The lowest response rate queries are: 'Account Migration' (62%), 'Multi-product Bundles' (68%), and 'Enterprise SSO Setup' (71%). These categories may need expanded knowledge articles or specialist routing. Want me to show the full breakdown?";
    if (msg.includes("compare") || msg.includes("team")) return "Cross-team comparison: Tier 1 handles 58% of volume with 4.1 min avg response, Tier 2 handles 30% at 8.7 min, and Technical handles 12% at 14.2 min. Tier 1 resolution-without-escalation rate improved 6% this month.";
    return null;
  },
  "auto-summary": (msg) => {
    if (msg.includes("accurate") || msg.includes("accuracy")) return "Auto-summary accuracy is currently at 91.3%, measured by agent acceptance rate. Summaries for billing conversations score highest (95.1%) while multi-turn technical troubleshooting scores lowest (84.7%). Would you like to see accuracy by conversation category?";
    if (msg.includes("trend") || msg.includes("generation")) return "Summary generation volume has grown 23% month-over-month, now averaging 2,840 summaries/day. The acceptance-without-edit rate has climbed from 78% to 86% over the past quarter, indicating improving quality. Shall I break this down by week?";
    if (msg.includes("type") || msg.includes("best")) return "Best-performing conversation types: Simple billing inquiries (96.2% acceptance), password resets (95.8%), and order status checks (94.1%). Weakest: multi-party escalations (81.3%) and edge-case troubleshooting (83.6%). Want to explore why specific types underperform?";
    if (msg.includes("length") || msg.includes("average")) return "Average summary length is 127 words, down from 156 last quarter \u2014 summaries are getting more concise while maintaining quality. Ideal length appears to be 100\u2013140 words based on agent satisfaction data. Should I show the length distribution?";
    return null;
  },
  "rules-engine": (msg) => {
    if (msg.includes("trigger") || msg.includes("frequent")) return "Top-triggering rules: Auto-route to Billing (3,420/day), Priority Escalation for VIPs (892/day), After-hours Auto-response (764/day), and SLA Warning at 80% (641/day). The VIP escalation rule has increased 18% since last quarter. Want to view trigger trends?";
    if (msg.includes("success") || msg.includes("execution")) return "Rule execution success rate is 97.8% overall. The 2.2% failure rate breaks down as: timeout errors (1.1%), condition conflicts (0.7%), and target-queue-full (0.4%). Three rules have been flagged with >5% failure rates this week. Want me to list them?";
    if (msg.includes("failing") || msg.includes("fail")) return "Currently 3 rules have elevated failure rates: 'Route to Specialist Queue' (8.2% \u2014 queue at capacity), 'Auto-close Inactive > 72h' (6.1% \u2014 edge case with reopened tickets), and 'Merge Duplicate Contacts' (5.4% \u2014 matching conflict). Want me to suggest fixes?";
    if (msg.includes("compare") || msg.includes("month") || msg.includes("last")) return "Month-over-month: total rule executions up 14%, success rate stable at ~97.8%, and average execution time improved from 230ms to 195ms. Two new rules added this month account for 620 daily triggers. Shall I break down the new rule performance?";
    return null;
  },
  "task-assist": (msg) => {
    if (msg.includes("adoption") || msg.includes("rate")) return "Task assist adoption is at 72.4% of eligible agents, up from 64.1% last quarter. New agents adopt within 3 days on average. The highest adoption is in Tier 1 (81%) while Technical teams are at 58%. Would you like to see adoption by team?";
    if (msg.includes("completion") || msg.includes("trend")) return "Task completion rates: 89.2% overall. Top tasks by completion \u2014 Password Reset Guide (97%), Billing Adjustment Steps (93%), Return Processing (91%). The lowest is Complex Troubleshooting (72%). Completion rates have improved 4.3% quarter-over-quarter.";
    if (msg.includes("time") || msg.includes("save")) return "Task assist saves an average of 2.3 minutes per interaction. Top time-savers: Account Verification (3.8 min saved), Order Lookup + Status (3.2 min), and Warranty Check (2.9 min). Monthly estimated time savings: ~1,840 agent hours. Want a cost-impact analysis?";
    if (msg.includes("compare") || msg.includes("team")) return "Team usage comparison: Tier 1 averages 14.2 task assists/agent/day, Tier 2 averages 8.7, Technical averages 5.3. Tier 1 sees the highest time savings per use (2.6 min) while Technical agents report highest satisfaction with complex task guides (4.3/5).";
    return null;
  },
  "intent-nlu": (msg) => {
    if (msg.includes("confidence") || msg.includes("lowest")) return "The intents with lowest confidence scores are: 'change_plan' (72%), 'complaint_escalation' (75%), and 'product_comparison' (78%). These would benefit from additional training data. Want me to show misclassification patterns?";
    if (msg.includes("accuracy") || msg.includes("trend")) return "NLU accuracy has improved from 88.2% to 91.7% over the past 90 days, driven by recent model retraining. The biggest gains were in billing-related intents. Should I compare across languages?";
    if (msg.includes("misclassif") || msg.includes("confused")) return "Top misclassification pairs: 'change_plan' \u2194 'cancel_subscription' (23% confusion rate), 'billing_inquiry' \u2194 'payment_issue' (18%), and 'feature_request' \u2194 'bug_report' (14%). Adding disambiguation prompts could reduce these by an estimated 40%. Shall I model the impact?";
    if (msg.includes("language") || msg.includes("compare")) return "Language comparison: English leads at 93.4% accuracy, followed by Spanish (89.1%), French (87.6%), German (86.2%), and Portuguese (84.8%). Non-English accuracy improved 3.2% after last month's multilingual fine-tuning. Want per-language intent breakdowns?";
    return null;
  },
  "goals-outcomes": (msg) => {
    if (msg.includes("completion") || msg.includes("rate")) return "Overall goal completion rate is 73.4%. Top performers: Password Reset (94%), Order Tracking (87%). Lowest: Plan Migration (41%), Technical Troubleshooting (52%). Would you like to see the drop-off funnel for underperformers?";
    if (msg.includes("resolution") || msg.includes("path")) return "Resolution path analysis: 61% of goals resolve in a single turn, 24% take 2\u20133 turns, and 15% require 4+ turns or escalation. Single-turn resolution has improved 8% this quarter. The biggest bottleneck is identity verification, adding ~1.5 turns on average.";
    if (msg.includes("drop") || msg.includes("highest")) return "Highest drop-off goals: Plan Migration drops 34% at the 'compare plans' step, Technical Troubleshooting drops 28% at 'diagnostic questions', and Insurance Claims drops 24% at 'document upload'. These are prime candidates for UX improvements or agent handoff triggers.";
    if (msg.includes("compare") || msg.includes("version") || msg.includes("bot")) return "Bot v3.2 vs v3.1: overall goal completion +4.7%, average turns-to-resolve -0.6, and customer satisfaction +3.1%. The biggest improvement was in multi-step goals (+8.2% completion). V3.2's improved context memory appears to be the key driver.";
    return null;
  },
  "ai-agents-overview": (msg) => {
    if (msg.includes("uptime") || msg.includes("health")) return "Current agent fleet uptime: 99.7% (30-day rolling). Two agents experienced brief degradation last week \u2014 SalesBot had a 12-minute outage on Feb 18 (dependency failure) and TechSupportBot had elevated latency for ~25 minutes on Feb 20 (model warm-up). All agents are healthy now.";
    if (msg.includes("throughput") || msg.includes("trend")) return "Weekly throughput: 142,300 conversations processed, up 9% from last week. Peak throughput hit 892 concurrent conversations on Tuesday at 11:15 AM EST. Average response time is 1.8s, within the 2.5s SLA. Want a breakdown by agent or hour?";
    if (msg.includes("degraded") || msg.includes("alert")) return "No agents are currently in degraded state. However, TechSupportBot is approaching its memory threshold (82% utilized) and may need a restart within 48 hours. BillingBot's p99 latency has crept from 2.1s to 2.4s this week \u2014 still within SLA but trending upward. Want to set alerting thresholds?";
    if (msg.includes("compare") || msg.includes("region")) return "Regional breakdown: US-East handles 41% of traffic (avg 1.6s latency), US-West 28% (1.7s), EU-West 22% (1.9s), APAC 9% (2.2s). APAC latency is elevated due to model serving distance; edge deployment planned for next sprint.";
    return null;
  },
  "ai-agents-copilot": (msg) => {
    if (msg.includes("adopt") || msg.includes("team")) return "Copilot adoption: 78% of active agents used assist at least once this week (+6 pts vs last week). Tier 1 leads at 86%, Tier 2 at 71%, Technical at 62%. Want a breakdown by queue or channel?";
    if (msg.includes("accept") || msg.includes("suggestion") || msg.includes("rate"))
      return "Suggestion acceptance rate is 71% (rolling 7 days), up from 64% last month. Highest acceptance on billing and order-status flows; lowest on multi-step troubleshooting. Should I segment by intent?";
    if (msg.includes("intent") || msg.includes("assist")) return "Top intents by Copilot assist volume: password reset, order lookup, billing inquiry, and return status. Assist reduces average handle time by ~18% on these intents in pilots. Want correlation with CSAT?";
    if (msg.includes("handle") || msg.includes("time") || msg.includes("compare"))
      return "Handle time with Copilot enabled averages 3.9 minutes vs 4.8 minutes without (same intent cohorts). Biggest savings are on lookup-heavy conversations. I can chart week-over-week impact if you want.";
    return null;
  },
  "ai-agent-evaluation": (msg) => {
    if (msg.includes("tool") || msg.includes("invoke") || msg.includes("often")) return "The most invoked tools are: CRM Lookup (34%), Knowledge Search (28%), Order Status API (19%), and Ticket Creator (12%). Average tool latency is 245ms; Knowledge Search is fastest at 120ms while CRM Lookup is slowest at 380ms. Shall I correlate tool errors with CSAT?";
    if (msg.includes("loop") || msg.includes("learning") || msg.includes("how many")) return "This week: 47 self-learning loops completed across 5 agents. CustomerBot ran the most (14 loops), incorporating 2,340 feedback signals. Overall improvement yield: 72% of loops produced measurable accuracy gains, up from 63% last month. Want to see loop outcomes by agent?";
    if (msg.includes("success") || msg.includes("failure") || msg.includes("rate")) return "Tool success rates: Knowledge Search 99.2%, Ticket Creator 98.7%, Order Status API 97.1%, CRM Lookup 94.8%. CRM Lookup failures are mostly timeout-related (3.1%) and auth token expiry (1.9%). Evaluation dashboards flag any tool below 96% for follow-up.";
    if (msg.includes("before") || msg.includes("after") || msg.includes("update") || msg.includes("compare")) return "Before/after recent updates (last 30 days): CustomerBot accuracy 89.1% \u2192 91.8%, SupportBot 86.4% \u2192 88.2%, SalesBot 91.2% \u2192 91.5% (plateau). Average resolution turns decreased by 0.4 across agents that received learning updates. Customer satisfaction improved 1.7 points in that cohort.";
    return null;
  },
  "knowledge-responses": (msg) => {
    if (msg.includes("coverage") || msg.includes("rate")) return "Current knowledge base coverage is 84.3%, meaning 15.7% of queries have no matching article. The biggest gaps are in recently launched features and edge-case troubleshooting. Want to see the uncovered topic clusters?";
    if (msg.includes("quality") || msg.includes("trend")) return "Response quality scores have averaged 4.2/5 this month, up from 3.9 last month. The improvement correlates with 23 new articles added to the billing and returns sections. Shall I show article-level breakdown?";
    if (msg.includes("article") || msg.includes("referenced") || msg.includes("most")) return "Top referenced articles: 'Password Reset Guide' (4,230 hits/week), 'Billing FAQ' (3,870), 'Return Policy' (2,910), 'Account Setup' (2,640), and 'Shipping Status Explained' (2,180). The top 20 articles handle 62% of all knowledge queries. Want to see utilization distribution?";
    if (msg.includes("no result") || msg.includes("zero") || msg.includes("no knowledge")) return "Top zero-result queries: 'Enterprise SSO configuration' (340/week), 'API rate limiting details' (280), 'Multi-region deployment' (210), and 'Custom webhook setup' (190). These map to 4 knowledge clusters that could be addressed with 8\u201312 new articles. Shall I draft the article briefs?";
    return null;
  },
  "improve-knowledge": (msg) => {
    if (msg.includes("gap") || msg.includes("top")) return "Top knowledge gaps by query volume: Enterprise Features (1,240 unresolved queries/month), API Documentation (890), Advanced Integrations (670), Compliance & Security (520), and Multi-tenant Configuration (380). Closing the top 3 gaps would improve overall coverage by ~8.4%.";
    if (msg.includes("suggested") || msg.includes("article") || msg.includes("trend")) return "Suggested article pipeline: 34 articles in draft, 12 in review, 8 published this month. The AI-suggested articles have a 78% acceptance rate by content authors. Average time from suggestion to publication: 6.2 days, down from 9.1 days last quarter.";
    if (msg.includes("topic") || msg.includes("improvement") || msg.includes("most")) return "Topics needing most improvement (by negative feedback signals): 'Billing Dispute Process' (needs clarity on edge cases), 'Integration Troubleshooting' (outdated screenshots), 'Data Export Guide' (missing CSV format details), and 'Team Admin Setup' (incomplete role permissions section).";
    if (msg.includes("closure") || msg.includes("rate") || msg.includes("over time")) return "Knowledge gap closure rate: 23 gaps closed this month (vs 18 last month, +28%). Cumulative closure rate: 67% of all identified gaps have been addressed since the program started. Average gap age before closure: 14 days. The backlog currently has 52 open gaps.";
    return null;
  },
  "llm-ai-agent": (msg) => {
    if (msg.includes("token") || msg.includes("usage") || msg.includes("total")) return "This month's LLM usage: 12.4M tokens ($3,720 estimated cost). GPT-4 accounts for 62% of spend but handles the most complex queries. GPT-3.5-turbo handles 71% of volume at 18% of cost. Want a model-by-model breakdown?";
    if (msg.includes("cost") || msg.includes("trend")) return "LLM cost trend: $3,720 this month vs $3,140 last month (+18.5%). The increase is driven by a 24% rise in conversation volume. Cost per conversation has actually decreased from $0.087 to $0.079 thanks to prompt optimization and model routing improvements.";
    if (msg.includes("ratio") || msg.includes("performance") || msg.includes("best")) return "Cost-to-performance ratio: GPT-4o leads with 94.2% accuracy at $0.042/conversation. GPT-4 scores 96.1% accuracy at $0.128/conversation. GPT-3.5-turbo is cheapest at $0.011 but scores 87.3% accuracy. The smart router routes 70% of simple queries to 3.5-turbo, saving ~$1,200/month.";
    if (msg.includes("compare") || msg.includes("conversation type")) return "Token usage by conversation type: Technical Support averages 1,840 tokens/conversation, Billing 920 tokens, General Inquiry 640 tokens, and Returns 780 tokens. Technical Support costs 2.4x more per conversation but has the highest resolution value.";
    return null;
  },
  "llm-agent": (msg) => {
    if (msg.includes("agent-assist") || msg.includes("how much") || msg.includes("usage")) return "Agent-assist LLM usage: 4.2M tokens this month ($1,260), accounting for 34% of total LLM spend. Usage breaks down as: response suggestions (48%), auto-summary (28%), knowledge lookup augmentation (16%), and sentiment analysis (8%).";
    if (msg.includes("copilot") || msg.includes("integration") || msg.includes("trend")) return "Copilot integration usage is up 31% month-over-month. Active copilot users: 187 agents (78% of workforce). Average copilot interactions per agent per day: 42. The suggestion acceptance rate is 71%, up from 64% last quarter, indicating improving relevance.";
    if (msg.includes("cost") || msg.includes("per") || msg.includes("interaction")) return "Cost per agent-assist interaction: $0.0067 average. Response suggestions cost $0.0089 (most complex), auto-summary $0.0052, knowledge augmentation $0.0041, and sentiment $0.0028. Total agent-assist program saves an estimated $18,400/month in reduced handle time.";
    if (msg.includes("compare") || msg.includes("team") || msg.includes("across")) return "LLM usage by agent team: Tier 1 Support (42% of agent-assist tokens), Tier 2 (28%), Technical (18%), Sales Support (12%). Tier 1 uses copilot most frequently but with shorter prompts. Technical team has the highest tokens-per-interaction (avg 340 tokens vs 180 for Tier 1).";
    return null;
  },
  "all-insights": (msg) => {
    if (msg.includes("widgets") || msg.includes("appear")) return "The widgets that appear across the most dashboards are: 'Top Queries', 'Agent Performance', 'Resolution Time', and 'Customer Satisfaction'. These widgets provide a comprehensive overview of key metrics and trends.";
    if (msg.includes("trends") || msg.includes("key")) return "Key trends across all insights include: increasing agent query volume, improving resolution times, and rising customer satisfaction scores. These trends indicate a positive impact on overall performance.";
    if (msg.includes("chart") || msg.includes("types")) return "The most frequently used chart types across all insights are: bar charts, line charts, and pie charts. These visualizations help in understanding and analyzing data effectively.";
    if (msg.includes("metrics") || msg.includes("focus")) return "You should focus on the following metrics first: 'Agent Uptime', 'Resolution Rate', 'Average Handle Time', and 'Customer Satisfaction'. These metrics are critical for assessing the overall health and performance of your operations.";
    return null;
  },
};

function generateAIResponse(
  userMessage: string,
  ootbTypeId?: string,
  pageContext?: { pageLabel?: string; pagePath?: string },
): AssistantReplyPayload {
  const meta = () =>
    buildMockAssistantFields(userMessage, {
      ootbTypeId,
      pageLabel: pageContext?.pageLabel,
      pagePath: pageContext?.pagePath,
    });
  const lowerMessage = userMessage.toLowerCase();

  // Try dashboard-specific handler first
  if (ootbTypeId) {
    const handler = dashboardResponseHandlers[ootbTypeId];
    if (handler) {
      const specific = handler(lowerMessage);
      if (specific) return { content: specific, ...meta() };
    }
  }

  // Generic fallbacks
  if (lowerMessage.includes("escalation") || lowerMessage.includes("trend")) {
    return {
      content:
        "From what you're viewing, escalation rates look about 8% higher over the last month. The main driver seems to be technical support. Want to narrow by team or product, or change the time range?",
      ...meta(),
    };
  }

  if (lowerMessage.includes("filter") || lowerMessage.includes("show")) {
    return {
      content:
        "I can help you adjust what you see. Try team (Tier 1, Tier 2, Technical), a date range (last 7 / 30 / 90 days, this quarter, this year), or product. What slice matters most right now?",
      ...meta(),
    };
  }

  if (lowerMessage.includes("export") || lowerMessage.includes("download")) {
    return {
      content:
        "I can help you export this data. You can download the current view as a PDF report or export the raw data as CSV. The export will include all currently applied filters. Which format would you prefer?",
      ...meta(),
    };
  }

  if (lowerMessage.includes("why") || lowerMessage.includes("reason")) {
    return {
      content:
        "From the patterns here, the main drivers look like more complex technical queries and a recent product change that drove support volume. I can go deeper on any slice if you want.",
      ...meta(),
    };
  }

  if (lowerMessage.includes("compare") || lowerMessage.includes("last month")) {
    return {
      content:
        "Comparing to last month: overall volume is up 11%, resolution time improved by 8%, and satisfaction remained steady at 94%. The most notable shift is a 15% increase in AI-handled conversations, which is reducing average cost per interaction. Want me to visualize the month-over-month delta?",
      ...meta(),
    };
  }

  if (lowerMessage.includes("metric") || lowerMessage.includes("important") || lowerMessage.includes("key")) {
    return {
      content:
        "The key metrics here look solid overall: resolution rate about 87% (+2%), handle time near 4.3h (-8%), satisfaction around 94% (+2%). Escalations are up ~12% — worth a closer look. Want to dig into what’s driving that?",
      ...meta(),
    };
  }

  return {
    content:
      "I can explain what you’re seeing, suggest filters or comparisons, spot trends, or help export what’s on screen. What should we tackle first?",
    ...meta(),
  };
}

// ─── Panel dimensions ────────────────────────────────────────────────────────

const REM_PX = 16;
const CHAT_PANEL_DEFAULT_WIDTH_REM = 22;
const CHAT_PANEL_MIN_WIDTH_REM = 280 / REM_PX; // 17.5rem
const CHAT_PANEL_MAX_WIDTH_REM = 600 / REM_PX; // 37.5rem

// ─── Sub-components ──────────────────────────────────────────────────────────

function formatInlineBold(text: string): ReactNode[] {
  const segments = text.split(/(\*\*[^*]+\*\*)/g);
  return segments.map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return (
        <strong key={i} className="font-semibold text-foreground">
          {part.slice(2, -2)}
        </strong>
      );
    }
    return <span key={i}>{part}</span>;
  });
}

function StreamingCursor() {
  return (
    <span
      className="inline-block h-[1.05em] w-0.5 translate-y-[0.12em] bg-foreground/75 align-baseline animate-pulse rounded-[1px]"
      aria-hidden
    />
  );
}

function AssistantTextContent({
  text,
  showTypingCursor,
}: {
  text: string;
  showTypingCursor?: boolean;
}) {
  const hasVisibleText = text.trim().length > 0;
  if (!hasVisibleText && showTypingCursor) {
    return (
      <div className="min-h-[1.25rem] text-sm text-foreground flex items-center">
        <StreamingCursor />
      </div>
    );
  }
  if (!hasVisibleText) {
    return null;
  }

  const blocks = text.split(/\n\n+/);
  return (
    <div className="space-y-3 text-sm text-foreground">
      {blocks.map((block, bi) => {
        const lines = block.split("\n");
        const isLastBlock = bi === blocks.length - 1;
        return (
          <div key={bi} className="leading-relaxed space-y-1">
            {lines.map((line, li) => {
              const isLastLine = isLastBlock && li === lines.length - 1;
              return (
                <p key={li} className={li > 0 ? "mt-1" : undefined}>
                  {formatInlineBold(line)}
                  {isLastLine && showTypingCursor ? <StreamingCursor /> : null}
                </p>
              );
            })}
          </div>
        );
      })}
    </div>
  );
}

function assistantAwaitingAnswer(msg: ChatMessage): boolean {
  return msg.role === "assistant" && !msg.content.trim();
}

function AssistantMessageBlocks({ msg }: { msg: ChatMessage }) {
  const awaiting = assistantAwaitingAnswer(msg);
  const showBody = msg.content.trim().length > 0 || Boolean(msg.isTypingContent);
  /** Reasoning link above the assistant answer (incl. stored history without structured reasoning). */
  const showReasoningCollapsible = showBody || Boolean(msg.reasoning?.trim());
  const awaitingToolSteps =
    awaiting && msg.toolSteps && msg.toolSteps.length > 0
      ? msg.toolSteps
      : awaiting
        ? [
            {
              label: defaultPhasedToolSteps[0]?.label ?? "Parsing request",
              status: "running" as const,
              detail: "Gathering context for your request.",
            },
          ]
        : null;

  return (
    <div className="w-full space-y-3">
      {awaiting ? (
        awaitingToolSteps && awaitingToolSteps.length > 0 ? (
          <div className="space-y-2.5 rounded-md border border-border/60 bg-muted/20 px-2.5 py-2">
            {awaitingToolSteps.map((step, i) => (
              <div key={i} className="flex items-start gap-2 text-xs">
                {step.status === "done" ? (
                  <Check className="h-3.5 w-3.5 shrink-0 text-primary mt-0.5" aria-hidden />
                ) : (
                  <Loader2
                    className="h-3.5 w-3.5 shrink-0 animate-spin text-muted-foreground mt-0.5"
                    aria-hidden
                  />
                )}
                <div className="min-w-0">
                  <p className="font-medium text-foreground/90 leading-snug">{step.label}</p>
                  {step.detail ? (
                    <p className="mt-0.5 text-[11px] text-muted-foreground leading-relaxed">
                      {step.detail}
                    </p>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        ) : null
      ) : null}

      {showReasoningCollapsible ? (
        <Collapsible defaultOpen={false} className="w-full max-w-full">
          <CollapsibleTrigger asChild>
            <Button
              type="button"
              variant="link"
              className={cn(
                "m-0 h-auto min-h-0 w-full justify-start gap-1.5 rounded-none p-0 text-left text-sm font-normal",
                /* default Button size adds has-[>svg]:px-3 — removes extra indent so label aligns with body */
                "has-[>svg]:p-0",
                "text-muted-foreground underline-offset-4 hover:text-foreground hover:underline",
                "data-[state=open]:text-foreground data-[state=open]:no-underline",
                "focus-visible:ring-1 focus-visible:ring-ring/50 focus-visible:ring-offset-0",
                "data-[state=open]:[&>svg]:rotate-180",
              )}
            >
              <span>Reasoning</span>
              <ChevronDown
                className="h-3.5 w-3.5 shrink-0 opacity-70 transition-transform duration-200"
                aria-hidden
              />
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="mt-1 w-max max-w-full min-w-0 rounded-md border border-border/60 bg-muted/15 px-2.5 pb-2.5 pt-2 space-y-3">
            {msg.reasoning?.trim() ? (
              <p className="text-xs text-muted-foreground leading-relaxed whitespace-pre-wrap">
                {msg.reasoning}
              </p>
            ) : msg.toolSteps && msg.toolSteps.length > 0 ? (
              <ul className="space-y-2 text-xs text-muted-foreground">
                {msg.toolSteps.map((step, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <Check className="h-3.5 w-3.5 shrink-0 text-primary mt-0.5" aria-hidden />
                    <section>
                      <span className="text-foreground/90 font-medium">{step.label}</span>
                      {step.detail ? (
                        <p className="mt-0.5 text-[11px] leading-relaxed">{step.detail}</p>
                      ) : null}
                    </section>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-xs text-muted-foreground leading-relaxed whitespace-pre-wrap">
                {syntheticAssistantReasoningText(msg.content)}
              </p>
            )}
          </CollapsibleContent>
        </Collapsible>
      ) : null}

      {showBody ? (
        <AssistantTextContent text={msg.content} showTypingCursor={msg.isTypingContent} />
      ) : null}

      {msg.createAgentView && !msg.isTypingContent ? (
        <div className="pt-2">
          <Button variant="outline" size="sm" asChild>
            <Link to={ROUTES.AUTOMATION_OPPORTUNITIES_AGENT(msg.createAgentView.agentId)}>
              View Agent
            </Link>
          </Button>
        </div>
      ) : null}
    </div>
  );
}

/**
 * Changes when any visible turn updates — including phased assistant patches that keep the same
 * message count (tool steps, reasoning, answer text, sources).
 */
function messageStreamScrollSignature(msg: ChatMessage): string {
  if (msg.role === "user") {
    return `u:${msg.id}:${msg.content.length}`;
  }
  const stepSig =
    msg.toolSteps
      ?.map((s) => `${s.status[0]}:${s.label.length}:${(s.detail ?? "").length}`)
      .join("|") ?? "";
  const agentKey = msg.createAgentView
    ? `${msg.createAgentView.agentId}:${msg.createAgentView.scopeTitle}`
    : "";
  return `a:${msg.id}:${msg.content.length}:${msg.reasoning?.length ?? 0}:${stepSig}:${msg.sources?.length ?? 0}:ty${msg.isTypingContent ? 1 : 0}:ag:${agentKey}`;
}

function AssistantEmptyTypingHint() {
  return (
    <p className="mt-2 max-w-[28rem] text-sm text-muted-foreground">
      Ask about agent performance, trends, anomalies, automation opportunities, or how to get started.
    </p>
  );
}

/** Conversation view: message list (single thread per dashboard) */
function ThreadView({
  messages,
  isThinking,
}: {
  messages: ChatMessage[];
  isThinking: boolean;
}) {
  type PendingSourceJump = {
    widgetRef?: string;
    anchorId?: string;
    sourcePath?: string;
    queuedAt?: number;
  };

  const navigate = useNavigate();
  const location = useLocation();
  const displayMessages = messages.filter((msg) => !msg.dashboardData);
  const bottomRef = useRef<HTMLDivElement>(null);
  const SOURCE_JUMP_PENDING_KEY = "ai-source-jump-pending";
  const currentRoutePath = `${location.pathname}${location.search}${location.hash}`;

  const resolveSourceElement = useCallback((widgetRef: string, anchorId?: string): HTMLElement | null => {
    if (anchorId) {
      const byId = document.getElementById(anchorId);
      if (byId) return byId;
    }

    const normalizedRef = normalizeAskAiWidgetTitle(widgetRef).toLowerCase();
    if (!normalizedRef) return null;
    const titleNodes = Array.from(
      document.querySelectorAll<HTMLElement>(
        "[data-slot='card'] h1, [data-slot='card'] h2, [data-slot='card'] h3, [data-slot='card'] [data-slot='card-title']",
      ),
    );

    for (const node of titleNodes) {
      // Skip matches inside the chat panel itself.
      if (node.closest("[data-chat-panel-root='true']")) continue;
      const text = normalizeAskAiWidgetTitle(node.textContent ?? "").toLowerCase();
      if (!text) continue;
      if (text === normalizedRef || text.includes(normalizedRef) || normalizedRef.includes(text)) {
        return node.closest("[data-slot='card']") as HTMLElement | null;
      }
    }

    return null;
  }, []);

  const scrollAndHighlightSource = useCallback((el: HTMLElement) => {
    el.scrollIntoView({ behavior: "smooth", block: "center" });
    el.classList.add("ring-2", "ring-primary/50");
    window.setTimeout(() => {
      el.classList.remove("ring-2", "ring-primary/50");
    }, 1200);
  }, []);

  const queueCrossPageSourceJump = useCallback(
    (widgetRef: string, anchorId?: string, sourcePath?: string) => {
      try {
        sessionStorage.setItem(
          SOURCE_JUMP_PENDING_KEY,
          JSON.stringify({
            widgetRef,
            anchorId,
            sourcePath,
            queuedAt: Date.now(),
          }),
        );
      } catch {
        /* ignore */
      }
      if (sourcePath) navigate(sourcePath);
    },
    [navigate],
  );

  const jumpToSourceCard = useCallback(
    (widgetRef: string, anchorId?: string, sourcePath?: string) => {
      const targetPath = sourcePath?.trim();
      if (targetPath && targetPath !== currentRoutePath) {
        queueCrossPageSourceJump(widgetRef, anchorId, targetPath);
        return;
      }

      const el = resolveSourceElement(widgetRef, anchorId);
      if (!el) {
        toast.info("Source card is not available in this view yet.");
        return;
      }
      scrollAndHighlightSource(el);
    },
    [
      currentRoutePath,
      queueCrossPageSourceJump,
      resolveSourceElement,
      scrollAndHighlightSource,
    ],
  );

  useEffect(() => {
    let cancelled = false;
    let timeoutId: number | undefined;

    const runPendingJump = (attempt = 0) => {
      let payload: PendingSourceJump | null = null;
      try {
        const raw = sessionStorage.getItem(SOURCE_JUMP_PENDING_KEY);
        if (!raw) return;
        payload = JSON.parse(raw) as PendingSourceJump;
      } catch {
        return;
      }

      if (!payload?.widgetRef) return;
      if (payload.sourcePath && payload.sourcePath !== currentRoutePath) return;
      if (
        typeof payload.queuedAt === "number" &&
        Date.now() - payload.queuedAt > 15_000
      ) {
        sessionStorage.removeItem(SOURCE_JUMP_PENDING_KEY);
        return;
      }

      const el = resolveSourceElement(payload.widgetRef, payload.anchorId);
      if (el) {
        sessionStorage.removeItem(SOURCE_JUMP_PENDING_KEY);
        scrollAndHighlightSource(el);
        return;
      }

      if (attempt >= 20 || cancelled) {
        sessionStorage.removeItem(SOURCE_JUMP_PENDING_KEY);
        toast.info("Source card is not available in this view yet.");
        return;
      }

      timeoutId = window.setTimeout(() => runPendingJump(attempt + 1), 120);
    };

    runPendingJump();
    return () => {
      cancelled = true;
      if (timeoutId) window.clearTimeout(timeoutId);
    };
  }, [currentRoutePath, resolveSourceElement, scrollAndHighlightSource]);

  const scrollStreamKey = useMemo(
    () =>
      `${isThinking ? 1 : 0}|${displayMessages.map(messageStreamScrollSignature).join("¦")}`,
    [displayMessages, isThinking],
  );

  // Auto-scroll when the thread grows or the in-flight assistant message updates (phased reply).
  useEffect(() => {
    let raf1 = 0;
    let raf2 = 0;
    raf1 = requestAnimationFrame(() => {
      raf2 = requestAnimationFrame(() => {
        bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
      });
    });
    return () => {
      cancelAnimationFrame(raf1);
      cancelAnimationFrame(raf2);
    };
  }, [scrollStreamKey]);

  const lastDisplay = displayMessages[displayMessages.length - 1];

  // Empty thread state with suggested prompts
  if (displayMessages.length === 0 && !isThinking) {
    return (
      <div className="h-full min-h-0 p-4 flex flex-col items-center justify-center text-center">
        <Sparkles className="h-12 w-12 shrink-0 text-primary" aria-hidden />
        <h3 className="mt-6 max-w-[28rem] text-lg font-semibold text-foreground">
          How can I help you today?
        </h3>
        <AssistantEmptyTypingHint />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {displayMessages.map((msg) => (
        <div
          key={msg.id}
          className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
        >
          {msg.role === "user" ? (
            <div className="max-w-[85%] rounded-lg bg-[color:var(--lyra-primary-p500)] px-3 py-2 text-white shadow-sm">
              {msg.widgetRef ? (
                <Badge
                  asChild
                  variant="secondary"
                  className="mb-2 h-auto max-w-full min-w-0 flex-col items-stretch justify-start gap-1 whitespace-normal py-1 text-left shadow-none transition-colors hover:bg-secondary/90 focus-visible:ring-2 focus-visible:ring-ring/40"
                >
                  <button
                    type="button"
                    onClick={() =>
                      jumpToSourceCard(
                        msg.widgetRef!,
                        msg.widgetAnchorId,
                        msg.widgetSourcePath,
                      )
                    }
                    aria-label={`Go to ${msg.widgetRef}`}
                    className="inline-flex w-full min-w-0 cursor-pointer flex-col items-stretch gap-1 text-left outline-none"
                  >
                    <span className="inline-flex min-w-0 w-full items-center gap-1">
                      {(() => {
                        const IconComp =
                          msg.widgetIconType === "bot"
                            ? Bot
                            : msg.widgetIconType
                              ? getChartIconForWidgetType(msg.widgetIconType)
                              : null;
                        return IconComp ? (
                          <IconComp
                            className="h-3 w-3 shrink-0 opacity-80"
                            aria-hidden
                          />
                        ) : null;
                      })()}
                      <span className="min-w-0 truncate">{msg.widgetRef}</span>
                    </span>
                    {msg.widgetKpiLabel ? (
                      <span className="w-full truncate text-left opacity-80">
                        Selected:{" "}
                        <span className="font-medium opacity-100">{msg.widgetKpiLabel}</span>
                      </span>
                    ) : null}
                  </button>
                </Badge>
              ) : null}
              <p className="text-sm">{msg.content}</p>
            </div>
          ) : (
            <div className="w-full">
              <AssistantMessageBlocks msg={msg} />
            </div>
          )}
        </div>
      ))}
      {isThinking && lastDisplay?.role !== "assistant" ? (
        <div className="flex justify-start">
          <div className="flex items-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" aria-hidden />
            <p className="text-sm text-muted-foreground">Analyzing...</p>
          </div>
        </div>
      ) : null}
      <div ref={bottomRef} />
    </div>
  );
}

// ─── Component ───────────────────────────────────────────────────────────────

export function DashboardChatPanel({
  dashboardId,
  sourceOotbId,
  assistantPersistKey,
  showResetButton = true,
  placeholder,
  pageContextLabel,
  onAssistantPanelResizeStart,
  onAssistantPanelResizeEnd,
}: DashboardChatPanelProps) {
  const dashboardChat = useDashboardChat();
  const location = useLocation();
  const isExploreHome = location.pathname === "/";
  const {
    isThinking: exploreThinking,
    onSend: exploreOnSend,
    onCancelInFlight: exploreCancelInFlight,
  } = useAiAssistantExploreBridge();

  // The OOTB type used for prompts / AI responses: explicit sourceOotbId > dashboardId
  const ootbTypeId = sourceOotbId || dashboardId;
  const isGlobalAssistantThread = assistantPersistKey === GLOBAL_AI_ASSISTANT_KEY;

  const storedMessages = useDashboardMessages(assistantPersistKey);

  const [query, setQuery] = useState("");
  const [internalIsThinking, setInternalIsThinking] = useState(false);
  const [panelWidthRem, setPanelWidthRem] = useState(CHAT_PANEL_DEFAULT_WIDTH_REM);
  const [isResizing, setIsResizing] = useState(false);
  /** Bumps to cancel in-flight phased assistant replies (new chat, switch thread, route change). */
  const phaseGenerationRef = useRef(0);
  const chatScrollRef = useRef<HTMLDivElement | null>(null);
  const [chatFade, setChatFade] = useState({ top: false, bottom: false });

  const messages = storedMessages;
  const isThinking = exploreOnSend ? exploreThinking : internalIsThinking;

  const displayThreadMessages = useMemo(
    () => storedMessages.filter((m) => !m.dashboardData),
    [storedMessages],
  );

  const assistantReplyInFlight = useMemo(() => {
    const last = displayThreadMessages[displayThreadMessages.length - 1];
    if (last?.role !== "assistant") return false;
    if (last.isTypingContent) return true;
    if (!(last.content ?? "").trim()) return true;
    const steps = last.toolSteps;
    return !!(steps && steps.some((s) => s.status === "running"));
  }, [displayThreadMessages]);

  // Explore keeps `isThinking` true until the phased runner fully settles; the thread already
  // reflects idle via `assistantReplyInFlight` once typing finishes — don’t hold the stop icon.
  const showComposerStop =
    assistantReplyInFlight || (!exploreOnSend && isThinking);
  const canSend = query.trim().length > 0;

  const updateFadeForElement = useCallback(
    (
      el: HTMLDivElement | null,
      setter: Dispatch<SetStateAction<{ top: boolean; bottom: boolean }>>,
    ) => {
      if (!el) return;
      const maxScroll = Math.max(0, el.scrollHeight - el.clientHeight);
      const topVisible = el.scrollTop > 1;
      const bottomVisible = el.scrollTop < maxScroll - 1;
      setter((prev) =>
        prev.top === topVisible && prev.bottom === bottomVisible
          ? prev
          : { top: topVisible, bottom: bottomVisible },
      );
    },
    [],
  );

  useEffect(() => {
    const raf = requestAnimationFrame(() => {
      updateFadeForElement(chatScrollRef.current, setChatFade);
    });
    return () => cancelAnimationFrame(raf);
  }, [messages.length, isThinking, updateFadeForElement]);

  const routeContextKey = `${dashboardId ?? ""}|${sourceOotbId ?? ""}|${assistantPersistKey}`;
  const prevRouteContextKeyRef = useRef(routeContextKey);
  useEffect(() => {
    if (prevRouteContextKeyRef.current !== routeContextKey) {
      prevRouteContextKeyRef.current = routeContextKey;
      phaseGenerationRef.current += 1;
      setQuery("");
      setInternalIsThinking(false);
    }
  }, [routeContextKey]);

  useEffect(() => {
    const handler = (e: Event) => {
      if (isExploreHome) return;
      const detail = (e as CustomEvent<CreateAIAgentInChatDetail>).detail;
      if (!detail?.sourceKey || !detail.scopeTitle?.trim() || !detail.agentId) return;

      phaseGenerationRef.current += 1;
      const gen = phaseGenerationRef.current;

      // Global assistant is append-only until explicit reset.
      if (!detail.appendToCurrentConversation && !isGlobalAssistantThread) {
        dashboardChat.clearMessages(assistantPersistKey);
      }

      const scope = detail.scopeTitle.trim();
      const userText = `Create AI Agent: ${scope}`;
      const userMessage: ChatMessage = {
        id: crypto.randomUUID(),
        role: "user",
        content: userText,
        timestamp: new Date(),
      };
      dashboardChat.appendMessage(assistantPersistKey, userMessage);

      const assistantId = crypto.randomUUID();
      const finalPayload = buildCreateAIAgentReplyPayload(scope, {
        ootbTypeId: detail.ootbTypeId ?? ootbTypeId,
        pageLabel: pageContextLabel?.trim() || undefined,
        pagePath: `${location.pathname}${location.search}`,
      });
      const stub: ChatMessage = {
        id: assistantId,
        role: "assistant",
        content: "",
        timestamp: new Date(),
      };
      dashboardChat.appendMessage(assistantPersistKey, stub);

      void runPhasedAssistantReply({
        final: finalPayload,
        stepMs: AI_AGENT_JOB_STEP_MS,
        isCancelled: () => gen !== phaseGenerationRef.current,
        patch: (partial) => {
          if (gen !== phaseGenerationRef.current) return;
          dashboardChat.patchMessage(assistantPersistKey, assistantId, partial);
          if (partial.toolSteps && partial.toolSteps.length > 0) {
            const runningIdx = partial.toolSteps.findIndex((s) => s.status === "running");
            const step = runningIdx >= 0 ? runningIdx + 1 : partial.toolSteps.length;
            window.dispatchEvent(
              new CustomEvent(CREATE_AI_AGENT_IN_CHAT_PROGRESS_EVENT, {
                detail: { sourceKey: detail.sourceKey, agentId: detail.agentId, step },
              }),
            );
          }
        },
      }).then(() => {
        const cancelled = gen !== phaseGenerationRef.current;
        if (!cancelled) {
          dashboardChat.patchMessage(assistantPersistKey, assistantId, {
            createAgentView: { scopeTitle: scope, agentId: detail.agentId },
          });
        }
        window.dispatchEvent(
          new CustomEvent(CREATE_AI_AGENT_IN_CHAT_FINISHED_EVENT, {
            detail: {
              sourceKey: detail.sourceKey,
              scopeTitle: scope,
              agentId: detail.agentId,
              cancelled,
            },
          }),
        );
      });
    };

    window.addEventListener(CREATE_AI_AGENT_IN_CHAT_EVENT, handler as EventListener);
    return () => window.removeEventListener(CREATE_AI_AGENT_IN_CHAT_EVENT, handler as EventListener);
  }, [
    isExploreHome,
    dashboardChat,
    assistantPersistKey,
    isGlobalAssistantThread,
    ootbTypeId,
    pageContextLabel,
    location.pathname,
    location.search,
  ]);

  const startOpportunityInvestigation = useCallback(
    (raw: StartOpportunityInvestigationChatDetail | null | undefined) => {
      const prompt = raw?.prompt?.trim();
      if (!prompt) return;

      const detail: StartOpportunityInvestigationChatDetail = {
        prompt,
        conversationTitle:
          raw?.conversationTitle?.trim() || conversationNameFromPrompt(prompt),
        ootbTypeId: raw?.ootbTypeId || "automation-opportunities",
        pageLabel: raw?.pageLabel || "Automation Opportunities",
        pagePath: raw?.pagePath || `${ROUTES.AUTOMATION_OPPORTUNITIES}#top-opportunities`,
      };

      phaseGenerationRef.current += 1;
      const gen = phaseGenerationRef.current;
      setInternalIsThinking(true);

      if (!isGlobalAssistantThread) {
        dashboardChat.clearMessages(assistantPersistKey);
      }

      const userMessage: ChatMessage = {
        id: crypto.randomUUID(),
        role: "user",
        content: detail.prompt,
        timestamp: new Date(),
      };
      dashboardChat.appendMessage(assistantPersistKey, userMessage);

      const assistantId = crypto.randomUUID();
      const finalPayload = buildOpportunityInvestigationAssistantPayload(
        detail,
        generateAIResponse,
      );
      const stub: ChatMessage = {
        id: assistantId,
        role: "assistant",
        content: "",
        timestamp: new Date(),
      };
      dashboardChat.appendMessage(assistantPersistKey, stub);

      void runPhasedAssistantReply({
        final: finalPayload,
        isCancelled: () => gen !== phaseGenerationRef.current,
        patch: (partial) => {
          if (gen !== phaseGenerationRef.current) return;
          dashboardChat.patchMessage(assistantPersistKey, assistantId, partial);
        },
      }).finally(() => {
        if (gen === phaseGenerationRef.current) {
          setInternalIsThinking(false);
        }
      });
    },
    [dashboardChat, assistantPersistKey, isGlobalAssistantThread],
  );

  useEffect(() => {
    const handler = (e: Event) => {
      startOpportunityInvestigation(
        (e as CustomEvent<StartOpportunityInvestigationChatDetail>).detail,
      );
    };

    window.addEventListener(
      START_OPPORTUNITY_INVESTIGATION_CHAT_EVENT,
      handler as EventListener,
    );
    return () =>
      window.removeEventListener(
        START_OPPORTUNITY_INVESTIGATION_CHAT_EVENT,
        handler as EventListener,
      );
  }, [startOpportunityInvestigation]);

  useEffect(() => {
    if (location.pathname !== ROUTES.AUTOMATION_OPPORTUNITIES) return;
    let raw: string | null = null;
    try {
      raw = sessionStorage.getItem(PENDING_OPPORTUNITY_INVESTIGATION_CHAT_STORAGE_KEY);
    } catch {
      return;
    }
    if (!raw) return;

    let parsed: unknown;
    try {
      parsed = JSON.parse(raw);
    } catch {
      try {
        sessionStorage.removeItem(PENDING_OPPORTUNITY_INVESTIGATION_CHAT_STORAGE_KEY);
      } catch {
        // ignore
      }
      return;
    }

    const queuedAt =
      typeof parsed === "object" && parsed !== null && "queuedAt" in parsed
        ? Number((parsed as { queuedAt?: unknown }).queuedAt)
        : Number.NaN;
    if (Number.isFinite(queuedAt) && Date.now() - queuedAt > 60_000) {
      try {
        sessionStorage.removeItem(PENDING_OPPORTUNITY_INVESTIGATION_CHAT_STORAGE_KEY);
      } catch {
        // ignore
      }
      return;
    }

    try {
      sessionStorage.removeItem(PENDING_OPPORTUNITY_INVESTIGATION_CHAT_STORAGE_KEY);
    } catch {
      // ignore
    }
    startOpportunityInvestigation(parsed as StartOpportunityInvestigationChatDetail);
  }, [location.pathname, startOpportunityInvestigation]);

  const chatVoice = useVoiceInput({
    onTranscript: (text) => {
      setQuery((prev) => (prev ? prev + " " : "") + text);
    },
    onError: (error) => {
      if (error === "not-allowed") {
        toast.error("Microphone access denied", {
          description: "Please allow microphone access in your browser settings and try again.",
        });
      } else if (error === "no-speech") {
        toast.info("No speech detected", {
          description: "Please try again and speak into your microphone.",
        });
      } else if (error === "network") {
        toast.error("Network error", {
          description: "Speech recognition requires an internet connection.",
        });
      }
    },
  });

  useEffect(() => {
    const onExploreUserTurn = () => {
      chatVoice.stop();
    };
    window.addEventListener(EXPLORE_THREAD_USER_TURN_EVENT, onExploreUserTurn);
    return () => window.removeEventListener(EXPLORE_THREAD_USER_TURN_EVENT, onExploreUserTurn);
  }, [chatVoice.stop]);

  // Keep one consistent, general set of suggested questions across the app.
  const suggestedQuestions = useMemo(() => {
    return defaultSuggestedQuestions;
  }, []);

  const showSuggestedPromptChips = useMemo(() => {
    const thread = messages.filter((m) => !m.dashboardData);
    return thread.length === 0 && !isThinking;
  }, [messages, isThinking]);

  const handleResize = useCallback((deltaPx: number) => {
    const deltaRem = deltaPx / REM_PX;
    setPanelWidthRem((prev) =>
      Math.min(CHAT_PANEL_MAX_WIDTH_REM, Math.max(CHAT_PANEL_MIN_WIDTH_REM, prev + deltaRem)),
    );
  }, []);

  const handleResizeReset = useCallback(() => {
    setPanelWidthRem(CHAT_PANEL_DEFAULT_WIDTH_REM);
  }, []);

  const handleResizeStart = useCallback(() => {
    setIsResizing(true);
    onAssistantPanelResizeStart?.();
  }, [onAssistantPanelResizeStart]);
  const handleResizeEnd = useCallback(() => {
    setIsResizing(false);
    onAssistantPanelResizeEnd?.();
  }, [onAssistantPanelResizeEnd]);

  const appendUserMessageWithReply = useCallback(
    (rawMessage: string) => {
      const message = rawMessage.trim();
      if (!message) return;

      const userMessage: ChatMessage = {
        id: crypto.randomUUID(),
        role: "user",
        content: message,
        timestamp: new Date(),
      };
      dashboardChat.appendMessage(assistantPersistKey, userMessage);
      setInternalIsThinking(true);

      const gen = ++phaseGenerationRef.current;
      const assistantId = crypto.randomUUID();
      const finalPayload = generateAIResponse(message, ootbTypeId, {
        pageLabel: pageContextLabel?.trim() || undefined,
        pagePath: `${location.pathname}${location.search}`,
      });
      const stub: ChatMessage = {
        id: assistantId,
        role: "assistant",
        content: "",
        timestamp: new Date(),
      };
      dashboardChat.appendMessage(assistantPersistKey, stub);

      void runPhasedAssistantReply({
        final: finalPayload,
        isCancelled: () => gen !== phaseGenerationRef.current,
        patch: (partial) => {
          if (gen !== phaseGenerationRef.current) return;
          dashboardChat.patchMessage(assistantPersistKey, assistantId, partial);
        },
      }).finally(() => {
        if (gen === phaseGenerationRef.current) {
          setInternalIsThinking(false);
        }
      });
    },
    [
      dashboardChat,
      assistantPersistKey,
      ootbTypeId,
      pageContextLabel,
      location.pathname,
      location.search,
    ],
  );

  const handleSend = (message: string = query) => {
    if (!message.trim()) return;

    chatVoice.stop();
    setQuery("");

    if (exploreOnSend) {
      exploreOnSend(message.trim());
      return;
    }

    appendUserMessageWithReply(message);
  };

  const handleStopAssistant = useCallback(() => {
    if (exploreOnSend && exploreCancelInFlight) {
      exploreCancelInFlight();
      return;
    }
    phaseGenerationRef.current += 1;
    setInternalIsThinking(false);
    const threadMsgs = storedMessages.filter((m) => !m.dashboardData);
    const last = threadMsgs[threadMsgs.length - 1];
    if (last?.role === "assistant") {
      dashboardChat.patchMessage(assistantPersistKey, last.id, {
        content: last.content.trim() ? last.content : "Stopped.",
        isTypingContent: false,
        toolSteps: undefined,
      });
    }
  }, [
    exploreOnSend,
    exploreCancelInFlight,
    assistantPersistKey,
    storedMessages,
    dashboardChat,
  ]);

  const handleResetChat = useCallback(() => {
    phaseGenerationRef.current += 1;
    setInternalIsThinking(false);
    setQuery("");
    if (isGlobalAssistantThread) {
      dashboardChat.startNewGlobalAiDraft();
      return;
    }
    dashboardChat.clearMessages(assistantPersistKey);
  }, [dashboardChat, assistantPersistKey, isGlobalAssistantThread]);

  return (
    <div
      data-chat-panel-root="true"
      className="h-full flex flex-col bg-white relative shrink-0"
      style={{ width: `${panelWidthRem}rem`, transition: isResizing ? 'none' : 'width 200ms ease' }}
    >
      {/* Resize handle on left edge */}
      <ResizeHandle
        side="left"
        onResize={handleResize}
        onReset={handleResizeReset}
        onResizeStart={handleResizeStart}
        onResizeEnd={handleResizeEnd}
      />

      <div className="flex-1 min-h-0 flex flex-col min-w-0">
        <div className="shrink-0 px-4 flex items-center justify-between gap-2 h-[60px] min-w-0 bg-white relative z-30">
          <div className="min-w-0 flex-1 flex items-center gap-2">
            <Sparkles className="h-4 w-4 shrink-0 text-primary" aria-hidden />
            <h2 className="truncate text-sm font-semibold text-foreground">AI Assistant</h2>
          </div>
            {showResetButton ? (
              <div className="flex items-center gap-0.5 shrink-0">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleResetChat} aria-label="Reset Chat">
                      <RotateCcw className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="bottom">Reset Chat</TooltipContent>
                </Tooltip>
              </div>
            ) : null}
        </div>

        <div className="flex-1 min-h-0 relative overflow-hidden min-w-0">
          <div
            ref={chatScrollRef}
            onScroll={() => updateFadeForElement(chatScrollRef.current, setChatFade)}
            className="h-full overflow-y-auto overflow-x-hidden px-4 py-2"
          >
            <ThreadView messages={messages} isThinking={isThinking} />
          </div>
          <div
            className={`pointer-events-none absolute inset-x-0 top-0 z-10 h-16 bg-gradient-to-b from-white from-[10%] via-white/85 via-40% to-white/0 to-100% transition-opacity ${chatFade.top ? "opacity-100" : "opacity-0"}`}
            aria-hidden
          />
          <div
            className={`pointer-events-none absolute inset-x-0 bottom-0 z-10 h-20 bg-gradient-to-t from-white from-[10%] via-white/85 via-40% to-white/0 to-100% transition-opacity ${chatFade.bottom ? "opacity-100" : "opacity-0"}`}
            aria-hidden
          />
        </div>

        <div className="shrink-0 bg-white p-4 relative z-30">
            {showSuggestedPromptChips && suggestedQuestions.length > 0 ? (
              <div
                className="mb-2 flex flex-wrap gap-2"
                role="group"
                aria-label="Suggested prompts"
              >
                {suggestedQuestions.map((question, index) => (
                  <Badge
                    key={index}
                    asChild
                    variant="outline"
                    className={cn(
                      "h-auto max-w-full min-w-0 cursor-pointer rounded-full bg-background py-1.5 pl-3 pr-3 text-left text-xs font-normal shadow-none transition-colors",
                      "hover:bg-muted/40",
                      "focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                    )}
                  >
                    <button
                      type="button"
                      className="inline-flex min-w-0 max-w-full text-left outline-none"
                      onClick={() => handleSend(question)}
                    >
                      <span className="min-w-0 whitespace-normal text-left leading-snug">
                        {question}
                      </span>
                    </button>
                  </Badge>
                ))}
              </div>
            ) : null}
            <section className="rounded-2xl border bg-background text-foreground transition-shadow focus-within:border-ring focus-within:ring-[3px] focus-within:ring-ring/20">
              <div className="p-2">
                <div className="flex items-start gap-2">
                  <Textarea
                    aria-label="Ask AI assistant a question"
                    placeholder={placeholder || "Ask a question\u2026"}
                    value={query}
                    onChange={(e) => {
                      setQuery(e.target.value);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey && query.trim()) {
                        e.preventDefault();
                        handleSend();
                      }
                    }}
                    rows={1}
                    className="min-h-9 max-h-40 flex-1 overflow-y-auto border-0 focus-visible:ring-0 shadow-none text-sm px-1 py-2"
                  />
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        size="icon"
                        aria-label={showComposerStop ? "Stop generating response" : "Send message"}
                        variant={
                          showComposerStop
                            ? "destructive"
                            : canSend
                              ? "default"
                              : "outline"
                        }
                        disabled={!showComposerStop && !canSend}
                        className="rounded-lg shrink-0"
                        onClick={() => {
                          if (showComposerStop) {
                            handleStopAssistant();
                          } else if (canSend) {
                            handleSend();
                          }
                        }}
                      >
                        {showComposerStop ? (
                          <Square className="h-4 w-4" />
                        ) : (
                          <ArrowUp className="h-4 w-4" />
                        )}
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent side="top">
                      {showComposerStop
                        ? "Stop generating"
                        : canSend
                          ? "Send"
                          : "Enter a message to send"}
                    </TooltipContent>
                  </Tooltip>
                </div>
              </div>
            </section>
          </div>
        </div>
    </div>
  );
}
