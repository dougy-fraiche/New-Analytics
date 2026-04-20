"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Bot,
  GitBranch,
  Pencil,
  Scan,
  Wrench,
  X,
  ZoomIn,
  ZoomOut,
} from "lucide-react";
import ReactFlow, {
  Background,
  Handle,
  MarkerType,
  Position,
  ReactFlowProvider,
  useOnViewportChange,
  useReactFlow,
  type Edge,
  type Node,
  type NodeProps,
  type NodeTypes,
} from "reactflow";
import "reactflow/dist/style.css";

import type {
  AgentJobDraft,
  AgentToolParameterRowDraft,
} from "../data/automation-opportunities-agent-page";
import { normalizeToolParameterRows } from "../data/automation-opportunities-agent-page";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Textarea } from "./ui/textarea";
import { cn } from "./ui/utils";

type JobField = "description" | "instruction";
type ToolField = "name" | "description" | "cognigyNodes" | "placeholderValue" | "parameters";
type ParameterRowField = "name" | "dataType" | "description";

type AgentSlot = "left" | "center" | "right";
type NodeKind = "router" | "agent" | "tool";

type FlowCardNodeData = {
  nodeId: string;
  kind: NodeKind;
  title: string;
  subtitle: string;
  selected: boolean;
  expanded: boolean;
  description?: string;
  instruction?: string;
  parameterRows?: AgentToolParameterRowDraft[];
  onSelect: () => void;
  onExpand: () => void;
  onCollapse: () => void;
  onCancel: () => void;
  onSave: () => void;
  onNameChange?: (value: string) => void;
  onDescriptionChange?: (value: string) => void;
  onInstructionChange?: (value: string) => void;
  onParameterRowChange?: (
    rowId: string,
    field: ParameterRowField,
    value: string,
  ) => void;
};

type FlowCardNode = Node<FlowCardNodeData, "flowCard">;

type ActiveEditor =
  | {
      kind: "router" | "agent";
      nodeId: string;
      jobId: string;
      description: string;
      instruction: string;
    }
  | {
      kind: "tool";
      nodeId: string;
      jobId: string;
      toolId: string;
      name: string;
      description: string;
      parameterRows: AgentToolParameterRowDraft[];
    };

type AutomationOpportunitiesFlowViewProps = {
  jobs: AgentJobDraft[];
  selectedJobId: string;
  onUpdateJobField: (jobId: string, field: JobField, value: string) => void;
  onUpdateToolField: (
    jobId: string,
    toolId: string,
    field: ToolField,
    value: string,
  ) => void;
  onUpdateToolParameterRows: (
    jobId: string,
    toolId: string,
    rows: AgentToolParameterRowDraft[],
  ) => void;
};

function selectAgentSlots(
  jobs: AgentJobDraft[],
  selectedJobId: string,
): Array<{ slot: AgentSlot; job: AgentJobDraft }> {
  const selectedJob = jobs.find((job) => job.id === selectedJobId) ?? jobs[0];
  if (!selectedJob) return [];

  const otherJobs = jobs.filter((job) => job.id !== selectedJob.id);
  const left = otherJobs[0] ?? selectedJob;
  const right = otherJobs[1] ?? otherJobs[0] ?? selectedJob;

  return [
    { slot: "left", job: left },
    { slot: "center", job: selectedJob },
    { slot: "right", job: right },
  ];
}

function edgeTemplate(id: string, source: string, target: string): Edge {
  return {
    id,
    source,
    target,
    type: "smoothstep",
    markerEnd: {
      type: MarkerType.ArrowClosed,
      width: 16,
      height: 16,
      color: "#6E56CF",
    },
    style: {
      stroke: "#6E56CF",
      strokeWidth: 2,
    },
  };
}

const nodeTypes: NodeTypes = {
  flowCard: FlowCardNodeRenderer,
};

