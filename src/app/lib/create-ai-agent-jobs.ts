export const AI_AGENT_JOB_STEP_MS = 2000;

export const AI_AGENT_JOBS_STORAGE_KEY = "create-ai-agent-jobs-v1";

/** Figma-aligned loading stage labels (Section 4) */
export const LOADING_STEP_LABELS = [
  "AI Agent In Process…",
  "Create Reasons…",
  "Summarize Actions…",
  "Create Jobs…",
  "Create Tools…",
  "Routing Agents…",
] as const;

/** 0 idle, 1–6 loading, 7 complete */
export type AgentJobStep = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7;

export type AgentJobLayout = "compact" | "dialog";

export type AgentJobPosition = { x: number; y: number };

/** One queued agent creation (order in the array = click order, first at top). */
export type AgentJob = {
  id: string;
  sourceKey: string;
  scopeTitle: string;
  step: AgentJobStep;
  stepEnteredAt: number;
};

export type SerializedAgentJobV1 = AgentJob & {
  layout: AgentJobLayout;
  position: AgentJobPosition;
};

export type SerializedAgentJob = AgentJob;

/** Persisted when an agent creation finishes (step 7); survives clearing the popover/dialog. */
export type CompletedAgentBySource = Record<string, { scopeTitle: string }>;

export type PersistedAgentJobsStateV2 = {
  v: 2;
  jobs: SerializedAgentJob[];
  panelLayout: AgentJobLayout;
  panelPosition: AgentJobPosition;
  completedBySource?: CompletedAgentBySource;
};

export function isLoadingStep(step: AgentJobStep): boolean {
  return step >= 1 && step <= 6;
}

export function buttonLabelForStep(step: AgentJobStep): string {
  if (step === 0) return "Create AI Agent";
  if (step === 7) return "View Agent";
  return LOADING_STEP_LABELS[step - 1];
}

export function currentStageLabel(step: AgentJobStep): string {
  if (step === 0 || step === 7) return "";
  return LOADING_STEP_LABELS[step - 1];
}

/** Used only for initial placement before the panel is measured. */
const PANEL_APPROX_HEIGHT = 360;

/** 1rem edge inset for clamping and default panel position (respects root font size). */
export function getViewportEdgePaddingPx(): number {
  if (typeof window === "undefined") return 16;
  const fs = parseFloat(getComputedStyle(document.documentElement).fontSize || "16");
  return Number.isFinite(fs) ? fs : 16;
}

export function defaultPanelPosition(): AgentJobPosition {
  const pad = typeof window === "undefined" ? 16 : getViewportEdgePaddingPx();
  if (typeof window === "undefined") {
    return { x: pad, y: pad };
  }
  const y = window.innerHeight - pad - PANEL_APPROX_HEIGHT;
  return { x: pad, y: Math.max(pad, y) };
}

export function clampPosition(pos: AgentJobPosition, cardWidth: number, cardHeight: number): AgentJobPosition {
  if (typeof window === "undefined") return pos;
  const pad = getViewportEdgePaddingPx();
  const maxX = Math.max(pad, window.innerWidth - cardWidth - pad);
  const maxY = Math.max(pad, window.innerHeight - cardHeight - pad);
  return {
    x: Math.min(maxX, Math.max(pad, pos.x)),
    y: Math.min(maxY, Math.max(pad, pos.y)),
  };
}

function isValidSerializedJobV1(row: unknown): row is SerializedAgentJobV1 {
  if (!row || typeof row !== "object") return false;
  const o = row as Record<string, unknown>;
  return (
    typeof o.id === "string" &&
    typeof o.sourceKey === "string" &&
    typeof o.scopeTitle === "string" &&
    typeof o.step === "number" &&
    o.step >= 0 &&
    o.step <= 7 &&
    (o.layout === "compact" || o.layout === "dialog") &&
    o.position != null &&
    typeof o.position === "object" &&
    typeof (o.position as AgentJobPosition).x === "number" &&
    typeof (o.position as AgentJobPosition).y === "number" &&
    typeof o.stepEnteredAt === "number"
  );
}

