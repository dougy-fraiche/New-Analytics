"use client";

import type { HTMLAttributes } from "react";
import {
  CheckCircle2,
  GripVertical,
  Loader2,
  Maximize2,
  Minimize2,
  X,
} from "lucide-react";

import {
  type AgentJob,
  buttonLabelForStep,
  currentStageLabel,
  isLoadingStep,
} from "../lib/create-ai-agent-jobs";
import { Button } from "./ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { cn } from "./ui/utils";

export type ProcessPanelVariant = "compact" | "dialog";

function CreateAIAgentJobRow({
  job,
  onDismiss,
}: {
  job: AgentJob;
  onDismiss: () => void;
}) {
  const loading = isLoadingStep(job.step);
  const complete = job.step === 7;
  const stageLine = currentStageLabel(job.step);

  return (
    <div className="px-6 py-4">
      {complete ? (
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex shrink-0 items-center rounded-lg bg-success-bg p-2">
            <CheckCircle2 className="size-5 text-success" aria-hidden />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-foreground">{job.scopeTitle}</p>
            <p className="text-xs text-muted-foreground">Ai agent created successfully</p>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button type="button" variant="outline" size="sm" className="shrink-0 text-xs">
                View AI Agent
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem disabled className="text-muted-foreground">
                Additional actions coming soon
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      ) : (
        <>
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="text-xs tracking-wide text-muted-foreground">Create AI Agent</p>
              <p className="text-sm font-medium text-foreground">{job.scopeTitle}</p>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="size-8 shrink-0 text-muted-foreground"
              onClick={onDismiss}
              aria-label="Dismiss"
            >
              <X className="size-4" />
            </Button>
          </div>

          <div className="mt-2 flex gap-2">
            <div className="flex shrink-0 items-start pt-0.5">
              {loading ? <Loader2 className="size-5 animate-spin text-foreground" aria-hidden /> : null}
            </div>
            <div className="min-w-0 flex-1 space-y-1" aria-live="polite">
              {loading ? (
                <p className="text-sm font-medium text-foreground">
                  {stageLine || buttonLabelForStep(job.step)}
                </p>
              ) : null}
              <p className="text-sm text-foreground">
                <span className="font-medium">Creating an AI agent for: </span>
                <span className="block sm:inline">
                  <br className="sm:hidden" aria-hidden="true" />
                  {job.scopeTitle}. This will take a moment...
                </span>
              </p>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

/** Single popover/dialog listing all agent creations (click order: first row at top). */
export function CreateAIAgentUnifiedPanel({
  variant,
  jobs,
  onDismissJob,
  onDismissAll,
  onExpand,
  onMinimize,
  dragHandleProps,
}: {
  variant: ProcessPanelVariant;
  jobs: AgentJob[];
  onDismissJob: (jobId: string) => void;
  onDismissAll: () => void;
  onExpand?: () => void;
  onMinimize?: () => void;
  dragHandleProps?: HTMLAttributes<HTMLDivElement>;
}) {
  return (
    <div
      className={cn(
        "flex flex-col overflow-hidden text-foreground",
        variant === "compact" &&
          "w-[420px] max-h-[min(520px,calc(100vh-2rem))] rounded-xl border border-border bg-card text-card-foreground shadow-lg",
        variant === "dialog" &&
          "h-full min-h-0 w-full max-w-full flex-1 overflow-hidden rounded-none border-0 bg-transparent",
      )}
    >
      <div
        className={cn(
          "flex h-14 shrink-0 items-center justify-between gap-2 border-b bg-muted/50 px-4",
          variant === "compact" && "cursor-grab touch-none active:cursor-grabbing",
        )}
        role={variant === "compact" ? "button" : undefined}
        tabIndex={variant === "compact" ? 0 : undefined}
        aria-label={variant === "compact" ? "Drag to move" : undefined}
        {...(variant === "compact" ? dragHandleProps : {})}
      >
        <div className="flex min-w-0 flex-1 items-center gap-2 pointer-events-none">
          {variant === "compact" ? (
            <GripVertical className="size-5 shrink-0 text-muted-foreground" aria-hidden />
          ) : null}
          <p className="truncate text-base font-normal text-foreground">Create/Publish AI Agent</p>
        </div>
        <div
          className="flex shrink-0 items-center gap-0.5"
          onPointerDown={(e) => e.stopPropagation()}
        >
          {variant === "compact" && onExpand ? (
            <Button type="button" variant="ghost" size="icon" onClick={onExpand} aria-label="Expand">
              <Maximize2 className="size-4" />
            </Button>
          ) : null}
          {variant === "dialog" && onMinimize ? (
            <Button type="button" variant="ghost" size="icon" onClick={onMinimize} aria-label="Minimize">
              <Minimize2 className="size-4" />
            </Button>
          ) : null}
          <Button type="button" variant="ghost" size="icon" onClick={onDismissAll} aria-label="Close all">
            <X className="size-4" />
          </Button>
        </div>
      </div>

      <div className="flex min-h-0 flex-1 flex-col overflow-y-auto overscroll-contain">
        {jobs.map((job) => (
          <CreateAIAgentJobRow key={job.id} job={job} onDismiss={() => onDismissJob(job.id)} />
        ))}
      </div>
    </div>
  );
}
