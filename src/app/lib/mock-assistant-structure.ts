import type { AssistantStructuredFields } from "../types/conversation-types";

/** Resolve label + path for “current page” source chips (browser only). */
export function getClientPageSourceMeta(overrides?: {
  pageLabel?: string;
  pagePath?: string;
}): { pageLabel: string; pagePath: string } {
  if (typeof window === "undefined") {
    return {
      pageLabel: overrides?.pageLabel ?? "Current page",
      pagePath: overrides?.pagePath ?? "/",
    };
  }
  const pagePath =
    overrides?.pagePath ?? `${window.location.pathname}${window.location.search}`;
  const pageLabel =
    overrides?.pageLabel?.trim() ||
    (typeof document !== "undefined" && document.title?.trim()) ||
    "Current page";
  return { pageLabel, pagePath };
}

/**
 * Deterministic mock “thinking”, tool steps, and sources for demo / design validation.
 * Replace with real model output when a backend exists.
 */
export function buildMockAssistantFields(
  userMessage: string,
  options?: {
    ootbTypeId?: string;
    widgetTitle?: string;
    widgetAnchorId?: string;
    /** Human-readable name for the active screen (e.g. from route / header context). */
    pageLabel?: string;
    /** App-relative path for Link (`/path?query`), excluding origin. */
    pagePath?: string;
  },
): AssistantStructuredFields {
  const trimmed = userMessage.trim();
  const preview = trimmed.slice(0, 72);
  const ell = trimmed.length > 72 ? "…" : "";

  const { pageLabel, pagePath } = getClientPageSourceMeta({
    pageLabel: options?.pageLabel,
    pagePath: options?.pagePath,
  });

  const scopePhrase = options?.widgetTitle
    ? `the “${options.widgetTitle}” widget and the rest of what’s visible`
    : options?.ootbTypeId
      ? `this ${options.ootbTypeId.replace(/-/g, " ")} view and applied filters`
      : "the current page, time range, and what’s on screen";

  const reasoning = `From your wording we identified what you’re asking about, scoped it to ${scopePhrase}, and grounded the answer in those signals plus documentation-style references. That keeps the reply aligned with what you can see here and traceable back to sources.`;

  const pageSource = {
    label: pageLabel,
    url: pagePath,
    snippet: "The screen you were on and the state visible there when you sent this message.",
  };

  const sources: NonNullable<AssistantStructuredFields["sources"]> = [
    pageSource,
    ...(options?.widgetTitle
      ? [
          {
            label: options.widgetTitle,
            widgetRef: options.widgetTitle,
            widgetAnchorId: options.widgetAnchorId,
            snippet: "Data and selection scoped to this widget on the page.",
          },
        ]
      : []),
    {
      label: "Knowledge base",
      url: "https://example.com/docs/metrics-glossary",
      snippet: "How common KPIs are calculated and interpreted",
    },
  ];

  const toolSteps: AssistantStructuredFields["toolSteps"] = [
    {
      label: "Parse prompt and intent",
      status: "done",
      detail: `Detected question focus from “${preview}${ell}”.`,
    },
    {
      label: "Resolve page context",
      status: "done",
      detail: options?.widgetTitle
        ? `Scoped to widget “${options.widgetTitle}” and what’s visible on screen.`
        : options?.ootbTypeId
          ? `Mapped to the ${options.ootbTypeId.replace(/-/g, " ")} view and filters.`
          : "Used what’s visible on this page and the active time range.",
    },
    {
      label: "Draft answer with references",
      status: "done",
      detail: "Grounded the reply in on-screen context and doc-style citations.",
    },
    {
      label: "Preparing reply",
      status: "done",
      detail: "Formatting the response for clarity and double-checking tone.",
    },
  ];

  return { reasoning, sources, toolSteps };
}
