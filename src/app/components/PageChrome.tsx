import type { ReactNode } from "react";

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
 * Page title region: full width of the main column, background edge-to-edge,
 * subtle bottom border, equal top/bottom padding (matches previous pt-6).
 */
export const pageHeaderClassName =
  "shrink-0 sticky top-0 z-10 w-full border-b border-border/60 bg-background pt-6 pb-6 [&_h1]:text-primary-900";

/**
 * Merge onto `<PageHeader className={pageHeaderTabsFooterClassName}>` when the last row
 * is a line-variant `TabsList`, so bottom padding is removed and the tab row aligns with the
 * header bottom border.
 */
export const pageHeaderTabsFooterClassName = "pb-0";

/** Constrains title/actions to the same max width as `PageContent` (1440px). */
export const pageHeaderInnerClassName =
  "mx-auto w-full max-w-[1440px] px-4 md:px-8";

/** Max width for scrollable page body (aligns with prior RootLayout constraint). */
export const pageContentMaxWidthClassName = "mx-auto w-full max-w-[1440px]";

export function PageContent({
  className,
  children,
}: {
  className?: string;
  children: ReactNode;
}) {
  return (
    <div className={cn(pageContentMaxWidthClassName, className)}>{children}</div>
  );
}

/** Page title bar: full-bleed background + inner content capped at 1440px. */
export function PageHeader({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <header className={cn(pageHeaderClassName, className)}>
      <div className={pageHeaderInnerClassName}>{children}</div>
    </header>
  );
}
