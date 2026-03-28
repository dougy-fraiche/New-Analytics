"use client";

import { ChevronDown, Loader2 } from "lucide-react";

import { useCreateAIAgentJobs } from "../contexts/CreateAIAgentJobsContext";
import {
  type AgentJobStep,
  buttonLabelForStep,
  isLoadingStep,
} from "../lib/create-ai-agent-jobs";
import { Button } from "./ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";

export function CreateAIAgentPopoverButton({
  sourceKey,
  scopeTitle,
  className,
}: {
  sourceKey: string;
  scopeTitle: string;
  className?: string;
}) {
  const { startJob, jobForSource } = useCreateAIAgentJobs();
  const job = jobForSource(sourceKey);
  const step = (job?.step ?? 0) as AgentJobStep;
  const loading = isLoadingStep(step);

  const handleClick = () => {
    if (step === 0) {
      startJob({ sourceKey, scopeTitle });
    }
  };

  if (step === 7) {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            className={className}
            aria-haspopup="menu"
          >
            View Agent
            <ChevronDown className="size-4 opacity-80" aria-hidden />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem disabled className="text-muted-foreground">
            Additional actions coming soon
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  return (
    <Button
      type="button"
      variant="secondary"
      size="sm"
      className={className}
      aria-busy={loading}
      aria-live="polite"
      onClick={handleClick}
    >
      {loading ? <Loader2 className="size-4 shrink-0 animate-spin" aria-hidden /> : null}
      {buttonLabelForStep(step)}
    </Button>
  );
}
