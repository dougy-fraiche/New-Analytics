import type { ReactNode } from "react";
import { Link, useLocation } from "react-router";
import { Sparkles } from "lucide-react";

import { usePageBreadcrumbs } from "../contexts/PageBreadcrumbsContext";
import { useOptionalAiAssistantPanelControl } from "../contexts/AiAssistantPanelControlContext";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbSeparator,
} from "./ui/breadcrumb";
import { Button } from "./ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "./ui/tooltip";

import { cn } from "./ui/utils";
import { ROUTES } from "../routes";

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
  "shrink-0 sticky top-0 z-10 w-full border-b border-border/60 bg-background [&_h1]:text-primary-900";

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
  actions?: ReactNode;
  tabs?: ReactNode;
  className?: string;
}

/**
 * Standardized page-header primary layout:
 * - Left: breadcrumb + title stacked (4px gap)
 * - Right: Ask AI + page actions
 * - Optional tabs row below
 */
export function PageHeaderPrimaryRow({
  title,
  actions,
  tabs,
  className,
}: PageHeaderPrimaryRowProps) {
  const breadcrumbs = usePageBreadcrumbs();
  const jumpableBreadcrumbs = breadcrumbs.slice(0, -1).filter((crumb) => Boolean(crumb.href));
  const location = useLocation();
  const aiAssistantPanelControl = useOptionalAiAssistantPanelControl();
  const isExploreHome = location.pathname === ROUTES.EXPLORE;
  const showAskAiButton = !isExploreHome && aiAssistantPanelControl !== undefined;
  const showActions = showAskAiButton || actions !== undefined;

  return (
    <div className={cn("w-full", className)}>
      <div className="flex min-w-0 flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex min-w-0 flex-col gap-1">
            {jumpableBreadcrumbs.length > 0 ? (
              <Breadcrumb>
                <BreadcrumbList className="min-w-0 flex-nowrap overflow-hidden whitespace-nowrap">
                  {jumpableBreadcrumbs.flatMap((crumb, index) => {
                    const isLast = index === jumpableBreadcrumbs.length - 1;
                    return [
                      <BreadcrumbItem key={`item-${crumb.label}-${crumb.href}-${index}`} className="min-w-0">
                        <BreadcrumbLink asChild className="truncate text-[color:var(--lyra-primary-p500)]">
                          <Link to={crumb.href!} className="truncate">
                            {crumb.label}
                          </Link>
                        </BreadcrumbLink>
                      </BreadcrumbItem>,
                      !isLast ? (
                        <BreadcrumbSeparator key={`sep-${crumb.label}-${crumb.href}-${index}`} className="text-[color:var(--lyra-neutral-n500)]" />
                      ) : null,
                    ];
                  })}
                </BreadcrumbList>
              </Breadcrumb>
            ) : null}
            <div className="min-w-0">{title}</div>
          </div>
        </div>
        {showActions ? (
          <div className="ml-auto flex shrink-0 items-center gap-2">
            {actions}
            {showAskAiButton && aiAssistantPanelControl ? (
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
            ) : null}
          </div>
        ) : null}
      </div>
      {tabs ? <div className="mt-4">{tabs}</div> : null}
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
    <header data-slot="page-header" className={pageHeaderClassName}>
      <div className={cn("w-full min-w-0 px-8 pt-6 pb-6", className)}>
        <div className={cn(pageMainColumnClassName, "space-y-3")}>{children}</div>
      </div>
    </header>
  );
}
