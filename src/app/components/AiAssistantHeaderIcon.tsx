import { useId } from "react";
import { cn } from "@/lib/utils";

const FIGMA_AI_ASSISTANT_MARK_URL =
  "https://www.figma.com/api/mcp/asset/044c8658-cbf7-4495-93ee-f57bee329b32";
export function AiAssistantHeaderIcon({ className }: { className?: string }) {
  const clipId = useId().replace(/:/g, "");
  return (
    <svg
      width="36"
      height="36"
      viewBox="0 0 36 36"
      className={cn("overflow-visible", className)}
      aria-hidden="true"
      focusable="false"
    >
      <defs>
        <clipPath id={clipId}>
          <rect x="5" y="5" width="26" height="26" rx="13" />
        </clipPath>
      </defs>

      <rect x="0" y="0" width="36" height="36" rx="18" fill="white" />
      <rect
        x="-2"
        y="-2"
        width="40"
        height="40"
        rx="20"
        fill="none"
        stroke="#6e56cf"
        strokeWidth="2"
        opacity="0.49"
      />
      <g clipPath={`url(#${clipId})`}>
        <image
          href={FIGMA_AI_ASSISTANT_MARK_URL}
          x="5"
          y="5"
          width="26"
          height="26"
          preserveAspectRatio="xMidYMid slice"
        />
      </g>
    </svg>
  );
}
