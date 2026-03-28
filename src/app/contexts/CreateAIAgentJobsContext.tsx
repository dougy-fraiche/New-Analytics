"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";

import {
  AI_AGENT_JOB_STEP_MS,
  type AgentJob,
  type AgentJobLayout,
  type AgentJobStep,
  type CompletedAgentBySource,
  clampPosition,
  completedJobsFromList,
  defaultPanelPosition,
  isLoadingStep,
  loadAgentJobsStateFromSession,
  mergeCompletedMaps,
  persistAgentJobsStateToSession,
  type AgentJobPosition,
} from "../lib/create-ai-agent-jobs";

type CreateAIAgentJobsContextValue = {
  jobs: AgentJob[];
  panelLayout: AgentJobLayout;
  panelPosition: AgentJobPosition;
  startJob: (input: { sourceKey: string; scopeTitle: string }) => void;
  dismissJob: (jobId: string) => void;
  dismissAllJobs: () => void;
  setPanelLayout: (layout: AgentJobLayout) => void;
  updatePanelPosition: (position: AgentJobPosition, cardSize: { width: number; height: number }) => void;
  jobForSource: (sourceKey: string) => AgentJob | undefined;
};

const CreateAIAgentJobsContext = createContext<CreateAIAgentJobsContextValue | null>(null);

function reconcileHydrated(jobs: AgentJob[]): AgentJob[] {
  const now = Date.now();
  return jobs.map((j) => {
    if (!isLoadingStep(j.step)) return j;
    let step = j.step;
    let entered = j.stepEnteredAt;
    while (step < 7 && isLoadingStep(step) && now - entered >= AI_AGENT_JOB_STEP_MS) {
      entered += AI_AGENT_JOB_STEP_MS;
      step = (step + 1) as AgentJobStep;
    }
    return { ...j, step, stepEnteredAt: entered };
  });
}

function hydrateInitialState(): {
  jobs: AgentJob[];
  completedBySource: CompletedAgentBySource;
  panelLayout: AgentJobLayout;
  panelPosition: AgentJobPosition;
} {
  const saved = loadAgentJobsStateFromSession();
  if (!saved) {
    return {
      jobs: [],
      completedBySource: {},
      panelLayout: "compact",
      panelPosition: defaultPanelPosition(),
    };
  }
  const jobs = reconcileHydrated(saved.jobs);
  return {
    jobs,
    completedBySource: mergeCompletedMaps(saved.completedBySource, completedJobsFromList(jobs)),
    panelLayout: saved.panelLayout,
    panelPosition: saved.panelPosition,
  };
}

function JobStepTimer({
  jobId,
  step,
  stepEnteredAt,
  onAdvance,
}: {
  jobId: string;
  step: AgentJobStep;
  stepEnteredAt: number;
  onAdvance: (jobId: string) => void;
}) {
  useEffect(() => {
    const elapsed = Date.now() - stepEnteredAt;
    const remaining = Math.max(0, AI_AGENT_JOB_STEP_MS - elapsed);
    const t = window.setTimeout(() => onAdvance(jobId), remaining);
    return () => window.clearTimeout(t);
  }, [jobId, step, stepEnteredAt, onAdvance]);
  return null;
}

