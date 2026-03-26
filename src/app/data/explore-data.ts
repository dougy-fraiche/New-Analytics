import { BarChart3, FileText, TrendingUp } from "lucide-react";
import type { DashboardData, WidgetData } from "../contexts/ConversationContext";

// ── Hero / Input constants ────────────────────────────────────────────

export const exploreHeadings = [
  "What insights do you need?",
  "What would you like to explore?",
  "How can I help you today?",
  "What story does your data tell?",
  "Ready to uncover patterns?",
  "What metrics matter most to you?",
  "Where should we start digging?",
  "What questions are top of mind?",
  "Looking for something specific?",
  "Let's find your next insight.",
];

export const placeholderSuffixes = [
  "customer support data\u2026",
  "key insights\u2026",
  "escalation trends\u2026",
  "agent performance\u2026",
  "CSAT scores\u2026",
  "resolution rates\u2026",
  "knowledge base gaps\u2026",
  "automation opportunities\u2026",
  "ticket volume patterns\u2026",
  "self-service metrics\u2026",
];

// ── Suggested action cards ────────────────────────────────────────────

export const suggestedActions = [
  {
    id: 1,
    icon: BarChart3,
    label: "Analyze Trends",
    description: "Show me agent escalation trends over the last 30 days",
    prompts: [
      "Analyze escalation trends over the last 30 days",
      "Analyze ticket volume trends by category this quarter",
      "Analyze CSAT score trends across all channels",
      "Analyze response time trends week over week",
      "Analyze self-service containment rate trends",
    ],
  },
  {
    id: 2,
    icon: FileText,
    label: "Knowledge Insights",
    description: "Which knowledge articles drive resolution?",
    prompts: [
      "Which knowledge articles have the highest resolution rate?",
      "What topics are missing from the knowledge base?",
      "Knowledge base gap analysis for top ticket categories",
      "Which knowledge articles need updating based on feedback?",
      "How effective is the knowledge base at deflecting tickets?",
    ],
  },
  {
    id: 3,
    icon: TrendingUp,
    label: "Performance Metrics",
    description: "Compare Copilot usage vs resolution rate",
    prompts: [
      "Compare Copilot usage vs resolution rate across teams",
      "Performance breakdown by agent tier and tenure",
      "Which agents have the best first-contact resolution rate?",
      "Performance comparison across all support channels",
      "How does agent utilization correlate with CSAT scores?",
    ],
  },
];

// ── Key Insights cards ────────────────────────────────────────────────

export const insights = [
  {
    id: 1,
    title: "Escalation Rate Increased",
    value: "12.4%",
    change: "+8%",
    trend: "up" as const,
    description: "From previous month",
    linkedActionId: 6,
  },
  {
    id: 2,
    title: "Self-Service Containment",
    value: "73%",
    change: "-5%",
    trend: "down" as const,
    description: "Dropped in last 7 days",
    linkedActionId: 4,
  },
  {
    id: 3,
    title: "Copilot Adoption",
    value: "62%",
    change: "+12%",
    trend: "up" as const,
    description: "Across all agents",
    linkedActionId: 3,
  },
  {
    id: 4,
    title: "Automation Opportunities",
    value: "14",
    change: "New",
    trend: "neutral" as const,
    description: "Identified this week",
    linkedActionId: 7,
  },
];

// ── Top Automation Opportunities ───────────────────────────────────────

export type AutomationOpportunity = {
  id: number;
  title: string;
  description: string;
  priority: "Critical" | "High" | "Medium";
  weeklyVolume: string;
  impactValue: string;
};

