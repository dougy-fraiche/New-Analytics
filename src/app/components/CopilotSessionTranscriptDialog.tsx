import { useEffect, useMemo, useState } from "react";
import {
  ChevronDown,
  CircleCheckBig,
  Download,
  Flag,
  ListChecks,
  MessageCircleMore,
  MessagesSquare,
  Smile,
  Sparkles,
  SquareCheckBig,
  TableOfContents,
  TriangleAlert,
  UserRound,
} from "lucide-react";

import {
  buildCopilotTranscriptPayload,
  buildTranscriptExportText,
  type CopilotTranscriptMessageCategory,
  type CopilotTranscriptPerformanceCard,
  type CopilotTranscriptSentiment,
  type CopilotTranscriptSessionContext,
} from "../data/copilot-session-transcript";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import { Label } from "./ui/label";
import { ScrollArea } from "./ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { cn } from "./ui/utils";

type TranscriptTab = "transcript" | "summary";
type TranscriptShowOption = CopilotTranscriptMessageCategory;

const TRANSCRIPT_SHOW_OPTIONS: Array<{ value: TranscriptShowOption; label: string }> = [
  { value: "tasks", label: "Tasks" },
  { value: "rules-notifications", label: "Rules Notifications" },
  { value: "generative-suggestions", label: "Generative Suggestions" },
  { value: "summaries", label: "Summaries" },
];

function statusBadgeClass(status: string): string {
  const normalized = status.toLowerCase();
  if (normalized.includes("resolved") || normalized.includes("closed")) {
    return "border-transparent bg-emerald-100 text-emerald-700";
  }
  if (normalized.includes("follow") || normalized.includes("pending")) {
    return "border-transparent bg-amber-100 text-amber-700";
  }
  return "border-transparent bg-secondary text-secondary-foreground";
}

function sentimentBadgeClass(sentiment: CopilotTranscriptSentiment): string {
  if (sentiment === "positive") return "border-transparent bg-emerald-100 text-emerald-700";
  if (sentiment === "negative") return "border-transparent bg-red-100 text-red-600";
  if (sentiment === "mixed") return "border-transparent bg-amber-100 text-amber-700";
  return "border-transparent bg-secondary text-secondary-foreground";
}

function performanceCardClass(tone: CopilotTranscriptPerformanceCard["tone"]): string {
  if (tone === "magenta") return "border-[#d83b8c] bg-[#fdf2f8]";
  if (tone === "indigo") return "border-[#4f57c6] bg-[#f3f4ff]";
  if (tone === "amber") return "border-[#c88a00] bg-[#fffaef]";
  return "border-[#6358c6] bg-[#f5f3ff]";
}

function performanceTextClass(tone: CopilotTranscriptPerformanceCard["tone"]): string {
  if (tone === "magenta") return "text-[#be2f7a]";
  if (tone === "indigo") return "text-[#3f49ad]";
  if (tone === "amber") return "text-[#ad7700]";
  return "text-[#5c46b8]";
}

function performanceIcon(card: CopilotTranscriptPerformanceCard) {
  if (card.icon === "sparkles") return <Sparkles className="size-4" aria-hidden />;
  if (card.icon === "square-check-big") return <SquareCheckBig className="size-4" aria-hidden />;
  if (card.icon === "triangle-alert") return <TriangleAlert className="size-4" aria-hidden />;
  return <ListChecks className="size-4" aria-hidden />;
}

