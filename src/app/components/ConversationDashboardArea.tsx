import { motion, AnimatePresence } from "motion/react";
import { Sparkles, LayoutDashboard, BarChart3, Bookmark, Share2, MoreVertical, Pencil, Trash2, Check } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { DashboardData } from "../contexts/ConversationContext";
import { DashboardChartGrid } from "./ChartVariants";
import { WidgetAIProvider } from "../contexts/WidgetAIContext";
import { SkeletonChartCard, SkeletonMetricCard } from "./SkeletonCard";
import { DashboardAISummary } from "./DashboardAISummary";
import { Tooltip, TooltipContent, TooltipTrigger } from "./ui/tooltip";
import { useContainerBreakpoint } from "../hooks/useContainerBreakpoint";

interface ConversationDashboardAreaProps {
  isThinking: boolean;
  dashboardData: DashboardData | null;
  /** When provided, widget AI prompts are sent to this handler instead of the dashboard chat panel */
  onWidgetPrompt?: (
    widgetTitle: string,
    message: string,
    chartType?: string,
    selectedKpiLabel?: string | null,
  ) => void;
  /** Called when the user clicks Save on the current dashboard */
  onSave?: (dashboard: DashboardData) => void;
  /** Whether the current dashboard has already been saved */
  isSaved?: boolean;
  /** Saved dashboard metadata (name + path) when isSaved is true */
  savedInfo?: { name: string; path: string };
  /** Open the rename-conversation dialog */
  onRename?: () => void;
  /** Open the delete-conversation confirmation */
  onDelete?: () => void;
}

function ThinkingAnimation() {
  return (
    <div className="space-y-6 p-8">
      {/* Skeleton metric cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[0, 1, 2, 3].map((i) => (
          <SkeletonMetricCard key={i} />
        ))}
      </div>

      {/* Skeleton chart grid matching typical layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <SkeletonChartCard colSpan={2} />
        <SkeletonChartCard colSpan={1} />
        <SkeletonChartCard colSpan={1} />
        <SkeletonChartCard colSpan={2} />
      </div>

      {/* Subtle animated indicator */}
      <div className="flex items-center justify-center gap-2 pt-2">
        <motion.div
          animate={{ opacity: [0.4, 1, 0.4] }}
          transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
          className="flex items-center gap-2 text-muted-foreground"
        >
          <Sparkles className="h-4 w-4 text-primary" />
          <span className="text-sm">AI is preparing your dashboard</span>
        </motion.div>
      </div>
    </div>
  );
}

