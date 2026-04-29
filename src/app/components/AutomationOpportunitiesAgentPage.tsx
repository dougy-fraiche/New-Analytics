"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ChevronDown } from "lucide-react";
import { useParams } from "react-router";
import { toast } from "sonner";

import { useCreateAIAgentJobs } from "../contexts/CreateAIAgentJobsContext";
import { WidgetAIProvider } from "../contexts/WidgetAIContext";
import type {
  AgentJobDraft,
  AgentToolDraft,
  AgentToolParameterRowDraft,
} from "../data/automation-opportunities-agent-page";
import {
  deriveAgentConfigFromTitle,
  normalizeToolParameterRows,
  type AgentConfigDraft,
} from "../data/automation-opportunities-agent-page";
import { GLOBAL_AI_ASSISTANT_KEY } from "../lib/ai-assistant-global";
import { formatAgentCreatedAt } from "../lib/create-ai-agent-jobs";
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { ToggleGroup, ToggleGroupItem } from "./ui/toggle-group";
import { Textarea } from "./ui/textarea";
import { Badge } from "./ui/badge";
import { Skeleton } from "./ui/skeleton";
import { PageTransition } from "./PageTransition";
import {
  PageHeader,
  PageHeaderPrimaryRow,
  pageMainColumnClassName,
  pageRootListScrollGutterClassName,
} from "./PageChrome";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { Tabs, TabsList, TabsTrigger } from "./ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./ui/table";
import { cn } from "./ui/utils";
import { ScrollArea } from "./ui/scroll-area";
import { AutomationOpportunitiesFlowView } from "./AutomationOpportunitiesFlowView";

const PROJECT_OPTIONS = ["Project Alpha", "Project Atlas", "Project Nova"] as const;
const AGENT_PAGE_OOTB_ID = "automation-opportunities";

