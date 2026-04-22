import {
  PanelLeftClose,
  PanelLeftOpen,
  Bell,
  Search,
  Sparkles,
} from "lucide-react";
import { Fragment, useCallback, useLayoutEffect, useMemo, useState } from "react";
import { Link } from "react-router";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { Button } from "./ui/button";
import { useSidebar } from "./ui/sidebar";
import { Tooltip, TooltipContent, TooltipTrigger } from "./ui/tooltip";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbEllipsis,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "./ui/breadcrumb";
import { recommendedActionsData } from "../data/recommended-actions";
import {
  ACTION_STATUS_LABELS,
  recommendedActionActivityById,
} from "../data/action-activity";

interface TopNavBarProps {
  onSearchClick?: () => void;
  breadcrumbs?: Array<{ label: string; href?: string }>;
  onActionsSlotRef?: (el: HTMLDivElement | null) => void;
  aiAssistantOpen?: boolean;
  onAiAssistantOpenChange?: (open: boolean) => void;
  /** When true (e.g. Explore routes), hide toggle / show disabled control */
  aiAssistantDisabled?: boolean;
}

export function TopNavBar({
  onSearchClick,
  breadcrumbs = [],
  onActionsSlotRef,
  aiAssistantOpen = false,
  onAiAssistantOpenChange,
  aiAssistantDisabled = false,
}: TopNavBarProps) {
  const { state: sidebarState, toggleSidebar, isMobile, openMobile } = useSidebar();
  const isNavigationVisible = isMobile ? openMobile : sidebarState !== "collapsed";
  const sidebarToggleLabel = isMobile
    ? (isNavigationVisible ? "Hide navigation" : "Show navigation")
    : (isNavigationVisible ? "Collapse sidebar" : "Expand sidebar");
  const hasBreadcrumbs = breadcrumbs.length > 0;
  const canCollapseBreadcrumbs = breadcrumbs.length > 1;

  const [breadcrumbViewportEl, setBreadcrumbViewportEl] = useState<HTMLDivElement | null>(null);
  const [breadcrumbMeasureEl, setBreadcrumbMeasureEl] = useState<HTMLDivElement | null>(null);
  const [breadcrumbsCollapsed, setBreadcrumbsCollapsed] = useState(false);

  const breadcrumbViewportRef = useCallback((el: HTMLDivElement | null) => {
    setBreadcrumbViewportEl(el);
  }, []);

  const breadcrumbMeasureRef = useCallback((el: HTMLDivElement | null) => {
    setBreadcrumbMeasureEl(el);
  }, []);

  useLayoutEffect(() => {
    if (!canCollapseBreadcrumbs || !breadcrumbViewportEl || !breadcrumbMeasureEl) {
      setBreadcrumbsCollapsed(false);
      return;
    }

    const update = () => {
      const availableWidth = breadcrumbViewportEl.clientWidth;
      const neededWidth = breadcrumbMeasureEl.scrollWidth;
      setBreadcrumbsCollapsed(neededWidth - availableWidth > 1);
    };

    update();

    const observer = new ResizeObserver(update);
    observer.observe(breadcrumbViewportEl);
    observer.observe(breadcrumbMeasureEl);

    return () => observer.disconnect();
  }, [breadcrumbMeasureEl, breadcrumbViewportEl, canCollapseBreadcrumbs, breadcrumbs]);

  const currentBreadcrumb = breadcrumbs[breadcrumbs.length - 1];
  const topRecommendedAction = recommendedActionsData[0];
  const topRecommendedActionTitle =
    topRecommendedAction?.title ?? "Deploy Account Verification AI Agent";
  const topRecommendedActionPriority = topRecommendedAction?.priority ?? "High";
  const topRecommendedActionActivity = topRecommendedAction
    ? recommendedActionActivityById[topRecommendedAction.id]
    : undefined;
  const statusUpdateAction = recommendedActionsData.find((action) => action.id === 3);
  const statusUpdateActionActivity = statusUpdateAction
    ? recommendedActionActivityById[statusUpdateAction.id]
    : undefined;
  const hiddenBreadcrumbs = useMemo(
    () => (breadcrumbsCollapsed ? breadcrumbs.slice(0, -1) : []),
    [breadcrumbs, breadcrumbsCollapsed],
  );

  const renderCrumbTrail = useCallback(
    (items: Array<{ label: string; href?: string }>) =>
      items.map((crumb, index) => {
        const isLast = index === items.length - 1;
        return (
          <Fragment key={`${crumb.label}-${index}`}>
            <BreadcrumbItem className="min-w-0">
              {isLast ? (
                <BreadcrumbPage className="truncate">{crumb.label}</BreadcrumbPage>
              ) : crumb.href ? (
                <BreadcrumbLink asChild className="truncate">
                  <Link to={crumb.href} className="truncate">
                    {crumb.label}
                  </Link>
                </BreadcrumbLink>
              ) : (
                <BreadcrumbPage className="truncate">{crumb.label}</BreadcrumbPage>
              )}
            </BreadcrumbItem>
            {!isLast && <BreadcrumbSeparator />}
          </Fragment>
        );
      }),
    [],
  );

  return (
    <header className="flex h-16 w-full items-center border-b border-border bg-background shrink-0 z-50 px-4">
      {/* Sidebar toggle */}
      <div className="flex items-center h-full">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="size-8"
              onClick={toggleSidebar}
            >
              {isNavigationVisible ? (
                <PanelLeftClose className="size-4" />
              ) : (
                <PanelLeftOpen className="size-4" />
              )}
              <span className="sr-only">{sidebarToggleLabel}</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom">{sidebarToggleLabel}</TooltipContent>
        </Tooltip>
      </div>

      {/* Breadcrumbs */}
      {hasBreadcrumbs && (
        <div className="relative flex min-w-0 flex-1 items-center px-3">
          <div ref={breadcrumbViewportRef} className="min-w-0 w-full">
            <Breadcrumb>
              <BreadcrumbList className="min-w-0 flex-nowrap overflow-hidden whitespace-nowrap">
                {breadcrumbsCollapsed && currentBreadcrumb ? (
                  <>
                    <BreadcrumbItem>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button
                            type="button"
                            className="inline-flex items-center rounded-sm text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring"
                            aria-label="Show previous breadcrumb levels"
                          >
                            <BreadcrumbEllipsis className="size-4" />
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="start">
                          {hiddenBreadcrumbs.map((crumb, index) =>
                            crumb.href ? (
                              <DropdownMenuItem key={`${crumb.label}-${index}`} asChild>
                                <Link to={crumb.href}>{crumb.label}</Link>
                              </DropdownMenuItem>
                            ) : (
                              <DropdownMenuItem key={`${crumb.label}-${index}`} disabled>
                                {crumb.label}
                              </DropdownMenuItem>
                            ),
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </BreadcrumbItem>
                    <BreadcrumbSeparator />
                    <BreadcrumbItem className="min-w-0">
                      <BreadcrumbPage className="truncate">{currentBreadcrumb.label}</BreadcrumbPage>
                    </BreadcrumbItem>
                  </>
                ) : (
                  renderCrumbTrail(breadcrumbs)
                )}
              </BreadcrumbList>
            </Breadcrumb>
          </div>

          {/* Hidden measurement row for overflow detection */}
          {canCollapseBreadcrumbs && (
            <div className="pointer-events-none absolute inset-y-0 left-0 -z-10 h-0 overflow-hidden opacity-0">
              <div ref={breadcrumbMeasureRef} className="w-max">
                <Breadcrumb aria-hidden="true">
                  <BreadcrumbList className="flex-nowrap whitespace-nowrap overflow-visible">
                    {renderCrumbTrail(breadcrumbs)}
                  </BreadcrumbList>
                </Breadcrumb>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Page-level actions slot (portaled into by child pages) + global actions */}
      <div className="ml-auto flex shrink-0 items-center gap-2">
        {/* Page-level actions slot */}
        <div ref={onActionsSlotRef} className="flex items-center gap-1" />

        {/* Search Button */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="size-8"
              onClick={onSearchClick}
            >
              <Search className="h-4 w-4" />
              <span className="sr-only">Search</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom">Search</TooltipContent>
        </Tooltip>

        {/* Notifications */}
        <DropdownMenu>
          <Tooltip>
            <DropdownMenuTrigger asChild>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" className="size-8">
                  <Bell className="h-4 w-4" />
                  <span className="sr-only">Notifications</span>
                </Button>
              </TooltipTrigger>
            </DropdownMenuTrigger>
            <TooltipContent side="bottom">Notifications</TooltipContent>
          </Tooltip>
          <DropdownMenuContent align="end" className="w-80">
            <DropdownMenuLabel>Notifications</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <div className="max-h-96 overflow-y-auto">
              <DropdownMenuItem className="flex flex-col items-start py-3 cursor-pointer">
                <div className="flex items-start gap-2 w-full">
                  <div className="h-2 w-2 bg-muted-foreground/40 rounded-full mt-1.5 shrink-0" aria-hidden />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-normal text-foreground">New recommended action available</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {topRecommendedActionTitle} - {topRecommendedActionPriority} Priority
                    </p>
                    {topRecommendedActionActivity ? (
                      <p className="text-xs text-muted-foreground mt-1">
                        {topRecommendedActionActivity.owner} · {ACTION_STATUS_LABELS[topRecommendedActionActivity.status]}
                      </p>
                    ) : null}
                    <p className="text-xs text-muted-foreground mt-1">
                      {topRecommendedActionActivity?.relativeTimeLabel ?? "2 minutes ago"}
                    </p>
                  </div>
                </div>
              </DropdownMenuItem>
              <DropdownMenuItem className="flex flex-col items-start py-3 cursor-pointer">
                <div className="flex items-start gap-2 w-full">
                  <div className="h-2 w-2 bg-muted-foreground/40 rounded-full mt-1.5 shrink-0" aria-hidden />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-normal text-foreground">Dashboard saved successfully</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Custom Support Analytics Dashboard saved to Q1 Analytics
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">1 hour ago</p>
                  </div>
                </div>
              </DropdownMenuItem>
              <DropdownMenuItem className="flex flex-col items-start py-3 cursor-pointer">
                <div className="flex items-start gap-2 w-full">
                  <div className="h-2 w-2 bg-muted-foreground/40 rounded-full mt-1.5 shrink-0" aria-hidden />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-normal text-foreground">Action status update</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {statusUpdateAction?.title ?? "Retrain Escalation Classifier"}
                    </p>
                    {statusUpdateActionActivity ? (
                      <p className="text-xs text-muted-foreground mt-1">
                        {statusUpdateActionActivity.owner} · {ACTION_STATUS_LABELS[statusUpdateActionActivity.status]}
                      </p>
                    ) : null}
                    <p className="text-xs text-muted-foreground mt-1">
                      {statusUpdateActionActivity?.relativeTimeLabel ?? "3 hours ago"}
                    </p>
                  </div>
                </div>
              </DropdownMenuItem>
            </div>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="justify-center text-sm text-primary">
              View all notifications
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Global AI Assistant toggle (single thread — not used on Explore) */}
        <Tooltip>
          <TooltipTrigger asChild>
            <span className="inline-flex">
              <Button
                variant="outline"
                size="sm"
                className={[
                  "h-8 gap-2",
                  "border-primary/40 text-primary hover:bg-primary/5 hover:text-primary",
                  aiAssistantOpen ? "bg-primary/10 border-primary/60" : "",
                ].join(" ")}
                disabled={aiAssistantDisabled}
                aria-pressed={aiAssistantOpen}
                onClick={() => onAiAssistantOpenChange?.(!aiAssistantOpen)}
              >
                <Sparkles className="h-4 w-4" />
                <span>Ask AI</span>
                <span className="sr-only">
                  {aiAssistantDisabled ? "AI assistant — not available on Explore" : aiAssistantOpen ? "Close AI assistant" : "Open AI assistant"}
                </span>
              </Button>
            </span>
          </TooltipTrigger>
          <TooltipContent side="bottom">
            {aiAssistantDisabled
              ? "AI assistant is available on dashboard pages — use Explore chat here"
              : aiAssistantOpen
                ? "AI assistant open"
                : "AI assistant closed"}
          </TooltipContent>
        </Tooltip>
      </div>
    </header>
  );
}