export const topAutomationOpportunities: AutomationOpportunity[] = [
  {
    id: 1,
    title: "Unlock 45 Agent-Hours a Week",
    description:
      "You're handling 847 card clearance requests every week and 94% of them follow the same 3-step pattern.",
    priority: "Critical",
    weeklyVolume: "847/wk",
    impactValue: "$213K/yr",
  },
  {
    id: 2,
    title: "Your #1 Ticket Type Can Basically Run Itself",
    description:
      "Over 1,200 \"Where is my order?\" questions every week. Most are just copying tracking numbers.",
    priority: "Critical",
    weeklyVolume: "1,243/wk",
    impactValue: "$319K/yr",
  },
  {
    id: 3,
    title: "Cut Returns Time from 8 Minutes to Under 1",
    description:
      "534 return cases a week, averaging nearly 8 minutes each. Most are policy checks.",
    priority: "High",
    weeklyVolume: "534/wk",
    impactValue: "$189K/yr",
  },
  {
    id: 4,
    title: "Turn 5-Minute Calls Into 30-Second Wins",
    description:
      "312 scheduling requests a week. Most follow the same pattern: check availability, pick a time, confirm.",
    priority: "Medium",
    weeklyVolume: "312/wk",
    impactValue: "$99K/yr",
  },
];

// ── Title generation rules ────────────────────────────────────────────

const titleRules: Array<{ keywords: string[]; titles: string[] }> = [
  { keywords: ["escalation", "escalate"], titles: ["Escalation Rate Analysis", "Agent Escalation Trends", "Escalation Pattern Review"] },
  { keywords: ["trend", "over time", "last 30", "last 90", "quarter"], titles: ["Support Trend Analysis", "Metric Trends Over Time", "Historical Performance Review"] },
  { keywords: ["knowledge", "article"], titles: ["Knowledge Base Insights", "Article Performance Analysis", "Knowledge Content Review"] },
  { keywords: ["self-service", "containment", "deflection"], titles: ["Self-Service Effectiveness", "Containment Rate Analysis", "Deflection Metrics Review"] },
  { keywords: ["chatbot", "bot", "virtual agent"], titles: ["Chatbot Performance Review", "Virtual Agent Effectiveness", "Bot Resolution Analysis"] },
  { keywords: ["copilot", "ai assist"], titles: ["Copilot Impact Analysis", "AI Assistant Performance", "Copilot Adoption Metrics"] },
  { keywords: ["resolution", "resolve"], titles: ["Resolution Rate Breakdown", "Ticket Resolution Analysis", "Resolution Performance Review"] },
  { keywords: ["response time", "first response"], titles: ["Response Time Analysis", "First Response Metrics", "Reply Speed Breakdown"] },
  { keywords: ["handle time", "aht"], titles: ["Handle Time Analysis", "AHT Performance Review", "Handling Efficiency Metrics"] },
  { keywords: ["sla", "compliance"], titles: ["SLA Compliance Report", "Service Level Performance", "SLA Adherence Analysis"] },
  { keywords: ["csat", "satisfaction", "customer satisfaction"], titles: ["Customer Satisfaction Analysis", "CSAT Score Breakdown", "Satisfaction Trend Review"] },
  { keywords: ["sentiment", "negative", "positive"], titles: ["Sentiment Analysis Overview", "Customer Sentiment Breakdown", "Feedback Sentiment Review"] },
  { keywords: ["nps", "net promoter", "promoter score"], titles: ["NPS Trend Analysis", "Net Promoter Score Review", "NPS Performance Summary"] },
  { keywords: ["effort score", "ces"], titles: ["Customer Effort Analysis", "CES Breakdown Report", "Effort Score Metrics"] },
  { keywords: ["volume", "ticket count", "how many tickets"], titles: ["Ticket Volume Overview", "Support Volume Analysis", "Request Volume Trends"] },
  { keywords: ["backlog", "queue", "pending"], titles: ["Backlog Status Review", "Queue Depth Analysis", "Pending Tickets Overview"] },
  { keywords: ["peak hours", "busiest"], titles: ["Peak Hours Analysis", "Support Load Patterns", "High Traffic Period Review"] },
  { keywords: ["agent", "performance", "top performing"], titles: ["Agent Performance Review", "Team Performance Metrics", "Agent Productivity Analysis"] },
  { keywords: ["training", "coaching", "onboarding"], titles: ["Training Needs Assessment", "Agent Coaching Insights", "Skill Gap Analysis"] },
  { keywords: ["utilization", "capacity", "staffing"], titles: ["Agent Utilization Report", "Capacity Planning Analysis", "Staffing Level Review"] },
  { keywords: ["automation", "automate"], titles: ["Automation Opportunity Analysis", "Process Automation Review", "Automation ROI Assessment"] },
  { keywords: ["workflow", "process", "bottleneck"], titles: ["Workflow Efficiency Review", "Process Bottleneck Analysis", "Operational Flow Assessment"] },
  { keywords: ["channel", "email", "chat", "phone"], titles: ["Channel Performance Comparison", "Omnichannel Analytics", "Support Channel Review"] },
  { keywords: ["dashboard", "report", "summary", "overview"], titles: ["Custom Analytics Dashboard", "Support Performance Dashboard", "Executive Summary Dashboard"] },
  { keywords: ["forecast", "predict", "projection", "next month"], titles: ["Support Volume Forecast", "Predictive Analytics Review", "Demand Forecast Analysis"] },
  { keywords: ["cost", "roi", "budget", "spend"], titles: ["Cost Per Ticket Analysis", "Support ROI Assessment", "Budget Impact Review"] },
  { keywords: ["category", "topic", "type", "breakdown"], titles: ["Category Breakdown Analysis", "Topic Distribution Review", "Issue Type Analysis"] },
  { keywords: ["billing", "payment", "subscription"], titles: ["Billing Issue Analysis", "Payment Support Review", "Billing Inquiry Trends"] },
  { keywords: ["technical", "bug", "error"], titles: ["Technical Issue Analysis", "Bug Report Trends", "Technical Support Review"] },
  { keywords: ["feature request", "product feedback"], titles: ["Feature Request Analysis", "Product Feedback Review", "User Request Trends"] },
];