function EmptyDashboardState() {
  return (
    <div className="flex flex-col items-center justify-center h-full gap-6 pt-12">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="flex flex-col items-center gap-4"
      >
        {/* Icon */}
        <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
          <LayoutDashboard className="h-8 w-8 text-muted-foreground/60" />
        </div>

        {/* Text */}
        <div className="text-center space-y-2 max-w-md">
          <h2 className="text-xl text-foreground/80">No insights yet</h2>
          <p className="text-sm text-muted-foreground">
            Continue the conversation to generate insights and dashboards.
            Ask about specific metrics, trends, or request a dashboard to visualize your data.
          </p>
        </div>

        {/* Hint cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-4 max-w-lg">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card className="border-dashed">
              <CardContent className="p-3 pt-6 text-center">
                <BarChart3 className="h-5 w-5 text-muted-foreground/50 mx-auto mb-1" />
                <p className="text-xs text-muted-foreground">
                  Ask for trends
                </p>
              </CardContent>
            </Card>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35 }}
          >
            <Card className="border-dashed">
              <CardContent className="p-3 pt-6 text-center">
                <Sparkles className="h-5 w-5 text-muted-foreground/50 mx-auto mb-1" />
                <p className="text-xs text-muted-foreground">
                  Request insights
                </p>
              </CardContent>
            </Card>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            <Card className="border-dashed">
              <CardContent className="p-3 pt-6 text-center">
                <LayoutDashboard className="h-5 w-5 text-muted-foreground/50 mx-auto mb-1" />
                <p className="text-xs text-muted-foreground">
                  Create a dashboard
                </p>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
}

function DashboardContent({
  dashboard,
  onSave,
  isSaved,
  onRename,
  onDelete,
}: {
  dashboard: DashboardData;
  onSave?: (dashboard: DashboardData) => void;
  isSaved?: boolean;
  onRename?: () => void;
  onDelete?: () => void;
}) {
  const { ref: dashboardContentRef, isBelowBreakpoint: isCompactDashboard } =
    useContainerBreakpoint<HTMLDivElement>(768);

  // Generate default trend data if not provided
  const trendData = dashboard.chartData?.trend || [
    { date: "Jan 6", interactions: 3842 },
    { date: "Jan 13", interactions: 4156 },
    { date: "Jan 20", interactions: 3987 },
    { date: "Jan 27", interactions: 4523 },
    { date: "Feb 3", interactions: 4891 },
    { date: "Feb 10", interactions: 5234 },
    { date: "Feb 17", interactions: 4978 },
    { date: "Feb 24", interactions: 5412 },
    { date: "Mar 3", interactions: 5687 },
    { date: "Mar 10", interactions: 5321 },
    { date: "Mar 17", interactions: 5843 },
    { date: "Mar 24", interactions: 6102 },
  ];

  // Generate default breakdown data if not provided
  const breakdownData = dashboard.chartData?.breakdown || [
    { category: "Password Reset", volume: 1842 },
    { category: "Billing Support", volume: 1356 },
    { category: "Product Inquiry", volume: 987 },
    { category: "Shipping Status", volume: 764 },
    { category: "Returns & Refunds", volume: 623 },
  ];

  return (
    <AnimatePresence mode="wait">
      <motion.div
        ref={dashboardContentRef}
        key="dashboard-content"
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.98 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="space-y-6 p-4 md:p-8"
      >
        {/* Title row — mirrors DashboardPage header */}
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
        >
          <div className="flex items-center gap-2">
            <h1 className="text-3xl tracking-tight truncate">{dashboard.title}</h1>
            <div className="ml-auto flex items-center gap-2 shrink-0">
              {isSaved ? (
                <Badge variant="secondary" className="gap-1.5 h-8 px-3">
                  <Check className="h-3 w-3" />
                  Saved
                </Badge>
              ) : (
                <Button size="sm" onClick={() => onSave?.(dashboard)}>
                  <Bookmark className="h-4 w-4 mr-2" />
                  Save
                </Button>
              )}
              <Button variant="outline" size="sm">
                <Share2 className="h-4 w-4 mr-2" />
                Share
              </Button>
              <DropdownMenu>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span className="inline-flex">
                      <DropdownMenuTrigger asChild>
                        <Button variant="outline" size="icon" className="h-8 w-8">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                    </span>
                  </TooltipTrigger>
                  <TooltipContent side="bottom">Dashboard options</TooltipContent>
                </Tooltip>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={onRename}>
                    <Pencil className="h-4 w-4 mr-2" />
                    Rename
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    className="text-destructive focus:text-destructive"
                    onClick={onDelete}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
          {dashboard.description && (
            <p className="text-muted-foreground mt-1">{dashboard.description}</p>
          )}
        </motion.div>

        {/* AI Summary + Recommended Action */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, duration: 0.4 }}
        >
          <DashboardAISummary dashboardId={dashboard.id} dashboardData={dashboard} />
        </motion.div>

        {/* Key Metrics with stagger animation */}
        {dashboard.metrics && dashboard.metrics.length > 0 && (
          <div
            className={`grid gap-4 ${
              isCompactDashboard
                ? "grid-cols-1"
                : "grid-cols-1 md:grid-cols-2 lg:grid-cols-4"
            }`}
          >
            {dashboard.metrics.map((metric, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 + idx * 0.05 }}
              >
                <Card>
                  <CardHeader className="pb-2">
                    <CardDescription>{metric.label}</CardDescription>
                    <CardTitle className="text-3xl">{metric.value}</CardTitle>
                  </CardHeader>
                </Card>
              </motion.div>
            ))}
          </div>
        )}

        {/* Randomized Chart Grid */}
        <DashboardChartGrid
          dashboardId={dashboard.id}
          trend={{ data: trendData, xKey: "date", yKey: "interactions" }}
          category={{ data: breakdownData, xKey: "category", yKey: "volume" }}
          animated
        />
      </motion.div>
    </AnimatePresence>
  );
}

export function ConversationDashboardArea({
  isThinking,
  dashboardData,
  onWidgetPrompt,
  onSave,
  isSaved,
  savedInfo,
  onRename,
  onDelete,
}: ConversationDashboardAreaProps) {
  // Determine what to show
  if (isThinking && !dashboardData) {
    return <ThinkingAnimation />;
  }

  if (dashboardData) {
    return (
      <WidgetAIProvider persistKey={`conversation-${dashboardData.id}`} onWidgetPrompt={onWidgetPrompt}>
        <DashboardContent
          dashboard={dashboardData}
          onSave={onSave}
          isSaved={isSaved}
          onRename={onRename}
          onDelete={onDelete}
        />
      </WidgetAIProvider>
    );
  }

  return <EmptyDashboardState />;
}