import { memo, useRef, useEffect } from "react";
import {
  Loader2,
  LayoutDashboard,
  ExternalLink,
  Check,
} from "lucide-react";
import { Badge } from "./ui/badge";
import { Link } from "react-router";

import { InlineWidget } from "./InlineWidget";
import { getChartIconForWidgetType } from "./ChartVariants";
import type { Message, DashboardData } from "../contexts/ConversationContext";

// ── Types ─────────────────────────────────────────────────────────────

interface MessageListProps {
  messages: Message[];
  isThinking: boolean;
  activeDashboardId: string | null;
  savedDashboards: Record<string, { name: string; path: string }>;
  onOpenArtifact: (dashboard: DashboardData) => void;
  onCloseArtifact: () => void;
  maxWidth?: string;
}

// ── Component ─────────────────────────────────────────────────────────

/**
 * Memoised message list that only re-renders when its own props change.
 * This isolates the expensive message tree from keystroke-driven
 * re-renders in the parent `ConversationPhase`.
 */
export const MessageList = memo(function MessageList({
  messages,
  isThinking,
  activeDashboardId,
  savedDashboards,
  onOpenArtifact,
  onCloseArtifact,
  maxWidth = "max-w-[700px]",
}: MessageListProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll when new messages arrive or thinking state changes
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isThinking]);

  return (
    <div className={`${maxWidth} mx-auto space-y-4`}>
      {messages.map((msg) => {
        // ── Dashboard artifact card ──────────────────────────
        if (msg.dashboardData) {
          const dash = msg.dashboardData;
          const isOpen = activeDashboardId === dash.id;
          const saved = savedDashboards[dash.id];
          return (
            <div
              key={msg.id}
              className="flex justify-start"
            >
              <div className="w-full space-y-3">
                <button
                  type="button"
                  onClick={() => (isOpen ? onCloseArtifact() : onOpenArtifact(dash))}
                  className={`w-full text-left rounded-xl border-2 transition-[box-shadow,border-color,background-color] p-3 cursor-pointer ${
                    isOpen
                      ? "border-primary/50 bg-primary/5 shadow-sm"
                      : "border-border bg-card hover:border-primary/30 hover:shadow-sm"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${isOpen ? "bg-primary/10" : "bg-muted"}`}
                    >
                      <LayoutDashboard
                        className={`h-4.5 w-4.5 ${isOpen ? "text-primary" : "text-muted-foreground"}`}
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm truncate" style={{ fontWeight: 500 }}>
                          {dash.title}
                        </p>
                        {isOpen && (
                          <Badge variant="secondary" className="text-xs shrink-0">
                            Viewing
                          </Badge>
                        )}
                        {saved && (
                          <Badge
                            variant="outline"
                            className="text-xs shrink-0 text-green-700 dark:text-green-400 border-green-300 dark:border-green-700"
                          >
                            <Check className="h-3 w-3 mr-0.5" />
                            Saved
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground truncate mt-0.5">
                        {dash.description}
                      </p>
                    </div>
                  </div>
                  {saved && (
                    <div className="mt-2 pt-2 border-t">
                      <Link
                        to={saved.path}
                        onClick={(e) => e.stopPropagation()}
                        className="inline-flex items-center gap-1.5 text-xs text-primary hover:underline"
                      >
                        <ExternalLink className="h-3 w-3" />
                        View in Saved &mdash; {saved.name}
                      </Link>
                    </div>
                  )}
                </button>
                <div>
                  <p className="text-sm">{msg.content}</p>
                </div>
              </div>
            </div>
          );
        }

        // ── Widget + AI response ─────────────────────────────
        if (msg.widgetData) {
          return (
            <div
              key={msg.id}
              className="flex justify-start"
            >
              <div className="w-full space-y-3">
                <InlineWidget widget={msg.widgetData} />
                <div>
                  <p className="text-sm">{msg.content}</p>
                </div>
              </div>
            </div>
          );
        }

        // ── Standard message bubble ──────────────────────────
        return (
          <div
            key={msg.id}
            className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
          >
            {msg.role === "user" ? (
              <div className="max-w-[85%] rounded-2xl bg-neutral-0 px-4 py-3 text-neutral-800 shadow-sm">
                {msg.widgetRef && (
                  <span className="mb-1.5 inline-flex max-w-full flex-col items-start gap-0.5 rounded-md bg-neutral-50 px-1.5 py-0.5 text-left text-xs text-neutral-800">
                    <span className="inline-flex min-w-0 items-center gap-1">
                      {(() => {
                        const IconComp = msg.widgetIconType
                          ? getChartIconForWidgetType(msg.widgetIconType)
                          : null;
                        return IconComp ? (
                          <IconComp className="h-3 w-3 shrink-0 text-neutral-600" />
                        ) : null;
                      })()}
                      <span className="truncate font-medium">{msg.widgetRef}</span>
                    </span>
                    {msg.widgetKpiLabel ? (
                      <span className="w-full truncate text-[10px] text-neutral-600">
                        Selected: {msg.widgetKpiLabel}
                      </span>
                    ) : null}
                  </span>
                )}
                <p className="text-sm">{msg.content}</p>
              </div>
            ) : (
              <div className="w-full">
                <p className="text-sm">{msg.content}</p>
              </div>
            )}
          </div>
        );
      })}

      {/* Thinking indicator */}
      {isThinking && (
        <div className="flex justify-start">
          <div className="w-full py-1">
            <div className="flex items-center gap-2">
              <Loader2 className="h-4 w-4" />
              <p className="text-sm">Analyzing...</p>
            </div>
          </div>
        </div>
      )}

      {/* Scroll anchor */}
      <div ref={messagesEndRef} />
    </div>
  );
});
