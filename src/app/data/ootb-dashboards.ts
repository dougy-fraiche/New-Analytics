import {
  Brain,
  Target,
  LayoutDashboard,
  ClipboardCheck,
  Sparkles,
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
  /** When set, shown under the category title for all tabs in this observability surface. */
  pageDescription?: string;
  dashboards: OotbDashboard[];
}

export const ootbCategories: OotbCategory[] = [
  {
    id: "ai-agents",
    name: "AI Agents",
    icon: Brain,
    pageDescription:
      "End-to-end visibility for your AI agents: health and volume, goals and outcomes, evaluation quality, and intent/NLU performance.",
    dashboards: [
      {
        id: "ai-agents-overview",
        name: "Overview",
        icon: LayoutDashboard,
        description: "High-level health, volume, and performance snapshot across your AI agents",
        lastUpdated: "30 minutes ago",
      },
      {
        id: "goals-outcomes",
        name: "Goals & Outcomes",
        icon: Target,
        description: "Monitor goal completion rates, resolution paths, and outcome analysis",
        lastUpdated: "2 hours ago",
      },
      {
        id: "ai-agent-evaluation",
        name: "AI Agent Evaluation",
        icon: ClipboardCheck,
        description: "Measure quality, tool use, learning loops, and continuous improvement signals",
        lastUpdated: "1 hour ago",
      },
      {
        id: "intent-nlu",
        name: "Intent & NLU",
        icon: Brain,
        description: "Track intent recognition accuracy, NLU confidence, and classification metrics",
        lastUpdated: "1 hour ago",
      },
      {
        id: "ai-agents-copilot",
        name: "Copilot",
        icon: Sparkles,
        description: "Agent copilot usage, suggestion quality, and assist coverage (same layout as Overview for now)",
        lastUpdated: "Recently",
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
