import { useId } from "react";
import { cn } from "@/lib/utils";

const FIGMA_AI_ASSISTANT_MARK_URL =
  "https://www.figma.com/api/mcp/asset/044c8658-cbf7-4495-93ee-f57bee329b32";
const FIGMA_AI_ASSISTANT_EMPTY_STATE_URL =
  "https://www.figma.com/api/mcp/asset/ac286d90-67cf-48ad-9c35-476b5c5fe7d7";

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

export function AiAssistantEmptyStateGraphic({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "relative flex items-center justify-center rounded-full border-[3px] border-white bg-transparent p-[3px] shadow-[0px_8px_32px_0px_rgba(143,115,227,0.3),0px_2px_8px_0px_rgba(143,115,227,0.2)]",
        className,
      )}
      aria-hidden="true"
    >
      <img
        src={FIGMA_AI_ASSISTANT_EMPTY_STATE_URL}
        alt=""
        className="h-[81%] w-[81%] rounded-full object-cover"
        draggable={false}
      />
    </div>
  );
}
