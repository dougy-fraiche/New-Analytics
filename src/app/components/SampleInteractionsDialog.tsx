import { useEffect, useMemo, useState } from "react";
import type { DateRange } from "react-day-picker";
import { Play, RotateCcw } from "lucide-react";

import { Button } from "./ui/button";
import { Calendar } from "./ui/calendar";
import { Card, CardContent } from "./ui/card";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectSeparator,
  SelectTrigger,
} from "./ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  tableOverflowMenuColumnClassName,
} from "./ui/table";
import { LabeledFilterInline, LabeledSelectValue } from "./HeaderFilters";
import {
  DATE_RANGE_CUSTOM_OPTION,
  DATE_RANGE_LABELS,
  DATE_RANGE_PRIMARY_OPTIONS,
  DATE_RANGE_SECONDARY_OPTIONS,
  type DateRangeOption,
} from "../data/date-ranges";
import {
  buildPlaybackPayload,
  getSampleInteractionsForSource,
  openInteractionPlaybackWindow,
} from "../data/sample-interactions-dialog";

const DIALOG_FILTER_DEFAULTS = {
  dateRange: "last-7-days" as DateRangeOption,
  team: "all" as const,
  skill: "all" as const,
  direction: "all" as const,
};

function formatShortDateRange(range: DateRange): string {
  const fmt = (d: Date) =>
    d.toLocaleDateString("en-US", { month: "numeric", day: "2-digit", year: "2-digit" });
  if (!range.from || !range.to) return "Custom range";
  return `${fmt(range.from)} - ${fmt(range.to)}`;
}

