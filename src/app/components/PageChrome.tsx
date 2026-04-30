import type { ReactNode } from "react";
import { Link } from "react-router";
import { PanelLeftClose, PanelLeftOpen, Sparkles } from "lucide-react";

import { usePageBreadcrumbs } from "../contexts/PageBreadcrumbsContext";
import { useOptionalAiAssistantPanelControl } from "../contexts/AiAssistantPanelControlContext";
import { useSidebar } from "./ui/sidebar";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "./ui/breadcrumb";
import { Button } from "./ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "./ui/tooltip";

import { cn } from "./ui/utils";

/**
 * Layout patterns aligned with C26 / token-based UI (see `src/styles/tailwind.css`).
 *
 * - **Header + primary CTA:** wrap title and actions in a flex row, e.g.
 *   `className={cn("flex flex-wrap items-center justify-between gap-4", pageHeaderTitleRowClassName)}`
 *   Put the main action in `<Button variant="default">` (uses `--primary` / Figma P500).
 * - **Card icon well:** circular soft-primary icon container:
 *   `className={cardIconWellClassName}` on the wrapper around a `size-5` or `size-6` icon.
 * - **Tags / filters:** use the default badge variants (`default`, `secondary`, `destructive`, `outline`).
 */
export const pageHeaderTitleRowClassName = "w-full";

/** Soft primary circle behind list/card icons (Figma-style lavender well + purple glyph). */
export const cardIconWellClassName =
  "inline-flex shrink-0 items-center justify-center rounded-full bg-primary-soft p-2 text-primary";

/**
 * Page title region: full width, background edge-to-edge, subtle bottom border.
 * Horizontal/top padding live on the inner shell (see `PageHeader`) to match `PageContent`.
 */
export const pageHeaderClassName =
  "w-full border-b border-border/60 bg-background [&_h1]:text-primary-900";

/**
 * Merge onto `<PageHeader className={pageHeaderTabsFooterClassName}>` when the last row
 * is a line-variant `TabsList`, so bottom padding is removed and the tab row aligns with the
 * header bottom border.
 */
export const pageHeaderTabsFooterClassName = "pb-0";

/** Full-width page shell: 2rem inset left, right, and top (viewport gutters). */
export const pageMainShellClassName = "w-full min-w-0 px-8 pt-8";

/**
 * Viewport gutters + top padding for scrollable **root list** and **dashboard** bodies. Add
 * `pb-*` on the same element. Put `pageMainColumnClassName` on `PageTransition` or an inner
 * wrapper instead of `PageContent`, so the 1366px column is full width inside the gutters (not
 * shrunk by `px-*` and `max-w-*` on one node).
 */
export const pageRootListScrollGutterClassName = "w-full min-w-0 px-8 pt-8";

/**
 * Max-width column token (1366px, centered). Composed with `pageMainShellClassName` on
 * `PageContent` as a single root node — use `space-y-*`, `gap-*`, or `pb-*` on `className` for rhythm.
 */
export const pageMainColumnClassName = "mx-auto w-full min-w-0 max-w-[1366px]";

/** Alias for the inner column (max-width shell). */
export const pageContentMaxWidthClassName = pageMainColumnClassName;

export function PageContent({
  className,
  children,
}: {
  className?: string;
  children: ReactNode;
}) {
  return (
    <div className={cn(pageMainShellClassName, pageMainColumnClassName, className)}>
      {children}
    </div>
  );
}

export interface PageHeaderPrimaryRowProps {
  title: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  preTabs?: ReactNode;
  tabs?: ReactNode;
  className?: string;
}

/**
 * Standardized page-header primary layout:
 * - Title (left) + page actions (right)
 * - Optional tabs row below
 */
export function PageHeaderPrimaryRow({
  title,
  description,
  actions,
  preTabs,
  tabs,
  className,
}: PageHeaderPrimaryRowProps) {
  const showActions = actions !== undefined;

  return (
    <div className={cn("w-full", className)}>
      <div className="flex min-w-0 flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1">{title}</div>
        {showActions ? <div className="ml-auto flex shrink-0 items-center gap-2">{actions}</div> : null}
      </div>
      {description ? <div className="mt-1 text-sm text-muted-foreground">{description}</div> : null}
      {preTabs ? <div className="mt-4">{preTabs}</div> : null}
      {tabs ? <div className="mt-4">{tabs}</div> : null}
    </div>
  );
}

