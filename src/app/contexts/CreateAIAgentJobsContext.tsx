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

import { GLOBAL_AI_ASSISTANT_KEY } from "../lib/ai-assistant-global";
import {
  CREATE_AI_AGENT_IN_CHAT_EVENT,
  CREATE_AI_AGENT_IN_CHAT_FINISHED_EVENT,
  type CreateAIAgentInChatFinishedDetail,
} from "../lib/create-ai-agent-chat";
import {
  type AgentJob,
  type AgentJobStep,
  type AgentsBySource,
  type CreatedAgentRecord,
  loadAgentsBySourceFromSession,
  persistAgentsBySourceToSession,
} from "../lib/create-ai-agent-jobs";

const WIDGET_AI_MESSAGE_SENT_EVENT = "widget-ai-message-sent";

export type StartCreateAIAgentJobInput = {
  sourceKey: string;
  scopeTitle: string;
  ootbTypeId?: string;
  /** When true, append user + assistant turns to the current global thread (dropdown “Create AI Agent”). */
  appendToCurrentConversation?: boolean;
};

type CreateAIAgentJobsContextValue = {
  startJob: (input: StartCreateAIAgentJobInput) => void;
  jobForSource: (sourceKey: string) => AgentJob | undefined;
  agentsForSource: (sourceKey: string) => CreatedAgentRecord[];
  getAgentById: (agentId: string) => CreatedAgentRecord | undefined;
};

const CreateAIAgentJobsContext = createContext<CreateAIAgentJobsContextValue | null>(null);

export function CreateAIAgentJobsProvider({ children }: { children: ReactNode }) {
  const [agentsBySource, setAgentsBySource] = useState<AgentsBySource>(() =>
    loadAgentsBySourceFromSession(),
  );
  /** While the chat flow runs — value is scope title for synthetic job copy. */
  const [pendingBySource, setPendingBySource] = useState<Record<string, string>>({});

  const stateRef = useRef({ agentsBySource });
  stateRef.current = { agentsBySource };

  const persistTimer = useRef<number | undefined>(undefined);
  useEffect(() => {
    window.clearTimeout(persistTimer.current);
    persistTimer.current = window.setTimeout(() => {
      persistAgentsBySourceToSession(stateRef.current.agentsBySource);
    }, 150);
    return () => window.clearTimeout(persistTimer.current);
  }, [agentsBySource]);

  useEffect(() => {
    const onFinished = (e: Event) => {
      const d = (e as CustomEvent<CreateAIAgentInChatFinishedDetail>).detail;
      if (!d?.sourceKey || !d.agentId) return;
      setPendingBySource((prev) => {
        if (!(d.sourceKey in prev)) return prev;
        const next = { ...prev };
        delete next[d.sourceKey];
        return next;
      });
      if (!d.cancelled) {
        setAgentsBySource((prev) => {
          const list = prev[d.sourceKey] ?? [];
          return {
            ...prev,
            [d.sourceKey]: [
              ...list,
              { id: d.agentId, scopeTitle: d.scopeTitle, createdAt: Date.now() },
            ],
          };
        });
      }
    };
    window.addEventListener(CREATE_AI_AGENT_IN_CHAT_FINISHED_EVENT, onFinished as EventListener);
    return () =>
      window.removeEventListener(CREATE_AI_AGENT_IN_CHAT_FINISHED_EVENT, onFinished as EventListener);
  }, []);

  const startJob = useCallback((input: StartCreateAIAgentJobInput) => {
    const agentId = crypto.randomUUID();
    setPendingBySource((prev) => ({ ...prev, [input.sourceKey]: input.scopeTitle }));
    window.dispatchEvent(
      new CustomEvent(WIDGET_AI_MESSAGE_SENT_EVENT, {
        detail: { persistKey: GLOBAL_AI_ASSISTANT_KEY },
      }),
    );
    window.dispatchEvent(
      new CustomEvent(CREATE_AI_AGENT_IN_CHAT_EVENT, {
        detail: {
          sourceKey: input.sourceKey,
          scopeTitle: input.scopeTitle,
          agentId,
          ootbTypeId: input.ootbTypeId,
          appendToCurrentConversation: input.appendToCurrentConversation ?? false,
        },
      }),
    );
  }, []);

  const agentsForSource = useCallback(
    (sourceKey: string) => {
      const list = agentsBySource[sourceKey] ?? [];
      return [...list].sort((a, b) => b.createdAt - a.createdAt);
    },
    [agentsBySource],
  );

  const getAgentById = useCallback(
    (agentId: string): CreatedAgentRecord | undefined => {
      for (const list of Object.values(agentsBySource)) {
        const found = list.find((a) => a.id === agentId);
        if (found) return found;
      }
      return undefined;
    },
    [agentsBySource],
  );

  const jobForSource = useCallback(
    (sourceKey: string) => {
      const pendingTitle = pendingBySource[sourceKey];
      if (pendingTitle !== undefined) {
        const synthetic: AgentJob = {
          id: `pending-${sourceKey}`,
          sourceKey,
          scopeTitle: pendingTitle,
          step: 1,
          stepEnteredAt: Date.now(),
        };
        return synthetic;
      }
      const agents = agentsBySource[sourceKey];
      if (agents && agents.length > 0) {
        const last = agents.reduce((a, b) => (a.createdAt >= b.createdAt ? a : b));
        return {
          id: `completed-${sourceKey}`,
          sourceKey,
          scopeTitle: last.scopeTitle,
          step: 7 as AgentJobStep,
          stepEnteredAt: 0,
        } satisfies AgentJob;
      }
      return undefined;
    },
    [pendingBySource, agentsBySource],
  );

  const value = useMemo<CreateAIAgentJobsContextValue>(
    () => ({
      startJob,
      jobForSource,
      agentsForSource,
      getAgentById,
    }),
    [startJob, jobForSource, agentsForSource, getAgentById],
  );

  return <CreateAIAgentJobsContext.Provider value={value}>{children}</CreateAIAgentJobsContext.Provider>;
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
