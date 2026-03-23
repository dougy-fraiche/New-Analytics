import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate, useParams } from "react-router";
import { AnimatePresence } from "motion/react";
import { toast } from "sonner";

import { useConversations, type Message } from "../contexts/ConversationContext";
import { useVoiceInput } from "../hooks/useVoiceInput";
import { generateConversationName, generateAIResponse } from "../data/explore-data";

import { ExplorePhase } from "./ExplorePhase";
import { ConversationPhase } from "./ConversationPhase";

// Two UI phases:
// "explore"      — hero + input centred + insights cards
// "conversation" — chat with optional artifact panel on the right
type Phase = "explore" | "conversation";

const DRAFT_KEY = "explore-draft-query";

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

  // When true, phase transitions skip animation (e.g. direct URL navigation)
  const skipAnimationRef = useRef(false);

  // ── Context hooks ─────────────────────────────────────────────────
  const { addConversation, conversations, addMessageToConversation } = useConversations();
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

  useEffect(() => {
    const conversationId = params.conversationId ?? null;

    if (lastSyncedIdRef.current === conversationId) return;
    lastSyncedIdRef.current = conversationId;

    if (conversationId) {
      skipAnimationRef.current = true;
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

  // Clear skip-animation flag after a frame
  useEffect(() => {
    if (skipAnimationRef.current) {
      const id = requestAnimationFrame(() => { skipAnimationRef.current = false; });
      return () => cancelAnimationFrame(id);
    }
  }, [phase]);

  // ── Explore phase handlers ────────────────────────────────────────
  const handleActionClick = useCallback((label: string, prompts: string[]) => {
    setQuery(label);
    setForcedSuggestions(prompts);
    setShowTypeahead(true);
    setTimeout(() => inputRef.current?.focus(), 0);
  }, []);

  // First message — creates a new conversation
  const handleSend = useCallback(() => {
    if (!query.trim()) return;

    const name = generateConversationName(query);
    setConversationName(name);
    const newConversation = addConversation(name);
    setPhase("conversation");

    lastSyncedIdRef.current = newConversation.id;

    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: "user",
      content: query,
      timestamp: new Date(),
    };
    addMessageToConversation(newConversation.id, userMessage);
    setMessages([userMessage]);
    const messageToSend = query;
    setQuery("");
    try { sessionStorage.removeItem(DRAFT_KEY); } catch {}
    setIsThinking(true);

    // Capture the conversation ID for the async callback
    const targetConversationId = newConversation.id;

    queueMicrotask(() => {
      navigate(`/conversation/${newConversation.id}`);
    });

    // Simulate AI response
    setTimeout(() => {
      const aiResponse = generateAIResponse(messageToSend);
      const assistantMessage: Message = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: aiResponse.content,
        timestamp: new Date(),
        widgetData: aiResponse.widgetData,
        dashboardData: aiResponse.dashboardData,
      };
      // Always persist to the correct conversation
      addMessageToConversation(targetConversationId, assistantMessage);
      setMessages([userMessage, assistantMessage]);
      setIsThinking(false);
    }, 2000);
  }, [query, addConversation, addMessageToConversation, navigate]);

  // Capture skip-animation flag at render time
  const shouldSkipAnimation = skipAnimationRef.current;

  // ── Render ────────────────────────────────────────────────────────
  return (
    <div ref={containerRef} className="h-full flex flex-col overflow-hidden relative">
      <AnimatePresence mode="wait">
        {/* ─── PHASE 1: EXPLORE ────────────────────────────── */}
        {phase === "explore" && !currentConversationId && (
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
          />
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
            shouldSkipAnimation={shouldSkipAnimation}
            isInputAnimating={isInputAnimating}
            setIsInputAnimating={setIsInputAnimating}
            inputAnimStartTop={inputAnimStartTop}
            inputAnimStartLeft={inputAnimStartLeft}
            inputAnimStartWidth={inputAnimStartWidth}
            containerRef={containerRef}
          />
        )}
      </AnimatePresence>
    </div>
  );
}