export function SampleInteractionsDialog({
  open,
  onOpenChange,
  categoryTitle,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  categoryTitle: string;
}) {
  const [dateRange, setDateRange] = useState<DateRangeOption>(DIALOG_FILTER_DEFAULTS.dateRange);
  const [customRange, setCustomRange] = useState<DateRange | undefined>();
  const [customRangeOpen, setCustomRangeOpen] = useState(false);
  const [team, setTeam] = useState<(typeof DIALOG_FILTER_DEFAULTS)["team"]>(DIALOG_FILTER_DEFAULTS.team);
  const [skill, setSkill] = useState<(typeof DIALOG_FILTER_DEFAULTS)["skill"]>(DIALOG_FILTER_DEFAULTS.skill);
  const [direction, setDirection] = useState<(typeof DIALOG_FILTER_DEFAULTS)["direction"]>(
    DIALOG_FILTER_DEFAULTS.direction,
  );

  const { kpis: sampleInteractionKpis, rows: sampleInteractionRows } = useMemo(
    () => getSampleInteractionsForSource(categoryTitle || "General"),
    [categoryTitle],
  );

  useEffect(() => {
    if (!open) return;
    setDateRange(DIALOG_FILTER_DEFAULTS.dateRange);
    setCustomRange(undefined);
    setTeam(DIALOG_FILTER_DEFAULTS.team);
    setSkill(DIALOG_FILTER_DEFAULTS.skill);
    setDirection(DIALOG_FILTER_DEFAULTS.direction);
  }, [open, categoryTitle]);

  const hasFilterChanges = useMemo(() => {
    return (
      dateRange !== DIALOG_FILTER_DEFAULTS.dateRange ||
      team !== DIALOG_FILTER_DEFAULTS.team ||
      skill !== DIALOG_FILTER_DEFAULTS.skill ||
      direction !== DIALOG_FILTER_DEFAULTS.direction
    );
  }, [dateRange, direction, skill, team]);

  const resetFilters = () => {
    setDateRange(DIALOG_FILTER_DEFAULTS.dateRange);
    setCustomRange(undefined);
    setTeam(DIALOG_FILTER_DEFAULTS.team);
    setSkill(DIALOG_FILTER_DEFAULTS.skill);
    setDirection(DIALOG_FILTER_DEFAULTS.direction);
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="flex max-h-[90vh] max-w-[calc(100vw-2rem)] flex-col gap-4 overflow-y-auto sm:max-w-6xl">
          <DialogHeader className="space-y-1 text-left">
            <DialogTitle className="text-primary-900">Sample Interactions</DialogTitle>
            <DialogDescription>Category: {categoryTitle}</DialogDescription>
          </DialogHeader>

          <div className="flex flex-nowrap items-center gap-2 overflow-x-auto">
            <Select
              value={dateRange}
              onValueChange={(v) => {
                const next = v as DateRangeOption;
                setDateRange(next);
                if (next === DATE_RANGE_CUSTOM_OPTION) {
                  setCustomRangeOpen(true);
                }
              }}
            >
              <SelectTrigger className="h-8 w-auto shrink-0">
                <LabeledFilterInline label="Date range">
                  {dateRange === DATE_RANGE_CUSTOM_OPTION && customRange?.from && customRange?.to
                    ? formatShortDateRange(customRange)
                    : DATE_RANGE_LABELS[dateRange]}
                </LabeledFilterInline>
              </SelectTrigger>
              <SelectContent>
                {DATE_RANGE_PRIMARY_OPTIONS.map((opt) => (
                  <SelectItem key={opt} value={opt}>
                    {DATE_RANGE_LABELS[opt]}
                  </SelectItem>
                ))}
                <SelectSeparator />
                {DATE_RANGE_SECONDARY_OPTIONS.map((opt) => (
                  <SelectItem key={opt} value={opt}>
                    {DATE_RANGE_LABELS[opt]}
                  </SelectItem>
                ))}
                <SelectSeparator />
                <SelectItem value={DATE_RANGE_CUSTOM_OPTION}>
                  {DATE_RANGE_LABELS[DATE_RANGE_CUSTOM_OPTION]}
                </SelectItem>
              </SelectContent>
            </Select>

            <Select value={team} onValueChange={(v) => setTeam(v as typeof team)}>
              <SelectTrigger className="h-8 w-auto shrink-0">
                <LabeledSelectValue label="Team" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="t1">Tier 1</SelectItem>
                <SelectItem value="t2">Tier 2</SelectItem>
              </SelectContent>
            </Select>

            <Select value={skill} onValueChange={(v) => setSkill(v as typeof skill)}>
              <SelectTrigger className="h-8 w-auto shrink-0">
                <LabeledSelectValue label="Skill" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="billing">Billing</SelectItem>
                <SelectItem value="account">Account</SelectItem>
                <SelectItem value="card">Card services</SelectItem>
              </SelectContent>
            </Select>

            <Select value={direction} onValueChange={(v) => setDirection(v as typeof direction)}>
              <SelectTrigger className="h-8 w-auto shrink-0">
                <LabeledSelectValue label="Direction" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="inbound">Inbound</SelectItem>
                <SelectItem value="outbound">Outbound</SelectItem>
              </SelectContent>
            </Select>

            {hasFilterChanges ? (
              <Button type="button" variant="ghost" size="sm" className="shrink-0" onClick={resetFilters}>
                <RotateCcw className="mr-2 h-4 w-4" />
                Reset Filters
              </Button>
            ) : null}
          </div>

          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
            {sampleInteractionKpis.map((k) => (
              <Card key={k.label}>
                <CardContent className="space-y-1.5 p-4">
                  <p className="text-3xl font-normal tracking-tight tabular-nums text-foreground">{k.value}</p>
                  <p className="text-xs text-muted-foreground">{k.label}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="min-h-0 min-w-0 flex-1 pt-2">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[150px]">Agent Name</TableHead>
                  <TableHead className="w-[120px]">Team</TableHead>
                  <TableHead className="w-[200px]">Date &amp; Time</TableHead>
                  <TableHead>Duration</TableHead>
                  <TableHead>CSAT</TableHead>
                  <TableHead>Skill</TableHead>
                  <TableHead className={`${tableOverflowMenuColumnClassName} text-center`}>
                    <span className="sr-only">Play sample</span>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sampleInteractionRows.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell className="font-normal">{row.agentName}</TableCell>
                    <TableCell>{row.team}</TableCell>
                    <TableCell className="whitespace-pre-wrap">{row.dateTime}</TableCell>
                    <TableCell>{row.duration}</TableCell>
                    <TableCell>{row.csat}</TableCell>
                    <TableCell>{row.skill}</TableCell>
                    <TableCell className={`${tableOverflowMenuColumnClassName} text-center`}>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 shrink-0"
                        aria-label={`Play sample interaction for ${row.agentName}`}
                        onClick={() =>
                          openInteractionPlaybackWindow(buildPlaybackPayload(categoryTitle || "Interaction", row))
                        }
                      >
                        <Play className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <DialogFooter className="sm:justify-end">
            <DialogClose asChild>
              <Button type="button" variant="outline">
                Close
              </Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={customRangeOpen} onOpenChange={setCustomRangeOpen}>
        <DialogContent className="sm:max-w-[720px]">
          <DialogHeader>
            <DialogTitle>Custom range</DialogTitle>
            <DialogDescription>Select a start and end date.</DialogDescription>
          </DialogHeader>
          <div className="py-2">
            <Calendar
              mode="range"
              selected={customRange}
              defaultMonth={customRange?.from}
              onSelect={(range) => {
                setCustomRange(range);
                setDateRange(DATE_RANGE_CUSTOM_OPTION);
              }}
              numberOfMonths={2}
              className="[--cell-size:2.25rem]"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCustomRangeOpen(false)}>
              Done
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
