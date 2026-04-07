/**
 * Fallback copy for the assistant “Reasoning” collapsible when a stored message has no
 * `reasoning` or `toolSteps` (e.g. Explore threads mirrored into global chat history).
 */
export function syntheticAssistantReasoningText(content: string): string {
  const t = content.trim();
  if (!t) {
    return "No structured reasoning was stored for this turn; open the thread context or sources in the product to trace how this answer was produced.";
  }
  const firstBlock = (t.split(/\n\n+/)[0] ?? t).replace(/\s+/g, " ").trim();
  const sentenceMatch = firstBlock.match(/^(.+?[.!?])(\s|$)/);
  const gist = sentenceMatch
    ? sentenceMatch[1]!.trim()
    : firstBlock.length > 220
      ? `${firstBlock.slice(0, 217).trim()}…`
      : firstBlock;
  return `From your wording and the data visible in this workspace, the assistant grounded this reply in the following takeaway: ${gist}`;
}
