import { useEffect, useRef, useState } from "react";

export function useContainerBreakpoint<T extends HTMLElement>(
  breakpointPx: number,
) {
  const ref = useRef<T | null>(null);
  const [isBelowBreakpoint, setIsBelowBreakpoint] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    const update = () => {
      setIsBelowBreakpoint(node.clientWidth < breakpointPx);
    };

    update();

    const observer = new ResizeObserver(() => update());
    observer.observe(node);

    return () => observer.disconnect();
  }, [breakpointPx]);

  return { ref, isBelowBreakpoint };
}
