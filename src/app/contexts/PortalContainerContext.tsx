import { createContext, useContext } from "react";

/**
 * Provides a DOM element for Radix UI portals to render into.
 *
 * By default Radix portals attach to `document.body`, which works in
 * regular browsers but crashes inside Figma Make's sandboxed preview
 * iframe because Figma's runtime manages `document.body` and injects
 * inspector props / MutationObservers that conflict with Radix's
 * portal lifecycle.
 *
 * Mount a `<div id="radix-portal-root" />` inside your app tree,
 * store its ref in state, and pass it through this context so every
 * Radix Portal component renders into it instead of document.body.
 */
const PortalContainerContext = createContext<HTMLElement | null>(null);

/**
 * Returns the portal container element (or `undefined` to let Radix
 * fall back to document.body when running outside Figma).
 */
export function usePortalContainer(): HTMLElement | undefined {
  const el = useContext(PortalContainerContext);
  return el ?? undefined;
}

export { PortalContainerContext };
