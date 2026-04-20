import { AudioLines, MessageCircle, MessageCircleMore, MessagesSquare } from "lucide-react";

import { cn } from "./ui/utils";

type CanonicalChannel = "voice" | "webchat" | "whatsapp" | "messenger";

type ChannelDisplay = {
  Icon: typeof AudioLines;
  label: string;
  toneClassName: string;
};

const CHANNEL_DISPLAY_BY_KEY: Record<CanonicalChannel, ChannelDisplay> = {
  voice: { Icon: AudioLines, label: "Voice", toneClassName: "text-muted-foreground" },
  webchat: { Icon: MessageCircleMore, label: "Webchat", toneClassName: "text-primary" },
  whatsapp: { Icon: MessageCircle, label: "WhatsApp", toneClassName: "text-success" },
  messenger: { Icon: MessagesSquare, label: "Messenger", toneClassName: "text-primary" },
};

function normalizeChannel(channel: string): CanonicalChannel | null {
  const normalized = channel.trim().toLowerCase().replace(/[\s_-]+/g, "");
  if (normalized === "voice") return "voice";
  if (normalized === "webchat") return "webchat";
  if (normalized === "whatsapp") return "whatsapp";
  if (normalized === "messenger") return "messenger";
  return null;
}

export function TableChannelCell({
  channel,
  className,
  labelClassName,
}: {
  channel: string;
  className?: string;
  labelClassName?: string;
}) {
  const channelKey = normalizeChannel(channel);
  const channelDisplay = channelKey ? CHANNEL_DISPLAY_BY_KEY[channelKey] : null;
  const Icon = channelDisplay?.Icon ?? MessageCircleMore;
  const label = channelDisplay?.label ?? (channel.trim() || "Unknown");
  const toneClassName = channelDisplay?.toneClassName ?? "text-muted-foreground";

  return (
    <span className={cn("inline-flex min-w-0 max-w-full items-center gap-2", className)}>
      <Icon className={cn("size-4 shrink-0", toneClassName)} aria-hidden />
      <span className={cn("min-w-0 truncate text-foreground", labelClassName)}>{label}</span>
    </span>
  );
}