export function CreateAIAgentJobsProvider({ children }: { children: ReactNode }) {
  const initial = hydrateInitialState();
  const [jobs, setJobs] = useState<AgentJob[]>(initial.jobs);
  const [completedBySource, setCompletedBySource] = useState<CompletedAgentBySource>(initial.completedBySource);
  const [panelLayout, setPanelLayoutState] = useState<AgentJobLayout>(initial.panelLayout);
  const [panelPosition, setPanelPosition] = useState<AgentJobPosition>(initial.panelPosition);

  const stateRef = useRef({ jobs, completedBySource, panelLayout, panelPosition });
  stateRef.current = { jobs, completedBySource, panelLayout, panelPosition };

  /** Keep completion ledger in sync with any job at step 7 (timers + hydration). */
  useEffect(() => {
    setCompletedBySource((prev) => {
      const fromJobs = completedJobsFromList(jobs);
      const merged = mergeCompletedMaps(prev, fromJobs);
      const prevKeys = Object.keys(prev);
      const nextKeys = Object.keys(merged);
      if (prevKeys.length !== nextKeys.length) return merged;
      for (const k of nextKeys) {
        if (prev[k]?.scopeTitle !== merged[k]?.scopeTitle) return merged;
      }
      return prev;
    });
  }, [jobs]);

  const advanceJobStep = useCallback((jobId: string) => {
    setJobs((prev) =>
      prev.map((x) => {
        if (x.id !== jobId || !isLoadingStep(x.step)) return x;
        return {
          ...x,
          step: (x.step + 1) as AgentJobStep,
          stepEnteredAt: Date.now(),
        };
      }),
    );
  }, []);

  const persistTimer = useRef<number | undefined>(undefined);
  useEffect(() => {
    window.clearTimeout(persistTimer.current);
    persistTimer.current = window.setTimeout(() => {
      persistAgentJobsStateToSession(stateRef.current);
    }, 150);
    return () => window.clearTimeout(persistTimer.current);
  }, [jobs, completedBySource, panelLayout, panelPosition]);

  const startJob = useCallback((input: { sourceKey: string; scopeTitle: string }) => {
    setCompletedBySource((prev) => {
      if (!(input.sourceKey in prev)) return prev;
      const next = { ...prev };
      delete next[input.sourceKey];
      return next;
    });
    let wasEmpty = false;
    setJobs((prev) => {
      wasEmpty = prev.length === 0;
      const job: AgentJob = {
        id: crypto.randomUUID(),
        sourceKey: input.sourceKey,
        scopeTitle: input.scopeTitle,
        step: 1,
        stepEnteredAt: Date.now(),
      };
      return [...prev, job];
    });
    if (wasEmpty) {
      setPanelPosition(defaultPanelPosition());
    }
  }, []);

  const dismissJob = useCallback((jobId: string) => {
    setJobs((prev) => prev.filter((j) => j.id !== jobId));
  }, []);

  const dismissAllJobs = useCallback(() => {
    setJobs([]);
    setPanelLayoutState("compact");
  }, []);

  const setPanelLayout = useCallback((layout: AgentJobLayout) => {
    setPanelLayoutState(layout);
  }, []);

  const updatePanelPosition = useCallback((position: AgentJobPosition, cardSize: { width: number; height: number }) => {
    const w = cardSize.width > 0 ? cardSize.width : 420;
    const h = cardSize.height > 0 ? cardSize.height : 320;
    setPanelPosition(clampPosition(position, w, h));
  }, []);

  const jobForSource = useCallback((sourceKey: string) => {
    for (let i = jobs.length - 1; i >= 0; i--) {
      if (jobs[i]!.sourceKey === sourceKey) return jobs[i];
    }
    const done = completedBySource[sourceKey];
    if (done) {
      const synthetic: AgentJob = {
        id: `completed-${sourceKey}`,
        sourceKey,
        scopeTitle: done.scopeTitle,
        step: 7,
        stepEnteredAt: 0,
      };
      return synthetic;
    }
    return undefined;
  }, [jobs, completedBySource]);

  const value = useMemo<CreateAIAgentJobsContextValue>(
    () => ({
      jobs,
      panelLayout,
      panelPosition,
      startJob,
      dismissJob,
      dismissAllJobs,
      setPanelLayout,
      updatePanelPosition,
      jobForSource,
    }),
    [jobs, panelLayout, panelPosition, startJob, dismissJob, dismissAllJobs, setPanelLayout, updatePanelPosition, jobForSource],
  );

  return (
    <CreateAIAgentJobsContext.Provider value={value}>
      <>
        {jobs.map((j) =>
          isLoadingStep(j.step) ? (
            <JobStepTimer
              key={`${j.id}:${j.step}:${j.stepEnteredAt}`}
              jobId={j.id}
              step={j.step}
              stepEnteredAt={j.stepEnteredAt}
              onAdvance={advanceJobStep}
            />
          ) : null,
        )}
        {children}
      </>
    </CreateAIAgentJobsContext.Provider>
  );
}

export function useCreateAIAgentJobs(): CreateAIAgentJobsContextValue {
  const ctx = useContext(CreateAIAgentJobsContext);
  if (!ctx) {
    throw new Error("useCreateAIAgentJobs must be used within CreateAIAgentJobsProvider");
  }
  return ctx;
}

export function useCreateAIAgentJobsOptional(): CreateAIAgentJobsContextValue | null {
  return useContext(CreateAIAgentJobsContext);
}
