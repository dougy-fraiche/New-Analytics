"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Bot,
  GitBranch,
  Minus,
  Pencil,
  Plus,
  Scan,
  Wrench,
  X,
} from "lucide-react";
import ReactFlow, {
  Background,
  Handle,
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
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Textarea } from "./ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./ui/table";
import { Tooltip, TooltipContent, TooltipTrigger } from "./ui/tooltip";
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
  visualMode?: "avatar" | "icon";
  avatarSrc?: string;
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

const ROUTER_AVATAR_SRC = "/flow-avatars/router-main.png";
const AGENT_AVATAR_POOL = [
  "/flow-avatars/avatar-agent-1.png",
  "/flow-avatars/avatar-agent-2.png",
  "/flow-avatars/avatar-agent-3.png",
  "/flow-avatars/avatar-agent-4.png",
] as const;

function buildRoundRobinAvatarMap(nodeIds: string[]): Record<string, string> {
  const sortedIds = [...nodeIds].sort();
  return Object.fromEntries(
    sortedIds.map((nodeId, index) => [
      nodeId,
      AGENT_AVATAR_POOL[index % AGENT_AVATAR_POOL.length],
    ]),
  );
}

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
    type: "step",
    style: {
      stroke: "var(--color-neutral-400)",
      strokeWidth: 1,
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
    <div className="h-full min-h-0 w-full bg-background">
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
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [activeEditor, setActiveEditor] = useState<ActiveEditor | null>(null);
  const [zoomPercent, setZoomPercent] = useState(100);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const isViewportResettingRef = useRef(false);
  const { fitView, zoomIn, zoomOut, zoomTo, getViewport } = useReactFlow();

  const recenterFlow = useCallback(
    (options?: { duration?: number; preserveZoom?: boolean }) => {
      const duration = options?.duration ?? 0;
      const preserveZoom = options?.preserveZoom ?? true;
      const targetZoom = preserveZoom ? getViewport().zoom : 1;
      const zoomDuration = preserveZoom ? Math.min(duration, 140) : duration;

      return Promise.resolve(fitView({ duration, padding: 0.24 })).then(() =>
        zoomTo(targetZoom, { duration: zoomDuration }),
      );
    },
    [fitView, getViewport, zoomTo],
  );

  useOnViewportChange({
    onChange: (viewport) => {
      setZoomPercent(Math.round(viewport.zoom * 100));
    },
  });

  const resetViewportToDefault = useCallback(
    (duration = 250) => {
      isViewportResettingRef.current = true;
      return Promise.resolve(recenterFlow({ duration, preserveZoom: false })).finally(() => {
        window.setTimeout(() => {
          isViewportResettingRef.current = false;
        }, 0);
      });
    },
    [recenterFlow],
  );

  useEffect(() => {
    setSelectedNodeId(null);
    setActiveEditor(null);
    requestAnimationFrame(() => {
      void resetViewportToDefault(0);
    });
  }, [resetViewportToDefault, selectedJob?.id]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let frameId = 0;
    const observer = new ResizeObserver(() => {
      window.cancelAnimationFrame(frameId);
      frameId = window.requestAnimationFrame(() => {
        if (isViewportResettingRef.current) return;
        void recenterFlow({ preserveZoom: true });
      });
    });

    observer.observe(container);
    return () => {
      window.cancelAnimationFrame(frameId);
      observer.disconnect();
    };
  }, [recenterFlow]);

  useEffect(() => {
    requestAnimationFrame(() => {
      void recenterFlow({ duration: 180, preserveZoom: true });
    });
  }, [activeEditor?.nodeId, recenterFlow]);

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

    const EDITOR_NODE_ID = activeEditor?.nodeId ?? null;
    const BASE_CENTER_X = 720;
    const ROW_GAP = 64; // 4rem
    const NODE_GAP = 16; // 1rem
    const ROUTER_COLLAPSED_WIDTH = 400;
    const ROUTER_EXPANDED_WIDTH = 512;
    const ROUTER_COLLAPSED_HEIGHT = 128;
    const ROUTER_EXPANDED_HEIGHT = 416;
    const AGENT_COLLAPSED_WIDTH = 300;
    const AGENT_EXPANDED_WIDTH = 512;
    const AGENT_COLLAPSED_HEIGHT = 148;
    const AGENT_EXPANDED_HEIGHT = 416;
    const TOOL_COLLAPSED_WIDTH = 300;
    const TOOL_EXPANDED_WIDTH = 544;
    const TOP_ROW_Y = 40;
    const ROUTER_WIDTH =
      EDITOR_NODE_ID === "router" ? ROUTER_EXPANDED_WIDTH : ROUTER_COLLAPSED_WIDTH;
    const ROUTER_HEIGHT =
      EDITOR_NODE_ID === "router" ? ROUTER_EXPANDED_HEIGHT : ROUTER_COLLAPSED_HEIGHT;
    const AGENT_ROW_Y = TOP_ROW_Y + ROUTER_HEIGHT + ROW_GAP;
    const AGENT_ROW_HEIGHT =
      activeEditor?.kind === "agent" ? AGENT_EXPANDED_HEIGHT : AGENT_COLLAPSED_HEIGHT;
    const TOOL_ROW_Y = AGENT_ROW_Y + AGENT_ROW_HEIGHT + ROW_GAP;

    const layoutRow = (widths: number[]): number[] => {
      const totalWidth =
        widths.reduce((sum, width) => sum + width, 0) + Math.max(widths.length - 1, 0) * NODE_GAP;
      let currentX = BASE_CENTER_X - totalWidth / 2;
      return widths.map((width) => {
        const x = currentX;
        currentX += width + NODE_GAP;
        return x;
      });
    };

    const slotJobs = selectAgentSlots(jobs, selectedJob.id);
    const routerNodeId = "router";
    const agentAvatarMap = buildRoundRobinAvatarMap(
      slotJobs.map(({ slot }) => `agent-${slot}`),
    );

    const nodes: FlowCardNode[] = [
      {
        id: routerNodeId,
        type: "flowCard",
        position: { x: BASE_CENTER_X - ROUTER_WIDTH / 2, y: TOP_ROW_Y },
        draggable: false,
        sourcePosition: Position.Bottom,
        data: {
          nodeId: routerNodeId,
          kind: "router",
          title: "Intent Router",
          subtitle: selectedJob.name,
          selected: selectedNodeId === routerNodeId,
          expanded: activeEditor?.nodeId === routerNodeId,
          visualMode: "avatar",
          avatarSrc: ROUTER_AVATAR_SRC,
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

    const agentWidthsBySlot: Record<AgentSlot, number> = {
      left: EDITOR_NODE_ID === "agent-left" ? AGENT_EXPANDED_WIDTH : AGENT_COLLAPSED_WIDTH,
      center: EDITOR_NODE_ID === "agent-center" ? AGENT_EXPANDED_WIDTH : AGENT_COLLAPSED_WIDTH,
      right: EDITOR_NODE_ID === "agent-right" ? AGENT_EXPANDED_WIDTH : AGENT_COLLAPSED_WIDTH,
    };
    const [agentLeftX, agentCenterX, agentRightX] = layoutRow([
      agentWidthsBySlot.left,
      agentWidthsBySlot.center,
      agentWidthsBySlot.right,
    ]);
    const agentXBySlot: Record<AgentSlot, number> = {
      left: agentLeftX,
      center: agentCenterX,
      right: agentRightX,
    };

    for (const { slot, job } of slotJobs) {
      const nodeId = `agent-${slot}`;
      nodes.push({
        id: nodeId,
        type: "flowCard",
        position: { x: agentXBySlot[slot], y: AGENT_ROW_Y },
        draggable: false,
        sourcePosition: Position.Bottom,
        targetPosition: Position.Top,
        data: {
          nodeId,
          kind: "agent",
          title: job.name,
          subtitle: "Agent",
          selected: selectedNodeId === nodeId,
          expanded: activeEditor?.nodeId === nodeId,
          visualMode: "avatar",
          avatarSrc: agentAvatarMap[nodeId],
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
    const toolWidths = tools.map((tool) =>
      EDITOR_NODE_ID === `tool-${tool.id}` ? TOOL_EXPANDED_WIDTH : TOOL_COLLAPSED_WIDTH,
    );
    const toolXs = layoutRow(toolWidths);
    for (const [index, tool] of tools.entries()) {
      const nodeId = `tool-${tool.id}`;
      const resolvedRows =
        activeEditor?.kind === "tool" && activeEditor.nodeId === nodeId
          ? activeEditor.parameterRows
          : normalizeToolParameterRows(tool);
      nodes.push({
        id: nodeId,
        type: "flowCard",
        position: { x: toolXs[index] ?? BASE_CENTER_X - TOOL_COLLAPSED_WIDTH / 2, y: TOOL_ROW_Y },
        draggable: false,
        targetPosition: Position.Top,
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
          visualMode: "icon",
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
    <div
      ref={containerRef}
      className="relative h-full w-full [&_.react-flow__pane]:cursor-grab [&_.react-flow__pane:active]:cursor-grabbing"
    >
      <ReactFlow
        nodes={graph.nodes}
        edges={graph.edges}
        nodeTypes={nodeTypes}
        onNodeClick={(_, node) => {
          setSelectedNodeId(node.id);
        }}
        noPanClassName="react-flow__node"
        minZoom={0.35}
        maxZoom={2}
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

      <div className="pointer-events-none absolute top-4 right-4 z-10">
        <div className="pointer-events-auto flex items-center gap-0 rounded-lg border border-border/80 bg-white/95 p-2 shadow-sm backdrop-blur">
          <span className="mr-2 px-2 text-sm font-medium text-neutral-700">Drag to pan</span>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="size-8"
            onClick={() => zoomIn({ duration: 140 })}
            aria-label="Zoom in"
          >
            <Plus className="size-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="size-8"
            onClick={() => zoomOut({ duration: 140 })}
            aria-label="Zoom out"
          >
            <Minus className="size-4" />
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
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-8 min-w-16 px-2 text-sm font-medium text-neutral-800"
            onClick={() => zoomTo(1, { duration: 180 })}
            aria-label="Reset zoom to 100%"
          >
            {zoomPercent}%
          </Button>
        </div>
      </div>
    </div>
  );
}

function defaultVisualMode(kind: NodeKind): "avatar" | "icon" {
  return kind === "tool" ? "icon" : "avatar";
}

function badgeLabel(kind: NodeKind): "Agent" | "Tool" {
  return kind === "tool" ? "Tool" : "Agent";
}

type NodeCardConfig = {
  collapsedSizeClass: string;
  expandedSizeClass: string;
  mediaSizeClass: string;
  titleElement: "h3" | "h4";
  titleClassName: string;
  badgeVariant: "default" | "secondary" | "outline";
  badgeClassName: string;
  defaultBorderClass: string;
};

const NODE_CARD_CONFIG: Record<NodeKind, NodeCardConfig> = {
  router: {
    collapsedSizeClass: "w-[400px] h-[128px]",
    expandedSizeClass: "w-[32rem]",
    mediaSizeClass: "size-[56px]",
    titleElement: "h4",
    titleClassName: "truncate text-lg font-medium leading-snug text-foreground",
    badgeVariant: "default",
    badgeClassName: "mt-0 bg-primary-500 text-white",
    defaultBorderClass: "border-primary-500",
  },
  agent: {
    collapsedSizeClass: "w-[300px] h-[148px]",
    expandedSizeClass: "w-[32rem]",
    mediaSizeClass: "size-[48px]",
    titleElement: "h3",
    titleClassName: "truncate text-base font-medium leading-snug text-foreground",
    badgeVariant: "secondary",
    badgeClassName: "mt-0 bg-primary-100 text-primary-700",
    defaultBorderClass: "border-primary-200",
  },
  tool: {
    collapsedSizeClass: "w-[300px] h-[148px]",
    expandedSizeClass: "w-[34rem]",
    mediaSizeClass: "size-[48px]",
    titleElement: "h3",
    titleClassName: "truncate text-base font-medium leading-snug text-foreground",
    badgeVariant: "outline",
    badgeClassName: "mt-0 border-primary-300 bg-transparent text-primary-700",
    defaultBorderClass: "border-primary-200",
  },
};

function titleInitials(title: string): string {
  const words = title
    .trim()
    .split(/[\s_-]+/g)
    .filter(Boolean);
  if (!words.length) return "AI";
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase() || "AI";
  return `${words[0]?.[0] ?? ""}${words[1]?.[0] ?? ""}`.toUpperCase();
}

function nodeIcon(kind: NodeKind) {
  if (kind === "router") return <GitBranch className="size-5 text-primary-700" />;
  if (kind === "agent") return <Bot className="size-5 text-primary-700" />;
  return <Wrench className="size-5 text-primary-700" />;
}

function FlowCardNodeRenderer({ data }: NodeProps<FlowCardNodeData>) {
  const mode = data.visualMode ?? defaultVisualMode(data.kind);
  const config = NODE_CARD_CONFIG[data.kind];
  const badge = badgeLabel(data.kind);
  const icon = nodeIcon(data.kind);
  const TitleTag = config.titleElement;
  const sizeClass = data.expanded ? config.expandedSizeClass : config.collapsedSizeClass;
  const stateClass = data.expanded
    ? cn(config.defaultBorderClass, "ring-2 ring-primary-300")
    : data.selected
      ? "border-primary-500 ring-2 ring-primary-500"
      : config.defaultBorderClass;

  return (
    <div
      className={cn(
        "relative cursor-pointer overflow-hidden rounded-md border border-b-[3px] bg-white transition-all",
        "nodrag nopan",
        sizeClass,
        stateClass,
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
          style={{
            width: 1,
            height: 1,
            opacity: 0,
            border: "none",
            background: "transparent",
            pointerEvents: "none",
          }}
          isConnectable={false}
        />
      ) : null}
      {data.kind !== "tool" ? (
        <Handle
          type="source"
          position={Position.Bottom}
          style={{
            width: 1,
            height: 1,
            opacity: 0,
            border: "none",
            background: "transparent",
            pointerEvents: "none",
          }}
          isConnectable={false}
        />
      ) : null}

      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            type="button"
            variant="ghost"
            size="icon-xs"
            className="absolute top-3 right-3"
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
            {data.expanded ? <X /> : <Pencil />}
          </Button>
        </TooltipTrigger>
        <TooltipContent side="bottom" sideOffset={6}>
          {data.expanded ? "Close" : "Edit"}
        </TooltipContent>
      </Tooltip>

      <div className="p-4">
        <div className="flex gap-2 pr-10">
          <div className="shrink-0">
            {mode === "avatar" ? (
              <Avatar className={cn(config.mediaSizeClass, "rounded-md bg-primary-25")}>
                <AvatarImage src={data.avatarSrc} alt={data.title} className="object-contain" />
                <AvatarFallback className="rounded-md bg-primary-25 text-sm font-semibold text-primary-700">
                  {titleInitials(data.title)}
                </AvatarFallback>
              </Avatar>
            ) : (
              <div
                className={cn(
                  "flex items-center justify-center rounded-md bg-primary-25",
                  config.mediaSizeClass,
                )}
              >
                {icon}
              </div>
            )}
          </div>

          <div className="min-w-0 flex-1">
            <TitleTag className={config.titleClassName}>
              {data.title}
            </TitleTag>
            <Badge
              variant={config.badgeVariant}
              className={config.badgeClassName}
            >
              {badge}
            </Badge>
          </div>
        </div>
        <p
          className={cn(
            "mt-2 text-xs leading-relaxed text-neutral-700",
            data.expanded ? "" : "line-clamp-3",
          )}
        >
          {data.description ?? data.subtitle}
        </p>
      </div>

      {data.expanded ? (
        <div className="border-t border-border/70 px-4 pt-4 pb-0">
          {data.kind === "tool" ? (
            <div className="space-y-2">
              <div className="space-y-2">
                <label className="text-xs font-medium text-neutral-600">Tool Name</label>
                <Input
                  value={data.title}
                  onChange={(event) => data.onNameChange?.(event.target.value)}
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-medium text-neutral-600">Description</label>
                <Textarea
                  className="min-h-20"
                  value={data.description ?? ""}
                  onChange={(event) => data.onDescriptionChange?.(event.target.value)}
                />
              </div>
              <div className="space-y-2">
                <p className="text-xs font-medium text-neutral-600">Parameters</p>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[180px] min-w-[180px] max-w-[180px]"><span>Name</span></TableHead>
                      <TableHead className="w-[72px] min-w-[72px] max-w-[72px]"><span>Type</span></TableHead>
                      <TableHead><span>Description</span></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.parameterRows?.map((row) => (
                      <TableRow key={row.id}>
                        <TableCell className="w-[180px] min-w-[180px] max-w-[180px]">
                          <Input
                            value={row.name}
                            onChange={(event) =>
                              data.onParameterRowChange?.(row.id, "name", event.target.value)
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
                              data.onParameterRowChange?.(
                                row.id,
                                "description",
                                event.target.value,
                              )
                            }
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              <div className="space-y-2">
                <label className="text-xs font-medium text-neutral-600">Description</label>
                <Textarea
                  className="min-h-20"
                  value={data.description ?? ""}
                  onChange={(event) => data.onDescriptionChange?.(event.target.value)}
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-medium text-neutral-600">Instruction</label>
                <Textarea
                  className="min-h-20"
                  value={data.instruction ?? ""}
                  onChange={(event) => data.onInstructionChange?.(event.target.value)}
                />
              </div>
            </div>
          )}

          <div className="flex justify-end gap-2 py-4">
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
