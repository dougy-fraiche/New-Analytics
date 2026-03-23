import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useCallback,
  useMemo,
  type ReactNode,
} from "react";

// ── Types ─────────────────────────────────────────────────────────────

export interface ShortcutDefinition {
  /** Unique key for this shortcut (used internally for register/unregister). */
  id: string;
  /**
   * The `KeyboardEvent.key` value to match (case-sensitive).
   * Examples: "b", "k", "Escape", "F", "S"
   */
  key: string;
  /** Require Meta (macOS Cmd) or Ctrl (Windows/Linux). Default: false */
  meta?: boolean;
  /** Require Shift. Default: false */
  shift?: boolean;
  /** Require Alt/Option. Default: false */
  alt?: boolean;
  /** Allow the shortcut to fire even when an input/textarea is focused. Default: false */
  allowInInputs?: boolean;
  /**
   * Higher-priority shortcuts are evaluated first for the same key event.
   * If a higher-priority handler calls `e.preventDefault()`, lower-priority
   * handlers for the same event are skipped.
   * Default: 0
   */
  priority?: number;
  /** The handler to invoke when the shortcut matches. */
  handler: (e: KeyboardEvent) => void;
}

type RegisterFn = (def: ShortcutDefinition) => void;
type UnregisterFn = (id: string) => void;

interface ShortcutRegistryContextValue {
  register: RegisterFn;
  unregister: UnregisterFn;
}

// ── Context ───────────────────────────────────────────────────────────

const ShortcutRegistryContext =
  createContext<ShortcutRegistryContextValue | null>(null);

// ── Provider ──────────────────────────────────────────────────────────

/**
 * Mounts a **single** global `keydown` listener and dispatches events to
 * registered shortcuts sorted by priority (descending).  Place this near
 * the root of your component tree so every component can register shortcuts.
 */
export function KeyboardShortcutProvider({ children }: { children: ReactNode }) {
  // Map keyed by shortcut id → definition.
  // Using a ref so register/unregister are stable and never trigger re-renders.
  const registryRef = useRef<Map<string, ShortcutDefinition>>(new Map());

  // Pre-sorted snapshot that the listener reads.  Re-sorted on every
  // register/unregister — the list is small (< 20 items) so the cost is
  // negligible and avoids sorting on every keydown.
  const sortedRef = useRef<ShortcutDefinition[]>([]);

  const rebuildSorted = () => {
    sortedRef.current = Array.from(registryRef.current.values()).sort(
      (a, b) => (b.priority ?? 0) - (a.priority ?? 0),
    );
  };

  const register = useCallback<RegisterFn>((def) => {
    registryRef.current.set(def.id, def);
    rebuildSorted();
  }, []);

  const unregister = useCallback<UnregisterFn>((id) => {
    registryRef.current.delete(id);
    rebuildSorted();
  }, []);

  // Single global listener (capture phase so it runs before Radix portals
  // that may also listen on the bubble phase).
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const isInput =
        target?.tagName === "INPUT" ||
        target?.tagName === "TEXTAREA" ||
        target?.tagName === "SELECT" ||
        target?.isContentEditable === true;

      for (const def of sortedRef.current) {
        // 1. Skip if target is an input and the shortcut doesn't allow it
        if (isInput && !def.allowInInputs) continue;

        // 2. Match key (case-sensitive)
        if (e.key !== def.key) continue;

        // 3. Match modifiers
        if (def.meta && !(e.metaKey || e.ctrlKey)) continue;
        if (!def.meta && (e.metaKey || e.ctrlKey)) continue;

        if (def.shift && !e.shiftKey) continue;
        if (!def.shift && e.shiftKey) continue;

        if (def.alt && !e.altKey) continue;
        if (!def.alt && e.altKey) continue;

        // 4. Matched — call handler
        def.handler(e);

        // 5. If the handler prevented default, don't evaluate lower-priority
        //    shortcuts for this event.
        if (e.defaultPrevented) break;
      }
    };

    document.addEventListener("keydown", handleKeyDown, true);
    return () => document.removeEventListener("keydown", handleKeyDown, true);
  }, []);

  // Stable context value — register/unregister have stable identity (useCallback
  // with [] deps), so we memoise the container object to avoid re-rendering all
  // context consumers on every provider render.
  const contextValue = useMemo<ShortcutRegistryContextValue>(
    () => ({ register, unregister }),
    [register, unregister],
  );

  return (
    <ShortcutRegistryContext.Provider value={contextValue}>
      {children}
    </ShortcutRegistryContext.Provider>
  );
}

// ── Hook ──────────────────────────────────────────────────────────────

/**
 * Register one or more keyboard shortcuts for the lifetime of the calling
 * component.  Shortcuts are automatically unregistered on unmount.
 *
 * The `handler` is kept in a ref internally so you don't need to memoise it —
 * the identity of the callback you pass can change freely without
 * unregister→re-register churn.
 *
 * @example
 * ```tsx
 * useKeyboardShortcut({
 *   id: "sidebar-toggle",
 *   key: "b",
 *   meta: true,
 *   handler: () => toggleSidebar(),
 * });
 * ```
 */
export function useKeyboardShortcut(
  def: ShortcutDefinition | ShortcutDefinition[] | null,
) {
  const ctx = useContext(ShortcutRegistryContext);
  if (!ctx) {
    throw new Error(
      "useKeyboardShortcut must be used within a <KeyboardShortcutProvider>",
    );
  }

  const defsArray = def == null ? [] : Array.isArray(def) ? def : [def];

  // Keep handler refs fresh without re-registering
  const handlersRef = useRef<Map<string, (e: KeyboardEvent) => void>>(new Map());

  for (const d of defsArray) {
    handlersRef.current.set(d.id, d.handler);
  }

  useEffect(() => {
    const ids: string[] = [];
    for (const d of defsArray) {
      const stableHandler = (e: KeyboardEvent) => {
        handlersRef.current.get(d.id)?.(e);
      };
      ctx.register({ ...d, handler: stableHandler });
      ids.push(d.id);
    }
    return () => {
      for (const id of ids) {
        ctx.unregister(id);
      }
    };
    // Re-register if the set of IDs or structural keys change.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ctx, defsArray.map((d) => `${d.id}|${d.key}|${d.meta}|${d.shift}|${d.alt}|${d.priority}|${d.allowInInputs}`).join(",")]);

  return null;
}