/** Generate a contextual conversation title from the user's query */
export const generateConversationName = (query: string): string => {
  const lower = query.toLowerCase();

  for (const rule of titleRules) {
    if (rule.keywords.some((kw) => lower.includes(kw))) {
      const index = query.length % rule.titles.length;
      return rule.titles[index];
    }
  }

  let cleaned = query
    .replace(/^(what|how|why|when|where|which|who|show me|tell me|give me|can you|could you|please|i want to|i'd like to|i need to)\s+/i, "")
    .replace(/[?.!]+$/, "")
    .trim();

  if (cleaned.length > 0) {
    cleaned = cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
  }
  if (cleaned.length > 50) {
    cleaned = cleaned.substring(0, 47) + "...";
  }

  return cleaned || "New Conversation";
};

// ── Dashboard title generation ────────────────────────────────────────

export const generateDashboardTitle = (query: string): { title: string; description: string } => {
  const lower = query.toLowerCase();

  if (lower.includes("escalation")) return { title: "Escalation Trends Dashboard", description: "Track agent escalation rates, patterns, and root causes across support tiers" };
  if (lower.includes("knowledge") || lower.includes("article")) return { title: "Knowledge Base Performance Dashboard", description: "Article effectiveness, resolution rates, and content gap analysis" };
  if (lower.includes("copilot") || lower.includes("ai assist")) return { title: "Copilot Impact Dashboard", description: "AI assistant adoption, accuracy, and impact on agent productivity" };
  if (lower.includes("csat") || lower.includes("satisfaction")) return { title: "Customer Satisfaction Dashboard", description: "CSAT trends, driver analysis, and team-level satisfaction scores" };
  if (lower.includes("sentiment")) return { title: "Sentiment Analysis Dashboard", description: "Customer sentiment breakdown by channel, topic, and time period" };
  if (lower.includes("agent") || lower.includes("performance") || lower.includes("team")) return { title: "Team Performance Dashboard", description: "Agent metrics, productivity benchmarks, and performance comparisons" };
  if (lower.includes("channel")) return { title: "Channel Comparison Dashboard", description: "Cross-channel performance metrics, volume, and satisfaction scores" };
  if (lower.includes("volume") || lower.includes("ticket")) return { title: "Ticket Volume Dashboard", description: "Request volume trends, category breakdown, and capacity indicators" };
  if (lower.includes("automation") || lower.includes("workflow")) return { title: "Automation Insights Dashboard", description: "Automation opportunities, ROI projections, and workflow efficiency" };
  if (lower.includes("sla") || lower.includes("compliance")) return { title: "SLA Compliance Dashboard", description: "Service level adherence, breach analysis, and compliance trends" };
  if (lower.includes("resolution") || lower.includes("response time")) return { title: "Resolution & Response Dashboard", description: "Resolution rates, response times, and handle time analytics" };
  if (lower.includes("forecast") || lower.includes("predict")) return { title: "Predictive Analytics Dashboard", description: "Volume forecasts, trend projections, and capacity planning insights" };
  if (lower.includes("executive") || lower.includes("summary") || lower.includes("overview")) return { title: "Executive Summary Dashboard", description: "High-level KPIs, trends, and strategic insights for leadership review" };
  if (lower.includes("weekly") || lower.includes("monthly")) return { title: "Periodic Performance Dashboard", description: "Scheduled performance snapshots with period-over-period comparisons" };
  return { title: "Support Analytics Dashboard", description: "Comprehensive view of customer support performance metrics" };
};

// ── Widget data generation ────────────────────────────────────────────

export const generateWidgetData = (userMessage: string): WidgetData => {
  const lower = userMessage.toLowerCase();
  const id = `widget-${Date.now()}`;

  if (lower.includes("escalation")) {
    return {
      id, chartType: "area", title: "Escalation Rate", description: "Last 30 days trend",
      value: "12.4%", change: "+8%", trend: "up",
      data: [
        { week: "W1", rate: 9.2 }, { week: "W2", rate: 10.1 }, { week: "W3", rate: 11.3 },
        { week: "W4", rate: 12.4 }, { week: "W5", rate: 11.8 }, { week: "W6", rate: 12.4 },
      ],
      xKey: "week", yKey: "rate",
    };
  }
  if (lower.includes("csat") || lower.includes("satisfaction")) {
    return {
      id, chartType: "metric", title: "CSAT Score", description: "Overall customer satisfaction",
      value: "4.6 / 5", change: "+0.3", trend: "up",
      data: [], xKey: "", yKey: "",
    };
  }
  if (lower.includes("volume") || lower.includes("ticket")) {
    return {
      id, chartType: "bar", title: "Ticket Volume", description: "By category this month",
      value: "3,847", change: "+12%", trend: "up",
      data: [
        { category: "Billing", count: 842 }, { category: "Technical", count: 1156 },
        { category: "General", count: 987 }, { category: "Returns", count: 462 },
        { category: "Shipping", count: 400 },
      ],
      xKey: "category", yKey: "count",
    };
  }
  if (lower.includes("channel")) {
    return {
      id, chartType: "donut", title: "Channel Distribution", description: "Support requests by channel",
      value: "5,234", change: "+5%", trend: "up",
      data: [
        { channel: "Chat", volume: 2100 }, { channel: "Email", volume: 1450 },
        { channel: "Phone", volume: 984 }, { channel: "Social", volume: 700 },
      ],
      xKey: "channel", yKey: "volume",
    };
  }
  if (lower.includes("resolution") || lower.includes("response")) {
    return {
      id, chartType: "line", title: "Resolution Rate", description: "Weekly trend",
      value: "87%", change: "+3%", trend: "up",
      data: [
        { week: "W1", rate: 82 }, { week: "W2", rate: 84 }, { week: "W3", rate: 83 },
        { week: "W4", rate: 86 }, { week: "W5", rate: 85 }, { week: "W6", rate: 87 },
      ],
      xKey: "week", yKey: "rate",
    };
  }
  if (lower.includes("agent") || lower.includes("performance")) {
    return {
      id, chartType: "bar", title: "Agent Performance", description: "Top performers by resolution rate",
      value: "84%", change: "+6%", trend: "up",
      data: [
        { agent: "Team A", score: 92 }, { agent: "Team B", score: 87 },
        { agent: "Team C", score: 84 }, { agent: "Team D", score: 79 },
        { agent: "Team E", score: 76 },
      ],
      xKey: "agent", yKey: "score",
    };
  }

  const types: WidgetData["chartType"][] = ["area", "bar", "line", "donut", "metric"];
  const picked = types[userMessage.length % types.length];
  return {
    id, chartType: picked, title: "Key Metric Insight", description: "AI-generated analysis",
    value: "1,247", change: "+14%", trend: "up",
    data: [
      { period: "Jan", value: 820 }, { period: "Feb", value: 932 },
      { period: "Mar", value: 1015 }, { period: "Apr", value: 1147 },
      { period: "May", value: 1247 },
    ],
    xKey: "period", yKey: "value",
  };
};

// ── AI response generation ────────────────────────────────────────────

export const generateAIResponse = (userMessage: string): { content: string; dashboardData?: DashboardData; widgetData?: WidgetData } => {
  const lowerMessage = userMessage.toLowerCase();
  const wantsWidget = lowerMessage.includes("widget") || lowerMessage.includes("insight");
  const wantsDashboard = lowerMessage.includes("dashboard");

  const widgetData = wantsWidget ? generateWidgetData(userMessage) : undefined;

  if (lowerMessage.includes("escalation") || lowerMessage.includes("trend")) {
    return {
      content: "Based on the data from the last 30 days, I've analyzed the agent escalation trends. The escalation rate has increased by 8% to 12.4%, primarily driven by complex technical issues in the product support category. The peak escalation times are between 2-4 PM EST. Would you like me to break this down by support tier or product category?",
      widgetData,
    };
  }

  if (lowerMessage.includes("knowledge") || lowerMessage.includes("article")) {
    return {
      content: "I've analyzed the knowledge article performance data. The top 5 articles that drive resolution account for 45% of all self-service resolutions. 'How to reset your password' leads with 2,847 views and an 89% resolution rate. However, I noticed 3 articles with high traffic but low resolution rates that may need updates. Shall I provide more details?",
      widgetData,
    };
  }

  if (lowerMessage.includes("copilot") || lowerMessage.includes("resolution")) {
    return {
      content: "Comparing Copilot usage with resolution rates shows a strong positive correlation. Teams with >70% Copilot adoption have an average resolution rate of 84%, compared to 68% for teams with lower adoption. The data suggests that Copilot is most effective for tier-1 support issues. Would you like to see this broken down by team or issue category?",
      widgetData,
    };
  }

  if (wantsDashboard) {
    const { title, description } = generateDashboardTitle(userMessage);
    return {
      content: `I've generated a "${title}" based on your request. You can view and interact with it in the panel on the right. Save it to keep it in your collection, or close the panel to continue our conversation.`,
      widgetData,
      dashboardData: {
        id: `dash-${Date.now()}`,
        title,
        description,
        metrics: [
          { label: "Total Tickets", value: "1,247" },
          { label: "Avg Response Time", value: "2.3h" },
          { label: "Resolution Rate", value: "87%" },
          { label: "CSAT Score", value: "4.6/5" },
        ],
        chartData: {
          trend: [
            { date: "Jan 15", interactions: 245 },
            { date: "Jan 22", interactions: 312 },
            { date: "Jan 29", interactions: 287 },
            { date: "Feb 5", interactions: 398 },
            { date: "Feb 12", interactions: 456 },
            { date: "Feb 19", interactions: 512 },
            { date: "Feb 26", interactions: 478 },
          ],
          breakdown: [
            { category: "Technical Issues", volume: 342 },
            { category: "Billing Questions", volume: 187 },
            { category: "Feature Requests", volume: 156 },
            { category: "General Inquiry", volume: 289 },
            { category: "Bug Reports", volume: 98 },
          ],
        },
      },
    };
  }

  if (wantsWidget) {
    return {
      content: "Here's an insight based on your request. The data shows notable patterns in the metrics you're tracking. Let me know if you'd like me to explore specific aspects further or generate a full dashboard.",
      widgetData,
    };
  }

  return {
    content: "I've analyzed your request regarding customer support data. The insights show interesting patterns in user behavior and support performance. Let me know if you'd like me to dive deeper into any specific metrics or create a custom dashboard for tracking these trends.",
  };
};
