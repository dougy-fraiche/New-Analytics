import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useNavigate, useParams } from "react-router";
import { toast } from "sonner";

import { useConversations, type Message } from "../contexts/ConversationContext";
import { useDashboardChat } from "../contexts/DashboardChatContext";
import {
  EXPLORE_THREAD_USER_TURN_EVENT,
  GLOBAL_AI_ASSISTANT_KEY,
  getExploreConversationAssistantKey,
} from "../lib/ai-assistant-global";
import { conversationMessageToGlobalChat } from "../lib/conversation-message-to-global-chat";
import { runPhasedExploreAssistantReply } from "../lib/run-phased-explore-assistant-reply";
import { useVoiceInput } from "../hooks/useVoiceInput";
import {
  generateConversationName,
  generateAIResponse,
  isRecognizableExplorePrompt,
  topInsightsCards,
  type TopInsightCard,
} from "../data/explore-data";
import type { AnomalyInvestigationMeta } from "../types/conversation-types";
import { ROUTES } from "../routes";
import { useOptionalAiAssistantPanelControl } from "../contexts/AiAssistantPanelControlContext";
import {
  PENDING_OPPORTUNITY_INVESTIGATION_CHAT_STORAGE_KEY,
  START_OPPORTUNITY_INVESTIGATION_CHAT_EVENT,
  type StartOpportunityInvestigationChatDetail,
} from "../lib/start-opportunity-investigation-chat";
import { normalizeAskAiWidgetTitle } from "../lib/normalize-ask-ai-widget-title";
import { buildAnomalyPrimaryFindingModel } from "../lib/anomaly-primary-finding";

import { WidgetAIProvider } from "../contexts/WidgetAIContext";
import { ExplorePhase } from "./ExplorePhase";
import { ConversationPhase } from "./ConversationPhase";
import { ConversationDashboardArea } from "./ConversationDashboardArea";

// Two UI phases:
// "explore"      — hero + input centred + insights cards
// "conversation" — chat with optional artifact panel on the right
// "anomaly-preview" — direct anomaly page, no conversation created yet
type Phase = "explore" | "conversation" | "anomaly-preview";
type ExplorePromptSource = "footer-chip" | "typeahead" | "freeform" | "investigation";

const DRAFT_KEY = "explore-draft-query";

