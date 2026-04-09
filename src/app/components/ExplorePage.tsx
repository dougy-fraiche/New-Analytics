import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate, useParams } from "react-router";
import { toast } from "sonner";

import { useConversations, type Message } from "../contexts/ConversationContext";
import { useDashboardChat } from "../contexts/DashboardChatContext";
import {
  EXPLORE_THREAD_USER_TURN_EVENT,
  GLOBAL_AI_ASSISTANT_KEY,
} from "../lib/ai-assistant-global";
import { conversationMessageToGlobalChat } from "../lib/conversation-message-to-global-chat";
import { runPhasedExploreAssistantReply } from "../lib/run-phased-explore-assistant-reply";
import { useVoiceInput } from "../hooks/useVoiceInput";
import {
  generateConversationName,
  generateAIResponse,
  type TopInsightCard,
} from "../data/explore-data";
import type { AnomalyInvestigationMeta } from "../types/conversation-types";
import { ROUTES } from "../routes";

import { WidgetAIProvider } from "../contexts/WidgetAIContext";
import { ExplorePhase } from "./ExplorePhase";
import { ConversationPhase } from "./ConversationPhase";

// Two UI phases:
// "explore"      — hero + input centred + insights cards
// "conversation" — chat with optional artifact panel on the right
type Phase = "explore" | "conversation";

const DRAFT_KEY = "explore-draft-query";

type ExploreFirstMessageOptions = {
  anomalyInvestigation?: AnomalyInvestigationMeta;
  conversationNameOverride?: string;
};

function buildTopInsightInvestigationPrompt(
  insight: Extract<TopInsightCard, { segment: "anomaly" }>,
): string {
  return [
    `Investigate this anomaly in depth: ${insight.title}.`,
    `Severity: ${insight.severity}. Detected: ${insight.timestamp}.`,
    `Summary: ${insight.description}.`,
    `Observed signal: ${insight.detail}.`,
    "Provide a structured investigation covering likely root causes, impact assessment, recommended remediation actions, and priority next steps.",
  ].join(" ");
}

