import { useState, useCallback, useRef, useEffect } from "react";
import { X, Bookmark, ExternalLink, Check } from "lucide-react";
import { Button } from "./ui/button";
import { DashboardData } from "../contexts/ConversationContext";
import { ConversationDashboardArea } from "./ConversationDashboardArea";
import { Link } from "react-router";
import { ResizeHandle } from "./ResizeHandle";
import { useKeyboardShortcut } from "../hooks/useKeyboardShortcuts";
import { Tooltip, TooltipContent, TooltipTrigger } from "./ui/tooltip";

interface SavedInfo {
  name: string;
  path: string;
}

interface ArtifactPanelProps {
  dashboard: DashboardData;
  onClose: () => void;
  onSave: (dashboard: DashboardData) => void;
  savedInfo: SavedInfo | null;
  isThinking?: boolean;
  /** When provided, widget AI prompts are sent back to the Explore conversation */
  onWidgetPrompt?: (
    widgetTitle: string,
    message: string,
    chartType?: string,
    widgetAnchorId?: string,
    selectedKpiLabel?: string | null,
  ) => void;
}

const MIN_WIDTH = 360;
const MAX_RATIO = 0.75;
const DEFAULT_RATIO = 0.5;

export function ArtifactPanel({
  dashboard,
  onClose,
  onSave,
  savedInfo,
  isThinking,
  onWidgetPrompt,
}: ArtifactPanelProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  // null = default 50% mode (tracked via parentWidth), number = user manually resized
  const [manualWidth, setManualWidth] = useState<number | null>(null);
  // Track the flex parent width so default 50% stays accurate as sidebar collapses/expands
  const [parentWidth, setParentWidth] = useState(0);

  useEffect(() => {
    const el = containerRef.current;
    // Use a data attribute to find the flex container reliably instead of
    // brittle parentElement chains that break on layout changes.
    const flexParent = el?.closest<HTMLElement>("[data-panel-container]");
    if (!flexParent) return;

    const update = () => {
      setParentWidth(flexParent.getBoundingClientRect().width);
    };
    update();

    const observer = new ResizeObserver(update);
    observer.observe(flexParent);
    return () => observer.disconnect();
  }, []);

  const handleResize = useCallback(
    (delta: number) => {
      setManualWidth((prev) => {
        const el = containerRef.current;
        const flexParent = el?.closest<HTMLElement>("[data-panel-container]");
        const pw = flexParent
          ? flexParent.getBoundingClientRect().width
          : 1200;
        const current = prev ?? Math.round(pw * DEFAULT_RATIO);
        const maxWidth = Math.round(pw * MAX_RATIO);
        return Math.max(MIN_WIDTH, Math.min(maxWidth, current + delta));
      });
    },
    [],
  );

  const handleReset = useCallback(() => {
    setManualWidth(null);
  }, []);

  // Resolved pixel width: manual override wins, otherwise 50% of flex parent
  const resolvedWidth = manualWidth ?? Math.round(parentWidth * DEFAULT_RATIO);

  // Focus the close button when the panel opens for accessibility
  useEffect(() => {
    // Small delay to allow the DOM to settle after portal render
    const id = requestAnimationFrame(() => {
      closeButtonRef.current?.focus();
    });
    return () => cancelAnimationFrame(id);
  }, [dashboard.id]);

  // Keyboard shortcut: Escape to close the panel (high priority so it wins
  // over other Escape handlers like search overlay)
  useKeyboardShortcut({
    id: "artifact-panel:close",
    key: "Escape",
    handler: (e: KeyboardEvent) => {
      e.preventDefault();
      onClose();
    },
    priority: 100,
  });

  return (
    <div
      ref={containerRef}
      role="complementary"
      aria-label={`Dashboard panel: ${dashboard.title}`}
      className="relative flex flex-col h-full border-l bg-background"
      style={{ width: resolvedWidth || "50%", minWidth: MIN_WIDTH }}
    >
      <ResizeHandle side="left" onResize={handleResize} onReset={handleReset} />

      {/* Header bar */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-border bg-background shrink-0">
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <span className="text-sm truncate" style={{ fontWeight: 500 }}>
            {dashboard.title}
          </span>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          {savedInfo ? (
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5 text-green-700 dark:text-green-400 border-green-300 dark:border-green-700 hover:bg-green-50 dark:hover:bg-green-950"
              asChild
            >
              <Link to={savedInfo.path}>
                <Check className="h-3.5 w-3.5" />
                Saved
                <ExternalLink className="h-3 w-3 ml-0.5" />
              </Link>
            </Button>
          ) : (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onSave(dashboard)}
              className="gap-1.5"
            >
              <Bookmark className="h-3.5 w-3.5" />
              Save
            </Button>
          )}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                ref={closeButtonRef}
                variant="ghost"
                size="icon"
                onClick={onClose}
                className="h-7 w-7"
                aria-label="Close panel"
              >
                <X className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">Close</TooltipContent>
          </Tooltip>
        </div>
      </div>

      {/* Dashboard content */}
      <div className="flex-1 overflow-auto">
        <ConversationDashboardArea
          isThinking={!!isThinking}
          dashboardData={dashboard}
          onWidgetPrompt={onWidgetPrompt}
        />
      </div>
    </div>
  );
}