export function AutomationOpportunitiesFlowView({
  jobs,
  selectedJobId,
  onUpdateJobField,
  onUpdateToolField,
  onUpdateToolParameterRows,
}: AutomationOpportunitiesFlowViewProps) {
  const selectedJob = useMemo(
    () => jobs.find((job) => job.id === selectedJobId) ?? jobs[0],
    [jobs, selectedJobId],
  );

  return (
    <div className="h-full min-h-[620px] w-full rounded-xl border border-border/80 bg-background">
      <ReactFlowProvider>
        <FlowCanvas
          jobs={jobs}
          selectedJob={selectedJob}
          onUpdateJobField={onUpdateJobField}
          onUpdateToolField={onUpdateToolField}
          onUpdateToolParameterRows={onUpdateToolParameterRows}
        />
      </ReactFlowProvider>
    </div>
  );
}

function FlowCanvas({
  jobs,
  selectedJob,
  onUpdateJobField,
  onUpdateToolField,
  onUpdateToolParameterRows,
}: {
  jobs: AgentJobDraft[];
  selectedJob: AgentJobDraft | undefined;
  onUpdateJobField: (jobId: string, field: JobField, value: string) => void;
  onUpdateToolField: (
    jobId: string,
    toolId: string,
    field: ToolField,
    value: string,
  ) => void;
  onUpdateToolParameterRows: (
    jobId: string,
    toolId: string,
    rows: AgentToolParameterRowDraft[],
  ) => void;
}) {
  const [selectedNodeId, setSelectedNodeId] = useState<string>("agent-left");
  const [activeEditor, setActiveEditor] = useState<ActiveEditor | null>(null);
  const [zoomPercent, setZoomPercent] = useState(100);
  const { fitView, zoomIn, zoomOut } = useReactFlow();

  useOnViewportChange({
    onChange: (viewport) => {
      setZoomPercent(Math.round(viewport.zoom * 100));
    },
  });

  useEffect(() => {
    setSelectedNodeId("agent-left");
    setActiveEditor(null);
    requestAnimationFrame(() => {
      fitView({ duration: 250, padding: 0.24 });
    });
  }, [selectedJob?.id, fitView]);

  const handleEditorCancel = useCallback(() => {
    setActiveEditor(null);
  }, []);

  const handleEditorSave = useCallback(() => {
    if (!activeEditor) return;

    if (activeEditor.kind === "tool") {
      onUpdateToolField(activeEditor.jobId, activeEditor.toolId, "name", activeEditor.name);
      onUpdateToolField(
        activeEditor.jobId,
        activeEditor.toolId,
        "description",
        activeEditor.description,
      );
      onUpdateToolField(
        activeEditor.jobId,
        activeEditor.toolId,
        "parameters",
        activeEditor.parameterRows
          .map((row) => row.name.trim())
          .filter(Boolean)
          .join(", "),
      );
      onUpdateToolParameterRows(
        activeEditor.jobId,
        activeEditor.toolId,
        activeEditor.parameterRows,
      );
      setActiveEditor(null);
      return;
    }

    onUpdateJobField(activeEditor.jobId, "description", activeEditor.description);
    onUpdateJobField(activeEditor.jobId, "instruction", activeEditor.instruction);
    setActiveEditor(null);
  }, [activeEditor, onUpdateJobField, onUpdateToolField, onUpdateToolParameterRows]);

  const graph = useMemo(() => {
    if (!selectedJob) {
      return { nodes: [] as FlowCardNode[], edges: [] as Edge[] };
    }

    const slotJobs = selectAgentSlots(jobs, selectedJob.id);
    const routerNodeId = "router";

    const nodes: FlowCardNode[] = [
      {
        id: routerNodeId,
        type: "flowCard",
        position: { x: 520, y: 24 },
        draggable: false,
        data: {
          nodeId: routerNodeId,
          kind: "router",
          title: "Intent Router",
          subtitle: selectedJob.name,
          selected: selectedNodeId === routerNodeId,
          expanded: activeEditor?.nodeId === routerNodeId,
          description:
            activeEditor?.kind === "router" && activeEditor.nodeId === routerNodeId
              ? activeEditor.description
              : selectedJob.description,
          instruction:
            activeEditor?.kind === "router" && activeEditor.nodeId === routerNodeId
              ? activeEditor.instruction
              : selectedJob.instruction,
          onSelect: () => setSelectedNodeId(routerNodeId),
          onExpand: () => {
            setSelectedNodeId(routerNodeId);
            setActiveEditor({
              kind: "router",
              nodeId: routerNodeId,
              jobId: selectedJob.id,
              description: selectedJob.description,
              instruction: selectedJob.instruction,
            });
          },
          onCollapse: () => setActiveEditor(null),
          onCancel: handleEditorCancel,
          onSave: handleEditorSave,
          onDescriptionChange: (value) =>
            setActiveEditor((prev) =>
              prev?.kind === "router" && prev.nodeId === routerNodeId
                ? { ...prev, description: value }
                : prev,
            ),
          onInstructionChange: (value) =>
            setActiveEditor((prev) =>
              prev?.kind === "router" && prev.nodeId === routerNodeId
                ? { ...prev, instruction: value }
                : prev,
            ),
        },
      },
    ];

    const agentXBySlot: Record<AgentSlot, number> = {
      left: 180,
      center: 520,
      right: 860,
    };

    for (const { slot, job } of slotJobs) {
      const nodeId = `agent-${slot}`;
      nodes.push({
        id: nodeId,
        type: "flowCard",
        position: { x: agentXBySlot[slot], y: 240 },
        draggable: false,
        data: {
          nodeId,
          kind: "agent",
          title: job.name,
          subtitle: "Agent",
          selected: selectedNodeId === nodeId,
          expanded: activeEditor?.nodeId === nodeId,
          description:
            activeEditor?.kind === "agent" && activeEditor.nodeId === nodeId
              ? activeEditor.description
              : job.description,
          instruction:
            activeEditor?.kind === "agent" && activeEditor.nodeId === nodeId
              ? activeEditor.instruction
              : job.instruction,
          onSelect: () => setSelectedNodeId(nodeId),
          onExpand: () => {
            setSelectedNodeId(nodeId);
            setActiveEditor({
              kind: "agent",
              nodeId,
              jobId: job.id,
              description: job.description,
              instruction: job.instruction,
            });
          },
          onCollapse: () => setActiveEditor(null),
          onCancel: handleEditorCancel,
          onSave: handleEditorSave,
          onDescriptionChange: (value) =>
            setActiveEditor((prev) =>
              prev?.kind === "agent" && prev.nodeId === nodeId
                ? { ...prev, description: value }
                : prev,
            ),
          onInstructionChange: (value) =>
            setActiveEditor((prev) =>
              prev?.kind === "agent" && prev.nodeId === nodeId
                ? { ...prev, instruction: value }
                : prev,
            ),
        },
      });
    }

    const tools = selectedJob.tools;
    const toolSpacing = 270;
    const startX = 520 - ((tools.length - 1) * toolSpacing) / 2;
    for (const [index, tool] of tools.entries()) {
      const nodeId = `tool-${tool.id}`;
      const resolvedRows =
        activeEditor?.kind === "tool" && activeEditor.nodeId === nodeId
          ? activeEditor.parameterRows
          : normalizeToolParameterRows(tool);
      nodes.push({
        id: nodeId,
        type: "flowCard",
        position: { x: startX + index * toolSpacing, y: 480 },
        draggable: false,
        data: {
          nodeId,
          kind: "tool",
          title:
            activeEditor?.kind === "tool" && activeEditor.nodeId === nodeId
              ? activeEditor.name
              : tool.name,
          subtitle: "Tool",
          selected: selectedNodeId === nodeId,
          expanded: activeEditor?.nodeId === nodeId,
          description:
            activeEditor?.kind === "tool" && activeEditor.nodeId === nodeId
              ? activeEditor.description
              : tool.description,
          parameterRows: resolvedRows,
          onSelect: () => setSelectedNodeId(nodeId),
          onExpand: () => {
            setSelectedNodeId(nodeId);
            setActiveEditor({
              kind: "tool",
              nodeId,
              jobId: selectedJob.id,
              toolId: tool.id,
              name: tool.name,
              description: tool.description,
              parameterRows: normalizeToolParameterRows(tool).map((row) => ({ ...row })),
            });
          },
          onCollapse: () => setActiveEditor(null),
          onCancel: handleEditorCancel,
          onSave: handleEditorSave,
          onNameChange: (value) =>
            setActiveEditor((prev) =>
              prev?.kind === "tool" && prev.nodeId === nodeId
                ? { ...prev, name: value }
                : prev,
            ),
          onDescriptionChange: (value) =>
            setActiveEditor((prev) =>
              prev?.kind === "tool" && prev.nodeId === nodeId
                ? { ...prev, description: value }
                : prev,
            ),
          onParameterRowChange: (rowId, field, value) =>
            setActiveEditor((prev) => {
              if (!(prev?.kind === "tool" && prev.nodeId === nodeId)) return prev;
              return {
                ...prev,
                parameterRows: prev.parameterRows.map((row) =>
                  row.id === rowId ? { ...row, [field]: value } : row,
                ),
              };
            }),
        },
      });
    }

    const edges: Edge[] = [];
    for (const { slot } of slotJobs) {
      edges.push(edgeTemplate(`router-to-${slot}`, routerNodeId, `agent-${slot}`));
    }
    for (const tool of tools) {
      edges.push(
        edgeTemplate(
          `agent-center-to-tool-${tool.id}`,
          "agent-center",
          `tool-${tool.id}`,
        ),
      );
    }

    return { nodes, edges };
  }, [
    activeEditor,
    handleEditorCancel,
    handleEditorSave,
    jobs,
    selectedJob,
    selectedNodeId,
  ]);

  return (
    <div className="relative h-full w-full">
      <ReactFlow
        nodes={graph.nodes}
        edges={graph.edges}
        nodeTypes={nodeTypes}
        fitView
        minZoom={0.35}
        maxZoom={1.8}
        nodesConnectable={false}
        nodesDraggable={false}
        elementsSelectable={false}
        panOnDrag
        panOnScroll={false}
        zoomOnDoubleClick={false}
        proOptions={{ hideAttribution: true }}
      >
        <Background color="#E5E7EB" gap={24} size={1} />
      </ReactFlow>

      <div className="pointer-events-none absolute right-4 bottom-4 z-10">
        <div className="pointer-events-auto flex items-center gap-1 rounded-lg border border-border/80 bg-white/95 p-1 shadow-sm backdrop-blur">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="size-8"
            onClick={() => zoomOut({ duration: 140 })}
            aria-label="Zoom out"
          >
            <ZoomOut className="size-4" />
          </Button>
          <span className="min-w-14 px-1 text-center text-xs font-medium text-neutral-700">
            {zoomPercent}%
          </span>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="size-8"
            onClick={() => zoomIn({ duration: 140 })}
            aria-label="Zoom in"
          >
            <ZoomIn className="size-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="size-8"
            onClick={() => fitView({ duration: 240, padding: 0.24 })}
            aria-label="Fit view"
          >
            <Scan className="size-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}

function FlowCardNodeRenderer({ data }: NodeProps<FlowCardNodeData>) {
  const icon =
    data.kind === "router" ? (
      <GitBranch className="size-4 text-primary-700" />
    ) : data.kind === "agent" ? (
      <Bot className="size-4 text-primary-700" />
    ) : (
      <Wrench className="size-4 text-primary-700" />
    );

  const widthClass = data.expanded
    ? data.kind === "tool"
      ? "w-[34rem]"
      : "w-[30rem]"
    : "w-[16rem]";

  return (
    <div
      className={cn(
        "rounded-xl border bg-white shadow-sm transition-all",
        "nodrag nopan",
        widthClass,
        data.selected ? "border-primary-500 ring-2 ring-primary-100" : "border-border/80",
      )}
      onClick={data.onSelect}
      role="button"
      tabIndex={0}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          data.onSelect();
        }
      }}
    >
      {data.kind !== "router" ? (
        <Handle
          type="target"
          position={Position.Top}
          style={{ width: 10, height: 10, borderColor: "#6E56CF", background: "#6E56CF" }}
        />
      ) : null}
      {data.kind !== "tool" ? (
        <Handle
          type="source"
          position={Position.Bottom}
          style={{ width: 10, height: 10, borderColor: "#6E56CF", background: "#6E56CF" }}
        />
      ) : null}

      <div className="flex items-start justify-between gap-3 p-3">
        <div className="min-w-0 space-y-1">
          <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-neutral-500">
            {icon}
            <span>{data.kind}</span>
          </div>
          <p className="text-sm font-medium text-foreground">{data.title}</p>
          <p className="line-clamp-2 text-xs text-neutral-600">{data.subtitle}</p>
        </div>
        <button
          type="button"
          className="rounded-md p-1 text-neutral-500 transition hover:bg-primary-25 hover:text-primary-800"
          onClick={(event) => {
            event.stopPropagation();
            if (data.expanded) {
              data.onCollapse();
            } else {
              data.onExpand();
            }
          }}
          aria-label={data.expanded ? "Close editor" : "Edit node"}
        >
          {data.expanded ? <X className="size-4" /> : <Pencil className="size-4" />}
        </button>
      </div>

      {data.expanded ? (
        <div className="space-y-3 border-t border-border/70 p-3">
          {data.kind === "tool" ? (
            <>
              <div className="space-y-1">
                <label className="text-xs font-medium text-neutral-600">Tool Name</label>
                <Input
                  value={data.title}
                  onChange={(event) => data.onNameChange?.(event.target.value)}
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-neutral-600">Description</label>
                <Textarea
                  className="min-h-20"
                  value={data.description ?? ""}
                  onChange={(event) => data.onDescriptionChange?.(event.target.value)}
                />
              </div>
              <div className="space-y-2">
                <p className="text-xs font-medium text-neutral-600">Parameters</p>
                <div className="rounded-md border border-border/70">
                  <div className="grid grid-cols-[1.1fr_0.7fr_1.4fr] gap-2 border-b border-border/70 bg-neutral-25 px-2 py-1 text-[11px] font-semibold uppercase tracking-wide text-neutral-500">
                    <span>Name</span>
                    <span>Type</span>
                    <span>Description</span>
                  </div>
                  <div className="space-y-2 p-2">
                    {data.parameterRows?.map((row) => (
                      <div
                        key={row.id}
                        className="grid grid-cols-[1.1fr_0.7fr_1.4fr] items-center gap-2"
                      >
                        <Input
                          value={row.name}
                          onChange={(event) =>
                            data.onParameterRowChange?.(row.id, "name", event.target.value)
                          }
                        />
                        <Input
                          value={row.dataType}
                          onChange={(event) =>
                            data.onParameterRowChange?.(
                              row.id,
                              "dataType",
                              event.target.value,
                            )
                          }
                        />
                        <Input
                          value={row.description}
                          onChange={(event) =>
                            data.onParameterRowChange?.(
                              row.id,
                              "description",
                              event.target.value,
                            )
                          }
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </>
          ) : (
            <>
              <div className="space-y-1">
                <label className="text-xs font-medium text-neutral-600">Description</label>
                <Textarea
                  className="min-h-20"
                  value={data.description ?? ""}
                  onChange={(event) => data.onDescriptionChange?.(event.target.value)}
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-neutral-600">Instruction</label>
                <Textarea
                  className="min-h-20"
                  value={data.instruction ?? ""}
                  onChange={(event) => data.onInstructionChange?.(event.target.value)}
                />
              </div>
            </>
          )}

          <div className="flex justify-end gap-2 border-t border-border/70 pt-2">
            <Button type="button" variant="outline" size="sm" onClick={data.onCancel}>
              Cancel
            </Button>
            <Button type="button" size="sm" onClick={data.onSave}>
              Save
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
