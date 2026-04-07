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

/** One in-flight or completed agent creation (synthetic for UI). */
export type AgentJob = {
  id: string;
  sourceKey: string;
  scopeTitle: string;
  step: AgentJobStep;
  stepEnteredAt: number;
};

/** One saved agent row per Top Opportunities source (multiple per scope). */
export type CreatedAgentRecord = {
  id: string;
  scopeTitle: string;
  createdAt: number;
};

/** @deprecated Legacy single completion per source — migrated to {@link AgentsBySource} */
export type CompletedAgentBySource = Record<string, { scopeTitle: string }>;

export type AgentsBySource = Record<string, CreatedAgentRecord[]>;

/** Current session shape — list of agents per source key. */
export type PersistedAgentJobsStateV4 = {
  v: 4;
  agentsBySource: AgentsBySource;
};

/** @deprecated v3 single map */
export type PersistedAgentJobsStateV3 = {
  v: 3;
  completedBySource: CompletedAgentBySource;
};

type AgentJobLayout = "compact" | "dialog";
type AgentJobPosition = { x: number; y: number };
type SerializedAgentJob = AgentJob;
type SerializedAgentJobV1 = AgentJob & {
  layout: AgentJobLayout;
  position: AgentJobPosition;
};

type PersistedAgentJobsStateV2 = {
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

/** Display string like “March 7, 2026 12:24 PM” (matches product reference). */
export function formatAgentCreatedAt(createdAt: number): string {
  const d = new Date(createdAt);
  const date = d.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
  const time = d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true });
  return `${date} ${time}`;
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

function isCreatedAgentRecord(row: unknown): row is CreatedAgentRecord {
  if (!row || typeof row !== "object") return false;
  const o = row as Record<string, unknown>;
  return (
    typeof o.id === "string" &&
    typeof o.scopeTitle === "string" &&
    typeof o.createdAt === "number" &&
    Number.isFinite(o.createdAt)
  );
}

function isAgentsBySourceRow(row: unknown): row is AgentsBySource {
  if (!row || typeof row !== "object") return false;
  return Object.entries(row as Record<string, unknown>).every(
    ([k, v]) => typeof k === "string" && Array.isArray(v) && v.every(isCreatedAgentRecord),
  );
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

function isPersistedV3(row: unknown): row is PersistedAgentJobsStateV3 {
  if (!row || typeof row !== "object") return false;
  const o = row as Record<string, unknown>;
  return o.v === 3 && isCompletedBySourceRow(o.completedBySource);
}

function isPersistedV4(row: unknown): row is PersistedAgentJobsStateV4 {
  if (!row || typeof row !== "object") return false;
  const o = row as Record<string, unknown>;
  return o.v === 4 && isAgentsBySourceRow(o.agentsBySource);
}

function completedJobsFromList(jobs: AgentJob[]): CompletedAgentBySource {
  const m: CompletedAgentBySource = {};
  for (const j of jobs) {
    if (j.step === 7) m[j.sourceKey] = { scopeTitle: j.scopeTitle };
  }
  return m;
}

function mergeCompletedMaps(a: CompletedAgentBySource, b: CompletedAgentBySource): CompletedAgentBySource {
  return { ...a, ...b };
}

function migrateV3ToAgents(v3: PersistedAgentJobsStateV3): AgentsBySource {
  const out: AgentsBySource = {};
  for (const [k, v] of Object.entries(v3.completedBySource)) {
    out[k] = [
      {
        id: crypto.randomUUID(),
        scopeTitle: v.scopeTitle,
        createdAt: Date.now(),
      },
    ];
  }
  return out;
}

function migrateCompletedMapToAgents(completed: CompletedAgentBySource): AgentsBySource {
  const out: AgentsBySource = {};
  for (const [k, v] of Object.entries(completed)) {
    out[k] = [
      {
        id: crypto.randomUUID(),
        scopeTitle: v.scopeTitle,
        createdAt: Date.now(),
      },
    ];
  }
  return out;
}

/**
 * Load persisted agents per source. Migrates legacy v1–v3 payloads.
 */
export function loadAgentsBySourceFromSession(): AgentsBySource {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.sessionStorage.getItem(AI_AGENT_JOBS_STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as unknown;

    if (isPersistedV4(parsed)) {
      return parsed.agentsBySource;
    }

    if (isPersistedV3(parsed)) {
      return migrateV3ToAgents(parsed);
    }

    if (isPersistedV2(parsed)) {
      const jobs = parsed.jobs.map((j) => ({ ...j, step: j.step as AgentJobStep }));
      const fromPayload = parsed.completedBySource ?? {};
      const fromJobs = completedJobsFromList(jobs);
      const merged = mergeCompletedMaps(fromPayload, fromJobs);
      return migrateCompletedMapToAgents(merged);
    }

    if (Array.isArray(parsed)) {
      const v1 = parsed.filter(isValidSerializedJobV1);
      if (!v1.length) return {};
      const jobs: AgentJob[] = v1.map(({ id, sourceKey, scopeTitle, step, stepEnteredAt }) => ({
        id,
        sourceKey,
        scopeTitle,
        step: step as AgentJobStep,
        stepEnteredAt,
      }));
      return migrateCompletedMapToAgents(completedJobsFromList(jobs));
    }

    return {};
  } catch {
    return {};
  }
}

/** @deprecated Use {@link loadAgentsBySourceFromSession} */
export function loadCompletedAgentStateFromSession(): CompletedAgentBySource {
  const agents = loadAgentsBySourceFromSession();
  const out: CompletedAgentBySource = {};
  for (const [k, list] of Object.entries(agents)) {
    const last = list[list.length - 1];
    if (last) out[k] = { scopeTitle: last.scopeTitle };
  }
  return out;
}

export function persistAgentsBySourceToSession(agentsBySource: AgentsBySource): void {
  if (typeof window === "undefined") return;
  try {
    const payload: PersistedAgentJobsStateV4 = { v: 4, agentsBySource };
    window.sessionStorage.setItem(AI_AGENT_JOBS_STORAGE_KEY, JSON.stringify(payload));
  } catch {
    /* ignore */
  }
}

/** @deprecated Use {@link persistAgentsBySourceToSession} */
export function persistCompletedAgentStateToSession(completedBySource: CompletedAgentBySource): void {
  persistAgentsBySourceToSession(migrateCompletedMapToAgents(completedBySource));
}
