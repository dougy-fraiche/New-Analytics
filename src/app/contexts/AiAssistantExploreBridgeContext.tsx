import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";

export type ExploreAiSendHandler = (
  message: string,
  meta?: { widgetRef?: string; widgetIconType?: string; widgetKpiLabel?: string },
) => void;

export type AiAssistantExploreBridgeState = {
  isThinking: boolean;
  onSend: ExploreAiSendHandler | null;
};

const defaultState: AiAssistantExploreBridgeState = {
  isThinking: false,
  onSend: null,
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
