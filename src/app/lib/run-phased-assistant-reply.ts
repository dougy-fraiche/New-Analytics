import type { ChatMessage } from "../contexts/DashboardChatContext";
import type { AssistantReplyPayload, AssistantToolStep } from "../types/conversation-types";

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** Reveal assistant text in chunks to mimic streaming / typing (UI only; final patch still stores full string). */
async function streamAssistantContent(options: {
  fullText: string;
  patch: (partial: Partial<ChatMessage>) => void;
  isCancelled: () => boolean;
  tickMs?: number;
  charsPerTick?: number;
}): Promise<void> {
  const { fullText, patch, isCancelled } = options;
  const tickMs = options.tickMs ?? 16;
  const charsPerTick = Math.max(1, options.charsPerTick ?? 2);

  if (!fullText) {
    return;
  }

  let i = 0;
  while (i < fullText.length) {
    if (isCancelled()) return;
    i = Math.min(i + charsPerTick, fullText.length);
    patch({ content: fullText.slice(0, i) });
    await sleep(tickMs);
  }
}

/**
 * Advances one assistant message through mock “processing” phases (tool steps + reasoning),
 * then reveals `content` with a typewriter-style stream and `sources`.
 * Caller must append the stub message first.
 */
export async function runPhasedAssistantReply(options: {
  final: AssistantReplyPayload;
  /** Pause after send before the first tool step (e.g. “Parse prompt”) appears. */
  beforeFirstStepMs?: number;
  stepMs?: number;
  /** Delay between revealed character chunks while typing out `content`. */
  typeTickMs?: number;
  /** Characters appended per tick while typing (≥ 1). */
  charsPerTypeTick?: number;
  isCancelled: () => boolean;
  patch: (partial: Partial<ChatMessage>) => void;
}): Promise<void> {
  const { final, patch, isCancelled } = options;
  const beforeFirstStepMs = options.beforeFirstStepMs ?? 500;
  const stepMs = options.stepMs ?? 2000;
  const typeTickMs = options.typeTickMs ?? 16;
  const charsPerTypeTick = options.charsPerTypeTick ?? 2;

  const defs = final.toolSteps ?? [];

  const finishWithStream = async () => {
    if (isCancelled()) return;
    patch({
      reasoning: final.reasoning,
      isTypingContent: true,
      toolSteps: undefined,
    });
    await streamAssistantContent({
      fullText: final.content,
      patch,
      isCancelled,
      tickMs: typeTickMs,
      charsPerTick: charsPerTypeTick,
    });
    if (isCancelled()) return;
    patch({
      content: final.content,
      sources: final.sources,
      isTypingContent: false,
    });
  };

  if (defs.length === 0) {
    await sleep(beforeFirstStepMs);
    if (isCancelled()) return;
    await sleep(stepMs);
    if (isCancelled()) return;
    await finishWithStream();
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
    patch({
      toolSteps,
    });
    await sleep(stepMs);
    if (isCancelled()) return;
  }

  await finishWithStream();
}
