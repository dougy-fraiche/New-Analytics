export type DateRangeOption =
  | "last-7-days"
  | "last-30-days"
  | "last-90-days"
  | "this-quarter"
  | "this-year"
  | "custom-range";

export const DATE_RANGE_LABELS: Record<DateRangeOption, string> = {
  "last-7-days": "Last 7 days",
  "last-30-days": "Last 30 days",
  "last-90-days": "Last 90 days",
  "this-quarter": "This quarter",
  "this-year": "This year",
  "custom-range": "Custom range",
};

export const DATE_RANGE_PRIMARY_OPTIONS: DateRangeOption[] = [
  "last-7-days",
  "last-30-days",
  "last-90-days",
];

export const DATE_RANGE_SECONDARY_OPTIONS: DateRangeOption[] = [
  "this-quarter",
  "this-year",
];

export const DATE_RANGE_CUSTOM_OPTION: DateRangeOption = "custom-range";

