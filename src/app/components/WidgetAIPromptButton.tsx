import { useState, useRef, useEffect } from "react";
import { Sparkles, ArrowRight, Mic, Square } from "lucide-react";
import { Button } from "./ui/button";
import { Textarea } from "./ui/textarea";
import { Popover, PopoverAnchor, PopoverContent, PopoverTrigger } from "./ui/popover";
import { useWidgetAI } from "../contexts/WidgetAIContext";
import { useVoiceInput } from "../hooks/useVoiceInput";
import { toast } from "sonner";
import { Tooltip, TooltipContent, TooltipTrigger } from "./ui/tooltip";
import { cn } from "./ui/utils";

interface WidgetAIPromptButtonProps {
  /** The widget/chart title, used as context reference when sending to AI panel */
  widgetTitle: string;
  /** The chart type, used to show the correct icon in the reference badge */
  chartType?: string;
  /** When set, links chat messages back to an in-page anchor (scroll + highlight). */
  widgetAnchorId?: string;
  /** Tooltip text on the sparkle trigger (default: Ask AI about this widget). */
  tooltipLabel?: string;
  /** Tooltip position for the sparkle trigger. */
  tooltipSide?: "top" | "right" | "bottom" | "left";
  /** Extra classes for the sparkle trigger button (e.g. different hover group). */
  triggerClassName?: string;
  /** Controlled open state (e.g. when opened from chart KPI click). */
  open?: boolean;
  /** Called when popover open state should change (for controlled mode). */
  onOpenChange?: (open: boolean) => void;
  /** When set, shows which KPI/segment is selected (e.g. from chart click). */
  selectedKpiLabel?: string | null;
  /** If provided, anchors the popover at a click point instead of the icon. */
  anchorPoint?: { x: number; y: number } | null;
}

export function WidgetAIPromptButton({
  widgetTitle,
  chartType,
  widgetAnchorId,
  tooltipLabel = "Ask AI about this widget",
  tooltipSide = "bottom",
  triggerClassName,
  open: controlledOpen,
  onOpenChange: controlledOnOpenChange,
  selectedKpiLabel,
  anchorPoint,
}: WidgetAIPromptButtonProps) {
  const widgetAI = useWidgetAI();
  const [internalOpen, setInternalOpen] = useState(false);
  const isControlled = controlledOpen !== undefined && controlledOnOpenChange !== undefined;
  const open = isControlled ? controlledOpen : internalOpen;
  const setOpen = isControlled ? controlledOnOpenChange! : setInternalOpen;
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const voice = useVoiceInput({
    onTranscript: (text) => {
      setQuery((prev) => (prev ? prev + " " : "") + text);
    },
    onError: (error) => {
      if (error === "not-allowed") {
        toast.error("Microphone access denied", {
          description: "Please allow microphone access in your browser settings.",
        });
      } else if (error === "no-speech") {
        toast.info("No speech detected");
      }
    },
  });

  // Focus input when popover opens
  useEffect(() => {
    if (open) {
      // Small delay for popover animation
      const timer = setTimeout(() => inputRef.current?.focus(), 100);
      return () => clearTimeout(timer);
    } else {
      // Reset on close
      setQuery("");
      voice.stop();
    }
    // voice.stop is stable (useCallback with no deps), so this is safe
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, voice.stop]);

  const handleSend = () => {
    if (!query.trim() || !widgetAI) return;
    widgetAI.sendWidgetPrompt(
      widgetTitle,
      query.trim(),
      chartType,
      widgetAnchorId,
      selectedKpiLabel,
    );
    setQuery("");
    setOpen(false);
  };

  // Don't render if there's no WidgetAI context (no chat panel on the page)
  if (!widgetAI) return null;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      {anchorPoint && open ? (
        <PopoverAnchor asChild>
          <span
            style={{
              position: "fixed",
              left: anchorPoint.x,
              top: anchorPoint.y,
              width: 1,
              height: 1,
            }}
          />
        </PopoverAnchor>
      ) : null}
      <Tooltip>
        <TooltipTrigger asChild>
          <span className="inline-flex">
            <PopoverTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className={cn(
                  "h-7 w-7 rounded-md text-muted-foreground hover:text-primary opacity-0 data-[state=open]:opacity-100 transition-opacity",
                  triggerClassName ?? "group-hover/widget:opacity-100",
                )}
              >
                <Sparkles className="h-3.5 w-3.5" />
              </Button>
            </PopoverTrigger>
          </span>
        </TooltipTrigger>
        <TooltipContent side={tooltipSide}>{tooltipLabel}</TooltipContent>
      </Tooltip>

      <PopoverContent
        align="center"
        side="bottom"
        sideOffset={4}
        className="w-80 p-4"
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        <div className="space-y-2">
          <div className="flex flex-col gap-0.5 mb-2">
            <span className="text-xs text-muted-foreground truncate">
              Ask about <span className="font-medium text-foreground">{widgetTitle}</span>
            </span>
            {selectedKpiLabel && (
              <span className="text-xs text-muted-foreground truncate">
                Selected: <span className="font-medium text-foreground">{selectedKpiLabel}</span>
              </span>
            )}
          </div>

          <div className="flex items-start gap-1.5">
            <Textarea
              ref={inputRef}
              value={query + (voice.isListening && voice.interimText ? voice.interimText : "")}
              onChange={(e) => {
                if (voice.isListening) voice.stop();
                setQuery(e.target.value);
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey && query.trim()) {
                  e.preventDefault();
                  handleSend();
                }
                // Prevent popover from closing on Escape while typing
                if (e.key === "Escape") {
                  setOpen(false);
                }
              }}
              placeholder="Ask a question..."
              rows={1}
              className="min-h-8 max-h-40 flex-1 overflow-y-auto rounded-md border border-border bg-background px-2.5 py-1.5 text-sm outline-none focus:border-ring focus:ring-[2px] focus:ring-ring/20 transition-colors"
            />

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  size="icon"
                  variant={voice.isListening ? "destructive" : query.trim() ? "default" : "outline"}
                  className={`h-8 w-8 shrink-0 self-start rounded-md ${voice.isListening ? "animate-pulse" : ""}`}
                  onClick={() => {
                    if (voice.isListening) {
                      voice.stop();
                    } else if (query.trim()) {
                      handleSend();
                    } else if (voice.isSupported) {
                      voice.toggle();
                    } else {
                      toast.error("Voice input not supported", {
                        description: "Your browser doesn't support speech recognition.",
                      });
                    }
                  }}
                >
                  {voice.isListening ? (
                    <Square className="h-3.5 w-3.5" />
                  ) : query.trim() ? (
                    <ArrowRight className="h-3.5 w-3.5" />
                  ) : (
                    <Mic className="h-3.5 w-3.5" />
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom">
                {voice.isListening ? "Stop recording" : query.trim() ? "Send" : "Voice input"}
              </TooltipContent>
            </Tooltip>
          </div>

          <div className="flex flex-wrap gap-1.5 pt-1">
            {[
              "What's the trend?",
              "Explain this data",
              "Any anomalies?",
              "Any recommendations?",
            ].map((suggestion) => (
              <button
                key={suggestion}
                onClick={() => {
                  if (!widgetAI) return;
                  widgetAI.sendWidgetPrompt(
                    widgetTitle,
                    suggestion,
                    chartType,
                    widgetAnchorId,
                    selectedKpiLabel,
                  );
                  setOpen(false);
                }}
                className="text-xs px-2 py-1 rounded-md bg-muted hover:bg-muted/80 text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
              >
                {suggestion}
              </button>
            ))}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}