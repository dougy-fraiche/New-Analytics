"use client";

import { Bot, ChevronDown, Eye, Loader2 } from "lucide-react";
import { useNavigate } from "react-router";

import { useCreateAIAgentJobs } from "../contexts/CreateAIAgentJobsContext";
import {
  type AgentJobStep,
  buttonLabelForStep,
  formatAgentCreatedAt,
  isLoadingStep,
} from "../lib/create-ai-agent-jobs";
import { ROUTES } from "../routes";
import { Button } from "./ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { Label } from "./ui/label";
import { cn } from "./ui/utils";

export function CreateAIAgentPopoverButton({
  sourceKey,
  scopeTitle,
  ootbTypeId = "automation-opportunities",
  className,
}: {
  sourceKey: string;
  scopeTitle: string;
  /** Defaults to Automation Opportunities dashboard context. */
  ootbTypeId?: string;
  className?: string;
}) {
  const navigate = useNavigate();
  const { startJob, jobForSource, agentsForSource } = useCreateAIAgentJobs();
  const job = jobForSource(sourceKey);
  const step = (job?.step ?? 0) as AgentJobStep;
  const loading = isLoadingStep(step);
  const agents = agentsForSource(sourceKey);

  const handlePrimaryCreate = () => {
    if (step === 0) {
      startJob({ sourceKey, scopeTitle, ootbTypeId });
    }
  };

  const openAgent = (agentId: string) => {
    navigate(ROUTES.AUTOMATION_OPPORTUNITIES_AGENT(agentId));
  };

  if (step === 7) {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className={className}
            aria-haspopup="menu"
          >
            View Agent
            <ChevronDown className="size-4 opacity-80" aria-hidden />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-[16rem] min-w-[16rem]">
          <Label className="block w-full px-2 py-1.5 text-xs font-medium text-muted-foreground">
            AI Agents ({agents.length})
          </Label>
          {agents.map((a) => (
            <DropdownMenuItem key={a.id} onSelect={() => openAgent(a.id)}>
              <Bot className="size-4 shrink-0" aria-hidden />
              <span className="min-w-0 flex-1">{formatAgentCreatedAt(a.createdAt)}</span>
              <Eye className="size-4 shrink-0" aria-hidden />
            </DropdownMenuItem>
          ))}
          <DropdownMenuSeparator />
          <DropdownMenuItem
            className="text-muted-foreground"
            onSelect={() =>
              startJob({
                sourceKey,
                scopeTitle,
                ootbTypeId,
                appendToCurrentConversation: true,
              })
            }
          >
            Create AI Agent
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      className={cn("max-w-full", className)}
      aria-busy={loading}
      aria-live="polite"
      onClick={handlePrimaryCreate}
    >
      {loading ? (
        <Loader2 className="size-4 shrink-0 animate-spin" aria-hidden />
      ) : null}
      <span className={cn(loading && "min-w-0 flex-1 truncate text-left")}>
        {buttonLabelForStep(step)}
      </span>
    </Button>
  );
}
