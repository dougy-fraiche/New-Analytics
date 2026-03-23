import { useParams, useNavigate } from "react-router";
import { Calendar, Filter, Download, Share2, MoreVertical, Pin, Settings, Clock } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "./ui/table";
import { Separator } from "./ui/separator";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "./ui/tabs";
import { useProjects } from "../contexts/ProjectContext";
import { ootbCategories } from "../data/ootb-dashboards";
import { DashboardChartGrid } from "./ChartVariants";
import { DashboardAISummary } from "./DashboardAISummary";
import { DashboardChatPanel } from "./DashboardChatPanel";
import { useChatPanelSlot } from "../contexts/ChatPanelSlotContext";
import { WidgetAIProvider } from "../contexts/WidgetAIContext";
import { createPortal } from "react-dom";
import { WidgetAIPromptButton } from "./WidgetAIPromptButton";
import { WidgetOverflowMenu } from "./WidgetOverflowMenu";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { toast } from "sonner";
import { Tooltip, TooltipContent, TooltipTrigger } from "./ui/tooltip";
import { useContainerBreakpoint } from "../hooks/useContainerBreakpoint";

// Mock data for dashboard content (same as DashboardPage)
const trendData = [
  { date: "Jan 6", conversations: 1247 },
  { date: "Jan 13", conversations: 1389 },
  { date: "Jan 20", conversations: 1502 },
  { date: "Jan 27", conversations: 1285 },
  { date: "Feb 3", conversations: 1437 },
  { date: "Feb 10", conversations: 1592 },
  { date: "Feb 17", conversations: 1678 },
  { date: "Feb 24", conversations: 1543 },
  { date: "Mar 3", conversations: 1721 },
  { date: "Mar 10", conversations: 1834 },
  { date: "Mar 17", conversations: 1756 },
  { date: "Mar 24", conversations: 1892 },
];

const categoryData = [
  { category: "Account Access", tickets: 342 },
  { category: "Billing Inquiry", tickets: 287 },
  { category: "Technical Issue", tickets: 214 },
  { category: "Feature Request", tickets: 156 },
  { category: "Bug Report", tickets: 98 },
];

const comparisonData = [
  { week: "Week 1", thisPeriod: 892, lastPeriod: 764 },
  { week: "Week 2", thisPeriod: 1024, lastPeriod: 831 },
  { week: "Week 3", thisPeriod: 943, lastPeriod: 897 },
  { week: "Week 4", thisPeriod: 1156, lastPeriod: 952 },
  { week: "Week 5", thisPeriod: 1087, lastPeriod: 1014 },
  { week: "Week 6", thisPeriod: 1243, lastPeriod: 1078 },
];

const tableData = [
  { agent: "Sarah Johnson", escalations: 23, resolved: 187, avgTime: "4.2h", satisfaction: "94%" },
  { agent: "Michael Chen", escalations: 18, resolved: 203, avgTime: "3.8h", satisfaction: "96%" },
  { agent: "Emily Rodriguez", escalations: 31, resolved: 176, avgTime: "5.1h", satisfaction: "91%" },
  { agent: "David Kim", escalations: 15, resolved: 215, avgTime: "3.5h", satisfaction: "97%" },
  { agent: "Lisa Wang", escalations: 27, resolved: 192, avgTime: "4.6h", satisfaction: "93%" },
];

