import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { WidgetMessageMeta } from "../types/conversation-types";

/** Meta passed when sending from Explore (no in-page anchor). */
export type ExploreWidgetPromptMeta = Omit<WidgetMessageMeta, "widgetAnchorId">;

export type ExploreAiSendHandler = (
  message: string,
  meta?: ExploreWidgetPromptMeta,
) => void;

export type AiAssistantExploreBridgeState = {
  isThinking: boolean;
  onSend: ExploreAiSendHandler | null;
  /** Cancels in-flight phased assistant reply and finalizes the stub message (Explore). */
  onCancelInFlight: (() => void) | null;
};

const defaultState: AiAssistantExploreBridgeState = {
  isThinking: false,
  onSend: null,
  onCancelInFlight: null,
};

type AiAssistantExploreBridgeContextValue = AiAssistantExploreBridgeState & {
  setExploreBridge: (next: AiAssistantExploreBridgeState) => void;
};

const AiAssistantExploreBridgeContext = createContext<
  AiAssistantExploreBridgeContextValue | undefined
>(undefined);

export function AiAssistantExploreBridgeProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AiAssistantExploreBridgeState>(defaultState);
  const setExploreBridge = useCallback((next: AiAssistantExploreBridgeState) => {
    setState(next);
  }, []);

  const value = useMemo(
    () => ({
      ...state,
      setExploreBridge,
    }),
    [state, setExploreBridge],
  );

  return (
    <AiAssistantExploreBridgeContext.Provider value={value}>
      {children}
    </AiAssistantExploreBridgeContext.Provider>
  );
}

export function useAiAssistantExploreBridge() {
  const ctx = useContext(AiAssistantExploreBridgeContext);
  if (ctx === undefined) {
    throw new Error("useAiAssistantExploreBridge must be used within AiAssistantExploreBridgeProvider");
  }
  return ctx;
}