export function ExplorePage() {
  // ── Shared state ──────────────────────────────────────────────────
  const [query, setQuery] = useState(() => {
    try { return sessionStorage.getItem(DRAFT_KEY) || ""; } catch { return ""; }
  });
  const [phase, setPhase] = useState<Phase>("explore");
  const [conversationName, setConversationName] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [isThinking, setIsThinking] = useState(false);
  const [showTypeahead, setShowTypeahead] = useState(false);
  const [forcedSuggestions, setForcedSuggestions] = useState<string[]>([]);

  // Input slide-down animation state
  const [isInputAnimating, setIsInputAnimating] = useState(false);
  const [inputAnimStartTop, setInputAnimStartTop] = useState(0);
  const [inputAnimStartLeft, setInputAnimStartLeft] = useState(0);
  const [inputAnimStartWidth, setInputAnimStartWidth] = useState(0);

  // ── Refs ───────────────────────────────────────────────────────────
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const chatInputRef = useRef<HTMLTextAreaElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const heroInputBarRef = useRef<HTMLDivElement>(null);
  /** Next hero send came from picking a typeahead row — merge dashboard into the assistant reply. */
  const exploreTypeaheadPickedRef = useRef(false);

  // ── Context hooks ─────────────────────────────────────────────────
  const { addConversation, conversations, addMessageToConversation, patchMessageInConversation } =
    useConversations();
  const {
    appendMessage,
    patchMessage,
    startNewGlobalAiDraft,
    setGlobalAiDraftDisplayName,
  } = useDashboardChat();
  const navigate = useNavigate();
  const params = useParams();

  // Derive active conversation ID directly from URL params
  const currentConversationId = params.conversationId ?? null;

  // ── Voice input ───────────────────────────────────────────────────
  const voice = useVoiceInput({
    onTranscript: (text) => {
      setQuery((prev) => (prev ? prev + " " : "") + text);
      if (phase === "explore") inputRef.current?.focus();
      else chatInputRef.current?.focus();
    },
    onError: (error) => {
      if (error === "not-allowed") {
        toast.error("Microphone access denied", {
          description: "Please allow microphone access in your browser settings and try again.",
        });
      } else if (error === "no-speech") {
        toast.info("No speech detected", {
          description: "Please try again and speak into your microphone.",
        });
      } else if (error === "network") {
        toast.error("Network error", {
          description: "Speech recognition requires an internet connection.",
        });
      }
    },
  });

  // ── Persist draft query to sessionStorage ─────────────────────────
  useEffect(() => {
    try {
      if (query) sessionStorage.setItem(DRAFT_KEY, query);
      else sessionStorage.removeItem(DRAFT_KEY);
    } catch { /* quota exceeded – ignore */ }
  }, [query]);

  // ── Focus input when landing on explore page ──────────────────────
  useEffect(() => {
    if (phase === "explore" && inputRef.current) {
      inputRef.current.focus();
    }
  }, [phase]);

  // ── Listen for focus input event (keyboard shortcut) ──────────────
  useEffect(() => {
    const handleFocusInput = () => {
      if (phase === "explore" && inputRef.current) {
        inputRef.current.focus();
      }
    };
    window.addEventListener("focusExploreInput", handleFocusInput);
    return () => window.removeEventListener("focusExploreInput", handleFocusInput);
  }, [phase]);

  // ── URL-sync: load conversation from URL params ───────────────────
  const conversationsRef = useRef(conversations);
  useEffect(() => { conversationsRef.current = conversations; });

  const lastSyncedIdRef = useRef<string | null>(null);
  /** Shared with ConversationPhase — cancels / finishes phased replies across hero + thread sends. */
  const exploreAssistantPhaseGenRef = useRef(0);

  useEffect(() => {
    const conversationId = params.conversationId ?? null;

    if (lastSyncedIdRef.current === conversationId) return;
    lastSyncedIdRef.current = conversationId;

    if (conversationId) {
      const conversation = conversationsRef.current.find((c) => c.id === conversationId);
      if (conversation) {
        setConversationName(conversation.name);
        setMessages(conversation.messages ?? []);
        setPhase("conversation");
      }
    } else {
      setPhase("explore");
      setConversationName("");
      setMessages([]);
    }
  }, [params.conversationId]);

  // ── Explore phase handlers ────────────────────────────────────────
  const handleActionClick = useCallback((label: string, prompts: string[]) => {
    setQuery(label);
    setForcedSuggestions(prompts);
    setShowTypeahead(true);
    setTimeout(() => inputRef.current?.focus(), 0);
  }, []);

  /** First user message — same path as sending from the hero {@link ChatInputBar} (new thread + navigate). */
  const sendExploreFirstMessage = useCallback(
    (rawMessage: string, options?: ExploreFirstMessageOptions) => {
      const messageToSend = rawMessage.trim();
      if (!messageToSend) return;

      setShowTypeahead(false);
      setForcedSuggestions([]);

      voice.stop();
      window.dispatchEvent(new Event(EXPLORE_THREAD_USER_TURN_EVENT));

      const name = options?.conversationNameOverride?.trim() || generateConversationName(messageToSend);
      setConversationName(name);
      const newConversation = addConversation(name);
      setPhase("conversation");

      lastSyncedIdRef.current = newConversation.id;

      const userMessage: Message = {
        id: crypto.randomUUID(),
        role: "user",
        content: messageToSend,
        timestamp: new Date(),
        anomalyInvestigation: options?.anomalyInvestigation,
      };
      addMessageToConversation(newConversation.id, userMessage);
      startNewGlobalAiDraft();
      setGlobalAiDraftDisplayName(name.trim(), { userSet: true });
      appendMessage(GLOBAL_AI_ASSISTANT_KEY, conversationMessageToGlobalChat(userMessage));
      setMessages([userMessage]);
      setQuery("");
      try {
        sessionStorage.removeItem(DRAFT_KEY);
      } catch {
        /* ignore */
      }
      setIsThinking(true);

      const targetConversationId = newConversation.id;
      const gen = ++exploreAssistantPhaseGenRef.current;
      const assistantId = crypto.randomUUID();
      const seedDashboardForTypeahead = exploreTypeaheadPickedRef.current;
      exploreTypeaheadPickedRef.current = false;
      const aiResponse = generateAIResponse(messageToSend, { seedDashboardForTypeahead });
      const stub: Message = {
        id: assistantId,
        role: "assistant",
        content: "",
        timestamp: new Date(),
      };
      addMessageToConversation(targetConversationId, stub);
      appendMessage(GLOBAL_AI_ASSISTANT_KEY, conversationMessageToGlobalChat(stub));
      setMessages([userMessage, stub]);

      queueMicrotask(() => {
        navigate(`/conversation/${newConversation.id}`);
      });

      void runPhasedExploreAssistantReply({
        conversationId: targetConversationId,
        assistantId,
        final: aiResponse,
        isCancelled: () => gen !== exploreAssistantPhaseGenRef.current,
        patchMessageInConversation,
        patchGlobalMessage: (messageId, partial) =>
          patchMessage(GLOBAL_AI_ASSISTANT_KEY, messageId, partial),
        syncLocalMessages: (updater) => setMessages(updater),
      }).finally(() => {
        if (gen === exploreAssistantPhaseGenRef.current) {
          setIsThinking(false);
        }
      });
    },
    [
      voice.stop,
      addConversation,
      addMessageToConversation,
      appendMessage,
      patchMessage,
      patchMessageInConversation,
      navigate,
      startNewGlobalAiDraft,
      setGlobalAiDraftDisplayName,
    ],
  );

  const handleSend = useCallback(() => {
    sendExploreFirstMessage(query);
  }, [query, sendExploreFirstMessage]);

  /** Top Insights “Ask AI” popover — same widget prompt UI as dashboards; sends start an Explore thread. */
  const handleExploreWidgetPrompt = useCallback(
    (widgetTitle: string, message: string) => {
      const trimmed = message.trim();
      if (!trimmed) return;
      sendExploreFirstMessage(`Regarding “${widgetTitle}”: ${trimmed}`);
    },
    [sendExploreFirstMessage],
  );

  const handleTopInsightInvestigate = useCallback(
    (insight: TopInsightCard) => {
      if (insight.segment === "anomaly") {
        sendExploreFirstMessage(buildTopInsightInvestigationPrompt(insight), {
          conversationNameOverride: `Investigation: ${insight.title}`,
          anomalyInvestigation: {
            source: "top-insight",
            insight: {
              id: insight.id,
              title: insight.title,
              description: insight.description,
              detail: insight.detail,
              severity: insight.severity,
              timestamp: insight.timestamp,
            },
          },
        });
        return;
      }

      const params = new URLSearchParams({
        scope: insight.automationTarget.scope,
        target: insight.automationTarget.id,
      });
      navigate(`${ROUTES.AUTOMATION_OPPORTUNITIES}?${params.toString()}#top-opportunities`);
    },
    [navigate, sendExploreFirstMessage],
  );

  // ── Render ────────────────────────────────────────────────────────
  return (
    <div ref={containerRef} className="h-full flex flex-col overflow-hidden relative">
      {/* ─── PHASE 1: EXPLORE ────────────────────────────── */}
      {phase === "explore" && !currentConversationId && (
        <WidgetAIProvider
          persistKey={GLOBAL_AI_ASSISTANT_KEY}
          ootbTypeId="explore"
          onWidgetPrompt={handleExploreWidgetPrompt}
        >
          <ExplorePhase
            query={query}
            onQueryChange={setQuery}
            voice={voice}
            inputRef={inputRef}
            heroInputBarRef={heroInputBarRef}
            isInputAnimating={isInputAnimating}
            showTypeahead={showTypeahead}
            onShowTypeahead={setShowTypeahead}
            forcedSuggestions={forcedSuggestions}
            onForcedSuggestionsChange={setForcedSuggestions}
            onActionClick={handleActionClick}
            onSend={handleSend}
            onTopInsightInvestigate={handleTopInsightInvestigate}
            onTypeaheadSuggestionPicked={() => {
              exploreTypeaheadPickedRef.current = true;
            }}
          />
        </WidgetAIProvider>
      )}

      {/* ─── PHASE 2: CONVERSATION ──────────────────────── */}
      {phase === "conversation" && (
        <ConversationPhase
          query={query}
          onQueryChange={setQuery}
          voice={voice}
          chatInputRef={chatInputRef}
          currentConversationId={currentConversationId}
          conversationName={conversationName}
          setConversationName={setConversationName}
          messages={messages}
          setMessages={setMessages}
          isThinking={isThinking}
          setIsThinking={setIsThinking}
          isInputAnimating={isInputAnimating}
          setIsInputAnimating={setIsInputAnimating}
          inputAnimStartTop={inputAnimStartTop}
          inputAnimStartLeft={inputAnimStartLeft}
          inputAnimStartWidth={inputAnimStartWidth}
          containerRef={containerRef}
          assistantPhaseGenRef={exploreAssistantPhaseGenRef}
        />
      )}
    </div>
  );
}
