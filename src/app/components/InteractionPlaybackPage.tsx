import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router";
import {
  ArrowLeftRight,
  ChevronDown,
  Download,
  FileText,
  Meh,
  MoreHorizontal,
  Monitor,
  Pause,
  PhoneForwarded,
  Play,
  SkipBack,
  SkipForward,
  Smile,
  Frown,
  Volume2,
  X,
} from "lucide-react";

import { Button } from "./ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "./ui/collapsible";
import { Switch } from "./ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { Slider } from "./ui/slider";
import { cn } from "./ui/utils";
import {
  type InteractionPlaybackPayload,
  type PlaybackSegmentRow,
  SAMPLE_PLAYBACK_STORAGE_KEY,
} from "../data/sample-interactions-dialog";

function InfoItem({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <span className="inline-flex items-baseline gap-1.5 whitespace-nowrap">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium text-foreground">{children}</span>
    </span>
  );
}

function SentimentIcon({ sentiment }: { sentiment: PlaybackSegmentRow["sentiment"] }) {
  const cls = "size-5 shrink-0";
  if (sentiment === "positive") return <Smile className={cn(cls, "text-emerald-600 dark:text-emerald-400")} aria-hidden />;
  if (sentiment === "negative") return <Frown className={cn(cls, "text-amber-700 dark:text-amber-500")} aria-hidden />;
  return <Meh className={cn(cls, "text-muted-foreground")} aria-hidden />;
}

function WaveformToolbarIcon() {
  return (
    <span className="flex h-5 w-[18px] items-end justify-center gap-px" aria-hidden>
      {[7, 5, 10, 5, 6].map((h, i) => (
        <span key={i} className="bg-muted-foreground w-0.5 rounded-full" style={{ height: h }} />
      ))}
    </span>
  );
}

const PLAYER_DOCUMENT_TITLE = "CXone Player";

