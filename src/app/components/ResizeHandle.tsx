import { useCallback, useEffect, useRef, useState } from "react";
import { cn } from "./ui/utils";

interface ResizeHandleProps {
  /** Which edge of the parent the handle sits on */
  side: "left" | "right";
  /** Called continuously during drag with the signed pixel delta (positive = wider) */
  onResize: (delta: number) => void;
  /** Called on double-click to reset width to default */
  onReset: () => void;
  /** Fired once when drag begins */
  onResizeStart?: () => void;
  /** Fired once when drag ends */
  onResizeEnd?: () => void;
  className?: string;
}

export function ResizeHandle({
  side,
  onResize,
  onReset,
  onResizeStart,
  onResizeEnd,
  className,
}: ResizeHandleProps) {
  const [isDragging, setIsDragging] = useState(false);
  const lastXRef = useRef(0);

  // Keep callback refs current to avoid stale closures in the effect
  const onResizeRef = useRef(onResize);
  const onResizeEndRef = useRef(onResizeEnd);
  onResizeRef.current = onResize;
  onResizeEndRef.current = onResizeEnd;

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(true);
      lastXRef.current = e.clientX;
      onResizeStart?.();
    },
    [onResizeStart],
  );

  const handleDoubleClick = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      onReset();
    },
    [onReset],
  );

  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      const delta = e.clientX - lastXRef.current;
      lastXRef.current = e.clientX;
      // Right-side handle: moving right = positive delta = wider
      // Left-side handle: moving left = negative delta, negate so wider
      onResizeRef.current(side === "right" ? delta : -delta);
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
    document.body.style.userSelect = "none";
    document.body.style.cursor = "col-resize";

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
      document.body.style.userSelect = "";
      document.body.style.cursor = "";
      onResizeEndRef.current?.();
    };
  }, [isDragging, side]);

  return (
    <div
      className={cn(
        "group/resize absolute inset-y-0 z-[100] cursor-col-resize w-[6px]",
        side === "right"
          ? "right-0 translate-x-1/2"
          : "left-0 -translate-x-1/2",
        className,
      )}
      onMouseDown={handleMouseDown}
      onDoubleClick={handleDoubleClick}
    >
      {/* Visible indicator line */}
      <div
        className={cn(
          "absolute inset-y-0 left-1/2 -translate-x-1/2 w-[2px] transition-colors duration-150",
          isDragging
            ? "bg-primary"
            : "bg-transparent group-hover/resize:bg-primary/40",
        )}
      />
    </div>
  );
}
