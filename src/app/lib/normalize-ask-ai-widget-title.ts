const ASK_AI_TITLE_PREFIXES = [
  "card source",
  "action",
  "history insight",
  "impact highlight",
];

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

const ASK_AI_TITLE_PREFIX_RE = new RegExp(
  `^\\s*(?:${ASK_AI_TITLE_PREFIXES.map(escapeRegex).join("|")})\\s*[:\\-–—]\\s*`,
  "i",
);

/**
 * Clean widget titles used by Ask AI prompt sources so user-visible/request text stays human-readable.
 * Strips known label-like prefixes such as "Card Source:" and "Action:".
 */
export function normalizeAskAiWidgetTitle(rawTitle: string): string {
  const trimmed = rawTitle.trim().replace(/\s+/g, " ");
  if (!trimmed) return "";

  let normalized = trimmed;
  let changed = false;
  do {
    changed = ASK_AI_TITLE_PREFIX_RE.test(normalized);
    if (changed) normalized = normalized.replace(ASK_AI_TITLE_PREFIX_RE, "").trim();
  } while (changed && normalized);

  return normalized || trimmed;
}