export function InteractionPlaybackPage() {
  const [searchParams] = useSearchParams();
  const [data, setData] = useState<InteractionPlaybackPayload | null>(null);
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(18);
  const [newPlayer, setNewPlayer] = useState(true);
  const [interactionDetailsOpen, setInteractionDetailsOpen] = useState(false);

  useEffect(() => {
    const previous = document.title;
    document.title = PLAYER_DOCUMENT_TITLE;
    return () => {
      document.title = previous;
    };
  }, []);

  useEffect(() => {
    const sid = searchParams.get("sid");
    if (!sid) {
      setData(null);
      return;
    }
    try {
      const raw = localStorage.getItem(`${SAMPLE_PLAYBACK_STORAGE_KEY}:${sid}`);
      if (raw) {
        setData(JSON.parse(raw) as InteractionPlaybackPayload);
        localStorage.removeItem(`${SAMPLE_PLAYBACK_STORAGE_KEY}:${sid}`);
      } else {
        setData(null);
      }
    } catch {
      setData(null);
    }
  }, [searchParams]);

  const closeWindow = useCallback(() => {
    window.close();
  }, []);

  const equalizerBars = useMemo(() => Array.from({ length: 48 }, (_, i) => 8 + ((i * 13) % 52)), []);

  const currentElapsedLabel = useMemo(() => {
    if (!data) return "0:00";
    const [m, s] = data.meta.duration.split(":").map((x) => parseInt(x, 10) || 0);
    const total = m * 60 + s;
    const cur = Math.floor((progress / 100) * total);
    const cm = Math.floor(cur / 60);
    const cs = cur % 60;
    return `${cm}:${String(cs).padStart(2, "0")}`;
  }, [data, progress]);

  if (!data) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background p-8 text-center">
        <p className="text-muted-foreground max-w-md text-sm">
          No interaction loaded. Open Sample Interactions from Automation Opportunities and choose Play on a row.
        </p>
        <Button type="button" variant="outline" size="sm" onClick={closeWindow}>
          Close window
        </Button>
      </div>
    );
  }

  const { meta, transcript, sourceCategory, aiInsightsSummary } = data;
  const pb = data.playback;
  if (!pb) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background p-8 text-center">
        <p className="text-muted-foreground max-w-md text-sm">
          This playback session is out of date. Close the window and choose Play again from Sample Interactions.
        </p>
        <Button type="button" variant="outline" size="sm" onClick={closeWindow}>
          Close window
        </Button>
      </div>
    );
  }

  return (
    <div className="flex h-screen min-h-[640px] flex-col overflow-hidden bg-background text-foreground">
      {/* Info bar — Figma node 3592:44178, h=44 */}
      <header className="flex min-h-11 shrink-0 items-center gap-x-5 gap-y-2 border-b bg-card px-5 py-2 text-sm">
        <div className="flex items-center gap-8 text-muted-foreground">
          <PhoneForwarded className="size-5 shrink-0" aria-hidden />
          <Monitor className="size-5 shrink-0" aria-hidden />
          <ArrowLeftRight className="size-5 shrink-0" aria-hidden />
        </div>
        <div className="hidden flex-wrap items-center gap-x-6 gap-y-1 md:flex md:flex-1">
          <InfoItem label="Agent Name:">{meta.agentName}</InfoItem>
          <InfoItem label="Date:">{meta.dateTime}</InfoItem>
          <InfoItem label="CSAT:">{meta.csat}</InfoItem>
          <InfoItem label="Team:">{meta.team}</InfoItem>
          <InfoItem label="Skill:">{meta.skill}</InfoItem>
        </div>
        <div className="ml-auto flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Switch id="new-player" checked={newPlayer} onCheckedChange={setNewPlayer} aria-label="New Player" />
            <label htmlFor="new-player" className="cursor-pointer text-sm whitespace-nowrap">
              New Player
            </label>
          </div>
          <div className="flex items-center gap-1 border-l pl-4">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="size-7 shrink-0 rounded-md"
              aria-label="Audio waveform"
            >
              <WaveformToolbarIcon />
            </Button>
            <Button type="button" variant="ghost" size="icon" className="size-7" aria-label="Download">
              <Download className="size-4" />
            </Button>
            <Button type="button" variant="ghost" size="icon" className="size-7" aria-label="Close player" onClick={closeWindow}>
              <X className="size-4" />
            </Button>
          </div>
        </div>
      </header>

      <div className="flex flex-col gap-1 border-b bg-muted/25 px-4 py-2 text-xs md:hidden">
        <InfoItem label="Agent:">{meta.agentName}</InfoItem>
        <InfoItem label="Date:">{meta.dateTime}</InfoItem>
      </div>

      <div className="flex min-h-0 min-w-0 flex-1">
        {/* Main media — ~1490px flex in Figma */}
        <div className="flex min-h-0 min-w-0 flex-[1490] flex-col border-r">
          <div className="flex min-h-0 flex-1 gap-2 p-2">
            <div className="relative flex min-h-[220px] flex-1 flex-col overflow-hidden rounded-lg border bg-gradient-to-b from-muted/50 to-muted/20">
              <span className="text-muted-foreground absolute left-3 top-2 text-xs font-medium">Agent view</span>
              <div className="flex flex-1 items-center justify-center">
                <Monitor className="text-muted-foreground/40 size-16" aria-hidden />
              </div>
            </div>
            <div className="relative flex min-h-[220px] flex-1 flex-col overflow-hidden rounded-lg border bg-gradient-to-b from-muted/50 to-muted/20">
              <span className="text-muted-foreground absolute left-3 top-2 text-xs font-medium">Customer view</span>
              <div className="flex flex-1 items-center justify-center">
                <Monitor className="text-muted-foreground/40 size-16" aria-hidden />
              </div>
            </div>
          </div>

          {/* Counter bar — thumbnails + View All (3592:44237, h=60) */}
          <div className="flex h-[60px] shrink-0 items-center gap-4 border-t bg-card px-4">
            <div className="bg-muted size-[48px] shrink-0 rounded border" />
            <div className="bg-muted size-[48px] shrink-0 rounded border" />
            <Button type="button" variant="outline" size="sm" className="h-10 px-3 text-sm font-normal">
              View All
            </Button>
          </div>

          {/* Secondary counter / timeline strip (3592:44244, h=44) */}
          <div className="flex h-11 shrink-0 items-center border-t bg-muted/20 px-4">
            <div className="bg-border/80 relative h-2 flex-1 overflow-hidden rounded-full">
              <div
                className="bg-primary absolute left-0 top-0 h-full rounded-full transition-[width]"
                style={{ width: `${progress}%` }}
              />
            </div>
            <span className="text-muted-foreground ml-3 shrink-0 text-xs tabular-nums">
              {currentElapsedLabel} / {meta.duration}
            </span>
          </div>

          {/* Audio bar — Figma h=174 */}
          <div className="flex min-h-[120px] shrink-0 flex-col justify-end gap-2 border-t bg-muted/10 px-6 pb-4 pt-4 sm:min-h-[154px]">
            <div className="text-muted-foreground flex justify-between text-[10px] font-medium uppercase tracking-wide">
              <span>Left</span>
              <span>Right</span>
            </div>
            <div className="flex h-24 items-end justify-center gap-px sm:h-28">
              {equalizerBars.map((px, i) => (
                <div
                  key={i}
                  className={cn(
                    "w-1 shrink-0 rounded-t",
                    i % 3 === 0 ? "bg-primary/70" : "bg-primary/40",
                  )}
                  style={{ height: px }}
                />
              ))}
            </div>
          </div>

          {/* Playback control — Figma h=60 (3592:44246) */}
          <div className="flex h-[60px] shrink-0 items-center gap-3 border-t bg-card px-4 sm:gap-4">
            <Button type="button" variant="ghost" size="icon" className="size-9 shrink-0" aria-label="Volume">
              <Volume2 className="size-4" />
            </Button>
            <span className="text-muted-foreground w-11 shrink-0 text-xs tabular-nums">{currentElapsedLabel}</span>
            <Slider
              value={[progress]}
              max={100}
              step={1}
              onValueChange={(v) => setProgress(v[0] ?? 0)}
              className="min-w-0 flex-1"
            />
            <span className="text-muted-foreground w-11 shrink-0 text-right text-xs tabular-nums">{meta.duration}</span>
            <div className="flex shrink-0 items-center gap-0.5 border-l pl-3">
              <Button type="button" variant="ghost" size="icon" className="size-9" aria-label="Skip back">
                <SkipBack className="size-4" />
              </Button>
              <Button
                type="button"
                variant="secondary"
                size="icon"
                className="size-10 rounded-full"
                aria-label={playing ? "Pause" : "Play"}
                onClick={() => setPlaying((p) => !p)}
              >
                {playing ? <Pause className="size-4" /> : <Play className="size-4 ml-0.5" />}
              </Button>
              <Button type="button" variant="ghost" size="icon" className="size-9" aria-label="Skip forward">
                <SkipForward className="size-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Right rail — 428px Figma */}
        <aside className="flex w-full max-w-full shrink-0 flex-col bg-card md:w-[428px] md:max-w-[428px]">
          <Tabs defaultValue="transcript" className="flex min-h-0 flex-1 flex-col gap-0">
            <TabsList
              variant="line"
              className="h-11 w-full shrink-0 justify-start rounded-none border-b border-border/60 bg-transparent px-3"
            >
              <TabsTrigger value="transcript" className="px-4">
                Transcript
              </TabsTrigger>
              <TabsTrigger value="ai" className="px-4">
                AI Insights
              </TabsTrigger>
            </TabsList>

            <TabsContent value="transcript" className="mt-0 min-h-0 flex-1 overflow-y-auto data-[state=inactive]:hidden">
              <div className="space-y-0">
                {/* Segment 01 header + speaker (Figma 3592:44252 area) */}
                <div className="border-b px-4 py-4">
                  <div className="text-foreground flex flex-wrap items-start justify-between gap-2 text-xs">
                    <span className="font-semibold">{pb.segmentLabel}</span>
                    <span className="text-muted-foreground tabular-nums">{pb.segmentTimeRange}</span>
                  </div>
                  <p className="text-muted-foreground mt-2 text-sm font-medium">{pb.customerDisplayName}</p>
                </div>

                <Collapsible open={interactionDetailsOpen} onOpenChange={setInteractionDetailsOpen} className="border-b">
                  <CollapsibleTrigger className="text-foreground flex w-full items-center gap-2 px-4 py-3 text-left text-sm font-medium hover:bg-muted/40">
                    <ChevronDown
                      className={cn("text-muted-foreground size-4 shrink-0 transition-transform", interactionDetailsOpen && "rotate-180")}
                    />
                    {pb.interactionDetailLabel}
                  </CollapsibleTrigger>
                  <CollapsibleContent className="text-muted-foreground space-y-1 px-4 pb-3 pl-11 text-xs">
                    <p>Category: {sourceCategory}</p>
                    <p>
                      Session KPIs: CSAT {meta.csat}, team {meta.team}, skill {meta.skill}.
                    </p>
                  </CollapsibleContent>
                </Collapsible>

                {/* Segment 1–3 rows with sentiment (Figma segment list) */}
                <div className="border-b py-2">
                  {pb.segments.map((seg) => (
                    <div
                      key={seg.label}
                      className="flex items-center gap-2 px-4 py-2.5 text-sm hover:bg-muted/30"
                    >
                      <ChevronDown className="text-muted-foreground size-4 shrink-0 opacity-60" aria-hidden />
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-baseline justify-between gap-x-2 gap-y-0.5">
                          <span className="font-medium">{seg.label}</span>
                          <span className="text-muted-foreground text-xs tabular-nums">{seg.timeRange}</span>
                        </div>
                      </div>
                      <SentimentIcon sentiment={seg.sentiment} />
                      <button
                        type="button"
                        className="text-muted-foreground hover:text-foreground flex size-6 shrink-0 items-center justify-center rounded"
                        aria-label="Segment options"
                      >
                        <MoreHorizontal className="size-4" />
                      </button>
                    </div>
                  ))}
                </div>

                {/* Chat cards */}
                <div className="space-y-4 px-4 py-4">
                  <p className="text-muted-foreground text-[11px] font-semibold uppercase tracking-wide">
                    {sourceCategory}
                  </p>
                  {transcript.map((line) => (
                    <div
                      key={line.id}
                      className={cn("flex flex-col gap-1.5", line.role === "agent" ? "items-end" : "items-start")}
                    >
                      <div
                        className={cn(
                          "text-muted-foreground flex items-center gap-2 text-xs",
                          line.role === "agent" && "flex-row-reverse",
                        )}
                      >
                        <span className="font-medium text-foreground">{line.speakerLabel}</span>
                        <span className="tabular-nums">{line.time}</span>
                      </div>
                      <div
                        className={cn(
                          "max-w-[98%] rounded-lg px-3 py-2.5 text-sm leading-snug shadow-sm",
                          line.role === "customer"
                            ? "border border-border/80 bg-muted/70 text-foreground"
                            : "border border-primary/20 bg-primary/10 text-foreground",
                        )}
                      >
                        {line.text}
                      </div>
                    </div>
                  ))}

                  {/* Agent note row (Figma 3592:44374+) */}
                  <div className="flex flex-col gap-1.5 items-end pt-1">
                    <div className="text-muted-foreground flex flex-row-reverse items-center gap-2 text-xs">
                      <span className="font-medium text-foreground">Agent note</span>
                      <span className="tabular-nums">{meta.duration}</span>
                    </div>
                    <div className="flex max-w-[98%] items-start gap-2 rounded-lg border border-border/80 bg-muted/40 px-3 py-2.5 text-sm">
                      <FileText className="text-muted-foreground mt-0.5 size-4 shrink-0" aria-hidden />
                      <span className="leading-snug">{pb.agentNote}</span>
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="ai" className="mt-0 min-h-0 flex-1 overflow-y-auto p-4 data-[state=inactive]:hidden">
              <div className="space-y-6">
                <p className="text-sm leading-relaxed">{aiInsightsSummary}</p>

                {/* Coach card — Figma Jean Gray / 0:10 */}
                <div className="space-y-3 rounded-lg border bg-muted/20 p-4">
                  <div className="flex items-center gap-3">
                    <div className="bg-primary/20 flex size-8 items-center justify-center rounded-full text-xs font-bold text-primary">
                      {pb.coachAgentName
                        .split(" ")
                        .map((n) => n[0])
                        .join("")
                        .slice(0, 2)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold">{pb.coachAgentName}</p>
                    </div>
                    <span className="text-muted-foreground text-sm tabular-nums">{pb.coachTimestamp}</span>
                  </div>
                  <p className="text-muted-foreground text-sm leading-relaxed">{pb.coachMessage}</p>
                </div>

                <div>
                  <p className="mb-3 text-sm font-semibold">Business Data</p>
                  <div className="space-y-2 rounded-md border bg-card p-3">
                    {pb.businessData.map((row) => (
                      <div key={row.label} className="flex flex-wrap gap-x-2 text-sm">
                        <span className="text-muted-foreground shrink-0 text-xs leading-6">{row.label}</span>
                        <span className="font-medium">{row.value}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-2 rounded-lg border border-dashed bg-muted/15 p-3">
                  <p className="text-sm font-semibold">{pb.enlightenSentimentLabel}</p>
                  <p className="text-muted-foreground text-xs">
                    Model blend reflects CSAT {meta.csat} and segment-level tone shifts; review negatives in Segment 3.
                  </p>
                </div>
                <div className="space-y-2 rounded-lg border border-dashed bg-muted/15 p-3">
                  <p className="text-sm font-semibold">{pb.behaviorScoreLabel}</p>
                  <p className="text-muted-foreground text-xs">
                    Adherence to greeting and verification steps within target; one missed recap opportunity before wrap.
                  </p>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </aside>
      </div>
    </div>
  );
}