function isValidSlimJob(row: unknown): row is SerializedAgentJob {
  if (!row || typeof row !== "object") return false;
  const o = row as Record<string, unknown>;
  return (
    typeof o.id === "string" &&
    typeof o.sourceKey === "string" &&
    typeof o.scopeTitle === "string" &&
    typeof o.step === "number" &&
    o.step >= 0 &&
    o.step <= 7 &&
    typeof o.stepEnteredAt === "number"
  );
}

function isCompletedBySourceRow(row: unknown): row is CompletedAgentBySource {
  if (!row || typeof row !== "object") return false;
  return Object.entries(row as Record<string, unknown>).every(
    ([k, v]) =>
      typeof k === "string" &&
      v !== null &&
      typeof v === "object" &&
      typeof (v as { scopeTitle?: unknown }).scopeTitle === "string",
  );
}

function isPersistedV2(row: unknown): row is PersistedAgentJobsStateV2 {
  if (!row || typeof row !== "object") return false;
  const o = row as Record<string, unknown>;
  if (o.v !== 2 || !Array.isArray(o.jobs)) return false;
  if (o.panelLayout !== "compact" && o.panelLayout !== "dialog") return false;
  const pos = o.panelPosition as AgentJobPosition | undefined;
  if (!pos || typeof pos.x !== "number" || typeof pos.y !== "number") return false;
  if (!o.jobs.every(isValidSlimJob)) return false;
  if (o.completedBySource !== undefined && !isCompletedBySourceRow(o.completedBySource)) return false;
  return true;
}

export type LoadedAgentJobsState = {
  jobs: AgentJob[];
  completedBySource: CompletedAgentBySource;
  panelLayout: AgentJobLayout;
  panelPosition: AgentJobPosition;
};

export function completedJobsFromList(jobs: AgentJob[]): CompletedAgentBySource {
  const m: CompletedAgentBySource = {};
  for (const j of jobs) {
    if (j.step === 7) m[j.sourceKey] = { scopeTitle: j.scopeTitle };
  }
  return m;
}

export function mergeCompletedMaps(
  a: CompletedAgentBySource,
  b: CompletedAgentBySource,
): CompletedAgentBySource {
  return { ...a, ...b };
}

export function loadAgentJobsStateFromSession(): LoadedAgentJobsState | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.sessionStorage.getItem(AI_AGENT_JOBS_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as unknown;

    if (isPersistedV2(parsed)) {
      const jobs = parsed.jobs.map((j) => ({ ...j, step: j.step as AgentJobStep }));
      const fromPayload = parsed.completedBySource ?? {};
      const fromJobs = completedJobsFromList(jobs);
      return {
        jobs,
        completedBySource: mergeCompletedMaps(fromPayload, fromJobs),
        panelLayout: parsed.panelLayout,
        panelPosition: parsed.panelPosition,
      };
    }

    if (Array.isArray(parsed)) {
      const v1 = parsed.filter(isValidSerializedJobV1);
      if (!v1.length) return null;
      const panelPosition = v1[0]!.position;
      const panelLayout: AgentJobLayout = v1.some((j) => j.layout === "dialog") ? "dialog" : "compact";
      const jobs: AgentJob[] = v1.map(({ id, sourceKey, scopeTitle, step, stepEnteredAt }) => ({
        id,
        sourceKey,
        scopeTitle,
        step: step as AgentJobStep,
        stepEnteredAt,
      }));
      return {
        jobs,
        completedBySource: completedJobsFromList(jobs),
        panelLayout,
        panelPosition,
      };
    }

    return null;
  } catch {
    return null;
  }
}

export function persistAgentJobsStateToSession(state: LoadedAgentJobsState): void {
  if (typeof window === "undefined") return;
  try {
    const fromActive = completedJobsFromList(state.jobs);
    const payload: PersistedAgentJobsStateV2 = {
      v: 2,
      jobs: state.jobs,
      panelLayout: state.panelLayout,
      panelPosition: state.panelPosition,
      completedBySource: mergeCompletedMaps(state.completedBySource, fromActive),
    };
    window.sessionStorage.setItem(AI_AGENT_JOBS_STORAGE_KEY, JSON.stringify(payload));
  } catch {
    /* ignore */
  }
}