export function CopilotSessionTranscriptDialog({
  open,
  onOpenChange,
  session,
  sourceLabel,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  session: CopilotTranscriptSessionContext | null;
  sourceLabel: string;
}) {
  const [activeTab, setActiveTab] = useState<TranscriptTab>("transcript");
  const [selectedShowOptions, setSelectedShowOptions] = useState<TranscriptShowOption[]>(
    TRANSCRIPT_SHOW_OPTIONS.map((option) => option.value),
  );

  useEffect(() => {
    if (!open) return;
    setActiveTab("transcript");
    setSelectedShowOptions(TRANSCRIPT_SHOW_OPTIONS.map((option) => option.value));
  }, [open, session?.contact]);

  const payload = useMemo(() => {
    if (!session) return null;
    return buildCopilotTranscriptPayload(session);
  }, [session]);

  const allOptionsSelected = selectedShowOptions.length === TRANSCRIPT_SHOW_OPTIONS.length;
  const showSummaryInTranscript = allOptionsSelected || selectedShowOptions.includes("summaries");

  const filteredMessages = useMemo(() => {
    if (!payload) return [];
    if (allOptionsSelected) return payload.messages;
    return payload.messages.filter((message) => selectedShowOptions.includes(message.category));
  }, [allOptionsSelected, payload, selectedShowOptions]);

  const showTriggerLabel = allOptionsSelected
    ? "Show All"
    : selectedShowOptions.length === 0
      ? "Show"
      : `Show (${selectedShowOptions.length})`;

  const handleExport = () => {
    if (!payload) return;

    const fileText = buildTranscriptExportText(payload, sourceLabel);
    const blob = new Blob([fileText], { type: "text/plain;charset=utf-8" });
    const objectUrl = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = objectUrl;
    anchor.download = `${payload.session.contact.toLowerCase()}-transcript.txt`;
    anchor.click();
    URL.revokeObjectURL(objectUrl);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex h-[calc(100vh-2rem)] min-h-0 flex-col max-w-[calc(100vw-2rem)] gap-0 overflow-hidden p-0 sm:h-[888px] sm:w-[960px] sm:max-w-[960px]">
        {!payload ? null : (
          <Tabs
            value={activeTab}
            onValueChange={(value) => setActiveTab(value as TranscriptTab)}
            className="flex h-full min-h-0 flex-col gap-0"
          >
            <div className="shrink-0 border-b p-6 pb-4">
              <DialogHeader className="pr-8 text-left">
                <DialogTitle>Transcript Viewer</DialogTitle>
                <DialogDescription className="sr-only">
                  Row-scoped transcript modal for {payload.session.contact}
                </DialogDescription>
              </DialogHeader>

              <div className="mt-5 space-y-2">
                <p className="text-lg leading-7 font-normal text-foreground">
                  {payload.session.agentDisplayName}
                </p>
                <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                  <span>{payload.session.issueLabel}</span>
                  <span className="text-border">|</span>
                  <span>{payload.session.sessionCode}</span>
                  <span className="text-border">|</span>
                  <span className="inline-flex items-center gap-1">
                    <MessageCircleMore className="size-3.5" aria-hidden />
                    {payload.session.channel}
                  </span>
                  <span>{payload.session.turnCount} turns</span>
                  <span className="inline-flex items-center gap-1">
                    <Flag className="size-3.5" aria-hidden />
                    {payload.session.flags}
                  </span>
                  <Badge variant="secondary" className={statusBadgeClass(payload.session.status)}>
                    {payload.session.statusLabel}
                  </Badge>
                </div>
              </div>

              <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                <TabsList>
                  <TabsTrigger value="transcript" className="gap-1.5 px-3">
                    <MessagesSquare className="size-4" aria-hidden />
                    Transcript
                  </TabsTrigger>
                  <TabsTrigger value="summary" className="gap-1.5 px-3">
                    <TableOfContents className="size-4" aria-hidden />
                    Summary
                  </TabsTrigger>
                </TabsList>

                <div className="flex items-center gap-2">
                  {activeTab === "transcript" ? (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button type="button" variant="outline" size="sm" className="h-8 min-w-[112px] justify-start">
                          {showTriggerLabel}
                          <ChevronDown className="ml-auto size-4 opacity-70" aria-hidden />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-56">
                        <DropdownMenuCheckboxItem
                          checked={allOptionsSelected}
                          onSelect={(event) => event.preventDefault()}
                          onCheckedChange={(checked) => {
                            if (checked === true) {
                              setSelectedShowOptions(TRANSCRIPT_SHOW_OPTIONS.map((option) => option.value));
                            } else {
                              setSelectedShowOptions([]);
                            }
                          }}
                        >
                          Show All
                        </DropdownMenuCheckboxItem>
                        <DropdownMenuSeparator />
                        {TRANSCRIPT_SHOW_OPTIONS.map((option) => (
                          <DropdownMenuCheckboxItem
                            key={option.value}
                            checked={selectedShowOptions.includes(option.value)}
                            onSelect={(event) => event.preventDefault()}
                            onCheckedChange={(checked) => {
                              setSelectedShowOptions((prev) => {
                                if (checked === true) {
                                  if (prev.includes(option.value)) return prev;
                                  return [...prev, option.value];
                                }
                                return prev.filter((value) => value !== option.value);
                              });
                            }}
                          >
                            {option.label}
                          </DropdownMenuCheckboxItem>
                        ))}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  ) : null}

                  <Button type="button" variant="outline" size="sm" className="h-8 gap-1.5" onClick={handleExport}>
                    <Download className="size-4" aria-hidden />
                    Export
                  </Button>
                </div>
              </div>
            </div>

            <TabsContent value="transcript" className="mt-0 h-0 min-h-0 flex-1 overflow-hidden">
              <div className="h-full overflow-y-auto overscroll-contain">
                <div className="space-y-0 px-6 py-5">
                  {filteredMessages.map((message, index) => (
                    <div key={message.id} className="grid grid-cols-[72px_minmax(0,1fr)] gap-6 pb-5">
                      <div className="relative flex justify-end pr-3">
                        <span className="pt-0.5 text-xs tabular-nums text-muted-foreground">{message.time}</span>
                        <span className="absolute right-0 top-1.5 size-2.5 rounded-full border border-background bg-muted-foreground" />
                        {index < filteredMessages.length - 1 ? (
                          <span className="absolute right-[4px] top-4 h-[calc(100%+1.25rem)] border-r border-dashed border-border" />
                        ) : null}
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-sm">
                          {message.speaker === "agent" ? (
                            <Sparkles className="size-4 text-primary" aria-hidden />
                          ) : (
                            <UserRound className="size-4 text-muted-foreground" aria-hidden />
                          )}
                          <span className="font-normal text-foreground">{message.speakerLabel}</span>
                        </div>
                        <div
                          className={cn(
                            "w-full rounded-md border px-4 py-3 text-base leading-6",
                            message.speaker === "agent"
                              ? "border-primary/20 bg-primary/10"
                              : "border-border bg-muted/50",
                          )}
                        >
                          {message.text}
                        </div>
                      </div>
                    </div>
                  ))}

                  {showSummaryInTranscript ? (
                    <div className="ml-[98px] mt-2 w-[calc(100%-98px)] rounded-md border border-primary/30 bg-primary/5 p-4">
                      <p className="text-base font-normal text-primary">{payload.summaryTitle}</p>
                      <p className="mt-2 text-base leading-6 text-muted-foreground">{payload.summary}</p>
                    </div>
                  ) : null}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="summary" className="mt-0 h-0 min-h-0 flex-1">
              <ScrollArea className="h-full">
                <div className="mx-auto w-full space-y-6 px-8 py-8">
                  <section className="space-y-5">
                    <h3>Call Summary</h3>
                    <div className="grid grid-cols-3 gap-8">
                      <div className="min-w-0 space-y-2">
                        <Label>Duration</Label>
                        <p className="text-base leading-6 text-foreground">{payload.callSummary.duration}</p>
                      </div>
                      <div className="min-w-0 space-y-2">
                        <Label>Resolution</Label>
                        <p className="text-base leading-6 text-foreground">{payload.callSummary.resolution}</p>
                      </div>
                      <div className="min-w-0 space-y-2">
                        <Label>Customer Sentiment</Label>
                        <Badge
                          variant="secondary"
                          className={cn(
                            "w-fit gap-1.5",
                            sentimentBadgeClass(payload.callSummary.customerSentiment),
                          )}
                        >
                          <Smile className="size-5" aria-hidden />
                          {payload.callSummary.customerSentiment}
                        </Badge>
                      </div>
                    </div>
                  </section>

                  <section className="space-y-5">
                    <h3>Copilot Performance</h3>
                    <div className="grid grid-cols-3 gap-4">
                      {payload.copilotPerformance.map((card) => (
                        <Card key={card.id} className={performanceCardClass(card.tone)}>
                          <CardHeader>
                            <CardTitle className={cn("flex items-center gap-2 text-base", performanceTextClass(card.tone))}>
                              {performanceIcon(card)}
                              <span>{card.title}</span>
                            </CardTitle>
                          </CardHeader>
                          <CardContent className="space-y-2">
                            <p className="text-sm text-slate-700">{card.primaryValue}</p>
                            {card.secondaryValue ? (
                              <p className="text-sm text-muted-foreground">{card.secondaryValue}</p>
                            ) : null}
                            {card.adherence ? (
                              <p className="inline-flex items-center gap-2 text-xs text-muted-foreground">
                                <span>{card.adherence.label}</span>
                                <span className="size-2.5 rounded-full bg-sky-500" aria-hidden />
                                <span className="font-medium text-sky-600">{card.adherence.value}</span>
                              </p>
                            ) : null}
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </section>

                  <section className="space-y-5">
                    <h3>Key Highlights</h3>
                    <ul className="space-y-4">
                      {payload.keyHighlights.map((highlight, index) => (
                        <li key={`${highlight}-${index}`} className="flex items-start gap-2.5 text-base leading-6 text-foreground">
                          <CircleCheckBig className="mt-0.5 size-4 shrink-0 text-emerald-600" aria-hidden />
                          <span>{highlight}</span>
                        </li>
                      ))}
                    </ul>
                  </section>
                </div>
              </ScrollArea>
            </TabsContent>
          </Tabs>
        )}
      </DialogContent>
    </Dialog>
  );
}
