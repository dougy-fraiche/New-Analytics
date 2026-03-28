import { useState, type LegacyRef, type RefObject } from "react";
import {
  Plus,
  ArrowRight,
  Mic,
  Square,
  Upload,
  Image,
  Paperclip,
  Zap,
  Telescope,
  CalendarDays,
  ChevronDown,
} from "lucide-react";
import { Button } from "./ui/button";
import { Textarea } from "./ui/textarea";
import { ToggleGroup, ToggleGroupItem } from "./ui/toggle-group";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { TypeaheadSuggestions } from "./TypeaheadSuggestions";
import { toast } from "sonner";
import { useTypingPlaceholder } from "../hooks/useTypingPlaceholder";
import { placeholderSuffixes } from "../data/explore-data";
import {
  DATE_RANGE_CUSTOM_OPTION,
  DATE_RANGE_LABELS,
  DATE_RANGE_PRIMARY_OPTIONS,
  DATE_RANGE_SECONDARY_OPTIONS,
  type DateRangeOption,
} from "../data/date-ranges";
import { Tooltip, TooltipContent, TooltipTrigger } from "./ui/tooltip";
import { Calendar } from "./ui/calendar";
import type { DateRange } from "react-day-picker";

interface ChatInputBarProps {
  variant: "hero" | "chat";
  query: string;
  voice: {
    isListening: boolean;
    isSupported: boolean;
    interimText: string;
    toggle: () => void;
    stop: () => void;
  };
  inputRef: RefObject<HTMLTextAreaElement | null>;
  onQueryChange: (value: string) => void;
  onSend: () => void;
  // Typeahead (hero only)
  showTypeahead?: boolean;
  onShowTypeahead?: (show: boolean) => void;
  forcedSuggestions?: string[];
  onForcedSuggestionsChange?: (s: string[]) => void;
}

// Date range options are shared across the app (see `src/app/data/date-ranges.ts`).

