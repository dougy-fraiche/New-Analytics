import { createContext, useContext } from "react";

/**
 * Provides a reference to the DOM element in AppHeader where
 * page-level action buttons should portal their content into.
 * This keeps page actions right-aligned in the breadcrumb bar.
 */
export const HeaderActionsSlotContext = createContext<HTMLDivElement | null>(null);

export function useHeaderActionsSlot() {
  return useContext(HeaderActionsSlotContext);
}