type ExploreFirstMessageOptions = {
  anomalyInvestigation?: AnomalyInvestigationMeta;
  conversationNameOverride?: string;
  promptSource?: ExplorePromptSource;
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

function buildTopInsightOpportunityInvestigationPrompt(
  insight: Extract<TopInsightCard, { segment: "opportunity" }>,
): string {
  return [
    `Investigate this automation opportunity in depth: ${insight.title}.`,
    `Detected: ${insight.timestamp}.`,
    `Summary: ${insight.description}.`,
    `Evidence: ${insight.detail}.`,
    `Target location: ${insight.automationTarget.scope} > ${insight.automationTarget.id}.`,
    "Provide readiness assessment, expected impact, implementation approach, key risks, and prioritized next steps.",
  ].join(" ");
}

function toAnomalyInvestigationMeta(
  insight: Extract<TopInsightCard, { segment: "anomaly" }>,
): AnomalyInvestigationMeta {
  return {
    source: "top-insight",
    insight: {
      id: insight.id,
      title: insight.title,
      description: insight.description,
      detail: insight.detail,
      severity: insight.severity,
      timestamp: insight.timestamp,
    },
  };
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
  } = useDashboardChat();
  const aiAssistantPanelControl = useOptionalAiAssistantPanelControl();
  const navigate = useNavigate();
  const params = useParams();

  // Derive active conversation ID directly from URL params
  const currentConversationId = params.conversationId ?? null;
  const currentAnomalyInsightId = params.insightId ?? null;
  const previewAnomalyInsight = useMemo(() => {
    if (!currentAnomalyInsightId) return null;
    const id = Number.parseInt(currentAnomalyInsightId, 10);
    if (!Number.isFinite(id)) return null;
    return topInsightsCards.find(
      (card): card is Extract<TopInsightCard, { segment: "anomaly" }> =>
        card.segment === "anomaly" && card.id === id,
    ) ?? null;
  }, [currentAnomalyInsightId]);

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
    const insightId = params.insightId ?? null;
    const routeKey = conversationId ? `conv:${conversationId}` : insightId ? `anomaly:${insightId}` : "explore";

    if (lastSyncedIdRef.current === routeKey) return;
    lastSyncedIdRef.current = routeKey;

    if (conversationId) {
      const conversation = conversationsRef.current.find((c) => c.id === conversationId);
      if (conversation) {
        setConversationName(conversation.name);
        setMessages(conversation.messages ?? []);
        setPhase("conversation");
      }
    } else if (insightId) {
      setPhase("anomaly-preview");
      setConversationName("");
      setMessages([]);
      setIsThinking(false);
    } else {
      setPhase("explore");
      setConversationName("");
      setMessages([]);
      setIsThinking(false);
    }
  }, [params.conversationId, params.insightId]);

  useEffect(() => {
    if (!currentAnomalyInsightId) return;
    if (previewAnomalyInsight) return;
    toast.error("Anomaly insight not found");
    navigate(ROUTES.EXPLORE, { replace: true });
  }, [currentAnomalyInsightId, navigate, previewAnomalyInsight]);

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
      const conversationAssistantKey = getExploreConversationAssistantKey(newConversation.id);
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
      appendMessage(conversationAssistantKey, conversationMessageToGlobalChat(userMessage));
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
      const typeaheadPicked = exploreTypeaheadPickedRef.current;
      exploreTypeaheadPickedRef.current = false;
      const promptSource: ExplorePromptSource =
        options?.promptSource ?? (typeaheadPicked ? "typeahead" : "freeform");
      const shouldSeedDashboard =
        promptSource === "footer-chip" ||
        promptSource === "typeahead" ||
        (promptSource === "freeform" && isRecognizableExplorePrompt(messageToSend));
      const aiResponse = generateAIResponse(messageToSend, { seedDashboard: shouldSeedDashboard });
      const stub: Message = {
        id: assistantId,
        role: "assistant",
        content: "",
        timestamp: new Date(),
      };
      addMessageToConversation(targetConversationId, stub);
      appendMessage(conversationAssistantKey, conversationMessageToGlobalChat(stub));
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
          patchMessage(conversationAssistantKey, messageId, partial),
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
    ],
  );

  // ── Explore phase handlers ────────────────────────────────────────
  const handleActionClick = useCallback((prompt: string) => {
    sendExploreFirstMessage(prompt, { promptSource: "footer-chip" });
  }, [sendExploreFirstMessage]);

  const handleSend = useCallback(() => {
    sendExploreFirstMessage(query);
  }, [query, sendExploreFirstMessage]);

  /** Top Insights “Ask AI” popover — same widget prompt UI as dashboards; sends start an Explore thread. */
  const handleExploreWidgetPrompt = useCallback(
    (widgetTitle: string, message: string) => {
      const trimmed = message.trim();
      if (!trimmed) return;
      const normalizedTitle = normalizeAskAiWidgetTitle(widgetTitle);
      sendExploreFirstMessage(`Regarding “${normalizedTitle}”: ${trimmed}`);
    },
    [sendExploreFirstMessage],
  );

  const handleTopInsightInvestigate = useCallback(
    (insight: TopInsightCard) => {
      if (insight.segment === "anomaly") {
        navigate(ROUTES.ANOMALY_INVESTIGATION(insight.id));
        return;
      }

      const destinationParams = new URLSearchParams({
        scope: insight.automationTarget.scope,
        target: insight.automationTarget.id,
      });
      const destinationPath = `${ROUTES.AUTOMATION_OPPORTUNITIES}?${destinationParams.toString()}#top-opportunities`;
      const detail: StartOpportunityInvestigationChatDetail = {
        prompt: buildTopInsightOpportunityInvestigationPrompt(insight),
        conversationTitle: `Investigation: ${insight.title}`,
        ootbTypeId: "automation-opportunities",
        pageLabel: "Automation Opportunities",
        pagePath: destinationPath,
      };

      const params = new URLSearchParams({
        scope: insight.automationTarget.scope,
        target: insight.automationTarget.id,
      });
      navigate(`${ROUTES.AUTOMATION_OPPORTUNITIES}?${params.toString()}#top-opportunities`);

      // Queue for destination-route start to avoid route-change cancellation races.
      try {
        sessionStorage.setItem(
          PENDING_OPPORTUNITY_INVESTIGATION_CHAT_STORAGE_KEY,
          JSON.stringify({ ...detail, queuedAt: Date.now() }),
        );
      } catch {
        // Fallback when sessionStorage is unavailable.
        window.dispatchEvent(
          new CustomEvent(START_OPPORTUNITY_INVESTIGATION_CHAT_EVENT, { detail }),
        );
      }
      aiAssistantPanelControl?.openPanel();
    },
    [aiAssistantPanelControl, navigate, sendExploreFirstMessage],
  );

  const anomalyPreviewPrimaryFindingModel = useMemo(() => {
    if (!previewAnomalyInsight) return null;

    const previewMessages: Message[] = [
      {
        id: `preview-anomaly-${previewAnomalyInsight.id}`,
        role: "user",
        content: buildTopInsightInvestigationPrompt(previewAnomalyInsight),
        timestamp: new Date(),
        anomalyInvestigation: toAnomalyInvestigationMeta(previewAnomalyInsight),
      },
    ];
    return buildAnomalyPrimaryFindingModel(previewMessages, { isThinking: false });
  }, [previewAnomalyInsight]);

  const handleAnomalyPreviewInvestigateFurther = useCallback(() => {
    if (!previewAnomalyInsight) return;
    sendExploreFirstMessage(buildTopInsightInvestigationPrompt(previewAnomalyInsight), {
      conversationNameOverride: previewAnomalyInsight.title,
      promptSource: "investigation",
      anomalyInvestigation: toAnomalyInvestigationMeta(previewAnomalyInsight),
    });
  }, [previewAnomalyInsight, sendExploreFirstMessage]);

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

      {/* ─── PHASE 3: ANOMALY PREVIEW (no conversation yet) ───────── */}
      {phase === "anomaly-preview" && previewAnomalyInsight && anomalyPreviewPrimaryFindingModel && (
        <ConversationDashboardArea
          isThinking={false}
          dashboardData={null}
          anomalyPrimaryFinding={anomalyPreviewPrimaryFindingModel}
          conversationTitle={previewAnomalyInsight.title}
          hasCompletedAssistantMessage
          anomalyHeadingActionLabel="Investigate Further"
          onAnomalyHeadingAction={handleAnomalyPreviewInvestigateFurther}
        />
      )}
    </div>
  );
}
