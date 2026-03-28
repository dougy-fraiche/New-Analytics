import { useId } from "react";
import { __iconNode } from "lucide-react/dist/esm/icons/sparkles.js";

import { cn } from "./ui/utils";

export function AIInsightsGradientSparkles({ className }: { className?: string }) {
  const uid = useId().replace(/:/g, "");
  const gradId = `ai-insights-sparkles-grad-${uid}`;

  return (
    <svg
      className={cn("size-5 shrink-0", className)}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <defs>
        <linearGradient id={gradId} x1="0%" y1="100%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#4D77FF" />
          <stop offset="45%" stopColor="#A855F7" />
          <stop offset="75%" stopColor="#EC4899" />
          <stop offset="100%" stopColor="#FF8A00" />
        </linearGradient>
      </defs>
      {__iconNode.map(([tag, attrs], i) => {
        const { key: pathKey, ...rest } = attrs as { key?: string; [k: string]: unknown };
        const Tag = tag as "path";
        return (
          <Tag
            key={pathKey ?? i}
            {...rest}
            fill="none"
            stroke={`url(#${gradId})`}
          />
        );
      })}
    </svg>
  );
}