export function ChatInputBar({
  variant,
  query,
  voice,
  inputRef,
  onQueryChange,
  onSend,
  showTypeahead = false,
  onShowTypeahead,
  forcedSuggestions = [],
  onForcedSuggestionsChange,
}: ChatInputBarProps) {
  const isHero = variant === "hero";
  const [researchMode, setResearchMode] = useState<"fast" | "deep">("fast");
  const [dateRange, setDateRange] = useState<DateRangeOption>("last-7-days");
  const [isDateMenuOpen, setIsDateMenuOpen] = useState(false);
  const [showCustomRangeCalendar, setShowCustomRangeCalendar] = useState(false);
  const [customRange, setCustomRange] = useState<DateRange | undefined>();
  // The typing animation runs inside ChatInputBar so only this component
  // re-renders every ~45ms, instead of the entire ExplorePhase tree.
  const animatedSuffix = useTypingPlaceholder(isHero ? placeholderSuffixes : []);
  const placeholder = isHero
    ? `Ask anything about your ${animatedSuffix}`
    : "Ask a follow-up question\u2026";

  const handleSend = () => {
    if (isHero) onShowTypeahead?.(false);
    onSend();
  };

  const formatCustomRange = (range: DateRange | undefined) => {
    if (!range?.from) return "Custom range";
    const from = range.from.toLocaleDateString();
    const to = range.to ? range.to.toLocaleDateString() : "Select end";
    return `${from} - ${to}`;
  };

  return (
    <div
      className={`relative mx-auto w-full max-w-[50rem] rounded-3xl border bg-card text-card-foreground transition-shadow focus-within:border-ring ${
        isHero
          ? "explore-chat-input-elevated"
          : "shadow-sm focus-within:ring-[3px] focus-within:ring-ring/20"
      }`}
    >
      <div className="w-full p-4">
        <div className="space-y-4">
          <div className="flex items-start gap-3">
            <div className="flex-1 min-w-0">
              <Textarea
                placeholder={placeholder}
                value={query + (voice.isListening && voice.interimText ? voice.interimText : "")}
                onChange={(e) => {
                  if (voice.isListening) voice.stop();
                  onQueryChange(e.target.value);
                  if (isHero) {
                    onForcedSuggestionsChange?.([]);
                    onShowTypeahead?.(true);
                  }
                }}
                onFocus={() => {
                  if (isHero && query.trim()) onShowTypeahead?.(true);
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey && query.trim()) {
                    e.preventDefault();
                    handleSend();
                  }
                }}
                rows={1}
                className={`min-h-9 max-h-40 overflow-y-auto border-0 focus-visible:ring-0 shadow-none px-1 py-2 ${isHero ? "text-base" : "text-sm"}`}
                ref={inputRef as LegacyRef<HTMLTextAreaElement>}
                autoComplete="off"
              />
            </div>
          </div>

          <div className="flex w-full items-center justify-between gap-2">
            <div className="flex min-w-0 items-center gap-2">
              <DropdownMenu>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span className="inline-flex">
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className={`${isHero ? "h-9 w-9" : "h-8 w-8"}`}>
                          <Plus className={`${isHero ? "h-5 w-5" : "h-4 w-4"}`} />
                        </Button>
                      </DropdownMenuTrigger>
                    </span>
                  </TooltipTrigger>
                  <TooltipContent side={isHero ? "bottom" : "top"}>Attach</TooltipContent>
                </Tooltip>
                <DropdownMenuContent align="start" side={isHero ? "bottom" : "top"}>
                  <DropdownMenuItem onClick={() => toast.info("File upload coming soon")}>
                    <Upload className="h-4 w-4 mr-2" />
                    Upload file
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => toast.info("Image upload coming soon")}>
                    <Image className="h-4 w-4 mr-2" />
                    Add image
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => toast.info("CSV import coming soon")}>
                    <Paperclip className="h-4 w-4 mr-2" />
                    Attach data source
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              <ToggleGroup
                type="single"
                value={researchMode}
                onValueChange={(value) => {
                  if (value === "fast" || value === "deep") setResearchMode(value);
                }}
                variant="default"
                className="w-auto shrink-0 gap-2 rounded-none bg-transparent"
                aria-label="Explore mode"
              >
                <ToggleGroupItem
                  value="fast"
                  aria-label="Fast mode"
                  className="h-9 !flex-none gap-1.5 rounded-md px-3 py-1 first:rounded-md last:rounded-md"
                >
                  <Zap className="h-3.5 w-3.5" />
                  Fast
                </ToggleGroupItem>
                <ToggleGroupItem
                  value="deep"
                  aria-label="Deep research mode"
                  className="h-9 !flex-none gap-1.5 rounded-md px-3 py-1 first:rounded-md last:rounded-md"
                >
                  <Telescope className="h-3.5 w-3.5" />
                  Deep Research
                </ToggleGroupItem>
              </ToggleGroup>

              <DropdownMenu
                open={isDateMenuOpen}
                onOpenChange={(open) => {
                  setIsDateMenuOpen(open);
                  if (open) {
                    setShowCustomRangeCalendar(dateRange === "custom-range");
                  } else {
                    setShowCustomRangeCalendar(false);
                  }
                }}
              >
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="h-9 w-fit max-w-full gap-2 px-3" aria-label="Date range">
                    <CalendarDays className="h-4 w-4 shrink-0" />
                    <span className="min-w-0 max-w-[18rem] truncate">
                      {dateRange === "custom-range"
                        ? formatCustomRange(customRange)
                        : DATE_RANGE_LABELS[dateRange]}
                    </span>
                    <ChevronDown className="h-4 w-4 shrink-0 opacity-60" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="start"
                  side={isHero ? "bottom" : "top"}
                  className={
                    showCustomRangeCalendar
                      ? "w-auto max-w-[calc(100vw-2rem)] min-w-0 overflow-visible p-0"
                      : "w-72"
                  }
                >
                  {showCustomRangeCalendar ? (
                    <div className="space-y-2 p-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-full justify-start"
                        onClick={() => setShowCustomRangeCalendar(false)}
                      >
                        Presets
                      </Button>
                      <Calendar
                        mode="range"
                        selected={customRange}
                        defaultMonth={customRange?.from}
                        onSelect={(range) => {
                          setCustomRange(range);
                          setDateRange("custom-range");
                        }}
                        numberOfMonths={2}
                        className="[--cell-size:2.25rem]"
                      />
                    </div>
                  ) : (
                    <>
                      {DATE_RANGE_PRIMARY_OPTIONS.map((opt) => (
                        <DropdownMenuItem
                          key={opt}
                          onClick={() => {
                            setDateRange(opt);
                            setIsDateMenuOpen(false);
                          }}
                        >
                          {DATE_RANGE_LABELS[opt]}
                        </DropdownMenuItem>
                      ))}
                      <DropdownMenuSeparator />
                      {DATE_RANGE_SECONDARY_OPTIONS.map((opt) => (
                        <DropdownMenuItem
                          key={opt}
                          onClick={() => {
                            setDateRange(opt);
                            setIsDateMenuOpen(false);
                          }}
                        >
                          {DATE_RANGE_LABELS[opt]}
                        </DropdownMenuItem>
                      ))}
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onSelect={(event) => {
                          event.preventDefault();
                          setDateRange(DATE_RANGE_CUSTOM_OPTION);
                          setShowCustomRangeCalendar(true);
                        }}
                      >
                        {DATE_RANGE_LABELS[DATE_RANGE_CUSTOM_OPTION]}
                      </DropdownMenuItem>
                    </>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            <div className="flex items-center gap-1">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    size="icon"
                    variant={voice.isListening ? "destructive" : query.trim() ? "default" : "outline"}
                    className={`${isHero ? "h-9 w-9" : "h-8 w-8"} rounded-lg ${voice.isListening ? "animate-pulse" : ""}`}
                    onClick={() => {
                      if (voice.isListening) {
                        voice.stop();
                      } else if (query.trim()) {
                        handleSend();
                      } else if (voice.isSupported) {
                        voice.toggle();
                      } else {
                        toast.error("Voice input not supported", {
                          description: "Your browser doesn't support speech recognition. Try Chrome or Edge.",
                        });
                      }
                    }}
                  >
                    {voice.isListening ? (
                      <Square className="h-4 w-4" />
                    ) : query.trim() ? (
                      <ArrowRight className="h-4 w-4" />
                    ) : (
                      <Mic className="h-4 w-4" />
                    )}
                  </Button>
                </TooltipTrigger>
                <TooltipContent side={isHero ? "bottom" : "top"}>
                  {voice.isListening ? "Stop recording" : query.trim() ? "Send" : "Voice input"}
                </TooltipContent>
              </Tooltip>
            </div>
          </div>
        </div>
      </div>
      {isHero && (
        <TypeaheadSuggestions
          query={query}
          onSelect={(suggestion) => {
            onQueryChange(suggestion);
            onForcedSuggestionsChange?.([]);
            onShowTypeahead?.(false);
            inputRef.current?.focus();
          }}
          visible={showTypeahead}
          onDismiss={() => {
            onShowTypeahead?.(false);
            onForcedSuggestionsChange?.([]);
          }}
          inputRef={inputRef}
          forcedSuggestions={forcedSuggestions}
        />
      )}
    </div>
  );
}