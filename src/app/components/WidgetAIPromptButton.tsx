import { useState, useRef, useEffect, useLayoutEffect } from "react";
import { createPortal } from "react-dom";
import { Sparkles, ArrowRight, Mic, Square } from "lucide-react";
import { Button } from "./ui/button";
import { Textarea } from "./ui/textarea";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import { useWidgetAI } from "../contexts/WidgetAIContext";
import { useVoiceInput } from "../hooks/useVoiceInput";
import { usePortalContainer } from "../contexts/PortalContainerContext";
import { toast } from "sonner";
import { Tooltip, TooltipContent, TooltipTrigger } from "./ui/tooltip";
import { cn } from "./ui/utils";

/**
 * PopoverContent defaults include slide-in-from-* by side; these zero out translate so
 * the panel only fades + zooms (same feel as KPI portal below).
 */
const ASK_AI_POPOVER_SLIDE_NEUTRAL =
  "data-[side=bottom]:slide-in-from-top-0 data-[side=left]:slide-in-from-right-0 data-[side=right]:slide-in-from-left-0 data-[side=top]:slide-in-from-bottom-0";

/**
 * Match `PopoverContent` animation contract (fade + slight zoom), but without slide-in.
 * We use `data-state` on the KPI portal so the same classes apply.
 */
const ASK_AI_PANEL_ANIMATION =
  "data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 origin-top";

// `tw-animate-css` default duration is ~150ms; keep KPI portal mounted briefly to allow close animation.
const KPI_PORTAL_CLOSE_MS = 160;

const PANEL_WIDTH_PX = 320;
const VIEW_PADDING = 8;
const PANEL_MAX_HEIGHT_ESTIMATE = 420;

function clampHorizontal(centerX: number): number {
  const half = PANEL_WIDTH_PX / 2;
  const min = half + VIEW_PADDING;
  const max = typeof window !== "undefined" ? window.innerWidth - half - VIEW_PADDING : centerX;
  return Math.min(Math.max(centerX, min), max);
}

