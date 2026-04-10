import { useState, useEffect, useRef, useCallback, useMemo, useDeferredValue } from "react";
import { Search } from "lucide-react";
import { cn } from "./ui/utils";

// Comprehensive customer support analytics prompt suggestions
const allSuggestions = [
  // Escalation & routing
  "What is the escalation rate this month?",
  "What are the top reasons for agent escalations?",
  "What is the average time before a ticket gets escalated?",
  "Which teams have the highest escalation rates?",
  "What percentage of escalations are resolved within SLA?",

  // Response & resolution times
  "What is the average first response time?",
  "What is the average resolution time by category?",
  "What is the median handle time for tier-1 tickets?",
  "Which agents have the fastest resolution times?",
  "How has response time changed over the last 90 days?",

  // CSAT & sentiment
  "What is the current CSAT score trend?",
  "What topics have the lowest customer satisfaction?",
  "What is the sentiment breakdown across channels?",
  "Which agents have the highest CSAT ratings?",
  "What drives negative customer sentiment?",

  // Volume & trends
  "What is the ticket volume trend this quarter?",
  "What are the peak hours for support requests?",
  "What categories have the most ticket volume?",
  "How does weekend volume compare to weekday volume?",
  "What is the ticket backlog size right now?",

  // Self-service & knowledge
  "What is the self-service containment rate?",
  "Which knowledge articles have the lowest resolution rate?",
  "What are the most viewed knowledge articles?",
  "What topics are missing from the knowledge base?",
  "How effective is the chatbot at resolving issues?",

  // Copilot & AI
  "What is the Copilot adoption rate across teams?",
  "How does Copilot usage impact resolution time?",
  "Which Copilot suggestions are most accepted by agents?",
  "What is the Copilot accuracy rate for suggested replies?",
  "Compare agent performance with and without Copilot",

  // Agent performance
  "Who are the top performing agents this month?",
  "What is the agent utilization rate?",
  "Which agents need additional training?",
  "What is the average number of tickets per agent?",
  "How does agent tenure correlate with performance?",

  // Automation & efficiency
  "What are the top automation opportunities?",
  "How much time could we save with automation?",
  "What repetitive tasks can be automated?",
  "What is the ROI of current automated workflows?",
  "Which manual processes are bottlenecks?",

  // Channels
  "How does performance differ across support channels?",
  "What is the chat vs email resolution rate comparison?",
  "Which channel has the highest customer satisfaction?",
  "What is the phone support abandonment rate?",
  "How is live chat performing compared to last month?",

  // Dashboards & reports
  "Create a dashboard for weekly team performance",
  "Show me a breakdown of tickets by priority",
  "Generate a report on SLA compliance",
  "Build a dashboard comparing all support channels",
  "Create a monthly executive summary dashboard",

  // Specific metrics
  "What is the first contact resolution rate?",
  "What is the net promoter score trend?",
  "What is the cost per ticket this quarter?",
  "What is the customer effort score by category?",
  "What is the reopened ticket rate?",

  // Forecasting & planning
  "Forecast ticket volume for next month",
  "What staffing level do we need for the holiday season?",
  "Predict which topics will trend next quarter",
  "What is the projected impact of the new product launch on support?",
  "How many agents should be on shift during peak hours?",
];

interface TypeaheadSuggestionsProps {
  query: string;
  onSelect: (suggestion: string) => void;
  visible: boolean;
  onDismiss: () => void;
  inputRef: React.RefObject<HTMLTextAreaElement | null>;
  forcedSuggestions?: string[];
}

function highlightMatch(text: string, query: string, isHighlighted: boolean) {
  if (!query.trim()) return <span>{text}</span>;

  const lowerText = text.toLowerCase();
  const lowerQuery = query.toLowerCase().trim();
  const index = lowerText.indexOf(lowerQuery);

  if (index === -1) return <span>{text}</span>;

  const before = text.slice(0, index);
  const match = text.slice(index, index + lowerQuery.length);
  const after = text.slice(index + lowerQuery.length);

  return (
    <span>
      {before}
      <span
        className={cn(
          "font-normal",
          isHighlighted ? "text-sidebar-accent-foreground" : "text-foreground",
        )}
      >
        {match}
      </span>
      {after}
    </span>
  );
}

