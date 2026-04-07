import { type LegacyRef, type RefObject } from "react";
import { Plus, ArrowRight, Mic, Square, Upload, Image, Paperclip } from "lucide-react";
import { Button } from "./ui/button";
import { Textarea } from "./ui/textarea";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { TypeaheadSuggestions } from "./TypeaheadSuggestions";
import { toast } from "sonner";
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

  const handleSend = () => {
    if (voice.isListening) voice.stop();
    if (isHero) onShowTypeahead?.(false);
    onSend();
  };

  return (
    <div
      className={`relative mx-auto w-full max-w-[64rem] rounded-3xl border bg-card text-card-foreground transition-shadow focus-within:border-ring ${
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
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className={`${isHero ? "h-9 w-9" : "h-8 w-8"}`}>
                        <Plus className={`${isHero ? "h-5 w-5" : "h-4 w-4"}`} />
                      </Button>
                    </DropdownMenuTrigger>
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
