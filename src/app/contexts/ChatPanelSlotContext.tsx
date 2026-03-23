import { createContext, useContext } from "react";

/**
 * Provides a reference to the DOM element in RootLayout where
 * page-level chat panels should portal their content into.
 * This keeps the chat panel visually alongside the header row
 * while allowing individual pages to control its props / mode.
 */
export const ChatPanelSlotContext = createContext<HTMLDivElement | null>(null);

export function useChatPanelSlot() {
  return useContext(ChatPanelSlotContext);
}