/** Stable viewport position for KPI-click popover (layout-synced portal; avoids Radix anchor flicker). */
function computeKpiPortalPosition(anchor: { x: number; y: number }): {
  left: number;
  top: number;
  transform: string;
} {
  const left = clampHorizontal(anchor.x);
  let top = anchor.y + 8;
  if (top + PANEL_MAX_HEIGHT_ESTIMATE > window.innerHeight - VIEW_PADDING) {
    top = Math.max(VIEW_PADDING, anchor.y - PANEL_MAX_HEIGHT_ESTIMATE - 8);
  }
  return { left, top, transform: "translate(-50%, 0)" };
}

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
  const portalContainer = usePortalContainer();
  const [internalOpen, setInternalOpen] = useState(false);
  const isControlled = controlledOpen !== undefined && controlledOnOpenChange !== undefined;
  const open = isControlled ? controlledOpen : internalOpen;
  const setOpen = isControlled ? controlledOnOpenChange! : setInternalOpen;
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const kpiPanelRef = useRef<HTMLDivElement>(null);
  const [lastAnchorPoint, setLastAnchorPoint] = useState<{ x: number; y: number } | null>(null);
  const [kpiPortalPhase, setKpiPortalPhase] = useState<"open" | "closing" | "closed">("closed");
  const kpiCloseTimerRef = useRef<number | null>(null);
  const [kpiPanelStyle, setKpiPanelStyle] = useState<{
    left: number;
    top: number;
    transform: string;
  } | null>(null);

  /** KPI mode uses a fixed portal; keep Radix closed so it does not trap focus without content. */
  const radixPopoverOpen = open && !anchorPoint;
  const isIconPopover = radixPopoverOpen;
  const isKpiPortal = open && !!anchorPoint;
  const shouldRenderKpiPortal = kpiPortalPhase !== "closed";
  const kpiPortalDataState = kpiPortalPhase === "open" ? "open" : "closed";
  const effectiveAnchorPoint = anchorPoint ?? lastAnchorPoint;

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

  // Track portal open/close so we can animate out like Radix does.
  useEffect(() => {
    // Clear any pending close timer when state changes.
    if (kpiCloseTimerRef.current) {
      window.clearTimeout(kpiCloseTimerRef.current);
      kpiCloseTimerRef.current = null;
    }

    if (isKpiPortal && anchorPoint) {
      setLastAnchorPoint(anchorPoint);
      setKpiPortalPhase("open");
      return;
    }

    // Leaving KPI mode: animate out, then unmount.
    if (kpiPortalPhase === "open") {
      setKpiPortalPhase("closing");
      kpiCloseTimerRef.current = window.setTimeout(() => {
        setKpiPortalPhase("closed");
        kpiCloseTimerRef.current = null;
      }, KPI_PORTAL_CLOSE_MS);
    } else if (kpiPortalPhase === "closing") {
      // If we are already closing, keep the timer running (it was cleared above and restarted here).
      kpiCloseTimerRef.current = window.setTimeout(() => {
        setKpiPortalPhase("closed");
        kpiCloseTimerRef.current = null;
      }, KPI_PORTAL_CLOSE_MS);
    }

    return () => {
      if (kpiCloseTimerRef.current) {
        window.clearTimeout(kpiCloseTimerRef.current);
        kpiCloseTimerRef.current = null;
      }
    };
  }, [isKpiPortal, anchorPoint, kpiPortalPhase]);

  // Position KPI portal relative to the last known click point (for open + exit animations).
  useLayoutEffect(() => {
    if (!shouldRenderKpiPortal || !effectiveAnchorPoint) {
      setKpiPanelStyle(null);
      return;
    }
    setKpiPanelStyle(computeKpiPortalPosition(effectiveAnchorPoint));
  }, [shouldRenderKpiPortal, effectiveAnchorPoint?.x, effectiveAnchorPoint?.y]);

  useEffect(() => {
    if (!shouldRenderKpiPortal) return;
    const sync = () => {
      if (effectiveAnchorPoint) setKpiPanelStyle(computeKpiPortalPosition(effectiveAnchorPoint));
    };
    window.addEventListener("scroll", sync, true);
    window.addEventListener("resize", sync);
    return () => {
      window.removeEventListener("scroll", sync, true);
      window.removeEventListener("resize", sync);
    };
  }, [shouldRenderKpiPortal, effectiveAnchorPoint?.x, effectiveAnchorPoint?.y]);

  useEffect(() => {
    if (!shouldRenderKpiPortal) return;
    const onPointerDown = (e: PointerEvent) => {
      const t = e.target as Node;
      if (kpiPanelRef.current?.contains(t) || triggerRef.current?.contains(t)) return;
      setOpen(false);
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("pointerdown", onPointerDown, true);
    document.addEventListener("keydown", onKeyDown, true);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown, true);
      document.removeEventListener("keydown", onKeyDown, true);
    };
  }, [shouldRenderKpiPortal, setOpen]);

  useEffect(() => {
    if (open) {
      const timer = setTimeout(() => inputRef.current?.focus(), 100);
      return () => clearTimeout(timer);
    } else {
      setQuery("");
      voice.stop();
    }
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

  if (!widgetAI) return null;

  const mountTarget = typeof document !== "undefined" ? portalContainer ?? document.body : null;

  /** Shared form: same markup for shadcn Popover and KPI portal (visual parity). */
  const askForm = (
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
            if (e.key === "Escape") {
              e.stopPropagation();
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
            type="button"
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
  );

  const kpiPortal =
    shouldRenderKpiPortal && kpiPanelStyle && mountTarget
      ? createPortal(
          <div
            ref={kpiPanelRef}
            role="dialog"
            aria-label="Ask AI"
            data-state={kpiPortalDataState}
            className={cn(
              "bg-popover text-popover-foreground z-50 rounded-md border p-4 shadow-md outline-hidden",
              ASK_AI_PANEL_ANIMATION,
            )}
            style={{
              position: "fixed",
              width: PANEL_WIDTH_PX,
              left: kpiPanelStyle.left,
              top: kpiPanelStyle.top,
              transform: kpiPanelStyle.transform,
            }}
          >
            {askForm}
          </div>,
          mountTarget,
        )
      : null;

  return (
    <>
      <Popover open={radixPopoverOpen} onOpenChange={setOpen} modal={false}>
        <Tooltip>
          <TooltipTrigger asChild>
            <span className="inline-flex">
              <PopoverTrigger asChild>
                <Button
                  ref={triggerRef}
                  variant="ghost"
                  size="icon"
                  className={cn(
                    "h-7 w-7 rounded-md text-muted-foreground hover:text-primary transition-colors",
                    triggerClassName,
                  )}
                  aria-expanded={radixPopoverOpen || isKpiPortal}
                  aria-haspopup="dialog"
                >
                  <Sparkles className="h-3.5 w-3.5" />
                </Button>
              </PopoverTrigger>
            </span>
          </TooltipTrigger>
          <TooltipContent side={tooltipSide}>{tooltipLabel}</TooltipContent>
        </Tooltip>

        {isIconPopover ? (
          <PopoverContent
            align="center"
            side="bottom"
            sideOffset={8}
            className={cn("w-80 p-4", ASK_AI_PANEL_ANIMATION, ASK_AI_POPOVER_SLIDE_NEUTRAL)}
            onOpenAutoFocus={(e) => e.preventDefault()}
          >
            {askForm}
          </PopoverContent>
        ) : null}
      </Popover>
      {kpiPortal}
    </>
  );
}
