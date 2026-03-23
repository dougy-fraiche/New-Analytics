import {
  Bot,
  Brain,
  FileSearch,
  Sparkles,
  Cog,
  CheckSquare,
  Target,
  BarChart3,
  Wrench,
  RefreshCw,
  Users,
  BookOpen,
  Lightbulb,
  Cpu,
  type LucideIcon,
} from "lucide-react";

export interface OotbDashboard {
  id: string;
  name: string;
  icon: LucideIcon;
  description: string;
  lastUpdated: string;
}

export interface OotbCategory {
  id: string;
  name: string;
  icon: LucideIcon;
  dashboards: OotbDashboard[];
}

export const ootbCategories: OotbCategory[] = [
  {
    id: "agents",
    name: "Agents",
    icon: Users,
    dashboards: [
      {
        id: "agent-queries",
        name: "Agent Queries",
        icon: FileSearch,
        description: "Analyze agent query patterns, volumes, and response effectiveness",
        lastUpdated: "2 hours ago",
      },
      {
        id: "auto-summary",
        name: "Auto Summary",
        icon: Sparkles,
        description: "Monitor AI-generated conversation summaries and accuracy metrics",
        lastUpdated: "3 hours ago",
      },
      {
        id: "rules-engine",
        name: "Rules Engine",
        icon: Cog,
        description: "Track rule execution, trigger rates, and automation outcomes",
        lastUpdated: "1 hour ago",
      },
      {
        id: "task-assist",
        name: "Task Assist",
        icon: CheckSquare,
        description: "Measure task assist adoption, completion rates, and time savings",
        lastUpdated: "4 hours ago",
      },
    ],
  },
  {
    id: "ai-agents",
    name: "AI Agents",
    icon: Bot,
    dashboards: [
      {
        id: "intent-nlu",
        name: "Intent & NLU",
        icon: Brain,
        description: "Track intent recognition accuracy, NLU confidence, and classification metrics",
        lastUpdated: "1 hour ago",
      },
      {
        id: "goals-outcomes",
        name: "Goals & Outcomes",
        icon: Target,
        description: "Monitor goal completion rates, resolution paths, and outcome analysis",
        lastUpdated: "2 hours ago",
      },
      {
        id: "tool-usage",
        name: "Tool Usage",
        icon: Wrench,
        description: "Analyze tool invocation patterns, success rates, and latency metrics",
        lastUpdated: "5 hours ago",
      },
      {
        id: "agent-ops",
        name: "Agent Ops",
        icon: BarChart3,
        description: "Operational metrics for AI agent health, uptime, and throughput",
        lastUpdated: "30 minutes ago",
      },
      {
        id: "self-improving-agents",
        name: "Self Improving Agents",
        icon: RefreshCw,
        description: "Track self-learning loops, model improvements, and feedback integration",
        lastUpdated: "6 hours ago",
      },
    ],
  },
  {
    id: "ai-agent-vs-agent",
    name: "AI Agent vs Agent",
    icon: Users,
    dashboards: [],
  },
  {
    id: "knowledge-performance",
    name: "Knowledge Performance",
    icon: BookOpen,
    dashboards: [
      {
        id: "knowledge-responses",
        name: "Knowledge Responses",
        icon: BookOpen,
        description: "Analyze knowledge base response quality, coverage, and usage patterns",
        lastUpdated: "3 hours ago",
      },
      {
        id: "improve-knowledge",
        name: "Improve Knowledge",
        icon: Lightbulb,
        description: "Identify knowledge gaps, suggested articles, and improvement opportunities",
        lastUpdated: "4 hours ago",
      },
    ],
  },
  {
    id: "llm-usage",
    name: "LLM Usage",
    icon: Cpu,
    dashboards: [
      {
        id: "llm-ai-agent",
        name: "AI Agent",
        icon: Bot,
        description: "Track LLM token usage, costs, and performance for AI agent interactions",
        lastUpdated: "1 hour ago",
      },
      {
        id: "llm-agent",
        name: "Agent",
        icon: Users,
        description: "Monitor LLM usage for agent-assist features and copilot integrations",
        lastUpdated: "2 hours ago",
      },
    ],
  },
];

// Flat list of all OOTB dashboards for search, breadcrumbs, etc.
export const allOotbDashboards: OotbDashboard[] = ootbCategories.flatMap(
  (cat) => cat.dashboards
);

// Standalone categories (no sub-dashboards, category itself IS the dashboard)
export const standaloneCategories = ootbCategories.filter(
  (cat) => cat.dashboards.length === 0
);

// Lookup: dashboard ID → parent category
export function findCategoryForDashboard(dashboardId: string): OotbCategory | undefined {
  return ootbCategories.find((cat) =>
    cat.dashboards.some((d) => d.id === dashboardId)
  );
}

// Lookup: get dashboard or standalone category by ID
export function findOotbDashboardById(id: string): { name: string; categoryName?: string; categoryId?: string } | undefined {
  // Check standalone categories first
  const standalone = standaloneCategories.find((cat) => cat.id === id);
  if (standalone) {
    return { name: standalone.name };
  }
  // Check nested dashboards
  for (const cat of ootbCategories) {
    const dash = cat.dashboards.find((d) => d.id === id);
    if (dash) {
      return { name: dash.name, categoryName: cat.name, categoryId: cat.id };
    }
  }
  return undefined;
}

// Total dashboard count (including standalone categories as dashboards)
export const totalOotbDashboardCount =
  allOotbDashboards.length + standaloneCategories.length;
