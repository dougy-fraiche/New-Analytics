import { useCallback, useLayoutEffect, useState } from "react";

export function useContainerBreakpoint<T extends HTMLElement>(
  breakpointPx: number,
) {
  const [node, setNode] = useState<T | null>(null);
  const [isBelowBreakpoint, setIsBelowBreakpoint] = useState(false);

  const ref = useCallback((el: T | null) => {
    setNode(el);
  }, []);

  useLayoutEffect(() => {
    if (!node) {
      setIsBelowBreakpoint(false);
      return;
    }

    const update = () => {
      setIsBelowBreakpoint(node.clientWidth < breakpointPx);
    };

    update();

    const observer = new ResizeObserver(() => update());
    observer.observe(node);

    return () => observer.disconnect();
  }, [node, breakpointPx]);

  return { ref, isBelowBreakpoint };
}
