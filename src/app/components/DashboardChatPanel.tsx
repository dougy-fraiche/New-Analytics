import { useState, useCallback, useRef, useEffect, useMemo } from "react";
import { Plus, ArrowRight, Mic, Square, Loader2, Sparkles, X, Upload, Image, Paperclip, ChevronLeft, MessageSquare, Trash2, SquarePen, MoreVertical, Pencil } from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Textarea } from "./ui/textarea";
import { ResizeHandle } from "./ResizeHandle";
import { useVoiceInput } from "../hooks/useVoiceInput";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "./ui/empty";
import { toast } from "sonner";
import { useDashboardChat, useDashboardMessages, useDashboardThreads, ChatStore, type ChatMessage, type ChatThread } from "../contexts/DashboardChatContext";
import { getChartIcon } from "./ChartVariants";
import { Tooltip, TooltipContent, TooltipTrigger } from "./ui/tooltip";

const WIDGET_THREAD_CREATED_EVENT = "widget-ai-thread-created";

interface DashboardChatPanelProps {
  /** Dashboard ID used for persistence key (e.g. route dashboardId or composite key) */
  dashboardId?: string;
  /**
   * Source OOTB dashboard type ID — used to resolve suggested prompts and AI
   * response context for saved/custom dashboards that don't have an OOTB dashboardId.
   * Falls back to dashboardId when not provided.
   */
  sourceOotbId?: string;
  // Optional props for external control (Explore page)
  externalMessages?: ChatMessage[];
  onSendMessage?: (message: string) => void;
  externalIsThinking?: boolean;
  placeholder?: string;
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
  "tool-usage": [
    "Which tools are invoked most often?",
    "Show tool latency trends",
    "What's the tool success vs failure rate?",
    "Compare tool usage across AI agents",
  ],
  "agent-ops": [
    "What's the current agent uptime?",
    "Show throughput trends this week",
    "Are there any agents with degraded health?",
    "Compare operational metrics across regions",
  ],
  "self-improving-agents": [
    "How many self-learning loops ran this week?",
    "Show model improvement trends",
    "What feedback was most impactful?",
    "Compare agent performance before vs after learning",
  ],
  "ai-agent-vs-agent": [
    "How does AI agent resolution compare to human agents?",
    "Show handling time comparison trends",
    "Which topics are better handled by AI vs humans?",
    "Compare satisfaction scores between AI and agents",
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
  "What are the key trends in this dashboard?",
  "Show me the most important metrics",
  "Compare with last month",
  "Export this data",
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
  "tool-usage": (msg) => {
    if (msg.includes("most") || msg.includes("often") || msg.includes("frequently")) return "The most invoked tools are: CRM Lookup (34%), Knowledge Search (28%), Order Status API (19%), and Ticket Creator (12%). CRM Lookup has increased 20% this month. Would you like latency details for any tool?";
    if (msg.includes("latency") || msg.includes("slow")) return "Average tool latency is 245ms. The slowest is CRM Lookup at 380ms (up from 310ms last month), while Knowledge Search is fastest at 120ms. Want me to flag tools exceeding SLA thresholds?";
    if (msg.includes("success") || msg.includes("failure") || msg.includes("rate")) return "Tool success rates: Knowledge Search 99.2%, Ticket Creator 98.7%, Order Status API 97.1%, CRM Lookup 94.8%. CRM Lookup failures are mostly timeout-related (3.1%) and auth token expiry (1.9%). The ops team has been alerted about the CRM connector. Want to see the trend?";
    if (msg.includes("compare") || msg.includes("agent") || msg.includes("across")) return "Tool usage by AI agent: CustomerBot uses CRM Lookup most heavily (42% of its calls), SalesBot relies on Product Catalog API (38%), and SupportBot favors Knowledge Search (51%). Different agents show distinct tool preference patterns based on their conversation domains.";
    return null;
  },
  "agent-ops": (msg) => {
    if (msg.includes("uptime") || msg.includes("health")) return "Current agent fleet uptime: 99.7% (30-day rolling). Two agents experienced brief degradation last week \u2014 SalesBot had a 12-minute outage on Feb 18 (dependency failure) and TechSupportBot had elevated latency for ~25 minutes on Feb 20 (model warm-up). All agents are healthy now.";
    if (msg.includes("throughput") || msg.includes("trend")) return "Weekly throughput: 142,300 conversations processed, up 9% from last week. Peak throughput hit 892 concurrent conversations on Tuesday at 11:15 AM EST. Average response time is 1.8s, within the 2.5s SLA. Want a breakdown by agent or hour?";
    if (msg.includes("degraded") || msg.includes("alert")) return "No agents are currently in degraded state. However, TechSupportBot is approaching its memory threshold (82% utilized) and may need a restart within 48 hours. BillingBot's p99 latency has crept from 2.1s to 2.4s this week \u2014 still within SLA but trending upward. Want to set alerting thresholds?";
    if (msg.includes("compare") || msg.includes("region")) return "Regional breakdown: US-East handles 41% of traffic (avg 1.6s latency), US-West 28% (1.7s), EU-West 22% (1.9s), APAC 9% (2.2s). APAC latency is elevated due to model serving distance; edge deployment planned for next sprint.";
    return null;
  },
  "self-improving-agents": (msg) => {
    if (msg.includes("loop") || msg.includes("learning") || msg.includes("how many")) return "This week: 47 self-learning loops completed across 5 agents. CustomerBot ran the most (14 loops), incorporating 2,340 feedback signals. Overall improvement yield: 72% of loops produced measurable accuracy gains, up from 63% last month. Want to see loop outcomes by agent?";
    if (msg.includes("improvement") || msg.includes("trend") || msg.includes("model")) return "Model improvement trends: aggregate accuracy has improved 2.4% this quarter through self-learning. The biggest single-loop gain was CustomerBot's intent model (+1.8% after incorporating 1,200 correction signals). Diminishing returns are appearing for mature agents \u2014 SalesBot's last 3 loops yielded <0.1% each.";
    if (msg.includes("feedback") || msg.includes("impactful")) return "Most impactful feedback sources: Agent corrections (42% of improvement signal), customer satisfaction ratings (28%), conversation outcome labels (19%), and explicit thumbs-up/down (11%). Agent corrections are 3x more impactful per signal than ratings. Want to see the feedback funnel?";
    if (msg.includes("before") || msg.includes("after") || msg.includes("compare")) return "Before/after learning (last 30 days): CustomerBot accuracy 89.1% \u2192 91.8%, SupportBot 86.4% \u2192 88.2%, SalesBot 91.2% \u2192 91.5% (plateau). Average resolution turns decreased by 0.4 across all learning agents. Customer satisfaction improved 1.7 points post-learning.";
    return null;
  },
  "ai-agent-vs-agent": (msg) => {
    if (msg.includes("resolution") || msg.includes("compare")) return "AI agents resolve 68% of conversations without human escalation, with a 4.1/5 satisfaction score. Human agents handle escalated/complex cases with 4.6/5 satisfaction. Combined, the hybrid model resolves 94% of conversations. AI resolution rate has improved 12% this quarter.";
    if (msg.includes("handling time") || msg.includes("time")) return "Average handling time: AI agents 2.3 minutes, human agents 8.7 minutes. AI-to-human handoffs add 1.4 minutes of transition overhead. When AI pre-processes before handoff, human handle time drops to 6.2 minutes. Total cost per conversation: AI $0.12, human $4.80, hybrid $1.95.";
    if (msg.includes("topic") || msg.includes("better") || msg.includes("handled")) return "AI excels at: password resets (97% resolution), order status (95%), billing FAQ (93%), and returns processing (89%). Humans outperform on: complex complaints (AI 34% vs human 78%), contract negotiations, multi-product technical issues, and emotionally sensitive situations. Want the full topic comparison matrix?";
    if (msg.includes("satisfaction") || msg.includes("score")) return "CSAT comparison: AI-only conversations 4.1/5, human-only 4.6/5, AI-with-handoff 4.3/5. Interestingly, AI scores higher than humans on speed-related satisfaction (4.7 vs 3.9) while humans lead on empathy (4.8 vs 3.6) and complex problem-solving (4.7 vs 3.2).";
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

function generateAIResponse(userMessage: string, ootbTypeId?: string): string {
  const lowerMessage = userMessage.toLowerCase();

  // Try dashboard-specific handler first
  if (ootbTypeId) {
    const handler = dashboardResponseHandlers[ootbTypeId];
    if (handler) {
      const specific = handler(lowerMessage);
      if (specific) return specific;
    }
  }

  // Generic fallbacks
  if (lowerMessage.includes("escalation") || lowerMessage.includes("trend")) {
    return "Based on the current dashboard data, I can see that escalation rates have increased by 8% over the last month. The primary drivers appear to be technical support issues. Would you like me to filter the dashboard to show specific team performance or break this down by product category?";
  }

  if (lowerMessage.includes("filter") || lowerMessage.includes("show")) {
    return "I can help you filter this dashboard. You can view data by team (Tier 1, Tier 2, Technical), by time period (7d, 30d, 90d, 12m), or by product. What specific view would you like to see?";
  }

  if (lowerMessage.includes("export") || lowerMessage.includes("download")) {
    return "I can help you export this data. You can download the current view as a PDF report or export the raw data as CSV. The export will include all currently applied filters. Which format would you prefer?";
  }

  if (lowerMessage.includes("why") || lowerMessage.includes("reason")) {
    return "Looking at the patterns in this dashboard, the main contributing factors appear to be increased complexity in technical queries and a recent product update that generated support tickets. I can create a detailed analysis if you'd like to investigate further.";
  }

  if (lowerMessage.includes("compare") || lowerMessage.includes("last month")) {
    return "Comparing to last month: overall volume is up 11%, resolution time improved by 8%, and satisfaction remained steady at 94%. The most notable shift is a 15% increase in AI-handled conversations, which is reducing average cost per interaction. Want me to visualize the month-over-month delta?";
  }

  if (lowerMessage.includes("metric") || lowerMessage.includes("important") || lowerMessage.includes("key")) {
    return "The key metrics on this dashboard are trending positively overall. Resolution rate is at 87% (+2%), average handle time is 4.3h (-8%), and satisfaction is 94% (+2%). The area that needs attention is the escalation rate, which has increased 12%. Would you like me to dig into the escalation drivers?";
  }

  return "I'm here to help you understand this dashboard data. I can explain metrics, suggest filters, identify trends, or help you export specific views. What would you like to know more about?";
}

// ─── Panel dimensions ────────────────────────────────────────────────────────

const CHAT_PANEL_DEFAULT_WIDTH = 320;
const CHAT_PANEL_MIN_WIDTH = 280;
const CHAT_PANEL_MAX_WIDTH = 600;

// ─── Helper: relative time label ────────────────────────────────────────────

function relativeTime(date: Date): string {
  const now = Date.now();
  const diff = now - date.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

// ─── Sub-components ──────────────────────────────────────────────────────────

/** Home view: thread list */
function HomeView({
  threads,
  onSelectThread,
  onDeleteThread,
  onNewThread,
}: {
  threads: ChatThread[];
  onSelectThread: (threadId: string) => void;
  onDeleteThread: (threadId: string) => void;
  onNewThread: () => void;
}) {
  const sortedThreads = useMemo(
    () => [...threads].sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime()),
    [threads],
  );

  if (sortedThreads.length === 0) {
    return (
      <Empty className="h-full min-h-0 border-none rounded-none bg-transparent">
        <EmptyHeader>
          <EmptyMedia className="bg-primary/10 [&>svg]:text-primary">
            <Sparkles />
          </EmptyMedia>
          <EmptyTitle>AI Assistant</EmptyTitle>
          <EmptyDescription className="max-w-[280px]">
            Ask questions about this dashboard, explore trends, or request specific insights.
          </EmptyDescription>
        </EmptyHeader>
        <EmptyContent>
          <Button size="sm" onClick={onNewThread}>
            <SquarePen className="h-4 w-4 mr-2" />
            Start a new thread
          </Button>
        </EmptyContent>
      </Empty>
    );
  }

  return (
    <div className="space-y-1">
      <p className="text-xs font-medium text-muted-foreground mb-2">Threads</p>
      {sortedThreads.map((thread) => (
        <div
          key={thread.id}
          className="group relative flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-2 transition-colors hover:bg-accent cursor-pointer has-[button.thread-delete-btn:focus-visible]:[&_.thread-title-wrap]:pr-8"
          onClick={() => onSelectThread(thread.id)}
        >
          <MessageSquare className="h-4 w-4 shrink-0 text-muted-foreground" />
          <div className="min-w-0 flex-1">
            <div className="thread-title-wrap min-w-0 pr-0 transition-[padding] duration-150 ease-out group-hover:pr-8">
              <p className="truncate whitespace-nowrap text-sm text-foreground">
                {thread.title}
              </p>
            </div>
            <p className="text-xs text-muted-foreground">{relativeTime(thread.updatedAt)}</p>
          </div>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="thread-delete-btn pointer-events-none absolute right-2 top-1/2 z-10 h-6 w-6 -translate-y-1/2 opacity-0 transition-opacity group-hover:pointer-events-auto group-hover:opacity-100 focus-visible:pointer-events-auto focus-visible:opacity-100"
                aria-label={`Delete thread ${thread.title}`}
                onClick={(e) => {
                  e.stopPropagation();
                  onDeleteThread(thread.id);
                }}
              >
                <Trash2 className="h-3 w-3 text-muted-foreground" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="left">Delete thread</TooltipContent>
          </Tooltip>
        </div>
      ))}
    </div>
  );
}

/** Thread view: message list */
function ThreadView({
  messages,
  isThinking,
  suggestedQuestions,
  onSendSuggestion,
}: {
  messages: ChatMessage[];
  isThinking: boolean;
  suggestedQuestions?: string[];
  onSendSuggestion?: (msg: string) => void;
}) {
  const displayMessages = messages.filter((msg) => !msg.dashboardData);
  const bottomRef = useRef<HTMLDivElement>(null);
  const sourceContext = useMemo(
    () => displayMessages.find((msg) => msg.role === "user" && !!msg.widgetRef),
    [displayMessages],
  );
  const jumpToSourceCard = useCallback((widgetRef: string, anchorId?: string) => {
    const resolveTargetElement = (): HTMLElement | null => {
      if (anchorId) {
        const byId = document.getElementById(anchorId);
        if (byId) return byId;
      }

      const normalizedRef = widgetRef.replace(/^Action:\s*/i, "").trim().toLowerCase();
      const titleNodes = Array.from(
        document.querySelectorAll<HTMLElement>(
          "[data-slot='card'] h1, [data-slot='card'] h2, [data-slot='card'] h3, [data-slot='card'] [data-slot='card-title']",
        ),
      );

      for (const node of titleNodes) {
        // Skip matches inside the chat panel itself.
        if (node.closest("[data-chat-panel-root='true']")) continue;
        const text = node.textContent?.trim().toLowerCase();
        if (!text) continue;
        if (text === normalizedRef || text.includes(normalizedRef) || normalizedRef.includes(text)) {
          return node.closest("[data-slot='card']") as HTMLElement | null;
        }
      }

      return null;
    };

    const el = resolveTargetElement();
    if (!el) {
      toast.info("Source card is not available in this view yet.");
      return;
    }
    el.scrollIntoView({ behavior: "smooth", block: "center" });
    el.classList.add("ring-2", "ring-primary/50");
    window.setTimeout(() => {
      el.classList.remove("ring-2", "ring-primary/50");
    }, 1200);
  }, []);

  // Auto-scroll to bottom when messages change or thinking starts
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [displayMessages.length, isThinking]);

  // Empty thread state with suggested prompts
  if (displayMessages.length === 0 && !isThinking) {
    return (
      <div className="space-y-4">
        <div className="text-sm text-muted-foreground mb-4">
          Ask questions about this dashboard or request specific insights.
        </div>
        {suggestedQuestions && suggestedQuestions.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs font-medium text-muted-foreground mb-2">Suggested Questions</p>
            {suggestedQuestions.map((question, index) => (
              <Button
                key={index}
                variant="outline"
                size="sm"
                className="w-full justify-start text-left h-auto py-2 px-3 whitespace-normal"
                onClick={() => onSendSuggestion?.(question)}
              >
                <span className="text-sm">{question}</span>
              </Button>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {sourceContext && (
        <div className="rounded-lg border border-border bg-white dark:bg-background p-3">
          <div className="flex items-center justify-between gap-3 mb-1">
            <p className="text-[11px] uppercase tracking-wide text-muted-foreground">
              Source action
            </p>
            <Button
              variant="ghost"
              size="sm"
              className="h-6 px-2 text-[10px] shrink-0"
              onClick={() => {
                jumpToSourceCard(sourceContext.widgetRef!, sourceContext.widgetAnchorId);
              }}
            >
              View source
            </Button>
          </div>
          <div className="min-w-0">
              <p className="text-sm font-medium truncate">{sourceContext.widgetRef}</p>
              {sourceContext.widgetKpiLabel ? (
                <p className="text-xs text-muted-foreground mt-0.5 truncate">
                  Selected:{" "}
                  <span className="font-medium text-foreground">{sourceContext.widgetKpiLabel}</span>
                </p>
              ) : null}
              <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                {sourceContext.content}
              </p>
          </div>
        </div>
      )}

      {displayMessages.map((msg) => (
        <div
          key={msg.id}
          className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
        >
          {msg.role === "user" ? (
            <div className="max-w-[85%] bg-primary text-primary-foreground rounded-lg px-3 py-2">
              {msg.widgetRef && !sourceContext && (
                <button
                  type="button"
                  className="inline-flex flex-col items-start gap-0.5 text-left text-xs px-1.5 py-0.5 rounded-md mb-1.5 bg-primary-foreground/15 text-primary-foreground/85 hover:bg-primary-foreground/25 transition-colors max-w-full"
                  onClick={() => {
                    jumpToSourceCard(msg.widgetRef!, msg.widgetAnchorId);
                  }}
                >
                  <span className="inline-flex items-center gap-1 min-w-0">
                    {(() => { const IconComp = msg.widgetIconType ? getChartIcon(msg.widgetIconType as any) : null; return IconComp ? <IconComp className="h-3 w-3 shrink-0" /> : null; })()}
                    <span className="truncate font-medium">{msg.widgetRef}</span>
                  </span>
                  {msg.widgetKpiLabel ? (
                    <span className="pl-0 text-[10px] opacity-90 truncate w-full">
                      Selected: {msg.widgetKpiLabel}
                    </span>
                  ) : null}
                </button>
              )}
              <p className="text-sm">{msg.content}</p>
            </div>
          ) : (
            <div className="w-full">
              {msg.widgetRef && !sourceContext && (
                <button
                  type="button"
                  className="inline-flex flex-col items-start gap-0.5 text-left text-xs px-1.5 py-0.5 rounded-md mb-1.5 bg-muted text-muted-foreground hover:bg-muted/80 transition-colors max-w-full"
                  onClick={() => {
                    jumpToSourceCard(msg.widgetRef!, msg.widgetAnchorId);
                  }}
                >
                  <span className="inline-flex items-center gap-1 min-w-0">
                    {(() => { const IconComp = msg.widgetIconType ? getChartIcon(msg.widgetIconType as any) : null; return IconComp ? <IconComp className="h-3 w-3 shrink-0" /> : null; })()}
                    <span className="truncate font-medium">{msg.widgetRef}</span>
                  </span>
                  {msg.widgetKpiLabel ? (
                    <span className="text-[10px] opacity-90 truncate w-full">
                      Selected: {msg.widgetKpiLabel}
                    </span>
                  ) : null}
                </button>
              )}
              <p className="text-sm">{msg.content}</p>
            </div>
          )}
        </div>
      ))}
      {isThinking && (
        <div className="flex justify-start">
          <div className="flex items-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
            <p className="text-sm text-muted-foreground">Analyzing...</p>
          </div>
        </div>
      )}
      <div ref={bottomRef} />
    </div>
  );
}

// ─── Component ───────────────────────────────────────────────────────────────

export function DashboardChatPanel({
  dashboardId,
  sourceOotbId,
  externalMessages,
  onSendMessage,
  externalIsThinking,
  placeholder,
}: DashboardChatPanelProps) {
  const dashboardChat = useDashboardChat();
  const store = dashboardChat._store;

  // The persistence key combines route context for uniqueness
  const persistKey = dashboardId ?? "__no_dashboard__";

  // The OOTB type used for prompts / AI responses: explicit sourceOotbId > dashboardId
  const ootbTypeId = sourceOotbId || dashboardId;

  // For external-control mode (Explore page), we skip persistence entirely
  const isExternalMode = !!externalMessages;

  // Thread support (internal mode only)
  const threads = useDashboardThreads(persistKey);
  const [activeThreadId, setActiveThreadId] = useState<string | null>(null);
  const [draftThreadId, setDraftThreadId] = useState<string | null>(null);

  // Compose the message key for the active thread
  const activeMessageKey = activeThreadId
    ? ChatStore.threadKey(persistKey, activeThreadId)
    : persistKey;

  // Persisted messages from context (only used in internal mode)
  const storedMessages = useDashboardMessages(activeMessageKey);
  const persistedMessages = isExternalMode ? [] : storedMessages;

  const [query, setQuery] = useState("");
  const [internalIsThinking, setInternalIsThinking] = useState(false);
  const [panelWidth, setPanelWidth] = useState(CHAT_PANEL_DEFAULT_WIDTH);
  const [isResizing, setIsResizing] = useState(false);
  const [renameThreadOpen, setRenameThreadOpen] = useState(false);
  const [renameThreadValue, setRenameThreadValue] = useState("");

  // When dashboardId changes, reset to home view
  const prevDashboardIdRef = useRef(dashboardId);
  useEffect(() => {
    if (prevDashboardIdRef.current !== dashboardId) {
      prevDashboardIdRef.current = dashboardId;
      setQuery("");
      setInternalIsThinking(false);
      setActiveThreadId(null);
    }
  }, [dashboardId]);

  // Open the newly created widget thread automatically (widget ask / OOTB prompt chips)
  useEffect(() => {
    if (isExternalMode) return;
    const onThreadCreated = (evt: Event) => {
      const e = evt as CustomEvent<{ persistKey?: string; threadId?: string }>;
      if (!e.detail?.persistKey || !e.detail?.threadId) return;
      if (e.detail.persistKey !== persistKey) return;
      setDraftThreadId(null);
      setActiveThreadId(e.detail.threadId);
    };
    window.addEventListener(WIDGET_THREAD_CREATED_EVENT, onThreadCreated as EventListener);
    return () => window.removeEventListener(WIDGET_THREAD_CREATED_EVENT, onThreadCreated as EventListener);
  }, [isExternalMode, persistKey]);

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

  // Use external messages if provided, otherwise use persisted messages
  const messages = isExternalMode ? externalMessages! : persistedMessages;
  const isThinking = externalIsThinking !== undefined ? externalIsThinking : internalIsThinking;

  // Resolve suggested questions: use ootbTypeId to look up, fallback to defaults
  const suggestedQuestions = useMemo(() => {
    if (ootbTypeId && dashboardSuggestedQuestions[ootbTypeId]) {
      return dashboardSuggestedQuestions[ootbTypeId];
    }
    return defaultSuggestedQuestions;
  }, [ootbTypeId]);

  const handleResize = useCallback((delta: number) => {
    setPanelWidth((prev) =>
      Math.min(CHAT_PANEL_MAX_WIDTH, Math.max(CHAT_PANEL_MIN_WIDTH, prev + delta)),
    );
  }, []);

  const handleResizeReset = useCallback(() => {
    setPanelWidth(CHAT_PANEL_DEFAULT_WIDTH);
  }, []);

  const handleResizeStart = useCallback(() => setIsResizing(true), []);
  const handleResizeEnd = useCallback(() => setIsResizing(false), []);

  /** Create a blank "New thread" and navigate to it (draft only — not persisted until first message) */
  const createBlankThread = useCallback(() => {
    const draftId = crypto.randomUUID();
    setActiveThreadId(draftId);
    setDraftThreadId(draftId);
    setQuery("");
    return { id: draftId };
  }, []);

  /** Send a message into the active thread, renaming it if it's the first message */
  const sendMessageToThread = useCallback(
    (threadId: string, message: string) => {
      const threadMsgKey = ChatStore.threadKey(persistKey, threadId);
      const existingMessages = dashboardChat.getMessages(threadMsgKey);

      // If this is a draft thread (not yet persisted), create it now in the store
      if (existingMessages.length === 0) {
        const title = message.length > 60 ? message.slice(0, 60) + "\u2026" : message;

        // Check if thread already exists in the store (non-draft case)
        const existing = dashboardChat.getThreads(persistKey).find((t) => t.id === threadId);
        if (!existing) {
          dashboardChat.createThread(persistKey, title, threadId);
        } else {
          dashboardChat.renameThread(persistKey, threadId, title);
        }
        setDraftThreadId(null);
      }

      const userMessage: ChatMessage = {
        id: crypto.randomUUID(),
        role: "user",
        content: message,
        timestamp: new Date(),
      };
      dashboardChat.appendMessage(threadMsgKey, userMessage);
      setInternalIsThinking(true);

      setTimeout(() => {
        const aiResponse = generateAIResponse(message, ootbTypeId);
        const assistantMessage: ChatMessage = {
          id: crypto.randomUUID(),
          role: "assistant",
          content: aiResponse,
          timestamp: new Date(),
        };
        dashboardChat.appendMessage(threadMsgKey, assistantMessage);
        dashboardChat.updateThreadTimestamp(persistKey, threadId);
        setInternalIsThinking(false);
      }, 1500);
    },
    [dashboardChat, persistKey, ootbTypeId, store],
  );

  const handleSend = (message: string = query) => {
    if (!message.trim()) return;

    setQuery("");

    // If using external control, just call the callback
    if (onSendMessage) {
      onSendMessage(message);
      return;
    }

    // If no active thread, create one then send into it
    if (!activeThreadId) {
      const thread = createBlankThread();
      sendMessageToThread(thread.id, message);
      return;
    }

    // Otherwise, continue the active thread
    sendMessageToThread(activeThreadId, message);
  };

  const handleDeleteThread = (threadId: string) => {
    dashboardChat.deleteThread(persistKey, threadId);
    // If the deleted thread is active, go back to home
    if (activeThreadId === threadId) {
      setActiveThreadId(null);
    }
  };

  const handleBackToHome = () => {
    setActiveThreadId(null);
    setDraftThreadId(null);
    setQuery("");
  };

  const handlePanelBack = () => {
    handleBackToHome();
  };

  // Determine if we're showing external mode, home, or thread view
  const isHomeView = !isExternalMode && !activeThreadId;
  const isThreadView = !isExternalMode && !!activeThreadId;

  const activeThread = activeThreadId ? threads.find((t) => t.id === activeThreadId) : null;

  return (
    <div
      data-chat-panel-root="true"
      className="h-full flex flex-col bg-background relative shrink-0 border-l border-border"
      style={{ width: `${panelWidth}px`, transition: isResizing ? 'none' : 'width 200ms ease' }}
    >
      {/* Resize handle on left edge */}
      <ResizeHandle
        side="left"
        onResize={handleResize}
        onReset={handleResizeReset}
        onResizeStart={handleResizeStart}
        onResizeEnd={handleResizeEnd}
      />

      {/* Header */}
      <div className="px-4 flex items-center justify-between shrink-0 h-[60px] border-b border-border">
        <div className="flex items-center gap-2 min-w-0">
          {isThreadView && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 shrink-0"
                  onClick={handlePanelBack}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom">Back</TooltipContent>
            </Tooltip>
          )}
          {!isThreadView && (
            <Sparkles className="h-5 w-5 text-primary shrink-0" />
          )}
          {isThreadView && activeThread ? (
            <h2 className="text-sm font-semibold truncate">{activeThread.title}</h2>
          ) : isThreadView && draftThreadId ? (
            <h2 className="text-sm font-semibold truncate">New thread</h2>
          ) : (
            <h2 className="font-semibold">AI Assistant</h2>
          )}
        </div>
        <div className="flex items-center gap-1 shrink-0">
          {/* Thread overflow menu (thread view) / New thread icon (elsewhere) */}
          {!isExternalMode && isThreadView ? (
            <DropdownMenu>
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="inline-flex">
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-7 w-7">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                  </span>
                </TooltipTrigger>
                <TooltipContent side="bottom">Thread options</TooltipContent>
              </Tooltip>
              <DropdownMenuContent align="end" className="w-52">
                <DropdownMenuItem
                  onSelect={() => {
                    createBlankThread();
                  }}
                >
                  <SquarePen className="h-4 w-4" />
                  New thread
                </DropdownMenuItem>
                <DropdownMenuItem
                  onSelect={() => {
                    if (!activeThreadId) return;
                    setRenameThreadValue(activeThread?.title ?? "");
                    setRenameThreadOpen(true);
                  }}
                >
                  <Pencil className="h-4 w-4" />
                  Rename
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="text-destructive focus:text-destructive"
                  onSelect={() => {
                    if (!activeThreadId) return;
                    handleDeleteThread(activeThreadId);
                  }}
                >
                  <Trash2 className="h-4 w-4" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            !isExternalMode && threads.length > 0 && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => createBlankThread()}
                  >
                    <SquarePen className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="bottom">New thread</TooltipContent>
              </Tooltip>
            )
          )}
        </div>
      </div>

      {/* Messages / Home Area — scrolls only when content overflows */}
      <div
        className={
          isHomeView
            ? "flex-1 overflow-y-auto min-h-0 bg-background p-4"
            : "flex-1 overflow-y-auto p-4 min-h-0"
        }
      >
        {isExternalMode ? (
          // External mode: flat message list (Explore page conversations)
          messages.filter((m) => !m.dashboardData).length === 0 ? (
            <div className="space-y-4">
              <div className="text-sm text-muted-foreground mb-4">
                Ask questions about this dashboard or request specific insights.
              </div>
              <div className="space-y-2">
                <p className="text-xs font-medium text-muted-foreground mb-2">Suggested Questions</p>
                {suggestedQuestions.map((question, index) => (
                  <Button
                    key={index}
                    variant="outline"
                    size="sm"
                    className="w-full justify-start text-left h-auto py-2 px-3 whitespace-normal"
                    onClick={() => handleSend(question)}
                  >
                    <span className="text-sm">{question}</span>
                  </Button>
                ))}
              </div>
            </div>
          ) : (
            <ThreadView messages={messages} isThinking={isThinking} />
          )
        ) : isHomeView ? (
          <HomeView
            threads={threads}
            onSelectThread={(threadId) => setActiveThreadId(threadId)}
            onDeleteThread={handleDeleteThread}
            onNewThread={() => createBlankThread()}
          />
        ) : (
          <ThreadView
            messages={messages}
            isThinking={isThinking}
            suggestedQuestions={suggestedQuestions}
            onSendSuggestion={handleSend}
          />
        )}
      </div>

      {/* Input Area — always visible at bottom */}
      <div className="p-4 shrink-0">
        <div className="rounded-3xl border bg-card text-card-foreground shadow-sm transition-shadow focus-within:border-ring focus-within:ring-[3px] focus-within:ring-ring/20">
          <div className="px-4 pt-3 pb-2">
            <div className="space-y-2">
              <Textarea
                placeholder={
                  placeholder ||
                  (isHomeView
                    ? "Start a new thread\u2026"
                    : "Ask a follow up question\u2026")
                }
                value={query + (chatVoice.isListening && chatVoice.interimText ? chatVoice.interimText : "")}
                onChange={(e) => {
                  // If the user starts typing while voice is active, stop recording
                  if (chatVoice.isListening) {
                    chatVoice.stop();
                  }
                  setQuery(e.target.value);
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey && query.trim()) {
                    e.preventDefault();
                    handleSend();
                  }
                }}
                rows={1}
                className="min-h-9 max-h-40 overflow-y-auto border-0 focus-visible:ring-0 shadow-none text-sm px-1 py-2"
              />

              <div className="flex items-center justify-between">
                <DropdownMenu>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span className="inline-flex">
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full">
                            <Plus className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                      </span>
                    </TooltipTrigger>
                    <TooltipContent side="top">Attach</TooltipContent>
                  </Tooltip>
                  <DropdownMenuContent align="start" side="top">
                    <DropdownMenuItem onClick={() => toast.info("File upload coming soon")}>
                      <Upload className="h-4 w-4 mr-2" />
                      Upload file
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => toast.info("Image upload coming soon")}>
                      <Image className="h-4 w-4 mr-2" />
                      Add image
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => toast.info("CSV import coming soon")}>
                      <Paperclip className="h-4 w-4 mr-2" />
                      Attach data source
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>

                <div className="flex items-center gap-1">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        size="icon"
                        variant={chatVoice.isListening ? "destructive" : query.trim() ? "default" : "outline"}
                        className={`h-8 w-8 rounded-lg ${chatVoice.isListening ? "animate-pulse" : ""}`}
                        onClick={() => {
                          if (chatVoice.isListening) {
                            chatVoice.stop();
                          } else if (query.trim()) {
                            handleSend();
                          } else if (chatVoice.isSupported) {
                            chatVoice.toggle();
                          } else {
                            toast.error("Voice input not supported", { description: "Your browser doesn't support speech recognition. Try Chrome or Edge." });
                          }
                        }}
                      >
                        {chatVoice.isListening ? (
                          <Square className="h-4 w-4" />
                        ) : query.trim() ? (
                          <ArrowRight className="h-4 w-4" />
                        ) : (
                          <Mic className="h-4 w-4" />
                        )}
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent side="top">
                      {chatVoice.isListening ? "Stop recording" : query.trim() ? "Send" : "Voice input"}
                    </TooltipContent>
                  </Tooltip>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Dialog
        open={renameThreadOpen}
        onOpenChange={(open) => {
          setRenameThreadOpen(open);
          if (!open) setRenameThreadValue("");
        }}
      >
        <DialogContent className="sm:max-w-[420px]">
          <DialogHeader>
            <DialogTitle>Rename thread</DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            <Input
              value={renameThreadValue}
              onChange={(e) => setRenameThreadValue(e.target.value)}
              placeholder="Thread name"
              autoFocus
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRenameThreadOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                if (!activeThreadId) return;
                const next = renameThreadValue.trim();
                if (!next) return;
                dashboardChat.renameThread(persistKey, activeThreadId, next);
                setRenameThreadOpen(false);
                toast.success("Thread renamed", { description: `Renamed to "${next}".` });
              }}
              disabled={!renameThreadValue.trim()}
            >
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  );
}