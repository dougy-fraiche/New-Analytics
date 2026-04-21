import { useLayoutEffect, useMemo, useRef, useState } from "react";
import type { ReactNode } from "react";
import type { EChartsCoreOption } from "echarts";
import {
  ArrowDown,
  ArrowDownRight,
  ArrowRight,
  ArrowUp,
  ArrowUpRight,
  BarChart3,
  CalendarDays,
  CalendarRange,
  CalendarClock,
  CalendarX2,
  Check,
  ChevronDown,
  ChevronRight,
  ChevronUp,
  Pencil,
  Plus,
  RotateCcw,
  Trash2,
  Upload,
  X,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { toast } from "sonner";

import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Checkbox } from "./ui/checkbox";
import { EChartsCanvas } from "./EChartsCanvas";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "./ui/empty";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "./ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { Separator } from "./ui/separator";
import { Progress } from "./ui/progress";
import { Switch } from "./ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { Textarea } from "./ui/textarea";
import { ToggleGroup, ToggleGroupItem } from "./ui/toggle-group";
import { Tooltip, TooltipContent, TooltipTrigger } from "./ui/tooltip";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import {
  PageHeader,
  pageHeaderTabsFooterClassName,
  pageMainColumnClassName,
  pageRootListScrollGutterClassName,
} from "./PageChrome";
import { PageTransition } from "./PageTransition";
import { KpiMetricValueTitle } from "./KpiMetricValueTitle";
import { cn } from "./ui/utils";

type AIAgentsSettingsTab =
  | "evaluation-criteria"
  | "topic-library"
  | "analyzer-settings";

type CriterionKind = "system" | "custom";

type BaseCriterion = {
  id: string;
  label: string;
  enabled: boolean;
};

type CustomWidgetType =
  | "Yes / No"
  | "3-Point Scale"
  | "5-Point Scale"
  | "Percentage (0-100)"
  | "Numeric Score (0-10)";

type OutcomeClass = {
  id: string;
  label: string;
  score: number;
  color: string;
  previewShare: number;
};

type CustomCriterionConfig = {
  title: string;
  description: string;
  evaluationInstruction: string;
  widgetType: CustomWidgetType;
  confidencePct: number;
  trendDeltaPct: number;
  trendSeries: number[];
  outcomeClasses: OutcomeClass[];
};

type SystemCriterion = BaseCriterion & {
  kind: "system";
};

type CustomCriterion = BaseCriterion & {
  kind: "custom";
  customConfig: CustomCriterionConfig;
};

type Criterion = SystemCriterion | CustomCriterion;

type SchedulerMode =
  | "off"
  | "after-every-conversation"
  | "daily"
  | "weekly";

type TopicNode = {
  id: string;
  label: string;
  children?: TopicNode[];
};

type RemovedTopicResult = {
  nodes: TopicNode[];
  removed: TopicNode | null;
  parentId: string | null;
  index: number;
};

type AIAgentsSettingsDraft = {
  criteria: Criterion[];
  selectedCriterionId: string;
  topics: TopicNode[];
  schedulerMode: SchedulerMode;
  model: string;
  endpointFiltersEnabled: boolean;
  endpointFilters: Record<string, boolean>;
  channelFiltersEnabled: boolean;
  channelFilters: Record<string, boolean>;
};

const AI_AGENT_SETTINGS_TABS: { value: AIAgentsSettingsTab; label: string }[] = [
  { value: "evaluation-criteria", label: "Evaluation Criteria" },
  { value: "topic-library", label: "Topic Library" },
  { value: "analyzer-settings", label: "Analyzer Settings" },
];

const SCHEDULER_OPTIONS: {
  value: SchedulerMode;
  label: string;
  Icon: LucideIcon;
}[] = [
  { value: "off", label: "Off", Icon: CalendarX2 },
  {
    value: "after-every-conversation",
    label: "After Every Conversation",
    Icon: CalendarClock,
  },
  { value: "daily", label: "Daily", Icon: CalendarDays },
  { value: "weekly", label: "Weekly", Icon: CalendarRange },
];

const ENDPOINT_OPTIONS = [
  "PremiumSupport",
  "CopilotAgent",
  "SalesAssist",
  "HRHelpdesk",
  "OrderAgent",
  "BasicSupport",
  "TechHelper",
  "BillingBot",
] as const;

const CHANNEL_OPTIONS = ["webchat", "voice", "whatsapp", "messenger"] as const;

const CUSTOM_WIDGET_TYPES: CustomWidgetType[] = [
  "Yes / No",
  "3-Point Scale",
  "5-Point Scale",
  "Percentage (0-100)",
  "Numeric Score (0-10)",
];

const DEFAULT_CUSTOM_OUTCOME_CLASSES = [
  { id: "pass", label: "Pass", score: 3, color: "#208337", previewShare: 62.3 },
  { id: "partial", label: "Partial", score: 2, color: "#ffb800", previewShare: 23.4 },
  { id: "fail", label: "Fail", score: 1, color: "#e32926", previewShare: 14.3 },
] as const;

const FIVE_POINT_OUTCOME_CLASSES = [
  { id: "excellent", label: "Excellent", score: 5, color: "#208337", previewShare: 24.1 },
  { id: "good", label: "Good", score: 4, color: "#57a942", previewShare: 27.8 },
  { id: "adequate", label: "Adequate", score: 3, color: "#ffb800", previewShare: 26.4 },
  { id: "poor", label: "Poor", score: 2, color: "#f97316", previewShare: 13.3 },
  { id: "very-poor", label: "Very Poor", score: 1, color: "#e32926", previewShare: 8.4 },
] as const;

const OUTCOME_CLASS_COLOR_PALETTE = [
  "#208337",
  "#57a942",
  "#22c55e",
  "#14b8a6",
  "#06b6d4",
  "#3b82f6",
  "#6e56cf",
  "#8b5cf6",
  "#ec4899",
  "#e32926",
  "#f97316",
  "#ffb800",
  "#84cc16",
  "#64748b",
  "#94a3b8",
  "#475569",
] as const;

const CUSTOM_CRITERIA_DESCRIPTION_SUGGESTIONS: Record<string, string> = {
  accuracy:
    "Measures whether the agent's responses are factually correct and free from material misinformation.",
  helpfulness:
    "Evaluates how effectively the response addresses the user's request and provides actionable guidance.",
  safety:
    "Checks whether responses avoid unsafe, disallowed, or policy-violating content.",
  "tone-empathy":
    "Assesses whether the agent communicates with appropriate tone, clarity, and empathy for the user's situation.",
  resolution:
    "Tracks whether the conversation reaches a clear outcome and the user's issue is resolved.",
  compliance:
    "Determines whether responses follow required business, legal, and policy constraints.",
  "brand-alignment":
    "Evaluates how well responses reflect brand voice, terminology, and communication standards.",
};

function createOutcomeClassesForWidgetType(
  prefix: string,
  widgetType: CustomWidgetType,
): OutcomeClass[] {
  if (widgetType === "3-Point Scale") {
    return DEFAULT_CUSTOM_OUTCOME_CLASSES.map((outcome) => ({
      id: `${prefix}-${outcome.id}`,
      label: outcome.label,
      score: outcome.score,
      color: outcome.color,
      previewShare: outcome.previewShare,
    }));
  }

  if (widgetType === "5-Point Scale") {
    return FIVE_POINT_OUTCOME_CLASSES.map((outcome) => ({
      id: `${prefix}-${outcome.id}`,
      label: outcome.label,
      score: outcome.score,
      color: outcome.color,
      previewShare: outcome.previewShare,
    }));
  }

  return [];
}

function supportsOutcomeClasses(widgetType: CustomWidgetType): boolean {
  return widgetType === "3-Point Scale" || widgetType === "5-Point Scale";
}

function createDefaultOutcomeClasses(prefix: string): OutcomeClass[] {
  return createOutcomeClassesForWidgetType(prefix, "3-Point Scale");
}

function createCustomCriterion(
  params: { id: string; title: string; enabled?: boolean },
): CustomCriterion {
  const { id, title, enabled = false } = params;
  return {
    id,
    label: title,
    kind: "custom",
    enabled,
    customConfig: {
      title,
      description: "",
      evaluationInstruction: "",
      widgetType: "3-Point Scale",
      confidencePct: 85,
      trendDeltaPct: 62.3,
      trendSeries: [46, 44, 43, 62, 62, 50, 53, 58, 57, 58, 62, 55],
      outcomeClasses: createDefaultOutcomeClasses(id),
    },
  };
}

const INITIAL_CRITERIA: Criterion[] = [
  { id: "customer-sentiment", label: "Customer Sentiment", kind: "system", enabled: true },
  { id: "containment-success", label: "Containment & Success", kind: "system", enabled: true },
  { id: "ai-behavior-quality", label: "AI Behaviour Quality", kind: "system", enabled: true },
  { id: "ai-agent-experience-quality", label: "AI Agent Experience Quality", kind: "system", enabled: true },
  createCustomCriterion({ id: "accuracy", title: "Accuracy", enabled: true }),
  createCustomCriterion({ id: "helpfulness", title: "Helpfulness", enabled: false }),
  createCustomCriterion({ id: "safety", title: "Safety", enabled: false }),
  createCustomCriterion({ id: "tone-empathy", title: "Tone & Empathy", enabled: false }),
  createCustomCriterion({ id: "resolution", title: "Resolution", enabled: false }),
  createCustomCriterion({ id: "compliance", title: "Compliance", enabled: false }),
  createCustomCriterion({ id: "brand-alignment", title: "Brand Alignment", enabled: false }),
];

const INITIAL_TOPICS: TopicNode[] = [
  {
    id: "billing",
    label: "Billing",
    children: [
      { id: "payments", label: "Payments", children: [{ id: "card-declined", label: "Card Declined" }, { id: "refund-status", label: "Refund Status" }] },
      { id: "invoices", label: "Invoices" },
      { id: "plan-upgrade", label: "Plan Upgrade" },
    ],
  },
  {
    id: "technical-support",
    label: "Technical Support",
    children: [{ id: "login-issues", label: "Login Issues" }, { id: "integration-help", label: "Integration Help" }, { id: "api-errors", label: "API Errors" }],
  },
  {
    id: "account-management",
    label: "Account Management",
    children: [{ id: "password-reset", label: "Password Reset" }, { id: "account-access", label: "Account Access" }, { id: "data-privacy", label: "Data Privacy" }],
  },
  {
    id: "orders",
    label: "Orders",
    children: [{ id: "order-status", label: "Order Status" }, { id: "shipping-delay", label: "Shipping Delay" }, { id: "cancellation", label: "Cancellation" }],
  },
  {
    id: "product",
    label: "Product",
    children: [{ id: "feature-request", label: "Feature Request" }, { id: "product-info", label: "Product Info" }],
  },
];

