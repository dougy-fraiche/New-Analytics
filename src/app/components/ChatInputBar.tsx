import { type LegacyRef, type RefObject } from "react";
import { SendHorizontal } from "lucide-react";
import { Button } from "./ui/button";
import { Textarea } from "./ui/textarea";
import { TypeaheadSuggestions } from "./TypeaheadSuggestions";
import { useTypingPlaceholder } from "../hooks/useTypingPlaceholder";
import { placeholderSuffixes } from "../data/explore-data";
import { Tooltip, TooltipContent, TooltipTrigger } from "./ui/tooltip";

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
  /** Fired when the user picks a row from the hero typeahead (not free‑typed send). */
  onTypeaheadSuggestionPicked?: () => void;
}

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
  onTypeaheadSuggestionPicked,
}: ChatInputBarProps) {
  const isHero = variant === "hero";
  // The typing animation runs inside ChatInputBar so only this component
  // re-renders every ~45ms, instead of the entire ExplorePhase tree.
  const animatedSuffix = useTypingPlaceholder(isHero ? placeholderSuffixes : []);
  const placeholder = isHero
    ? `Ask anything about your ${animatedSuffix}`
    : "Ask a follow-up question\u2026";
  const canSend = query.trim().length > 0;

  const handleSend = () => {
    if (voice.isListening) voice.stop();
    if (isHero) onShowTypeahead?.(false);
    onSend();
  };

  return (
    <div
      className={`relative w-full rounded-xl border bg-card text-card-foreground transition-shadow focus-within:border-ring ${
        isHero
          ? "shadow-none focus-within:ring-[3px] focus-within:ring-ring/20"
          : "shadow-sm focus-within:ring-[3px] focus-within:ring-ring/20"
      }`}
    >
      <div className="w-full p-2">
        <div className="flex items-end gap-3">
          <div className="min-w-0 flex-1">
            <Textarea
              aria-label={isHero ? "Ask a question" : "Ask a follow-up question"}
              placeholder={placeholder}
              value={query}
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
          <div className="shrink-0">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  size="icon-xs"
                  aria-label="Send message"
                  variant={canSend ? "default" : "outline"}
                  disabled={!canSend}
                  className="rounded-lg"
                  onClick={() => {
                    if (!canSend) return;
                    handleSend();
                  }}
                >
                  <SendHorizontal className="h-3.5 w-3.5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side={isHero ? "bottom" : "top"}>
                {canSend ? "Send" : "Enter a message to send"}
              </TooltipContent>
            </Tooltip>
          </div>
        </div>
      </div>
      {isHero && (
        <TypeaheadSuggestions
          query={query}
          onSelect={(suggestion) => {
            onTypeaheadSuggestionPicked?.();
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
