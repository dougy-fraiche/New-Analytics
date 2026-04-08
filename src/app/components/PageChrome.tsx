import type { ReactNode } from "react";
import { Link } from "react-router";

import { cn } from "./ui/utils";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "./ui/breadcrumb";
import { usePageBreadcrumbs } from "../contexts/PageBreadcrumbsContext";

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
 * wrapper instead of `PageContent`, so the 1440px column is full width inside the gutters (not
 * shrunk by `px-*` and `max-w-*` on one node).
 */
export const pageRootListScrollGutterClassName = "w-full min-w-0 px-8 pt-8";

/**
 * Max-width column token (1440px, centered). Composed with `pageMainShellClassName` on
 * `PageContent` as a single root node — use `space-y-*`, `gap-*`, or `pb-*` on `className` for rhythm.
 */
export const pageMainColumnClassName = "mx-auto w-full min-w-0 max-w-[1440px]";

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

/** Page title bar: full-bleed background; same shell + column as `PageContent`. */
export function PageHeader({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  const breadcrumbs = usePageBreadcrumbs();

  return (
    <header className={pageHeaderClassName}>
      <div className={cn("w-full min-w-0 px-8 pt-8 pb-8", className)}>
        <div className={pageMainColumnClassName}>
          {breadcrumbs.length > 0 && (
            <div className="mb-4 min-w-0">
              <Breadcrumb>
                <BreadcrumbList>
                  {breadcrumbs.flatMap((crumb, index) => {
                    const items = [];
                    items.push(
                      <BreadcrumbItem key={`item-${index}`}>
                        {index < breadcrumbs.length - 1 ? (
                          crumb.href ? (
                            <BreadcrumbLink asChild>
                              <Link to={crumb.href}>{crumb.label}</Link>
                            </BreadcrumbLink>
                          ) : (
                            <BreadcrumbPage>{crumb.label}</BreadcrumbPage>
                          )
                        ) : (
                          <BreadcrumbPage>{crumb.label}</BreadcrumbPage>
                        )}
                      </BreadcrumbItem>
                    );
                    if (index < breadcrumbs.length - 1) {
                      items.push(<BreadcrumbSeparator key={`sep-${index}`} />);
                    }
                    return items;
                  })}
                </BreadcrumbList>
              </Breadcrumb>
            </div>
          )}
          {children}
        </div>
      </div>
    </header>
  );
}
