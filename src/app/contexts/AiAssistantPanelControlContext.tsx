import { createContext, useContext, useMemo, type ReactNode } from "react";

export interface AiAssistantPanelControlContextValue {
  isOpen: boolean;
  setOpen: (open: boolean) => void;
  togglePanel: () => void;
  openPanel: () => void;
}

const AiAssistantPanelControlContext = createContext<AiAssistantPanelControlContextValue | undefined>(
  undefined,
);

export function AiAssistantPanelControlProvider({
  children,
  isOpen,
  setOpen,
  togglePanel,
  openPanel,
}: {
  children: ReactNode;
  isOpen: boolean;
  setOpen: (open: boolean) => void;
  togglePanel: () => void;
  openPanel: () => void;
}) {
  const value = useMemo(
    () => ({ isOpen, setOpen, togglePanel, openPanel }),
    [isOpen, setOpen, togglePanel, openPanel],
  );
  return (
    <AiAssistantPanelControlContext.Provider value={value}>{children}</AiAssistantPanelControlContext.Provider>
  );
}

/** Returns `undefined` when rendered outside `AiAssistantPanelControlProvider`. */
export function useOptionalAiAssistantPanelControl(): AiAssistantPanelControlContextValue | undefined {
  return useContext(AiAssistantPanelControlContext);
}