function cloneDraft(draft: AIAgentsSettingsDraft): AIAgentsSettingsDraft {
  return JSON.parse(JSON.stringify(draft)) as AIAgentsSettingsDraft;
}

function cloneCriteria(criteria: Criterion[]): Criterion[] {
  return criteria.map((criterion) =>
    criterion.kind === "custom"
      ? {
          ...criterion,
          customConfig: {
            ...criterion.customConfig,
            trendSeries: [...criterion.customConfig.trendSeries],
            outcomeClasses: criterion.customConfig.outcomeClasses.map((outcome) => ({
              ...outcome,
            })),
          },
        }
      : { ...criterion },
  );
}

function normalizeCustomCriteriaDescriptions(criteria: Criterion[]): Criterion[] {
  return criteria.map((criterion) => {
    if (criterion.kind !== "custom") return criterion;

    const currentDescription = criterion.customConfig.description.trim();
    if (currentDescription.length > 0) return criterion;

    const suggestedDescription = CUSTOM_CRITERIA_DESCRIPTION_SUGGESTIONS[criterion.id];
    if (!suggestedDescription) return criterion;

    return {
      ...criterion,
      customConfig: {
        ...criterion.customConfig,
        description: suggestedDescription,
      },
    };
  });
}

function cloneTopics(nodes: TopicNode[]): TopicNode[] {
  return nodes.map((node) => ({
    ...node,
    children: node.children ? cloneTopics(node.children) : undefined,
  }));
}

function createInitialDraft(): AIAgentsSettingsDraft {
  return {
    criteria: normalizeCustomCriteriaDescriptions(cloneCriteria(INITIAL_CRITERIA)),
    selectedCriterionId: "customer-sentiment",
    topics: cloneTopics(INITIAL_TOPICS),
    schedulerMode: "off",
    model: "GPT-4.1",
    endpointFiltersEnabled: false,
    endpointFilters: Object.fromEntries(ENDPOINT_OPTIONS.map((name) => [name, false])),
    channelFiltersEnabled: false,
    channelFilters: Object.fromEntries(CHANNEL_OPTIONS.map((name) => [name, false])),
  };
}

function countTopics(nodes: TopicNode[]): number {
  return nodes.reduce((acc, node) => acc + 1 + countTopics(node.children ?? []), 0);
}

function findTopicById(nodes: TopicNode[], id: string): TopicNode | null {
  for (const node of nodes) {
    if (node.id === id) return node;
    const found = findTopicById(node.children ?? [], id);
    if (found) return found;
  }
  return null;
}

function updateTopicLabelById(nodes: TopicNode[], id: string, nextLabel: string): TopicNode[] {
  return nodes.map((node) => {
    if (node.id === id) {
      return { ...node, label: nextLabel };
    }
    if (!node.children || node.children.length === 0) {
      return node;
    }
    return { ...node, children: updateTopicLabelById(node.children, id, nextLabel) };
  });
}

function addChildTopicById(nodes: TopicNode[], parentId: string, child: TopicNode): TopicNode[] {
  return nodes.map((node) => {
    if (node.id === parentId) {
      return { ...node, children: [...(node.children ?? []), child] };
    }
    if (!node.children || node.children.length === 0) {
      return node;
    }
    return { ...node, children: addChildTopicById(node.children, parentId, child) };
  });
}

function removeTopicById(
  nodes: TopicNode[],
  id: string,
  parentId: string | null = null,
): RemovedTopicResult {
  for (let index = 0; index < nodes.length; index += 1) {
    const node = nodes[index]!;
    if (node.id === id) {
      return {
        nodes: [...nodes.slice(0, index), ...nodes.slice(index + 1)],
        removed: node,
        parentId,
        index,
      };
    }
    if (node.children && node.children.length > 0) {
      const childResult = removeTopicById(node.children, id, node.id);
      if (childResult.removed) {
        return {
          nodes: nodes.map((candidate) =>
            candidate.id === node.id
              ? { ...candidate, children: childResult.nodes }
              : candidate,
          ),
          removed: childResult.removed,
          parentId: childResult.parentId,
          index: childResult.index,
        };
      }
    }
  }

  return { nodes, removed: null, parentId: null, index: -1 };
}

function insertTopicAtLocation(
  nodes: TopicNode[],
  topic: TopicNode,
  parentId: string | null,
  index: number,
): TopicNode[] {
  if (parentId === null) {
    const safeIndex = index < 0 ? nodes.length : index;
    return [
      ...nodes.slice(0, safeIndex),
      cloneTopics([topic])[0]!,
      ...nodes.slice(safeIndex),
    ];
  }

  return nodes.map((node) => {
    if (node.id === parentId) {
      const children = node.children ?? [];
      const safeIndex = index < 0 ? children.length : index;
      return {
        ...node,
        children: [
          ...children.slice(0, safeIndex),
          cloneTopics([topic])[0]!,
          ...children.slice(safeIndex),
        ],
      };
    }
    if (!node.children || node.children.length === 0) {
      return node;
    }
    return {
      ...node,
      children: insertTopicAtLocation(node.children, topic, parentId, index),
    };
  });
}

function topicExistsInTree(nodes: TopicNode[], id: string): boolean {
  return findTopicById(nodes, id) !== null;
}

function collectExpandableTopicIds(nodes: TopicNode[]): string[] {
  const ids: string[] = [];
  for (const node of nodes) {
    if ((node.children?.length ?? 0) > 0) {
      ids.push(node.id);
      ids.push(...collectExpandableTopicIds(node.children ?? []));
    }
  }
  return ids;
}

function collectTopicAndDescendantIds(node: TopicNode): string[] {
  return [
    node.id,
    ...(node.children ?? []).flatMap((child) => collectTopicAndDescendantIds(child)),
  ];
}

function findCriterionLabel(criteria: Criterion[], id: string): string {
  return criteria.find((criterion) => criterion.id === id)?.label ?? "Selected Criterion";
}

function findCriterionById(criteria: Criterion[], id: string): Criterion | undefined {
  return criteria.find((criterion) => criterion.id === id);
}

function isCustomCriterion(criterion: Criterion | undefined): criterion is CustomCriterion {
  return criterion?.kind === "custom";
}

function getSchedulerDescription(mode: SchedulerMode): string {
  switch (mode) {
    case "off":
      return "Evaluation runs only when manually triggered.";
    case "after-every-conversation":
      return "Evaluate each session immediately after it ends.";
    case "daily":
      return "Batch evaluate all new sessions once per day.";
    case "weekly":
      return "Batch evaluate all new sessions once per week.";
    default:
      return "";
  }
}

const AI_BEHAVIOR_AXES = [
  "Instruction Following",
  "Context Retention",
  "Tool Usage",
  "Politeness",
  "Response Clarity",
  "Empathy",
  "Professional Tone",
] as const;

const AI_BEHAVIOR_SCORES = [8, 7.4, 6.9, 7.1, 6.7, 7, 7.5] as const;

function formatPercent(value: number): string {
  return `${value.toFixed(1)}%`;
}

function buildCustomCriteriaDonutOption(outcomeClasses: OutcomeClass[]): EChartsCoreOption {
  const data =
    outcomeClasses.length > 0
      ? outcomeClasses.map((outcome) => ({
          value: outcome.previewShare,
          name: outcome.label,
          itemStyle: { color: outcome.color },
        }))
      : [{ value: 100, name: "No Data", itemStyle: { color: "#d1d5db" } }];

  return {
    animation: true,
    tooltip: { show: false },
    legend: { show: false },
    series: [
      {
        type: "pie",
        radius: ["62%", "86%"],
        center: ["50%", "50%"],
        clockwise: true,
        startAngle: 0,
        avoidLabelOverlap: false,
        label: { show: false },
        emphasis: { scale: false },
        itemStyle: {
          borderColor: "hsl(var(--background))",
          borderWidth: 3,
        },
        data,
      },
    ],
  };
}

function buildCustomCriteriaTrendOption(series: number[]): EChartsCoreOption {
  const safeSeries = series.length > 0 ? series : [0];
  const min = Math.min(...safeSeries);
  const max = Math.max(...safeSeries);
  const pad = Math.max((max - min) * 0.15, 1);

  return {
    animation: true,
    grid: { left: 0, right: 0, top: 4, bottom: 4 },
    tooltip: { show: false },
    xAxis: {
      type: "category",
      data: safeSeries.map((_, index) => index + 1),
      show: false,
      boundaryGap: false,
    },
    yAxis: {
      type: "value",
      show: false,
      min: min - pad,
      max: max + pad,
    },
    series: [
      {
        type: "line",
        data: safeSeries,
        smooth: 0.45,
        symbol: "none",
        lineStyle: {
          width: 4,
          color: "#6e56cf",
          cap: "round",
          join: "round",
        },
      },
    ],
  };
}

function CriteriaPreviewHeader({
  title,
  className,
}: {
  title: string;
  className?: string;
}) {
  return (
    <CardHeader className={cn("pb-3", className)}>
      <CardTitle className="text-sm font-medium">{title}</CardTitle>
    </CardHeader>
  );
}

function SystemKpiTile({
  label,
  value,
  className,
}: {
  label: string;
  value: string;
  className?: string;
}) {
  return (
    <div className={cn("rounded-xl border border-border bg-background p-4", className)}>
      <p className="text-sm text-muted-foreground">{label}</p>
      <KpiMetricValueTitle value={value} className="mt-2" />
    </div>
  );
}

function SystemCriterionDetailLayout({
  title,
  description,
  previewCard,
  output,
}: {
  title: string;
  description: string;
  previewCard: ReactNode;
  output: string;
}) {
  return (
    <div className="space-y-4">
      <div className="space-y-1">
        <h4 className="text-xl font-medium leading-7 text-foreground">{title}</h4>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>

      <div className="space-y-2">
        <p className="text-sm font-medium text-foreground">Preview</p>
        {previewCard}
      </div>

      <div className="space-y-2">
        <div className="space-y-2">
          <Label>Output</Label>
          <AutoSizeOutputField value={output} />
        </div>
      </div>
    </div>
  );
}