export function PageBreadcrumbBar({ className }: { className?: string } = {}) {
  const breadcrumbs = usePageBreadcrumbs();
  const { state: sidebarState, isMobile, openMobile, toggleSidebar } = useSidebar();
  const aiAssistantPanelControl = useOptionalAiAssistantPanelControl();
  const isNavigationVisible = isMobile ? openMobile : sidebarState !== "collapsed";
  const sidebarToggleLabel = isMobile
    ? (isNavigationVisible ? "Hide navigation" : "Show navigation")
    : (isNavigationVisible ? "Collapse sidebar" : "Expand sidebar");
  const showAskAiButton = aiAssistantPanelControl !== undefined;
  const showBreadcrumbBar = breadcrumbs.length > 0 || showAskAiButton;

  if (!showBreadcrumbBar) {
    return null;
  }

  return (
    <div
      data-slot="page-breadcrumb-bar"
      className={cn("w-full border-b border-[color:var(--lyra-neutral-n200)] bg-background", className)}
    >
      <div className="w-full min-w-0 p-3">
        <div className="flex w-full min-w-0 items-center gap-3">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="size-8 shrink-0 text-[color:var(--lyra-neutral-n600)] hover:bg-[color:var(--lyra-neutral-n100)]"
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
          <div className="min-w-0 flex-1">
            {breadcrumbs.length > 0 ? (
              <Breadcrumb>
                <BreadcrumbList className="min-w-0 flex-nowrap overflow-hidden whitespace-nowrap">
                  {breadcrumbs.flatMap((crumb, index) => {
                    const isLast = index === breadcrumbs.length - 1;
                    return [
                      <BreadcrumbItem key={`item-${crumb.label}-${crumb.href}-${index}`} className="min-w-0">
                        {isLast ? (
                          <BreadcrumbPage className="truncate text-[color:var(--lyra-neutral-n700)]">
                            {crumb.label}
                          </BreadcrumbPage>
                        ) : crumb.href ? (
                          <BreadcrumbLink asChild className="truncate text-[color:var(--lyra-primary-p500)]">
                            <Link to={crumb.href} className="truncate">
                              {crumb.label}
                            </Link>
                          </BreadcrumbLink>
                        ) : (
                          <span className="truncate text-[color:var(--lyra-neutral-n500)]">
                            {crumb.label}
                          </span>
                        )}
                      </BreadcrumbItem>,
                      !isLast ? (
                        <BreadcrumbSeparator key={`sep-${crumb.label}-${crumb.href}-${index}`} className="text-[color:var(--lyra-neutral-n500)]" />
                      ) : null,
                    ];
                  })}
                </BreadcrumbList>
              </Breadcrumb>
            ) : null}
          </div>
          {showAskAiButton && aiAssistantPanelControl ? (
            <div className="ml-auto flex shrink-0 items-center">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 shrink-0 gap-2"
                    aria-pressed={aiAssistantPanelControl.isOpen}
                    onClick={aiAssistantPanelControl.togglePanel}
                  >
                    <Sparkles className="h-4 w-4 text-primary" />
                    <span>Ask AI</span>
                    <span className="sr-only">
                      {aiAssistantPanelControl.isOpen ? "Close AI assistant" : "Open AI assistant"}
                    </span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="bottom">
                  {aiAssistantPanelControl.isOpen ? "AI assistant open" : "AI assistant closed"}
                </TooltipContent>
              </Tooltip>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

/** Page title bar: full-bleed background; same shell + column as `PageContent`. */
export function PageHeader({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className="shrink-0 sticky top-0 z-10 w-full bg-background">
      <PageBreadcrumbBar />
      <header data-slot="page-header" className={pageHeaderClassName}>
        <div className={cn("w-full min-w-0 px-8 pt-6 pb-6", className)}>
          <div className={cn(pageMainColumnClassName, "space-y-3")}>{children}</div>
        </div>
      </header>
    </div>
  );
}