export function ObservabilityCategoryPage() {
  const { categoryId, dashboardId: urlDashboardId } = useParams();
  const navigate = useNavigate();
  const { isFavorite, toggleFavorite } = useProjects();

  const category = ootbCategories.find((c) => c.id === categoryId);

  if (!category) {
    return (
      <div className="flex items-center justify-center h-full p-8">
        <div className="text-center">
          <h1 className="text-4xl mb-2">404</h1>
          <p className="text-muted-foreground">Category not found</p>
        </div>
      </div>
    );
  }

  // Standalone categories (no sub-dashboards) — redirect to the dashboard page
  if (category.dashboards.length === 0) {
    // Navigate to the standalone dashboard
    navigate(`/dashboard/${category.id}`, { replace: true });
    return null;
  }

  // Determine the active dashboard tab
  const defaultDashboard = category.dashboards[0];
  const activeDashboardId = urlDashboardId && category.dashboards.some((d) => d.id === urlDashboardId)
    ? urlDashboardId
    : defaultDashboard.id;

  const activeDashboard = category.dashboards.find((d) => d.id === activeDashboardId) || defaultDashboard;

  const handleTabChange = (tabValue: string) => {
    // Navigate to update the URL
    if (tabValue === defaultDashboard.id) {
      navigate(`/observability/${categoryId}`, { replace: true });
    } else {
      navigate(`/observability/${categoryId}/${tabValue}`, { replace: true });
    }
  };

  const chatPanelSlot = useChatPanelSlot();

  // Pin helpers
  const favoriteId = activeDashboard.id;
  const favoritePath = `/dashboard/${activeDashboard.id}`;
  const currentlyPinned = isFavorite(favoriteId);
  const { ref: dashboardContentRef, isBelowBreakpoint: isCompactDashboard } =
    useContainerBreakpoint<HTMLDivElement>(768);

  return (
    <WidgetAIProvider persistKey={activeDashboardId} ootbTypeId={activeDashboardId}>
      <Tabs value={activeDashboardId} onValueChange={handleTabChange} className="flex flex-col h-full min-h-0">
        <div className="flex flex-col h-full min-h-0">
          <header className="shrink-0 sticky top-0 z-10 bg-background px-4 md:px-8 pt-6 pb-0">
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-3xl tracking-tight">{category.name}</h1>
                <div className="ml-auto flex items-center gap-2">
                  <Button variant="outline" size="sm">
                    <Share2 className="mr-2 h-4 w-4" />
                    Share
                  </Button>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => {
                          toggleFavorite({ id: favoriteId, name: activeDashboard.name, path: favoritePath });
                          toast.success(currentlyPinned ? "Unpinned" : "Pinned");
                        }}
                      >
                        <Pin className={`h-4 w-4 ${currentlyPinned ? "fill-current text-primary" : ""}`} />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent side="bottom">{currentlyPinned ? "Unpin" : "Pin"}</TooltipContent>
                  </Tooltip>
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
                      <DropdownMenuItem>
                        <Download className="h-4 w-4 mr-2" />
                        Export
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        <Settings className="h-4 w-4 mr-2" />
                        Edit Settings
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        <Clock className="h-4 w-4 mr-2" />
                        Schedule Report
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
              <p className="text-muted-foreground mt-1">
                {activeDashboard.description}
              </p>
            </div>
            <TabsList className="w-full justify-start mt-4">
              {category.dashboards.map((dashboard) => {
                const DashIcon = dashboard.icon;
                return (
                  <TabsTrigger key={dashboard.id} value={dashboard.id}>
                    <DashIcon className="h-4 w-4" />
                    {dashboard.name}
                  </TabsTrigger>
                );
              })}
            </TabsList>
          </header>
          <div className="flex-1 min-h-0 overflow-auto">
            <div ref={dashboardContentRef} className="space-y-6 p-4 md:p-8">
            {category.dashboards.map((dashboard) => (
              <TabsContent key={dashboard.id} value={dashboard.id} className="space-y-6 mt-2">
                {/* AI Summary */}
                <DashboardAISummary
                  dashboardId={dashboard.id}
                  dashboardData={{
                    id: dashboard.id,
                    title: dashboard.name,
                    description: dashboard.description,
                  }}
                />

                {/* KPI Section Header */}
                <h2 className="tracking-tight">Key Performance Indicators</h2>

                {/* Filters */}
                <div className="flex items-center gap-3 flex-wrap">
                  <Select defaultValue="30d">
                    <SelectTrigger className="w-full sm:w-[180px]">
                      <Calendar className="mr-2 h-4 w-4" />
                      <SelectValue placeholder="Select period" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="7d">Last 7 days</SelectItem>
                      <SelectItem value="30d">Last 30 days</SelectItem>
                      <SelectItem value="90d">Last 90 days</SelectItem>
                      <SelectItem value="12m">Last 12 months</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select defaultValue="all-teams">
                    <SelectTrigger className="w-full sm:w-[180px]">
                      <Filter className="mr-2 h-4 w-4" />
                      <SelectValue placeholder="Filter by team" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all-teams">All Teams</SelectItem>
                      <SelectItem value="tier-1">Tier 1 Support</SelectItem>
                      <SelectItem value="tier-2">Tier 2 Support</SelectItem>
                      <SelectItem value="technical">Technical Team</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select defaultValue="all-products">
                    <SelectTrigger className="w-full sm:w-[180px]">
                      <SelectValue placeholder="Filter by product" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all-products">All Products</SelectItem>
                      <SelectItem value="product-a">Product A</SelectItem>
                      <SelectItem value="product-b">Product B</SelectItem>
                      <SelectItem value="product-c">Product C</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Metric Cards */}
                <div
                  className={`grid gap-4 ${
                    isCompactDashboard
                      ? "grid-cols-1"
                      : "grid-cols-1 md:grid-cols-2 lg:grid-cols-4"
                  }`}
                >
                  <Card className="group/widget transition-[box-shadow,border-color] hover:shadow-md hover:border-primary/30">
                    <CardHeader className="pb-2">
                      <div className="flex items-center gap-2">
                        <CardDescription className="flex-1">Total Escalations</CardDescription>
                        <WidgetAIPromptButton widgetTitle="Total Escalations" chartType="metric" />
                        <WidgetOverflowMenu widgetTitle="Total Escalations" chartType="metric" />
                      </div>
                      <CardTitle className="text-3xl">260</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <Badge variant="destructive" className="text-xs">
                        +12% from last period
                      </Badge>
                    </CardContent>
                  </Card>

                  <Card className="group/widget transition-[box-shadow,border-color] hover:shadow-md hover:border-primary/30">
                    <CardHeader className="pb-2">
                      <div className="flex items-center gap-2">
                        <CardDescription className="flex-1">Avg Resolution Time</CardDescription>
                        <WidgetAIPromptButton widgetTitle="Avg Resolution Time" chartType="metric" />
                        <WidgetOverflowMenu widgetTitle="Avg Resolution Time" chartType="metric" />
                      </div>
                      <CardTitle className="text-3xl">4.3h</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <Badge variant="default" className="text-xs">
                        -8% from last period
                      </Badge>
                    </CardContent>
                  </Card>

                  <Card className="group/widget transition-[box-shadow,border-color] hover:shadow-md hover:border-primary/30">
                    <CardHeader className="pb-2">
                      <div className="flex items-center gap-2">
                        <CardDescription className="flex-1">Customer Satisfaction</CardDescription>
                        <WidgetAIPromptButton widgetTitle="Customer Satisfaction" chartType="metric" />
                        <WidgetOverflowMenu widgetTitle="Customer Satisfaction" chartType="metric" />
                      </div>
                      <CardTitle className="text-3xl">94%</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <Badge variant="default" className="text-xs">
                        +2% from last period
                      </Badge>
                    </CardContent>
                  </Card>

                  <Card className="group/widget transition-[box-shadow,border-color] hover:shadow-md hover:border-primary/30">
                    <CardHeader className="pb-2">
                      <div className="flex items-center gap-2">
                        <CardDescription className="flex-1">Resolution Rate</CardDescription>
                        <WidgetAIPromptButton widgetTitle="Resolution Rate" chartType="metric" />
                        <WidgetOverflowMenu widgetTitle="Resolution Rate" chartType="metric" />
                      </div>
                      <CardTitle className="text-3xl">87%</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <Badge variant="secondary" className="text-xs">
                        No change
                      </Badge>
                    </CardContent>
                  </Card>
                </div>

                {/* Chart Grid — unique per dashboard */}
                <DashboardChartGrid
                  dashboardId={dashboard.id}
                  trend={{ data: trendData, xKey: "date", yKey: "conversations" }}
                  category={{ data: categoryData, xKey: "category", yKey: "tickets" }}
                  comparison={{
                    data: comparisonData,
                    xKey: "week",
                    yKey: "thisPeriod",
                    y2Key: "lastPeriod",
                  }}
                />

                {/* Data Table */}
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Agent</TableHead>
                      <TableHead className="text-right">Escalations</TableHead>
                      <TableHead className="text-right">Resolved</TableHead>
                      <TableHead className="text-right">Avg Time</TableHead>
                      <TableHead className="text-right">Satisfaction</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {tableData.map((row) => (
                      <TableRow key={row.agent}>
                        <TableCell className="font-medium">{row.agent}</TableCell>
                        <TableCell className="text-right">{row.escalations}</TableCell>
                        <TableCell className="text-right">{row.resolved}</TableCell>
                        <TableCell className="text-right">{row.avgTime}</TableCell>
                        <TableCell className="text-right">
                          <Badge variant="outline">{row.satisfaction}</Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TabsContent>
            ))}
          </div>
        </div>
      </div>
      </Tabs>

      {/* Chat panel — portaled to layout-level slot */}
      {chatPanelSlot && createPortal(
        <DashboardChatPanel
          dashboardId={activeDashboardId}
          sourceOotbId={activeDashboardId}
        />,
        chatPanelSlot
      )}
    </WidgetAIProvider>
  );
}