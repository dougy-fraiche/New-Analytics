"use client";

import { useParams } from "react-router";

import { useCreateAIAgentJobs } from "../contexts/CreateAIAgentJobsContext";
import { Button } from "./ui/button";
import { PageHeader, pageHeaderTitleRowClassName } from "./PageChrome";

/** Placeholder workspace for an AI agent created from Automation Opportunities. */
export function AutomationOpportunitiesAgentPage() {
  const { agentId } = useParams<{ agentId: string }>();
  const { getAgentById } = useCreateAIAgentJobs();
  const agent = agentId ? getAgentById(agentId) : undefined;
  const decodedAgentLabel = agentId ? decodeURIComponent(agentId) : "";
  const agentTitle = agent?.scopeTitle || decodedAgentLabel || "AI Agent";

  return (
    <div className="flex flex-1 min-h-0 flex-col">
      <PageHeader>
        <section className={pageHeaderTitleRowClassName}>
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="min-w-0">
              <h1 className="text-3xl tracking-tight">{agentTitle}</h1>
              <p className="text-muted-foreground mt-2">
                Configure this agent’s behavior, tools, and routing before publishing it for use in your workflows.
              </p>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <Button type="button" variant="outline" size="sm">
                Edit
              </Button>
              <Button type="button" variant="default" size="sm">
                Publish
              </Button>
            </div>
          </div>
        </section>
      </PageHeader>

      <div className="flex-1 min-h-0 overflow-auto">
        <div className="w-full min-w-0 px-8 pt-8 pb-8">
          <p className="text-sm text-muted-foreground">Agent workspace details coming soon.</p>
        </div>
      </div>
    </div>
  );
}
