"use client";

import { useParams } from "react-router";

import { useCreateAIAgentJobs } from "../contexts/CreateAIAgentJobsContext";

/** Placeholder workspace for an AI agent created from Automation Opportunities. */
export function AutomationOpportunitiesAgentPage() {
  const { agentId } = useParams<{ agentId: string }>();
  const { getAgentById } = useCreateAIAgentJobs();
  const agent = agentId ? getAgentById(agentId) : undefined;

  return (
    <div className="flex flex-1 flex-col min-h-0 overflow-auto p-6">
      <p className="text-sm text-muted-foreground">
        {agent
          ? `Workspace for “${agent.scopeTitle}” — details coming soon.`
          : "Agent workspace coming soon."}
      </p>
    </div>
  );
}
