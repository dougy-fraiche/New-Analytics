"use client";

import * as DialogPrimitive from "@radix-ui/react-dialog";
import { useCallback, useEffect, useLayoutEffect, useRef, type PointerEvent } from "react";
import { createPortal } from "react-dom";

import { useCreateAIAgentJobs } from "../contexts/CreateAIAgentJobsContext";
import { usePortalContainer } from "../contexts/PortalContainerContext";
import type { AgentJob, AgentJobPosition } from "../lib/create-ai-agent-jobs";
import { CreateAIAgentUnifiedPanel } from "./CreateAIAgentProcessPanel";
import { cn } from "./ui/utils";

function CompactJobsPanel({
  jobs,
  panelPosition,
  onDismissJob,
  onDismissAll,
  onExpand,
  updatePanelPosition,
}: {
  jobs: AgentJob[];
  panelPosition: AgentJobPosition;
  onDismissJob: (id: string) => void;
  onDismissAll: () => void;
  onExpand: () => void;
  updatePanelPosition: (pos: AgentJobPosition, cardSize: { width: number; height: number }) => void;
}) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const posRef = useRef(panelPosition);
  posRef.current = panelPosition;

  const measureCard = () => {
    const el = wrapRef.current;
    if (!el) return { width: 420, height: 320 };
    const w = el.offsetWidth || 420;
    const h = el.offsetHeight || 320;
    return { width: w, height: h };
  };

  useLayoutEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => {
      updatePanelPosition(posRef.current, {
        width: el.offsetWidth || 420,
        height: el.offsetHeight || 320,
      });
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, [updatePanelPosition]);

  useEffect(() => {
    const onResize = () => {
      updatePanelPosition(posRef.current, measureCard());
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [updatePanelPosition]);

  const dragRef = useRef<{
    pointerId: number;
    startX: number;
    startY: number;
    origX: number;
    origY: number;
  } | null>(null);

  const dragHandleProps = {
    onPointerDown: (e: PointerEvent<HTMLDivElement>) => {
      if (e.button !== 0) return;
      e.preventDefault();
      dragRef.current = {
        pointerId: e.pointerId,
        startX: e.clientX,
        startY: e.clientY,
        origX: posRef.current.x,
        origY: posRef.current.y,
      };
      e.currentTarget.setPointerCapture(e.pointerId);
    },
    onPointerMove: (e: PointerEvent<HTMLDivElement>) => {
      const d = dragRef.current;
      if (!d || e.pointerId !== d.pointerId) return;
      const dx = e.clientX - d.startX;
      const dy = e.clientY - d.startY;
      updatePanelPosition({ x: d.origX + dx, y: d.origY + dy }, measureCard());
    },
    onPointerUp: (e: PointerEvent<HTMLDivElement>) => {
      const d = dragRef.current;
      if (!d || e.pointerId !== d.pointerId) return;
      dragRef.current = null;
      try {
        e.currentTarget.releasePointerCapture(e.pointerId);
      } catch {
        /* ignore */
      }
    },
    onPointerCancel: (e: PointerEvent<HTMLDivElement>) => {
      dragRef.current = null;
      try {
        e.currentTarget.releasePointerCapture(e.pointerId);
      } catch {
        /* ignore */
      }
    },
  };

  return (
    <div
      ref={wrapRef}
      className="pointer-events-auto"
      style={{
        position: "fixed",
        left: panelPosition.x,
        top: panelPosition.y,
        zIndex: 10020,
      }}
    >
      <CreateAIAgentUnifiedPanel
        variant="compact"
        jobs={jobs}
        onDismissJob={onDismissJob}
        onDismissAll={onDismissAll}
        onExpand={onExpand}
        dragHandleProps={dragHandleProps}
      />
    </div>
  );
}

export function CreateAIAgentJobsLayer() {
  const portalContainer = usePortalContainer();
  const {
    jobs,
    panelLayout,
    panelPosition,
    dismissJob,
    dismissAllJobs,
    setPanelLayout,
    updatePanelPosition,
  } = useCreateAIAgentJobs();

  const onDialogOpenChange = useCallback(
    (open: boolean) => {
      if (!open) {
        setPanelLayout("compact");
      }
    },
    [setPanelLayout],
  );

  if (!portalContainer) {
    return null;
  }

  if (jobs.length === 0) {
    return null;
  }

  const scopeSummary = jobs.map((j) => j.scopeTitle).join(", ");

  return createPortal(
    <div className="!pointer-events-none fixed inset-0 z-[10020]">
      {panelLayout === "compact" ? (
        <CompactJobsPanel
          jobs={jobs}
          panelPosition={panelPosition}
          onDismissJob={dismissJob}
          onDismissAll={dismissAllJobs}
          onExpand={() => setPanelLayout("dialog")}
          updatePanelPosition={updatePanelPosition}
        />
      ) : null}

      {panelLayout === "dialog" ? (
        <DialogPrimitive.Root open onOpenChange={onDialogOpenChange}>
          <DialogPrimitive.Portal container={portalContainer}>
            <DialogPrimitive.Overlay
              className={cn(
                "data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 fixed inset-0 z-[10050] bg-black/50",
              )}
            />
            <DialogPrimitive.Content
              className={cn(
                "bg-background data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 fixed top-[50%] left-[50%] z-[10051] flex h-[min(400px,90vh)] max-h-[90vh] w-[min(600px,calc(100%-2rem))] min-h-0 translate-x-[-50%] translate-y-[-50%] flex-col gap-0 overflow-hidden rounded-lg border p-0 shadow-lg outline-none duration-200",
              )}
            >
              <DialogPrimitive.Title className="sr-only">Create/Publish AI Agent</DialogPrimitive.Title>
              <DialogPrimitive.Description className="sr-only">
                {jobs.length === 1
                  ? `Status of AI agent creation for ${jobs[0]!.scopeTitle}.`
                  : `Status of ${jobs.length} AI agent creations: ${scopeSummary}.`}
              </DialogPrimitive.Description>
              <CreateAIAgentUnifiedPanel
                variant="dialog"
                jobs={jobs}
                onDismissJob={dismissJob}
                onDismissAll={dismissAllJobs}
                onMinimize={() => setPanelLayout("compact")}
              />
            </DialogPrimitive.Content>
          </DialogPrimitive.Portal>
        </DialogPrimitive.Root>
      ) : null}
    </div>,
    portalContainer,
  );
}