export function TypeaheadSuggestions({
  query,
  onSelect,
  visible,
  onDismiss,
  inputRef,
  forcedSuggestions = [],
}: TypeaheadSuggestionsProps) {
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const listRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<(HTMLDivElement | null)[]>([]);

  // Debounce the query to avoid filtering on every keystroke
  const deferredQuery = useDeferredValue(query);

  const filtered = useMemo(() => {
    // If forced suggestions are provided, use them directly
    if (forcedSuggestions.length > 0) return forcedSuggestions;

    const trimmed = deferredQuery.toLowerCase().trim();
    if (!trimmed) return [];

    // Split query into words for multi-word matching
    const queryWords = trimmed.split(/\s+/).filter(Boolean);

    const scored = allSuggestions
      .map((suggestion) => {
        const lower = suggestion.toLowerCase();

        // Check if all query words appear somewhere in the suggestion
        const allWordsMatch = queryWords.every((word) => lower.includes(word));
        if (!allWordsMatch) return null;

        // Score: prefer starts-with, then contains full phrase, then word matches
        let score = 0;
        if (lower.startsWith(trimmed)) {
          score = 100;
        } else if (lower.includes(trimmed)) {
          score = 80;
        } else {
          score = 60;
        }

        return { suggestion, score };
      })
      .filter(Boolean) as { suggestion: string; score: number }[];

    scored.sort((a, b) => b.score - a.score);
    return scored.slice(0, 6).map((s) => s.suggestion);
  }, [deferredQuery, forcedSuggestions]);

  // Reset selected index when filtered results or forced suggestions change
  useEffect(() => {
    setSelectedIndex(-1);
  }, [filtered]);

  // Scroll selected item into view
  useEffect(() => {
    if (selectedIndex >= 0 && itemRefs.current[selectedIndex]) {
      itemRefs.current[selectedIndex]?.scrollIntoView({ block: "nearest" });
    }
  }, [selectedIndex]);

  // Handle keyboard navigation
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (!visible || filtered.length === 0) return;

      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex((prev) =>
          prev < filtered.length - 1 ? prev + 1 : 0
        );
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex((prev) =>
          prev > 0 ? prev - 1 : filtered.length - 1
        );
      } else if (e.key === "Enter" && selectedIndex >= 0) {
        e.preventDefault();
        onSelect(filtered[selectedIndex]);
      } else if (e.key === "Escape") {
        onDismiss();
      }
    },
    [visible, filtered, selectedIndex, onSelect, onDismiss]
  );

  useEffect(() => {
    const input = inputRef.current;
    if (input) {
      input.addEventListener("keydown", handleKeyDown);
      return () => input.removeEventListener("keydown", handleKeyDown);
    }
  }, [handleKeyDown, inputRef]);

  // Click outside to dismiss
  useEffect(() => {
    if (!visible) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (
        listRef.current &&
        !listRef.current.contains(e.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(e.target as Node)
      ) {
        onDismiss();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [visible, onDismiss, inputRef]);

  if (!visible || filtered.length === 0) return null;

  return (
    <div
      ref={listRef}
      className="absolute bottom-full left-0 right-0 z-50 mb-1 overflow-hidden rounded-md border bg-popover text-popover-foreground shadow-md"
    >
      <div className="p-1">
        {filtered.map((suggestion, index) => {
          const highlighted = index === selectedIndex;
          return (
            <div
              key={suggestion}
              ref={(el) => {
                itemRefs.current[index] = el;
              }}
              role="option"
              aria-selected={highlighted}
              className={cn(
                "relative flex cursor-default select-none items-center gap-2 rounded-sm px-2 py-1.5 text-left text-sm outline-none transition-colors",
                "[&_svg:not([class*='text-'])]:text-muted-foreground",
                highlighted
                  ? "bg-sidebar-accent text-sidebar-accent-foreground active:bg-sidebar-accent"
                  : "text-muted-foreground hover:bg-primary-25 hover:text-sidebar-accent-foreground active:bg-sidebar-accent active:text-sidebar-accent-foreground",
              )}
              onMouseEnter={() => setSelectedIndex(index)}
              onMouseDown={(e) => {
                e.preventDefault();
                onSelect(suggestion);
              }}
            >
              <Search className="h-4 w-4 shrink-0 pointer-events-none" />
              <span className="min-w-0 flex-1 truncate">
                {highlightMatch(suggestion, query, highlighted)}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
