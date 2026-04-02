import type { ChatMessage } from "../contexts/DashboardChatContext";
import type { AssistantReplyPayload, AssistantToolStep } from "../types/conversation-types";

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Advances one assistant message through mock “processing” phases (tool steps + reasoning),
 * then reveals `content` and `sources`. Caller must append the stub message first.
 */
export async function runPhasedAssistantReply(options: {
  final: AssistantReplyPayload;
  /** Pause after send before the first tool step (e.g. “Parse prompt”) appears. */
  beforeFirstStepMs?: number;
  stepMs?: number;
  gapBeforeAnswerMs?: number;
  isCancelled: () => boolean;
  patch: (partial: Partial<ChatMessage>) => void;
}): Promise<void> {
  const { final, patch, isCancelled } = options;
  const beforeFirstStepMs = options.beforeFirstStepMs ?? 500;
  const stepMs = options.stepMs ?? 2000;
  const gapBeforeAnswerMs = options.gapBeforeAnswerMs ?? 850;

  const defs = final.toolSteps ?? [];

  if (defs.length === 0) {
    await sleep(beforeFirstStepMs);
    if (isCancelled()) return;
    await sleep(stepMs);
    if (isCancelled()) return;
    patch({
      content: final.content,
      reasoning: final.reasoning,
      sources: final.sources,
      toolSteps: undefined,
    });
    return;
  }

  await sleep(beforeFirstStepMs);
  if (isCancelled()) return;

  const n = defs.length;

  for (let r = 0; r < n; r++) {
    const toolSteps: AssistantToolStep[] = defs.slice(0, r + 1).map((d, j) =>
      j < r
        ? { label: d.label, detail: d.detail, status: "done" as const }
        : { label: d.label, status: "running" as const },
    );
    const reasoningPreview = defs
      .slice(0, r)
      .map((d) => d.detail)
      .filter(Boolean)
      .join(" ");
    patch({
      toolSteps,
      reasoning: reasoningPreview || undefined,
    });
    await sleep(stepMs);
    if (isCancelled()) return;
  }

  patch({
    toolSteps: undefined,
    reasoning: final.reasoning,
  });
  await sleep(gapBeforeAnswerMs);
  if (isCancelled()) return;

  patch({
    content: final.content,
    sources: final.sources,
  });
}
