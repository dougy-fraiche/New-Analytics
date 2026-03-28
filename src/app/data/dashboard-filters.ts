import type { DateRangeOption } from "./date-ranges";

export type DashboardTeamFilter = "all-teams" | "tier-1" | "tier-2" | "technical";

export type DashboardProductFilter =
  | "all-products"
  | "product-a"
  | "product-b"
  | "product-c";

/** Shared defaults for dashboard header filter dropdowns (strict `Select` typing). */
export const DEFAULT_DASHBOARD_FILTERS: {
  dateRange: DateRangeOption;
  team: DashboardTeamFilter;
  product: DashboardProductFilter;
} = {
  dateRange: "last-30-days",
  team: "all-teams",
  product: "all-products",
};