const UUID_V4_OR_V7_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[147][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const REWRITE_LOADING_MS = 4500;
type RewriteTarget = "description" | "instruction";

function cloneDraft(config: AgentConfigDraft): AgentConfigDraft {
  return {
    ...config,
    jobs: config.jobs.map((job) => ({
      ...job,
      tools: job.tools.map((tool) => ({
        ...tool,
        parameterRows: normalizeToolParameterRows(tool).map((row) => ({ ...row })),
      })),
    })),
  };
}

function safeDecode(input: string): string {
  try {
    return decodeURIComponent(input);
  } catch {
    return input;
  }
}

function rewritePromptTarget(prompt: string): RewriteTarget | null {
  const normalized = prompt.trim().toLowerCase();
  if (
    normalized.includes("rewrite description") ||
    normalized.includes("rewrite job description")
  ) {
    return "description";
  }
  if (
    normalized.includes("rewrite instruction") ||
    normalized.includes("rewrite job instruction")
  ) {
    return "instruction";
  }
  return null;
}

function rewriteLoadingKey(jobId: string, target: RewriteTarget): string {
  return `${jobId}:${target}`;
}

function buildLocalRewriteCopy(job: AgentJobDraft, target: RewriteTarget): string {
  const jobName = job.name.trim() || "this job";
  if (target === "description") {
    return `Provide end-to-end support for ${jobName.toLowerCase()} requests by confirming user context, applying the right policy checks, and delivering a concise resolution summary with clear next steps.`;
  }

  return [
    `1. Confirm user intent and collect required inputs for ${jobName.toLowerCase()}.`,
    "2. Validate account context, policy constraints, and confidence before taking action.",
    "3. Execute approved steps in sequence and confirm the final outcome.",
    "4. Escalate to a human reviewer when confidence is low or policy requires manual approval.",
  ].join("\n");
}

export function AutomationOpportunitiesAgentPage() {
  const { agentId } = useParams<{ agentId: string }>();
  const { getAgentById } = useCreateAIAgentJobs();
  const agent = agentId ? getAgentById(agentId) : undefined;
  const decodedAgentLabel = agentId ? safeDecode(agentId) : "";
  const fallbackRouteTitle =
    decodedAgentLabel && !UUID_V4_OR_V7_PATTERN.test(decodedAgentLabel)
      ? decodedAgentLabel
      : "";
  const agentTitle = agent?.scopeTitle?.trim() || fallbackRouteTitle || "AI Agent";

  const initialDraft = useMemo(() => {
    const seeded = deriveAgentConfigFromTitle(agentTitle);
    if (agent?.createdAt) {
      seeded.creationDate = formatAgentCreatedAt(agent.createdAt);
    }
    seeded.intentTitle = agentTitle;
    return seeded;
  }, [agent?.createdAt, agentTitle]);

  const [draft, setDraft] = useState<AgentConfigDraft>(() =>
    cloneDraft(initialDraft),
  );
  const [savedDraft, setSavedDraft] = useState<AgentConfigDraft>(() =>
    cloneDraft(initialDraft),
  );
  const [selectedJobId, setSelectedJobId] = useState<string>(
    initialDraft.jobs[0]?.id ?? "",
  );
  const [viewMode, setViewMode] = useState<"textual" | "flow">("textual");
  const [rewriteLoadingByField, setRewriteLoadingByField] = useState<
    Record<string, boolean>
  >({});
  const rewriteTimersRef = useRef<Map<string, number>>(new Map());

  const clearRewriteTimers = useCallback(() => {
    for (const timerId of rewriteTimersRef.current.values()) {
      window.clearTimeout(timerId);
    }
    rewriteTimersRef.current.clear();
  }, []);

  useEffect(() => {
    clearRewriteTimers();
    setRewriteLoadingByField({});
    const seededDraft = cloneDraft(initialDraft);
    setDraft(seededDraft);
    setSavedDraft(cloneDraft(seededDraft));
    setSelectedJobId(initialDraft.jobs[0]?.id ?? "");
    setViewMode("textual");
  }, [clearRewriteTimers, initialDraft]);

  useEffect(
    () => () => {
      clearRewriteTimers();
    },
    [clearRewriteTimers],
  );

  useEffect(() => {
    if (!draft.jobs.length) {
      setSelectedJobId("");
      return;
    }
    if (!selectedJobId || !draft.jobs.some((job) => job.id === selectedJobId)) {
      setSelectedJobId(draft.jobs[0].id);
    }
  }, [draft.jobs, selectedJobId]);

  const selectedJob = useMemo(
    () => draft.jobs.find((job) => job.id === selectedJobId) ?? draft.jobs[0],
    [draft.jobs, selectedJobId],
  );
  const hasUnsavedChanges = useMemo(
    () => JSON.stringify(draft) !== JSON.stringify(savedDraft),
    [draft, savedDraft],
  );

  const updateSelectedJob = useCallback(
    (updater: (job: AgentJobDraft) => AgentJobDraft) => {
      if (!selectedJobId) return;
      setDraft((prev) => ({
        ...prev,
        jobs: prev.jobs.map((job) =>
          job.id === selectedJobId ? updater(job) : job,
        ),
      }));
    },
    [selectedJobId],
  );

  const updateJobById = useCallback(
    (jobId: string, updater: (job: AgentJobDraft) => AgentJobDraft) => {
      setDraft((prev) => ({
        ...prev,
        jobs: prev.jobs.map((job) => (job.id === jobId ? updater(job) : job)),
      }));
    },
    [],
  );

  const updateJobFieldById = useCallback(
    (jobId: string, field: "description" | "instruction", value: string) => {
      updateJobById(jobId, (job) => ({ ...job, [field]: value }));
    },
    [updateJobById],
  );

  const updateJobField = useCallback(
    (field: "description" | "instruction", value: string) => {
      updateSelectedJob((job) => ({ ...job, [field]: value }));
    },
    [updateSelectedJob],
  );

  const updateToolFieldByJob = useCallback(
    (
      jobId: string,
      toolId: string,
      field:
        | "name"
        | "description"
        | "cognigyNodes"
        | "placeholderValue"
        | "parameters",
      value: string,
    ) => {
      updateJobById(jobId, (job) => ({
        ...job,
        tools: job.tools.map((tool) =>
          tool.id === toolId ? { ...tool, [field]: value } : tool,
        ),
      }));
    },
    [updateJobById],
  );

  const updateToolField = useCallback(
    (
      toolId: string,
      field:
        | "name"
        | "description"
        | "cognigyNodes"
        | "placeholderValue"
        | "parameters",
      value: string,
    ) => {
      if (!selectedJobId) return;
      updateToolFieldByJob(selectedJobId, toolId, field, value);
    },
    [selectedJobId, updateToolFieldByJob],
  );

  const updateToolParameterRowsByJob = useCallback(
    (jobId: string, toolId: string, rows: AgentToolParameterRowDraft[]) => {
      updateJobById(jobId, (job) => ({
        ...job,
        tools: job.tools.map((tool) =>
          tool.id === toolId
            ? {
                ...tool,
                parameterRows: rows.map((row) => ({ ...row })),
                parameters: rows
                  .map((row) => row.name.trim())
                  .filter(Boolean)
                  .join(", "),
              }
            : tool,
        ),
      }));
    },
    [updateJobById],
  );

  const updateToolParameterRows = useCallback(
    (toolId: string, rows: AgentToolParameterRowDraft[]) => {
      if (!selectedJobId) return;
      updateToolParameterRowsByJob(selectedJobId, toolId, rows);
    },
    [selectedJobId, updateToolParameterRowsByJob],
  );

  const isFieldRewriteLoading = useCallback(
    (jobId: string, target: RewriteTarget) =>
      Boolean(rewriteLoadingByField[rewriteLoadingKey(jobId, target)]),
    [rewriteLoadingByField],
  );

  const handleSuggestedPromptSelect = useCallback(
    (prompt: string) => {
      const target = rewritePromptTarget(prompt);
      if (!target || !selectedJobId) return;

      const key = rewriteLoadingKey(selectedJobId, target);
      const existingTimer = rewriteTimersRef.current.get(key);
      if (existingTimer) {
        window.clearTimeout(existingTimer);
      }

      setRewriteLoadingByField((prev) => ({ ...prev, [key]: true }));

      const timerId = window.setTimeout(() => {
        setDraft((prev) => ({
          ...prev,
          jobs: prev.jobs.map((job) =>
            job.id === selectedJobId
              ? { ...job, [target]: buildLocalRewriteCopy(job, target) }
              : job,
          ),
        }));
        setRewriteLoadingByField((prev) => {
          const next = { ...prev };
          delete next[key];
          return next;
        });
        rewriteTimersRef.current.delete(key);
      }, REWRITE_LOADING_MS);

      rewriteTimersRef.current.set(key, timerId);
    },
    [selectedJobId],
  );

  const handleCancel = useCallback(() => {
    if (!hasUnsavedChanges) return;
    clearRewriteTimers();
    setRewriteLoadingByField({});
    setDraft(cloneDraft(savedDraft));
    toast.message("Changes discarded", {
      description: "Unsaved edits were reverted to the last saved draft.",
    });
  }, [clearRewriteTimers, hasUnsavedChanges, savedDraft]);

  const handleSave = useCallback(() => {
    if (!hasUnsavedChanges) return;
    setSavedDraft(cloneDraft(draft));
    toast.success("Draft saved locally", {
      description: "Your edits were kept for this session only.",
    });
  }, [draft, hasUnsavedChanges]);

  const handlePublish = useCallback(() => {
    toast.success("Publish requested", {
      description:
        "This prototype keeps publish behavior local-only (no backend persistence).",
    });
  }, []);

  return (
    <WidgetAIProvider
      persistKey={GLOBAL_AI_ASSISTANT_KEY}
      ootbTypeId={AGENT_PAGE_OOTB_ID}
    >
      <div className="flex flex-1 min-h-0 flex-col">
      <PageHeader className="pb-6">
        <PageHeaderPrimaryRow
          title={(
            <h1 className="text-3xl tracking-tight text-primary-900">
              Intent: {draft.intentTitle}
            </h1>
          )}
          actions={hasUnsavedChanges ? (
            <>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleCancel}
              >
                Cancel
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleSave}
              >
                Save
              </Button>
            </>
          ) : (
            <Button type="button" variant="default" size="sm" onClick={handlePublish}>
              Publish to Cognigy AI
            </Button>
          )}
        />
        <section className="space-y-5">
          <div className="flex flex-wrap items-end gap-4">
            <div className="w-[20rem] max-w-full space-y-2">
              <Label htmlFor="agent-name">AI Agent Name:</Label>
              <Input
                id="agent-name"
                value={draft.agentName}
                onChange={(event) =>
                  setDraft((prev) => ({ ...prev, agentName: event.target.value }))
                }
              />
            </div>
            <div className="w-[20rem] max-w-full space-y-2">
              <Label htmlFor="project-name">Project Name:</Label>
              <Select
                value={draft.projectName}
                onValueChange={(next) =>
                  setDraft((prev) => ({ ...prev, projectName: next }))
                }
              >
                <SelectTrigger id="project-name" className="font-normal">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PROJECT_OPTIONS.map((projectName) => (
                    <SelectItem key={projectName} value={projectName}>
                      {projectName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 pt-0 -mt-1">
            <div className="flex flex-wrap items-center gap-4 text-sm">
              <div className="flex items-center gap-2">
                <span className="font-medium text-foreground">Created By:</span>
                <span className="text-muted-foreground">{draft.createdBy}</span>
              </div>
              <span className="hidden h-4 w-px bg-border md:inline-block" />
              <div className="flex items-center gap-2">
                <span className="font-medium text-foreground">Creation Date:</span>
                <span className="text-muted-foreground">{draft.creationDate}</span>
              </div>
              <span className="hidden h-4 w-px bg-border md:inline-block" />
              <div className="flex items-center gap-2">
                <span className="font-medium text-foreground">Status:</span>
                <Badge
                  variant="outline"
                  className="border-primary-300 bg-white text-primary-900"
                >
                  {draft.status}
                </Badge>
              </div>
            </div>
            <ToggleGroup
              type="single"
              value={viewMode}
              variant="outline"
              onValueChange={(nextValue) => {
                if (nextValue === "textual" || nextValue === "flow") {
                  setViewMode(nextValue);
                }
              }}
            >
              <ToggleGroupItem
                value="textual"
                aria-label="Textual View"
                className="flex-none shrink-0"
              >
                Textual View
              </ToggleGroupItem>
              <ToggleGroupItem
                value="flow"
                aria-label="Flow View"
                className="flex-none shrink-0"
              >
                Flow View
              </ToggleGroupItem>
            </ToggleGroup>
          </div>
        </section>
      </PageHeader>

      <div className="flex-1 min-h-0 overflow-auto bg-white lg:overflow-hidden">
        <div
          className={cn(
            "h-full pt-0 pb-0",
            viewMode === "textual" ? pageRootListScrollGutterClassName : "w-full min-w-0",
          )}
        >
          <PageTransition
            className={cn(
              "h-full min-h-0",
              viewMode === "textual" ? pageMainColumnClassName : "w-full min-w-0",
            )}
          >
            {viewMode === "textual" ? (
              <div className="grid h-full min-h-0 items-start gap-8 lg:grid-cols-[17rem_minmax(0,1fr)]">
                <aside className="space-y-3 self-start pt-0 pb-8 lg:sticky lg:top-0">
                  <h3 className="tracking-tight">Jobs</h3>
                  <Tabs
                    orientation="vertical"
                    value={selectedJobId}
                    onValueChange={setSelectedJobId}
                    className="w-full"
                  >
                    <TabsList
                      className={cn(
                        "w-full items-stretch gap-1 rounded-none bg-transparent p-0",
                        "group-data-[orientation=vertical]/tabs:flex-col",
                      )}
                    >
                      {draft.jobs.map((job) => (
                        <TabsTrigger
                          key={job.id}
                          value={job.id}
                          size="sm"
                          className={cn(
                            "w-full justify-start rounded-xl px-3 py-2 text-left text-foreground",
                            "whitespace-normal leading-snug",
                            "data-[state=inactive]:bg-transparent data-[state=inactive]:text-foreground data-[state=inactive]:hover:bg-primary-25",
                            "data-[state=active]:bg-primary-50 data-[state=active]:text-primary-900 data-[state=active]:shadow-none",
                          )}
                        >
                          {job.name}
                        </TabsTrigger>
                      ))}
                    </TabsList>
                  </Tabs>
                </aside>

                <ScrollArea
                  className="min-w-0 h-full min-h-0"
                  showScrollbarOnHover
                >
                  <div className="space-y-4 pt-0 pb-8 lg:pr-2">
                    <h3 className="tracking-tight">{selectedJob?.name ?? "AI Agent"}</h3>

                    {selectedJob ? (
                      <div className="space-y-4">
                        <Card className="border-border/80 bg-background">
                          <CardHeader className="pb-2">
                            <div className="flex items-center justify-between gap-2">
                              <CardTitle className="flex-1 text-base">
                                Descriptions
                              </CardTitle>
                            </div>
                          </CardHeader>
                          <CardContent className="space-y-4">
                            <div className="space-y-2">
                              <Label htmlFor="job-description">Job Description:</Label>
                              {isFieldRewriteLoading(selectedJob.id, "description") ? (
                                <LoadingTextareaSkeleton />
                              ) : (
                                <Textarea
                                  id="job-description"
                                  className="min-h-20"
                                  value={selectedJob.description}
                                  onChange={(event) =>
                                    updateJobField("description", event.target.value)
                                  }
                                />
                              )}
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="job-instruction">Job Instruction:</Label>
                              {isFieldRewriteLoading(selectedJob.id, "instruction") ? (
                                <LoadingTextareaSkeleton />
                              ) : (
                                <Textarea
                                  id="job-instruction"
                                  className="min-h-20"
                                  value={selectedJob.instruction}
                                  onChange={(event) =>
                                    updateJobField("instruction", event.target.value)
                                  }
                                />
                              )}
                            </div>
                          </CardContent>
                        </Card>

                        {selectedJob.tools.map((tool, index) => (
                          <ToolSection
                            key={tool.id}
                            tool={tool}
                            index={index}
                            onToolFieldChange={updateToolField}
                            onToolParameterRowsChange={updateToolParameterRows}
                          />
                        ))}
                      </div>
                    ) : null}
                  </div>
                </ScrollArea>
              </div>
            ) : (
              <div className="h-full min-h-0 w-full">
                <AutomationOpportunitiesFlowView
                  jobs={draft.jobs}
                  selectedJobId={selectedJobId}
                  onUpdateJobField={updateJobFieldById}
                  onUpdateToolField={updateToolFieldByJob}
                  onUpdateToolParameterRows={updateToolParameterRowsByJob}
                />
              </div>
            )}
          </PageTransition>
        </div>
      </div>
    </div>
    </WidgetAIProvider>
  );
}

function LoadingTextareaSkeleton() {
  return (
    <div className="min-h-20 rounded-md border border-input bg-background px-3 py-2">
      <div className="space-y-2">
        <Skeleton className="h-4 w-[95%]" />
        <Skeleton className="h-4 w-[88%]" />
        <Skeleton className="h-4 w-[72%]" />
      </div>
    </div>
  );
}

function ToolSection({
  tool,
  index,
  onToolFieldChange,
  onToolParameterRowsChange,
}: {
  tool: AgentToolDraft;
  index: number;
  onToolFieldChange: (
    toolId: string,
    field:
      | "name"
      | "description"
      | "cognigyNodes"
      | "placeholderValue"
      | "parameters",
    value: string,
  ) => void;
  onToolParameterRowsChange: (
    toolId: string,
    rows: AgentToolParameterRowDraft[],
  ) => void;
}) {
  const [showParameters, setShowParameters] = useState(false);
  const parameterRows = useMemo(
    () => normalizeToolParameterRows(tool),
    [tool],
  );

  return (
    <Card className="border-border/80 bg-background">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between gap-2">
          <CardTitle className="flex-1 text-base">
            Tools {index + 1}
          </CardTitle>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor={`${tool.id}-name`}>Tool Name:</Label>
          <Input
            id={`${tool.id}-name`}
            value={tool.name}
            onChange={(event) => onToolFieldChange(tool.id, "name", event.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor={`${tool.id}-description`}>Tool Description:</Label>
          <Textarea
            id={`${tool.id}-description`}
            className="min-h-20"
            value={tool.description}
            onChange={(event) =>
              onToolFieldChange(tool.id, "description", event.target.value)
            }
          />
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor={`${tool.id}-nodes`}>Cognigy Nodes:</Label>
            <Input
              id={`${tool.id}-nodes`}
              value={tool.cognigyNodes}
              onChange={(event) =>
                onToolFieldChange(tool.id, "cognigyNodes", event.target.value)
              }
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor={`${tool.id}-placeholder`}>Place Holder Value:</Label>
            <Input
              id={`${tool.id}-placeholder`}
              value={tool.placeholderValue}
              onChange={(event) =>
                onToolFieldChange(tool.id, "placeholderValue", event.target.value)
              }
            />
          </div>
        </div>
        <div className="space-y-2">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setShowParameters((prev) => !prev)}
            className="px-0"
          >
            <ChevronDown
              className={`mr-2 h-4 w-4 transition-transform ${showParameters ? "rotate-180" : ""}`}
            />
            {showParameters ? "Hide" : "View"} Parameters ({parameterRows.length})
          </Button>
        </div>
        {showParameters ? (
          <div className="space-y-2">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[180px] min-w-[180px] max-w-[180px]"><span>Name</span></TableHead>
                  <TableHead className="w-[72px] min-w-[72px] max-w-[72px]"><span>Type</span></TableHead>
                  <TableHead><span>Description</span></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {parameterRows.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell className="w-[180px] min-w-[180px] max-w-[180px]">
                      <Input
                        value={row.name}
                        onChange={(event) =>
                          onToolParameterRowsChange(
                            tool.id,
                            parameterRows.map((candidate) =>
                              candidate.id === row.id
                                ? { ...candidate, name: event.target.value }
                                : candidate,
                            ),
                          )
                        }
                      />
                    </TableCell>
                    <TableCell className="w-[72px] min-w-[72px] max-w-[72px]">
                      <span className="text-sm text-foreground">{row.dataType}</span>
                    </TableCell>
                    <TableCell>
                      <Input
                        value={row.description}
                        onChange={(event) =>
                          onToolParameterRowsChange(
                            tool.id,
                            parameterRows.map((candidate) =>
                              candidate.id === row.id
                                ? { ...candidate, description: event.target.value }
                                : candidate,
                            ),
                          )
                        }
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