function AutoSizeOutputField({ value }: { value: string }) {
  const ref = useRef<HTMLTextAreaElement | null>(null);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.max(36, el.scrollHeight)}px`;
  }, [value]);

  return (
    <Textarea
      ref={ref}
      value={value}
      disabled
      readOnly
      rows={1}
      className="min-h-9 resize-none overflow-hidden"
    />
  );
}

const SENTIMENT_DISTRIBUTION_OPTION: EChartsCoreOption = {
  animation: true,
  tooltip: { show: false },
  legend: {
    show: true,
    bottom: 0,
    left: 0,
    itemWidth: 8,
    itemHeight: 8,
    itemGap: 20,
    icon: "circle",
    textStyle: {
      color: "hsl(var(--muted-foreground))",
      fontSize: 11,
    },
    data: ["Positive", "Neutral", "Negative"],
  },
  grid: { left: 0, right: 0, top: 6, bottom: 20 },
  xAxis: { type: "value", max: 100, show: false },
  yAxis: { type: "category", data: ["Sentiment"], show: false },
  series: [
    {
      name: "Positive",
      type: "bar",
      stack: "sentiment",
      data: [55.3],
      barWidth: 14,
      label: {
        show: true,
        position: "inside",
        formatter: "{c}%",
        color: "#ffffff",
        fontSize: 11,
      },
      itemStyle: { color: "#208337", borderRadius: [999, 0, 0, 999] },
      emphasis: { disabled: true },
    },
    {
      name: "Neutral",
      type: "bar",
      stack: "sentiment",
      data: [24.7],
      barWidth: 14,
      label: {
        show: true,
        position: "inside",
        formatter: "{c}%",
        color: "#ffffff",
        fontSize: 11,
      },
      itemStyle: { color: "#9ca3af" },
      emphasis: { disabled: true },
    },
    {
      name: "Negative",
      type: "bar",
      stack: "sentiment",
      data: [20],
      barWidth: 14,
      label: {
        show: true,
        position: "inside",
        formatter: (params: { value?: number }) => `${(params.value ?? 0).toFixed(1)}%`,
        color: "#ffffff",
        fontSize: 11,
      },
      itemStyle: { color: "#e32926", borderRadius: [0, 999, 999, 0] },
      emphasis: { disabled: true },
    },
  ],
};

function buildSentimentKpiCalloutOption({
  valueText,
  stateLabel,
  deltaText,
  isPositive,
}: {
  valueText: string;
  stateLabel: string;
  deltaText: string;
  isPositive: boolean;
}): EChartsCoreOption {
  const accentColor = isPositive ? "#208337" : "#e32926";
  const badgeBackground = isPositive ? "rgba(32,131,55,0.08)" : "rgba(227,41,38,0.08)";
  const deltaArrow = isPositive ? "\u2191" : "\u2193";

  return {
    animation: true,
    tooltip: { show: false },
    graphic: [
      {
        type: "text",
        left: 0,
        top: 0,
        style: {
          text: `{value|${valueText}} {label|${stateLabel}}`,
          rich: {
            value: {
              fontSize: 36,
              fontWeight: 500,
              lineHeight: 42,
              fill: accentColor,
            },
            label: {
              fontSize: 12,
              fontWeight: 500,
              lineHeight: 42,
              fill: "hsl(var(--muted-foreground))",
            },
          },
        },
      },
      {
        type: "group",
        left: 0,
        top: 56,
        children: [
          {
            type: "rect",
            shape: {
              x: 0,
              y: 0,
              width: 126,
              height: 20,
              r: 6,
            },
            style: {
              fill: badgeBackground,
              stroke: accentColor,
              lineWidth: 1,
            },
          },
          {
            type: "text",
            left: 12,
            top: 4,
            style: {
              text: `${deltaArrow} ${deltaText}`,
              fontSize: 11,
              fontWeight: 500,
              fill: accentColor,
            },
          },
        ],
      },
    ],
  };
}

const SENTIMENT_TOP_KPI_OPTION = buildSentimentKpiCalloutOption({
  valueText: "55.3%",
  stateLabel: "positive sentiment",
  deltaText: "+2.4% vs last week",
  isPositive: true,
});

const SENTIMENT_OUTCOME_BREAKDOWN_OPTION: EChartsCoreOption = {
  animation: true,
  tooltip: { show: false },
  legend: { show: false },
  grid: { left: 70, right: 26, top: 8, bottom: 8 },
  xAxis: { type: "value", max: 50, show: false },
  yAxis: {
    type: "category",
    inverse: true,
    data: ["Improving", "Stable", "Declining"],
    axisLine: { show: false },
    axisTick: { show: false },
    axisLabel: {
      color: "hsl(var(--muted-foreground))",
      fontSize: 11,
    },
  },
  series: [
    {
      type: "bar",
      data: [45, 30, 25],
      barWidth: 10,
      label: {
        show: true,
        position: "right",
        formatter: "{c}%",
        color: "hsl(var(--foreground))",
        fontSize: 11,
      },
      itemStyle: {
        borderRadius: 999,
        color: (params: { dataIndex?: number }) => {
          if (params.dataIndex === 0) return "#208337";
          if (params.dataIndex === 1) return "#9ca3af";
          return "#e32926";
        },
      },
      emphasis: { disabled: true },
    },
  ],
};

const SENTIMENT_POSITIVE_TREND_OPTION: EChartsCoreOption = {
  animation: true,
  tooltip: { show: false },
  legend: { show: false },
  grid: { left: 0, right: 0, top: 0, bottom: 0 },
  xAxis: {
    type: "category",
    data: ["D1", "D2", "D3", "D4", "D5", "D6", "D7"],
    boundaryGap: false,
    show: false,
  },
  yAxis: {
    type: "value",
    show: false,
    min: 50,
    max: 62,
  },
  series: [
    {
      type: "line",
      smooth: 0.35,
      symbol: "none",
      data: [52, 54, 53, 56, 55, 57, 55.3],
      lineStyle: { width: 2, color: "#208337" },
      areaStyle: {
        color: {
          type: "linear",
          x: 0,
          y: 0,
          x2: 0,
          y2: 1,
          colorStops: [
            { offset: 0, color: "rgba(32,131,55,0.28)" },
            { offset: 1, color: "rgba(32,131,55,0.02)" },
          ],
        },
      },
      emphasis: { disabled: true },
    },
  ],
};

const SENTIMENT_INTENSITY_OPTION: EChartsCoreOption = {
  animation: true,
  tooltip: { show: false },
  legend: { show: false },
  grid: { left: 0, right: 0, top: 4, bottom: 18 },
  xAxis: {
    type: "value",
    min: 0,
    max: 100,
    interval: 100,
    axisTick: { show: false },
    axisLine: { show: false },
    splitLine: { show: false },
    axisLabel: {
      color: "hsl(var(--muted-foreground))",
      fontSize: 11,
      formatter: (value: number) => (value === 0 ? "Low intensity" : "High intensity"),
    },
  },
  yAxis: { type: "category", data: ["Intensity"], show: false },
  series: [
    {
      type: "bar",
      data: [72],
      barWidth: 12,
      showBackground: true,
      backgroundStyle: { color: "hsl(var(--muted))", borderRadius: 999 },
      itemStyle: {
        borderRadius: 999,
        color: {
          type: "linear",
          x: 0,
          y: 0,
          x2: 1,
          y2: 0,
          colorStops: [
            { offset: 0, color: "#208337" },
            { offset: 0.65, color: "#ffb800" },
            { offset: 1, color: "#e32926" },
          ],
        },
      },
      emphasis: { disabled: true },
    },
  ],
};

const SENTIMENT_STATE_PROGRESS = [
  {
    id: "improving",
    label: "Improving",
    value: 45,
    bgClassName: "bg-[#208337]/10",
    textClassName: "text-[#208337]",
    Icon: ArrowUp,
  },
  {
    id: "stable",
    label: "Stable",
    value: 30,
    bgClassName: "bg-muted",
    textClassName: "text-[#6b7280]",
    Icon: ArrowRight,
  },
  {
    id: "declining",
    label: "Declining",
    value: 25,
    bgClassName: "bg-[#e32926]/10",
    textClassName: "text-[#e32926]",
    Icon: ArrowDown,
  },
] as const;

const CONTAINMENT_ESCALATION_RISK_OPTION: EChartsCoreOption = {
  animation: true,
  tooltip: { show: false },
  legend: { show: false },
  grid: { left: 0, right: 0, top: 0, bottom: 0 },
  xAxis: { type: "value", max: 100, show: false },
  yAxis: { type: "category", data: ["Risk"], show: false },
  series: [
    {
      type: "bar",
      stack: "risk",
      data: [55.3],
      barWidth: 20,
      label: { show: true, position: "inside", formatter: "{c}%", color: "#ffffff", fontSize: 11 },
      itemStyle: { color: "#208337", borderRadius: [999, 0, 0, 999] },
      emphasis: { disabled: true },
    },
    {
      type: "bar",
      stack: "risk",
      data: [24.7],
      barWidth: 20,
      label: { show: true, position: "inside", formatter: "{c}%", color: "#ffffff", fontSize: 11 },
      itemStyle: { color: "#9ca3af" },
      emphasis: { disabled: true },
    },
    {
      type: "bar",
      stack: "risk",
      data: [20],
      barWidth: 20,
      label: {
        show: true,
        position: "inside",
        formatter: (params: { value?: number }) => `${(params.value ?? 0).toFixed(1)}%`,
        color: "#ffffff",
        fontSize: 11,
      },
      itemStyle: { color: "#e32926", borderRadius: [0, 999, 999, 0] },
      emphasis: { disabled: true },
    },
  ],
};

const AI_BEHAVIOR_RADAR_OPTION: EChartsCoreOption = {
  animation: true,
  tooltip: { show: false },
  legend: { show: false },
  radar: {
    center: ["50%", "52%"],
    radius: "72%",
    startAngle: 90,
    splitNumber: 5,
    indicator: AI_BEHAVIOR_AXES.map((label) => ({ name: label, max: 10 })),
    axisName: { color: "hsl(var(--muted-foreground))", fontSize: 11 },
    splitLine: { lineStyle: { color: "hsl(var(--border))" } },
    splitArea: { show: false },
    axisLine: { lineStyle: { color: "hsl(var(--border))" } },
  },
  series: [
    {
      type: "radar",
      symbol: "circle",
      symbolSize: 5,
      lineStyle: { color: "#6e56cf", width: 2 },
      itemStyle: { color: "#6e56cf", borderColor: "#ffffff", borderWidth: 1 },
      areaStyle: { color: "rgba(110,86,207,0.2)" },
      data: [{ value: AI_BEHAVIOR_SCORES }],
    },
  ],
};

export function AIAgentsSettingsPage() {
  const [activeTab, setActiveTab] = useState<AIAgentsSettingsTab>("evaluation-criteria");
  const [draft, setDraft] = useState<AIAgentsSettingsDraft>(() => createInitialDraft());
  const [savedDraft, setSavedDraft] = useState<AIAgentsSettingsDraft>(() => createInitialDraft());
  const [pendingCustomCriterion, setPendingCustomCriterion] = useState<CustomCriterion | null>(null);
  const [expandedTopicIds, setExpandedTopicIds] = useState<Set<string>>(
    () => new Set(collectExpandableTopicIds(INITIAL_TOPICS)),
  );
  const [editingTopicId, setEditingTopicId] = useState<string | null>(null);
  const [editingTopicLabel, setEditingTopicLabel] = useState("");
  const [newlyAddedTopicIds, setNewlyAddedTopicIds] = useState<Set<string>>(() => new Set());
  const [deleteCustomCriterionId, setDeleteCustomCriterionId] = useState<string | null>(null);

  const hasUnsavedChanges = useMemo(
    () => pendingCustomCriterion !== null || JSON.stringify(draft) !== JSON.stringify(savedDraft),
    [draft, savedDraft, pendingCustomCriterion],
  );

  const selectedCriterion = useMemo(
    () => findCriterionById(draft.criteria, draft.selectedCriterionId),
    [draft.criteria, draft.selectedCriterionId],
  );

  const selectedCriterionId = draft.selectedCriterionId;
  const selectedCustomCriterion = isCustomCriterion(selectedCriterion)
    ? selectedCriterion
    : undefined;
  const isPendingCustomSelected =
    pendingCustomCriterion?.id === selectedCriterionId;
  const activeCustomCriterion = isPendingCustomSelected
    ? pendingCustomCriterion
    : selectedCustomCriterion;
  const isCreatingCustomCriterion = isPendingCustomSelected && pendingCustomCriterion !== null;
  const savedCustomCriterion = useMemo(() => {
    const savedCriterion = findCriterionById(savedDraft.criteria, selectedCriterionId);
    return isCustomCriterion(savedCriterion) ? savedCriterion : undefined;
  }, [savedDraft.criteria, selectedCriterionId]);

  const selectedCriterionLabel = useMemo(
    () =>
      pendingCustomCriterion?.id === selectedCriterionId
        ? pendingCustomCriterion.label
        : findCriterionLabel(draft.criteria, selectedCriterionId),
    [draft.criteria, selectedCriterionId, pendingCustomCriterion],
  );

  const customCriteriaCount = useMemo(
    () => draft.criteria.filter((criterion) => criterion.kind === "custom").length,
    [draft.criteria],
  );
  const customCriterionPendingDelete = useMemo(() => {
    if (!deleteCustomCriterionId) return null;
    const criterion = findCriterionById(draft.criteria, deleteCustomCriterionId);
    return isCustomCriterion(criterion) ? criterion : null;
  }, [deleteCustomCriterionId, draft.criteria]);

  const totalTopics = useMemo(() => countTopics(draft.topics), [draft.topics]);

  const customAverageScore = useMemo(() => {
    const outcomes = savedCustomCriterion?.customConfig.outcomeClasses ?? [];
    if (outcomes.length === 0) {
      return { value: 0, maxScore: 0 };
    }

    const totalShare = outcomes.reduce((sum, outcome) => sum + outcome.previewShare, 0);
    const weightedSum = outcomes.reduce(
      (sum, outcome) => sum + outcome.score * outcome.previewShare,
      0,
    );
    const maxScore = outcomes.reduce((max, outcome) => Math.max(max, outcome.score), 0);

    if (totalShare <= 0 || maxScore <= 0) {
      return { value: 0, maxScore: 0 };
    }

    return {
      value: weightedSum / totalShare,
      maxScore,
    };
  }, [savedCustomCriterion?.customConfig.outcomeClasses]);
  const customCriteriaHeadingDescription = activeCustomCriterion?.customConfig.description.trim() ?? "";

  const customDonutOption = useMemo(
    () =>
      buildCustomCriteriaDonutOption(
        savedCustomCriterion?.customConfig.outcomeClasses ?? [],
      ),
    [savedCustomCriterion?.customConfig.outcomeClasses],
  );

  const customTrendOption = useMemo(
    () =>
      buildCustomCriteriaTrendOption(
        savedCustomCriterion?.customConfig.trendSeries ?? [],
      ),
    [savedCustomCriterion?.customConfig.trendSeries],
  );

  const handleReset = () => {
    setDraft(createInitialDraft());
    setPendingCustomCriterion(null);
    setNewlyAddedTopicIds(new Set());
    toast.message("Settings reset", {
      description: "All AI Agent settings were reset to defaults.",
    });
  };

  const handleCancel = () => {
    setDraft(cloneDraft(savedDraft));
    setPendingCustomCriterion(null);
    setNewlyAddedTopicIds(new Set());
  };

  const handleSave = () => {
    const nextDraft = cloneDraft(draft);
    const isAddingCustomCriterion = pendingCustomCriterion !== null;
    if (pendingCustomCriterion) {
      nextDraft.criteria = [
        ...nextDraft.criteria,
        cloneCriteria([pendingCustomCriterion])[0]!,
      ];
      nextDraft.selectedCriterionId = pendingCustomCriterion.id;
    }
    nextDraft.criteria = normalizeCustomCriteriaDescriptions(nextDraft.criteria);
    setDraft(nextDraft);
    setSavedDraft(cloneDraft(nextDraft));
    setPendingCustomCriterion(null);
    setNewlyAddedTopicIds(new Set());
    if (!isAddingCustomCriterion) {
      toast.success("Settings saved", {
        description: "AI Agent settings were updated for this session.",
      });
    }
  };

  const toggleCriterion = (id: string, enabled: boolean) => {
    setDraft((current) => ({
      ...current,
      criteria: current.criteria.map((criterion) =>
        criterion.id === id ? { ...criterion, enabled } : criterion,
      ),
    }));
  };

  const addCustomCriterion = () => {
    if (pendingCustomCriterion) {
      setDraft((current) => ({
        ...current,
        selectedCriterionId: pendingCustomCriterion.id,
      }));
      return;
    }

    const nextNumber = customCriteriaCount + 1;
    const nextCriterion = createCustomCriterion({
      id: `custom-${Date.now()}`,
      title: `Custom Criteria ${nextNumber}`,
      enabled: false,
    });
    setPendingCustomCriterion(nextCriterion);
    setDraft((current) => ({
      ...current,
      selectedCriterionId: nextCriterion.id,
    }));
  };

  const updateActiveCustomCriterion = (
    updater: (criterion: CustomCriterion) => CustomCriterion,
  ) => {
    if (isPendingCustomSelected && pendingCustomCriterion) {
      setPendingCustomCriterion((current) => (current ? updater(current) : current));
      return;
    }

    setDraft((current) => ({
      ...current,
      criteria: current.criteria.map((criterion) => {
        if (criterion.id !== selectedCriterionId || criterion.kind !== "custom") {
          return criterion;
        }
        return updater(criterion);
      }),
    }));
  };

  const updateSelectedCustomTitle = (title: string) => {
    updateActiveCustomCriterion((criterion) => ({
      ...criterion,
      label: title.trim() || "Untitled Criteria",
      customConfig: {
        ...criterion.customConfig,
        title,
      },
    }));
  };

  const updateSelectedCustomConfig = (
    key: "description" | "evaluationInstruction",
    value: string,
  ) => {
    updateActiveCustomCriterion((criterion) => ({
      ...criterion,
      customConfig: {
        ...criterion.customConfig,
        [key]: value,
      },
    }));
  };

  const updateSelectedCustomWidgetType = (widgetType: CustomWidgetType) => {
    updateActiveCustomCriterion((criterion) => ({
      ...criterion,
      customConfig: {
        ...criterion.customConfig,
        widgetType,
        outcomeClasses: createOutcomeClassesForWidgetType(criterion.id, widgetType),
      },
    }));
  };

  const moveSelectedOutcomeClass = (outcomeId: string, direction: -1 | 1) => {
    updateActiveCustomCriterion((criterion) => {
      const outcomes = [...criterion.customConfig.outcomeClasses];
      const currentIndex = outcomes.findIndex((outcome) => outcome.id === outcomeId);
      if (currentIndex < 0) return criterion;

      const nextIndex = currentIndex + direction;
      if (nextIndex < 0 || nextIndex >= outcomes.length) return criterion;

      const [item] = outcomes.splice(currentIndex, 1);
      outcomes.splice(nextIndex, 0, item!);

      return {
        ...criterion,
        customConfig: {
          ...criterion.customConfig,
          outcomeClasses: outcomes,
        },
      };
    });
  };

  const updateSelectedOutcomeClass = (
    outcomeId: string,
    updater: (outcome: OutcomeClass) => OutcomeClass,
  ) => {
    updateActiveCustomCriterion((criterion) => ({
      ...criterion,
      customConfig: {
        ...criterion.customConfig,
        outcomeClasses: criterion.customConfig.outcomeClasses.map((outcome) =>
          outcome.id === outcomeId ? updater(outcome) : outcome,
        ),
      },
    }));
  };

  const requestDeleteCustomCriterion = (criterionId: string) => {
    setDeleteCustomCriterionId(criterionId);
  };

  const confirmDeleteCustomCriterion = () => {
    if (!deleteCustomCriterionId) return;
    const criterionToDelete = findCriterionById(draft.criteria, deleteCustomCriterionId);
    if (!isCustomCriterion(criterionToDelete)) {
      setDeleteCustomCriterionId(null);
      return;
    }

    setDraft((current) => {
      const nextCriteria = current.criteria.filter(
        (criterion) => criterion.id !== criterionToDelete.id,
      );
      const fallbackCriterionId =
        nextCriteria[0]?.id ?? current.selectedCriterionId;
      return {
        ...current,
        criteria: nextCriteria,
        selectedCriterionId:
          current.selectedCriterionId === criterionToDelete.id
            ? fallbackCriterionId
            : current.selectedCriterionId,
      };
    });
    setDeleteCustomCriterionId(null);
    toast.success(`Deleted "${criterionToDelete.label}"`, {
      description: "This change is local until you save.",
    });
  };

  const addTopLevelTopic = () => {
    const nextNumber = draft.topics.length + 1;
    const nextTopic: TopicNode = {
      id: `new-topic-${Date.now()}`,
      label: `New Topic ${nextNumber}`,
    };
    setDraft((current) => ({
      ...current,
      topics: [...current.topics, nextTopic],
    }));
    setEditingTopicId(nextTopic.id);
    setEditingTopicLabel(nextTopic.label);
    setNewlyAddedTopicIds((current) => {
      const next = new Set(current);
      next.add(nextTopic.id);
      return next;
    });
    toast.success("Topic added", {
      description: `${nextTopic.label} was added to the library.`,
    });
  };

  const handleImportCsv = () => {
    toast.message("Import started", {
      description: "CSV import is simulated in this mock settings surface.",
    });
  };

  const startTopicRename = (topicId: string) => {
    const topic = findTopicById(draft.topics, topicId);
    if (!topic) return;
    setEditingTopicId(topicId);
    setEditingTopicLabel(topic.label);
  };

  const commitTopicRename = () => {
    if (!editingTopicId) return;
    const trimmedLabel = editingTopicLabel.trim();
    if (!trimmedLabel) {
      cancelTopicRename();
      return;
    }
    setDraft((current) => ({
      ...current,
      topics: updateTopicLabelById(current.topics, editingTopicId, trimmedLabel),
    }));
    setNewlyAddedTopicIds((current) => {
      if (!current.has(editingTopicId)) return current;
      const next = new Set(current);
      next.delete(editingTopicId);
      return next;
    });
    setEditingTopicId(null);
    setEditingTopicLabel("");
  };

  const cancelTopicRename = () => {
    if (editingTopicId && newlyAddedTopicIds.has(editingTopicId)) {
      const removal = removeTopicById(draft.topics, editingTopicId);
      if (removal.removed) {
        setDraft((current) => ({
          ...current,
          topics: removeTopicById(current.topics, editingTopicId).nodes,
        }));
        setExpandedTopicIds((current) => {
          const next = new Set(current);
          collectTopicAndDescendantIds(removal.removed!).forEach((id) => next.delete(id));
          return next;
        });
        setNewlyAddedTopicIds((current) => {
          const next = new Set(current);
          collectTopicAndDescendantIds(removal.removed!).forEach((id) => next.delete(id));
          return next;
        });
      }
    }
    setEditingTopicId(null);
    setEditingTopicLabel("");
  };

  const addSubtopic = (parentId: string) => {
    const newTopicId = `topic-${Date.now()}`;
    let newTopicLabel = "New Subtopic 1";

    setDraft((current) => {
      const parent = findTopicById(current.topics, parentId);
      const nextNumber = (parent?.children?.length ?? 0) + 1;
      newTopicLabel = `New Subtopic ${nextNumber}`;
      const nextTopic: TopicNode = {
        id: newTopicId,
        label: newTopicLabel,
      };

      return {
        ...current,
        topics: addChildTopicById(current.topics, parentId, nextTopic),
      };
    });
    setExpandedTopicIds((current) => {
      const next = new Set(current);
      next.add(parentId);
      return next;
    });

    setEditingTopicId(newTopicId);
    setEditingTopicLabel(newTopicLabel);
    setNewlyAddedTopicIds((current) => {
      const next = new Set(current);
      next.add(newTopicId);
      return next;
    });
  };

  const deleteTopic = (topicId: string) => {
    const removal = removeTopicById(draft.topics, topicId);
    const removedTopic = removal.removed;
    if (!removedTopic) return;

    const removedParentId = removal.parentId;
    const removedIndex = removal.index;
    let removedExpandedIds: string[] = [];

    setDraft((current) => ({
      ...current,
      topics: removal.nodes,
    }));
    setNewlyAddedTopicIds((current) => {
      const next = new Set(current);
      collectTopicAndDescendantIds(removedTopic).forEach((id) => next.delete(id));
      return next;
    });

    setExpandedTopicIds((current) => {
      const next = new Set(current);
      const removedIds = collectTopicAndDescendantIds(removedTopic);
      removedExpandedIds = removedIds.filter((id) => next.has(id));
      removedIds.forEach((id) => next.delete(id));
      return next;
    });

    setEditingTopicId((currentEditingId) => {
      if (!currentEditingId) return null;
      if (currentEditingId === removedTopic.id) return null;
      if (topicExistsInTree([removedTopic], currentEditingId)) return null;
      return currentEditingId;
    });
    setEditingTopicLabel("");

    toast.success(`Deleted "${removedTopic.label}"`, {
      action: {
        label: "Undo",
        onClick: () => {
          setDraft((current) => ({
            ...current,
            topics: insertTopicAtLocation(
              current.topics,
              removedTopic,
              removedParentId,
              removedIndex,
            ),
          }));
          setExpandedTopicIds((current) => {
            const next = new Set(current);
            removedExpandedIds.forEach((id) => next.add(id));
            if (removedParentId) next.add(removedParentId);
            return next;
          });
        },
      },
    });
  };

  const toggleTopicExpanded = (topicId: string) => {
    setExpandedTopicIds((current) => {
      const next = new Set(current);
      if (next.has(topicId)) {
        next.delete(topicId);
      } else {
        next.add(topicId);
      }
      return next;
    });
  };

  const renderTopicNode = (node: TopicNode): JSX.Element => {
    const hasChildren = (node.children?.length ?? 0) > 0;
    const isExpanded = hasChildren && expandedTopicIds.has(node.id);
    const isEditing = editingTopicId === node.id;
    return (
      <div key={node.id} className="space-y-1">
        <div
          className={cn(
            "group/topic flex h-8 items-center gap-2 rounded-md px-2 text-sm hover:bg-primary-25/70 focus-within:bg-primary-25/70",
            hasChildren && !isEditing ? "cursor-pointer" : undefined,
          )}
          onClick={() => {
            if (!hasChildren || isEditing) return;
            toggleTopicExpanded(node.id);
          }}
        >
          {hasChildren ? (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-xs"
                  className="h-6 w-6 shrink-0"
                  aria-label={isExpanded ? `Collapse ${node.label}` : `Expand ${node.label}`}
                  onClick={(event) => {
                    event.stopPropagation();
                    toggleTopicExpanded(node.id);
                  }}
                >
                  {isExpanded ? (
                    <ChevronDown className="size-3.5 text-muted-foreground" />
                  ) : (
                    <ChevronRight className="size-3.5 text-muted-foreground" />
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom">{isExpanded ? "Collapse" : "Expand"}</TooltipContent>
            </Tooltip>
          ) : (
            <span className="h-6 w-6 shrink-0" />
          )}
          {isEditing ? (
            <div className="flex min-w-0 flex-1 items-center gap-1">
              <Input
                value={editingTopicLabel}
                onChange={(event) => setEditingTopicLabel(event.target.value)}
                onBlur={commitTopicRename}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    event.preventDefault();
                    commitTopicRename();
                  }
                  if (event.key === "Escape") {
                    event.preventDefault();
                    cancelTopicRename();
                  }
                }}
                className="h-7 min-w-0 flex-1"
                autoFocus
              />
              <div className="flex items-center gap-0.5">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-xs"
                      aria-label={`Cancel rename for ${node.label}`}
                      onMouseDown={(event) => event.preventDefault()}
                      onClick={(event) => {
                        event.stopPropagation();
                        cancelTopicRename();
                      }}
                    >
                      <X className="size-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="bottom">Cancel</TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-xs"
                      aria-label={`Save rename for ${node.label}`}
                      onMouseDown={(event) => event.preventDefault()}
                      onClick={(event) => {
                        event.stopPropagation();
                        commitTopicRename();
                      }}
                    >
                      <Check className="size-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="bottom">Save</TooltipContent>
                </Tooltip>
              </div>
            </div>
          ) : (
            <>
              <span className="min-w-0 flex-1 truncate text-foreground">{node.label}</span>
              <div className="ml-auto flex items-center gap-0.5 opacity-0 transition-opacity group-hover/topic:opacity-100">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-xs"
                      aria-label={`Add subtopic under ${node.label}`}
                      onClick={(event) => {
                        event.stopPropagation();
                        addSubtopic(node.id);
                      }}
                    >
                      <Plus className="size-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="bottom">Add Subtopic</TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-xs"
                      aria-label={`Rename ${node.label}`}
                      onClick={(event) => {
                        event.stopPropagation();
                        startTopicRename(node.id);
                      }}
                    >
                      <Pencil className="size-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="bottom">Rename</TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-xs"
                      aria-label={`Delete ${node.label}`}
                      onClick={(event) => {
                        event.stopPropagation();
                        deleteTopic(node.id);
                      }}
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="bottom">Delete</TooltipContent>
                </Tooltip>
              </div>
            </>
          )}
        </div>
        {hasChildren && isExpanded ? (
          <div className="relative ml-3 pl-5">
            <span className="pointer-events-none absolute bottom-0 left-2 top-0 w-px bg-border/70" />
            <div className="space-y-1">
              {node.children!.map((child) => renderTopicNode(child))}
            </div>
          </div>
        ) : null}
      </div>
    );
  };

  return (
    <Tabs
      value={activeTab}
      onValueChange={(value) => setActiveTab(value as AIAgentsSettingsTab)}
      className="flex flex-1 min-h-0 flex-col"
    >
      <div className="flex flex-1 min-h-0 flex-col">
        <PageHeader className={pageHeaderTabsFooterClassName}>
          <section className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <h1 className="text-3xl tracking-tight text-primary-900">Settings</h1>
              <p className="mt-1 max-w-3xl text-sm text-muted-foreground">
                Control how the AI Conversation Analyzer evaluates your agent sessions. Changes here
                determine which quality criteria are scored, how conversations are categorized, and
                when analysis runs.
              </p>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-8"
                onClick={handleReset}
              >
                <RotateCcw className="size-3.5" />
                Reset
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-8"
                onClick={handleCancel}
                disabled={!hasUnsavedChanges}
              >
                Cancel
              </Button>
              <Button
                type="button"
                size="sm"
                className="h-8"
                onClick={handleSave}
                disabled={!hasUnsavedChanges}
              >
                Save &amp; Re-Analyze
              </Button>
            </div>
          </section>
          <TabsList variant="line" className="mt-4">
            {AI_AGENT_SETTINGS_TABS.map((tab) => (
              <TabsTrigger key={tab.value} value={tab.value}>
                {tab.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </PageHeader>

        <div className="flex-1 min-h-0 overflow-hidden">
          <div className={cn(pageRootListScrollGutterClassName, "h-full pb-8")}>
            <PageTransition className={cn(pageMainColumnClassName, "flex h-full min-h-0 flex-col")}>
              <TabsContent value="evaluation-criteria" className="mt-0 flex min-h-0 flex-1 flex-col gap-4 overflow-hidden">
                <p className="max-w-4xl text-sm text-muted-foreground">
                  Criteria define what the AI evaluates in each conversation. Toggle criteria on or
                  off to control which visualizations appear on the dashboard. Select any criterion
                  to preview its visualization. New criteria need a re-analyze to generate data.
                </p>

                <div className="grid min-h-0 flex-1 gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(0,2fr)]">
                  <aside className="min-h-0 -mb-8 overflow-y-auto pb-8">
                    <div className="space-y-2">
                      <h3 className="pb-1 text-sm font-medium">System Criteria</h3>
                    {draft.criteria
                      .filter((criterion) => criterion.kind === "system")
                      .map((criterion) => (
                        <button
                          type="button"
                          key={criterion.id}
                          className={cn(
                            "flex w-full cursor-pointer items-center justify-between rounded-[12px] border px-4 py-3 text-left transition-colors duration-150",
                            draft.selectedCriterionId === criterion.id
                              ? "border-primary/50 bg-primary-25 text-primary-900 shadow-[inset_0_0_0_1px_hsl(var(--primary)/0.3)]"
                              : "border-border bg-background text-foreground hover:border-primary/40 hover:bg-primary-25/50",
                          )}
                          onClick={() =>
                            setDraft((current) => ({
                              ...current,
                              selectedCriterionId: criterion.id,
                            }))
                          }
                          >
                          <span className="text-sm font-medium">{criterion.label}</span>
                          <Switch
                            checked={criterion.enabled}
                            onClick={(event) => event.stopPropagation()}
                            onCheckedChange={(checked) =>
                              toggleCriterion(criterion.id, checked === true)
                            }
                          />
                        </button>
                      ))}

                    <div className="mt-4 flex items-center justify-between">
                      <h4 className="pb-1 text-sm font-medium">
                        Custom Criteria ({customCriteriaCount})
                      </h4>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-7 px-2 text-xs"
                        onClick={addCustomCriterion}
                      >
                        <Plus className="size-3.5" />
                        Add Criteria
                      </Button>
                    </div>

                    {draft.criteria
                      .filter((criterion) => criterion.kind === "custom")
                      .map((criterion) => (
                        <div
                          key={criterion.id}
                          role="button"
                          tabIndex={0}
                          className={cn(
                            "flex w-full cursor-pointer items-center justify-between rounded-[12px] border px-4 py-3 text-left transition-colors duration-150",
                            draft.selectedCriterionId === criterion.id
                              ? "border-primary/50 bg-primary-25 text-primary-900 shadow-[inset_0_0_0_1px_hsl(var(--primary)/0.3)]"
                              : "border-border bg-background text-foreground hover:border-primary/40 hover:bg-primary-25/50",
                          )}
                          onClick={() =>
                            setDraft((current) => ({
                              ...current,
                              selectedCriterionId: criterion.id,
                            }))
                          }
                          onKeyDown={(event) => {
                            if (event.key !== "Enter" && event.key !== " ") return;
                            event.preventDefault();
                            setDraft((current) => ({
                              ...current,
                              selectedCriterionId: criterion.id,
                            }));
                          }}
                          >
                          <span className="min-w-0">
                            <span className="block truncate text-sm font-medium">{criterion.label}</span>
                            <span className="block truncate text-xs text-muted-foreground">
                              {criterion.customConfig.widgetType}
                            </span>
                          </span>
                          <div className="ml-2 flex items-center gap-1">
                            <Switch
                              checked={criterion.enabled}
                              onClick={(event) => event.stopPropagation()}
                              onCheckedChange={(checked) =>
                                toggleCriterion(criterion.id, checked === true)
                              }
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </aside>

                  <section
                    className={cn(
                      "relative min-h-0 rounded-xl border border-border/70 bg-background",
                      activeCustomCriterion
                        ? "flex flex-col overflow-hidden"
                        : "overflow-y-auto p-4 pb-8",
                    )}
                  >
                    {activeCustomCriterion ? (
                    <>
                    <div className="min-h-0 flex-1 overflow-y-auto p-4 pb-8">
                      <div className="space-y-4">
                        <div className="space-y-1">
                          <h4 className="text-xl font-medium leading-7 text-foreground">
                            {activeCustomCriterion.customConfig.title || "New Criteria"}
                          </h4>
                          {customCriteriaHeadingDescription ? (
                            <p className="text-sm text-muted-foreground">
                              {customCriteriaHeadingDescription}
                            </p>
                          ) : null}
                        </div>

                        <div className="space-y-2">
                        <p className="text-sm font-medium text-foreground">Preview</p>
                        <Card className="group/widget rounded-lg transition-[box-shadow,border-color] hover:shadow-md hover:border-primary/30">
                          {savedCustomCriterion ? (
                            <CardContent className="space-y-5 pt-5">
                              <div className="flex items-start justify-between gap-4">
                                <div className="flex items-center gap-3">
                                  <p className="text-3xl font-medium tracking-[0.04em] text-muted-foreground">
                                    {(savedCustomCriterion.customConfig.title || "Custom Criteria").toUpperCase()}
                                  </p>
                                  <div className="inline-flex w-fit items-center rounded-md bg-muted px-3 py-1 text-sm font-medium text-muted-foreground">
                                    {savedCustomCriterion.customConfig.confidencePct}% conf.
                                  </div>
                                </div>
                                <p
                                  className={cn(
                                    "inline-flex items-center gap-1 text-4xl font-medium leading-none",
                                    savedCustomCriterion.customConfig.trendDeltaPct >= 0
                                      ? "text-success"
                                      : "text-destructive",
                                  )}
                                >
                                  {savedCustomCriterion.customConfig.trendDeltaPct >= 0 ? "+" : ""}
                                  {formatPercent(savedCustomCriterion.customConfig.trendDeltaPct)}
                                  {savedCustomCriterion.customConfig.trendDeltaPct >= 0 ? (
                                    <ArrowUpRight className="size-6" />
                                  ) : (
                                    <ArrowDownRight className="size-6" />
                                  )}
                                </p>
                              </div>

                              <div className="flex flex-wrap items-center justify-between gap-6">
                                <div className="flex min-w-[20rem] flex-wrap items-center gap-4">
                                  <div className="h-[160px] w-[160px] shrink-0">
                                    <EChartsCanvas option={customDonutOption} className="h-full w-full" />
                                  </div>
                                  <div className="flex flex-col gap-2">
                                    <p className="text-6xl font-semibold leading-none text-foreground">
                                      {customAverageScore.maxScore > 0
                                        ? `${customAverageScore.value.toFixed(2)}/${customAverageScore.maxScore}`
                                        : "N/A"}
                                    </p>
                                    <p className="text-2xl font-medium tracking-[0.04em] text-muted-foreground">
                                      AVG SCORE
                                    </p>
                                    <div className="mt-1 flex flex-wrap gap-6 text-foreground">
                                      {savedCustomCriterion.customConfig.outcomeClasses.map((outcome) => (
                                        <span
                                          key={outcome.id}
                                          className="inline-flex items-center gap-2 text-sm font-normal"
                                        >
                                          <span
                                            className="h-4 w-4 rounded-full"
                                            style={{ backgroundColor: outcome.color }}
                                          />
                                          {outcome.label}
                                        </span>
                                      ))}
                                    </div>
                                  </div>
                                </div>

                                <div className="ml-auto w-full max-w-[220px] self-end">
                                  <div className="h-24 w-full">
                                    <EChartsCanvas option={customTrendOption} className="h-full w-full" />
                                  </div>
                                </div>
                              </div>
                            </CardContent>
                          ) : (
                            <CardContent className="pt-0">
                              <Empty variant="solid" className="min-h-[180px] border-border/70">
                                <EmptyHeader>
                                  <EmptyMedia variant="icon">
                                    <BarChart3 />
                                  </EmptyMedia>
                                  <EmptyTitle>No preview data yet</EmptyTitle>
                                  <EmptyDescription>
                                    Save this custom criterion and run the analyzer to generate
                                    visualizations.
                                  </EmptyDescription>
                                </EmptyHeader>
                              </Empty>
                            </CardContent>
                          )}
                        </Card>
                      </div>

                        <div className="space-y-4">
                        <div className="max-w-[400px] space-y-2">
                          <Label>
                            Title <span className="text-destructive">*</span>
                          </Label>
                          <Input
                            value={activeCustomCriterion.customConfig.title}
                            placeholder="e.g., Accuracy"
                            onChange={(event) => updateSelectedCustomTitle(event.target.value)}
                            className="h-9"
                          />
                        </div>

                        <div className="max-w-[400px] space-y-2">
                          <Label>Description</Label>
                          <Textarea
                            value={activeCustomCriterion.customConfig.description}
                            placeholder="Brief description of what this criterion measures"
                            onChange={(event) =>
                              updateSelectedCustomConfig("description", event.target.value)
                            }
                            className="min-h-20 resize-y"
                          />
                        </div>

                        <div className="max-w-[720px] space-y-2">
                          <Label>
                            Evaluation Instruction <span className="text-destructive">*</span>
                          </Label>
                          <p className="text-sm text-muted-foreground">
                            Write a clear instruction that tells the AI exactly how to score this
                            criterion. Be specific about what constitutes each score level. This
                            text is sent verbatim to the LLM for every conversation it evaluates.
                          </p>
                          <Textarea
                            value={activeCustomCriterion.customConfig.evaluationInstruction}
                            placeholder="Example: Evaluate whether the agent provided factually correct information. Score 3 (pass) if all facts are correct, 2 (partial) if mostly correct with minor errors, 1 (fail) if significant misinformation was provided."
                            onChange={(event) =>
                              updateSelectedCustomConfig(
                                "evaluationInstruction",
                                event.target.value,
                              )
                            }
                            className="min-h-24 resize-y max-w-[400px]"
                          />
                        </div>

                        <div className="max-w-[400px] space-y-2">
                          <Label>Widget Type</Label>
                          <Select
                            value={activeCustomCriterion.customConfig.widgetType}
                            disabled={!isCreatingCustomCriterion}
                            onValueChange={(value) =>
                              updateSelectedCustomWidgetType(value as CustomWidgetType)
                            }
                          >
                            <SelectTrigger className="h-9">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {CUSTOM_WIDGET_TYPES.map((type) => (
                                <SelectItem key={type} value={type}>
                                  {type}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        {supportsOutcomeClasses(activeCustomCriterion.customConfig.widgetType) ? (
                          <div className="space-y-2">
                            <Label>Outcome Classes</Label>
                            <div className="space-y-2">
                              {activeCustomCriterion.customConfig.outcomeClasses.map(
                              (outcome, index) => (
                                <div key={outcome.id} className="flex items-center gap-3">
                                  <div className="flex flex-col">
                                    <Button
                                      type="button"
                                      variant="ghost"
                                      size="icon-xs"
                                      className="h-6 w-6"
                                      disabled={index === 0}
                                      onClick={() =>
                                        moveSelectedOutcomeClass(outcome.id, -1)
                                      }
                                    >
                                      <ChevronUp className="size-3.5" />
                                    </Button>
                                    <Button
                                      type="button"
                                      variant="ghost"
                                      size="icon-xs"
                                      className="h-6 w-6"
                                      disabled={
                                        index ===
                                        activeCustomCriterion.customConfig.outcomeClasses
                                          .length -
                                          1
                                      }
                                      onClick={() =>
                                        moveSelectedOutcomeClass(outcome.id, 1)
                                      }
                                    >
                                      <ChevronDown className="size-3.5" />
                                    </Button>
                                  </div>

                                  <Popover>
                                    <PopoverTrigger asChild>
                                      <Button
                                        type="button"
                                        variant="ghost"
                                        className="h-9 w-9 shrink-0 rounded-lg border border-border p-0 hover:bg-transparent"
                                        aria-label={`Select color for ${outcome.label}`}
                                      >
                                        <span
                                          className="block h-full w-full rounded-[7px]"
                                          style={{ backgroundColor: outcome.color }}
                                        />
                                      </Button>
                                    </PopoverTrigger>
                                    <PopoverContent align="start" className="w-auto p-2">
                                      <div className="grid grid-cols-4 gap-2">
                                        {OUTCOME_CLASS_COLOR_PALETTE.map((color) => {
                                          const isSelected =
                                            outcome.color.toLowerCase() === color.toLowerCase();
                                          return (
                                            <Button
                                              key={color}
                                              type="button"
                                              variant="ghost"
                                              className={cn(
                                                "relative h-7 w-7 rounded-md border border-border p-0 hover:scale-105 hover:bg-transparent",
                                                isSelected &&
                                                  "ring-2 ring-primary ring-offset-2 ring-offset-background",
                                              )}
                                              style={{ backgroundColor: color }}
                                              onClick={() =>
                                                updateSelectedOutcomeClass(outcome.id, (current) => ({
                                                  ...current,
                                                  color,
                                                }))
                                              }
                                              aria-label={`Set outcome color to ${color}`}
                                            >
                                              {isSelected ? (
                                                <Check className="size-3 text-white drop-shadow-[0_1px_1px_rgba(0,0,0,0.8)]" />
                                              ) : null}
                                            </Button>
                                          );
                                        })}
                                      </div>
                                    </PopoverContent>
                                  </Popover>

                                  <Input
                                    value={outcome.label}
                                    onChange={(event) =>
                                      updateSelectedOutcomeClass(outcome.id, (current) => ({
                                        ...current,
                                        label: event.target.value,
                                      }))
                                    }
                                    className="h-9 flex-1"
                                  />

                                  <Input
                                    type="number"
                                    min={0}
                                    max={10}
                                    step={1}
                                    value={outcome.score}
                                    onChange={(event) => {
                                      const parsed = Number(event.target.value);
                                      if (!Number.isFinite(parsed)) return;
                                      updateSelectedOutcomeClass(outcome.id, (current) => ({
                                        ...current,
                                        score: Math.max(0, Math.min(10, Math.round(parsed))),
                                      }));
                                    }}
                                    className="h-9 w-24"
                                  />
                                </div>
                              ),
                            )}
                            </div>
                          </div>
                        ) : null}
                        </div>
                      </div>
                    </div>
                    <div className="shrink-0 border-t border-border/80 bg-white px-4 py-3">
                      <div className="flex items-center justify-end gap-2">
                        {!isCreatingCustomCriterion ? (
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="h-9 border-destructive/40 text-destructive hover:bg-destructive/10 hover:text-destructive"
                            onClick={() => requestDeleteCustomCriterion(activeCustomCriterion.id)}
                          >
                            Delete
                          </Button>
                        ) : null}
                        {isCreatingCustomCriterion ? (
                          <>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              className="h-9"
                              onClick={handleCancel}
                              disabled={!hasUnsavedChanges}
                            >
                              Cancel
                            </Button>
                            <Button
                              type="button"
                              size="sm"
                              className="h-9"
                              onClick={handleSave}
                              disabled={!hasUnsavedChanges}
                            >
                              Add to Criteria
                            </Button>
                          </>
                        ) : null}
                      </div>
                    </div>
                    </>
                    ) : selectedCriterionId === "containment-success" ? (
                    <SystemCriterionDetailLayout
                      title="Containment & Success"
                      description="Tracks whether the conversation was escalated and whether it was resolved"
                      output="Contained/Escalated, Resolved/Unresolved"
                      previewCard={
                        <Card className="rounded-lg">
                          <CriteriaPreviewHeader
                            title="Containment & Success"
                          />
                          <CardContent className="space-y-4 pt-0">

                            <div className="grid gap-3 md:grid-cols-3">
                              <SystemKpiTile label="Success Rate" value="84%" />
                              <SystemKpiTile label="Containment" value="88.8%" />
                              <SystemKpiTile label="High Escalation" value="11.8%" />
                            </div>

                            <div className="h-[86px]">
                              <EChartsCanvas
                                option={SENTIMENT_TOP_KPI_OPTION}
                                className="h-full w-full"
                              />
                            </div>

                            <div className="space-y-1">
                              <p className="text-sm font-medium text-foreground">Escalation Risk</p>
                              <div className="h-5">
                                <EChartsCanvas
                                  option={CONTAINMENT_ESCALATION_RISK_OPTION}
                                  className="h-full w-full"
                                />
                              </div>
                              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                                <span className="inline-flex items-center gap-1.5">
                                  <span className="h-2.5 w-2.5 rounded-[3px] bg-success" />
                                  Low
                                </span>
                                <span className="inline-flex items-center gap-1.5">
                                  <span className="h-2.5 w-2.5 rounded-[3px] bg-[#9ca3af]" />
                                  Medium
                                </span>
                                <span className="inline-flex items-center gap-1.5">
                                  <span className="h-2.5 w-2.5 rounded-[3px] bg-destructive" />
                                  High
                                </span>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      }
                    />
                    ) : selectedCriterionId === "ai-behavior-quality" ? (
                    <SystemCriterionDetailLayout
                      title="AI Behaviour Quality"
                      description="Produces 7 quality scores (0-10) evaluating different aspects of agent behavior"
                      output="instructionFollowing, contextRetention, toolUsageCorrectness, politeness, responseClarity, empathyScore, professionalTone"
                      previewCard={
                        <Card className="rounded-lg">
                          <CriteriaPreviewHeader
                            title="AI Behaviour Quality"
                          />
                          <CardContent className="space-y-4 pt-0">

                            <div className="grid gap-3 md:grid-cols-3">
                              <SystemKpiTile label="Success Rate" value="84%" className="md:col-span-1" />
                            </div>

                            <div className="flex items-center justify-center">
                              <div className="h-[300px] w-full max-w-[460px]">
                                <EChartsCanvas option={AI_BEHAVIOR_RADAR_OPTION} className="h-full w-full" />
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      }
                    />
                    ) : selectedCriterionId === "ai-agent-experience-quality" ? (
                    <SystemCriterionDetailLayout
                      title="AI Agent Experience Quality"
                      description="Evaluates the overall quality of the agent experience from the customer perspective"
                      output="Overall experience score"
                      previewCard={
                        <Card className="rounded-lg">
                          <CriteriaPreviewHeader
                            title="AI Agent Experience Quality"
                          />
                          <CardContent className="space-y-4 pt-0">

                            <div className="grid gap-3 md:grid-cols-3 md:items-end">
                              <SystemKpiTile
                                label="Evaluated Sessions"
                                value="400"
                                className="md:col-span-1"
                              />
                              <p className="text-sm text-muted-foreground md:col-span-2">
                                This criterion evaluates the overall quality of the agent experience from the
                                customer&apos;s perspective. When enabled, each conversation receives an
                                overall experience score.
                              </p>
                            </div>
                          </CardContent>
                        </Card>
                      }
                    />
                    ) : (
                    <SystemCriterionDetailLayout
                      title={selectedCriterionLabel}
                      description="Detects overall sentiment of the customer throughout the conversation."
                      output="Positive / Neutral / Negative"
                      previewCard={
                        <Card className="rounded-lg">
                          <CardHeader className="pb-3">
                            <CardTitle className="text-sm font-medium">{selectedCriterionLabel}</CardTitle>
                          </CardHeader>
                          <CardContent className="space-y-4">
                            <div className="h-[86px]">
                              <EChartsCanvas
                                option={SENTIMENT_TOP_KPI_OPTION}
                                className="h-full w-full"
                              />
                            </div>

                            <div className="space-y-1">
                              <div className="flex items-center justify-between text-xs text-muted-foreground">
                                <Label>Sentiment Distribution</Label>
                                <span>Share of conversations by tone</span>
                              </div>
                              <div className="h-[52px]">
                                <EChartsCanvas
                                  option={SENTIMENT_DISTRIBUTION_OPTION}
                                  className="h-full w-full"
                                />
                              </div>
                            </div>

                            <div className="space-y-3">
                              <h4 className="text-sm font-medium text-foreground">Emotional Intensity</h4>
                              <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_minmax(0,2fr)] md:items-stretch">
                                <div className="space-y-3">
                                  {SENTIMENT_STATE_PROGRESS.map((state) => (
                                    <div
                                      key={state.id}
                                      className="rounded-lg border border-border p-3"
                                    >
                                      <div className="flex items-start gap-3">
                                        <div
                                          className={cn(
                                            "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg",
                                            state.bgClassName,
                                          )}
                                        >
                                          <state.Icon className={cn("size-5", state.textClassName)} />
                                        </div>
                                        <div className="min-w-0 flex-1 space-y-1.5">
                                          <div className="flex items-center justify-between gap-3">
                                            <p className="text-sm font-medium text-muted-foreground">
                                              {state.label}
                                            </p>
                                            <p className={cn("text-2xl font-semibold", state.textClassName)}>
                                              {state.value}%
                                            </p>
                                          </div>
                                          <Progress
                                            value={state.value}
                                            className="h-2 bg-muted"
                                            indicatorClassName={cn(
                                              "rounded-full",
                                              state.id === "improving" && "bg-[#208337]",
                                              state.id === "stable" && "bg-[#9ca3af]",
                                              state.id === "declining" && "bg-[#e32926]",
                                            )}
                                          />
                                        </div>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                                <div className="flex h-full flex-col overflow-hidden rounded-lg border border-border">
                                  <p className="px-3 pt-3 text-[12px] text-muted-foreground">
                                    Positive sentiment - last 7 days
                                  </p>
                                  <div className="min-h-[180px] flex-1 w-full p-4">
                                    <EChartsCanvas
                                      option={SENTIMENT_POSITIVE_TREND_OPTION}
                                      className="h-full w-full"
                                    />
                                  </div>
                                  <div className="flex items-center justify-between px-3 py-2 text-[11px] text-muted-foreground">
                                    <span>7 days ago</span>
                                    <span>Today</span>
                                  </div>
                                </div>
                              </div>
                            </div>

                            <div className="space-y-2">
                              <div className="flex items-center justify-between gap-3">
                                <h4 className="text-sm font-medium text-foreground">Emotional Intensity</h4>
                                <span className="text-sm text-muted-foreground">
                                  Average emotional weight across conversations
                                </span>
                              </div>
                              <div className="h-10">
                                <EChartsCanvas
                                  option={SENTIMENT_INTENSITY_OPTION}
                                  className="h-full w-full"
                                />
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      }
                    />
                    )}
                  </section>
                </div>
              </TabsContent>

              <TabsContent value="topic-library" className="mt-0 flex min-h-0 flex-1 flex-col gap-4 overflow-hidden">
                <p className="max-w-4xl text-sm text-muted-foreground">
                  Topics let the analyzer automatically tag each conversation with what it&apos;s about
                  (e.g. Billing &gt; Refund Status). This powers the topic breakdown charts on the
                  dashboard. Define a hierarchy up to 3 levels deep and the AI will pick the most
                  specific matching topic for each conversation.
                </p>

                <div className="flex items-center justify-between gap-2">
                  <p className="text-xs text-muted-foreground">
                    {draft.topics.length} top-level topics · {totalTopics} total
                  </p>
                  <div className="flex items-center gap-2">
                    <Button type="button" variant="outline" size="sm" className="h-8" onClick={handleImportCsv}>
                      <Upload className="size-3.5" />
                      Import CSV
                    </Button>
                    <Button type="button" variant="outline" size="sm" className="h-8" onClick={addTopLevelTopic}>
                      <Plus className="size-3.5" />
                      Add Topic
                    </Button>
                  </div>
                </div>

                <Card className="min-h-0 flex-1 rounded-lg">
                  <CardContent className="h-full min-h-0 space-y-1 overflow-y-auto p-3 pb-8">
                    {draft.topics.map((topic) => renderTopicNode(topic))}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="analyzer-settings" className="mt-0 flex min-h-0 flex-1 flex-col gap-4 overflow-hidden">
                <p className="max-w-4xl text-sm text-muted-foreground">
                  These settings control when the evaluation runs, which LLM performs the scoring,
                  and which agent endpoints and channels are included. Sessions outside the selected
                  filters are skipped by the analyzer.
                </p>

                <Card className="min-h-0 flex-1 rounded-lg">
                  <CardContent className="h-full min-h-0 space-y-5 overflow-y-auto p-4 pb-8">
                    <section className="space-y-3">
                      <div>
                        <p className="text-sm font-medium">Scheduler</p>
                        <p className="text-xs text-muted-foreground">
                          Choose how frequently the analyzer evaluates new conversations.
                        </p>
                      </div>
                      <ToggleGroup
                        type="single"
                        value={draft.schedulerMode}
                        variant="outline"
                        size="sm"
                        className="w-fit max-w-full overflow-hidden"
                        onValueChange={(nextValue) => {
                          if (!nextValue) return;
                          setDraft((current) => ({
                            ...current,
                            schedulerMode: nextValue as SchedulerMode,
                          }));
                        }}
                      >
                        {SCHEDULER_OPTIONS.map(({ value, label, Icon }) => (
                          <ToggleGroupItem
                            key={value}
                            value={value}
                            className={cn(
                              "!flex-none gap-2 px-4 text-sm font-normal",
                              "data-[state=on]:border-primary/40",
                              "data-[state=on]:bg-primary-25 data-[state=on]:text-primary-900",
                            )}
                          >
                            <Icon className="size-4" />
                            {label}
                          </ToggleGroupItem>
                        ))}
                      </ToggleGroup>
                      <p className="text-xs text-muted-foreground">
                        {getSchedulerDescription(draft.schedulerMode)}
                      </p>
                    </section>

                    <Separator />

                    <section className="space-y-3">
                      <div>
                        <p className="text-sm font-medium">LLM Model</p>
                        <p className="text-xs text-muted-foreground">
                          The model that reads each conversation transcript and scores it against
                          your criteria.
                        </p>
                      </div>
                      <Select
                        value={draft.model}
                        onValueChange={(model) =>
                          setDraft((current) => ({
                            ...current,
                            model,
                          }))
                        }
                      >
                        <SelectTrigger className="h-8 w-full max-w-[400px]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="GPT-4.1">GPT-4.1</SelectItem>
                          <SelectItem value="GPT-4o">GPT-4o</SelectItem>
                          <SelectItem value="GPT-4o Mini">GPT-4o Mini</SelectItem>
                          <SelectItem value="Claude Sonnet 4">Claude Sonnet 4</SelectItem>
                          <SelectItem value="Claude Haiku 4.5">Claude Haiku 4.5</SelectItem>
                        </SelectContent>
                      </Select>
                    </section>

                    <section className="space-y-3">
                      <div className="flex items-start gap-2">
                        <Checkbox
                          checked={draft.endpointFiltersEnabled}
                          onCheckedChange={(checked) =>
                            setDraft((current) => ({
                              ...current,
                              endpointFiltersEnabled: checked === true,
                            }))
                          }
                          className="mt-[2px]"
                        />
                        <div>
                          <p className="text-sm font-medium">Endpoint Filters</p>
                          <p className="text-xs text-muted-foreground">
                            Only evaluate sessions from selected endpoints. Leave empty to include
                            all.
                          </p>
                        </div>
                      </div>
                      <div
                        className={cn(
                          "grid gap-1 pl-6",
                          !draft.endpointFiltersEnabled && "opacity-60",
                        )}
                      >
                        {ENDPOINT_OPTIONS.map((endpoint) => (
                          <label
                            key={endpoint}
                            className="inline-flex items-center gap-2 text-sm font-normal"
                          >
                            <Checkbox
                              checked={draft.endpointFilters[endpoint]}
                              disabled={!draft.endpointFiltersEnabled}
                              onCheckedChange={(checked) =>
                                setDraft((current) => ({
                                  ...current,
                                  endpointFilters: {
                                    ...current.endpointFilters,
                                    [endpoint]: checked === true,
                                  },
                                }))
                              }
                            />
                            <span className="text-sm font-normal">{endpoint}</span>
                          </label>
                        ))}
                      </div>
                    </section>

                    <section className="space-y-3">
                      <div className="flex items-start gap-2">
                        <Checkbox
                          checked={draft.channelFiltersEnabled}
                          onCheckedChange={(checked) =>
                            setDraft((current) => ({
                              ...current,
                              channelFiltersEnabled: checked === true,
                            }))
                          }
                          className="mt-[2px]"
                        />
                        <div>
                          <p className="text-sm font-medium">Channel Filters</p>
                          <p className="text-xs text-muted-foreground">
                            Only evaluate sessions from selected channels. Leave empty to include
                            all.
                          </p>
                        </div>
                      </div>
                      <div
                        className={cn(
                          "grid gap-1 pl-6",
                          !draft.channelFiltersEnabled && "opacity-60",
                        )}
                      >
                        {CHANNEL_OPTIONS.map((channel) => (
                          <label
                            key={channel}
                            className="inline-flex items-center gap-2 text-sm font-normal"
                          >
                            <Checkbox
                              checked={draft.channelFilters[channel]}
                              disabled={!draft.channelFiltersEnabled}
                              onCheckedChange={(checked) =>
                                setDraft((current) => ({
                                  ...current,
                                  channelFilters: {
                                    ...current.channelFilters,
                                    [channel]: checked === true,
                                  },
                                }))
                              }
                            />
                            <span className="text-sm font-normal">{channel}</span>
                          </label>
                        ))}
                      </div>
                    </section>
                  </CardContent>
                </Card>
              </TabsContent>
            </PageTransition>
          </div>
        </div>
      </div>
      <AlertDialog
        open={deleteCustomCriterionId !== null}
        onOpenChange={(open) => {
          if (!open) {
            setDeleteCustomCriterionId(null);
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete custom criterion?</AlertDialogTitle>
            <AlertDialogDescription>
              {`This will remove "${customCriterionPendingDelete?.label ?? "this criterion"}". Click Save to apply this change.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDeleteCustomCriterion}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Tabs>
  );
}
