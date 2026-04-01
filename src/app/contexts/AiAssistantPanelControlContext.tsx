import { createContext, useContext, useMemo, type ReactNode } from "react";

export interface AiAssistantPanelControlContextValue {
  openPanel: () => void;
}

const AiAssistantPanelControlContext = createContext<AiAssistantPanelControlContextValue | undefined>(
  undefined,
);

export function AiAssistantPanelControlProvider({
  children,
  openPanel,
}: {
  children: ReactNode;
  openPanel: () => void;
}) {
  const value = useMemo(() => ({ openPanel }), [openPanel]);
  return (
    <AiAssistantPanelControlContext.Provider value={value}>{children}</AiAssistantPanelControlContext.Provider>
  );
}

/** Returns `undefined` when rendered outside `AiAssistantPanelControlProvider`. */
export function useOptionalAiAssistantPanelControl(): AiAssistantPanelControlContextValue | undefined {
  return useContext(AiAssistantPanelControlContext);
}
