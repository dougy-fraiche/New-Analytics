/** Mock data for the Sample Interactions modal + interaction playback (Figma: Auto-Insight). */

export type SampleInteractionRow = {
  id: string;
  agentName: string;
  team: string;
  dateTime: string;
  duration: string;
  csat: string;
  skill: string;
};

export type InteractionTranscriptLine = {
  id: string;
  role: "customer" | "agent";
  speakerLabel: string;
  time: string;
  text: string;
};

export type PlaybackSegmentRow = {
  label: string;
  timeRange: string;
  sentiment: "positive" | "neutral" | "negative";
};

/** Right-rail structure from Figma (Segment 01, Interaction & Business details, coach, etc.). */
export type InteractionPlaybackDetails = {
  customerDisplayName: string;
  segmentLabel: string;
  segmentTimeRange: string;
  interactionDetailLabel: string;
  segments: PlaybackSegmentRow[];
  agentNote: string;
  businessData: { label: string; value: string }[];
  coachAgentName: string;
  coachMessage: string;
  coachTimestamp: string;
  enlightenSentimentLabel: string;
  behaviorScoreLabel: string;
};

export type InteractionPlaybackPayload = {
  sourceCategory: string;
  meta: {
    agentName: string;
    team: string;
    dateTime: string;
    csat: string;
    skill: string;
    duration: string;
  };
  transcript: InteractionTranscriptLine[];
  aiInsightsSummary: string;
  /** Present for recordings opened via Play; omit on older stored payloads. */
  playback?: InteractionPlaybackDetails;
};

/** Prefix for localStorage keys (shared across tabs/windows for same origin). */
export const SAMPLE_PLAYBACK_STORAGE_KEY = "auto-insight:sample-interaction-playback";

// ── Seeded pseudo-random (deterministic per source string) ─────────────────

function hashString(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = (Math.imul(31, h) + s.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
}

function mulberry32(seed: number): () => number {
  return () => {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function pick<T>(rng: () => number, arr: readonly T[]): T {
  return arr[Math.floor(rng() * arr.length)]!;
}

const FIRST_NAMES = [
  "Noah",
  "Micah",
  "Jaxen",
  "Tatum",
  "Dominic",
  "Sophia",
  "Liam",
  "Emma",
  "Olivia",
  "Ava",
  "Mia",
  "Harper",
  "Evelyn",
  "Jean",
  "Helen",
] as const;

const LAST_NAMES = [
  "Miller",
  "Wiley",
  "Gibson",
  "Logan",
  "Williams",
  "Carter",
  "Turner",
  "Gray",
  "Parr",
  "Nguyen",
  "Chen",
  "Patel",
  "Brooks",
  "Hayes",
  "Foster",
] as const;

const TEAMS = ["Team A", "Team B", "Team C", "Team D", "Tier 1", "Tier 2"] as const;

const BASE_SKILLS = [
  "Time Management",
  "Billing",
  "Card services",
  "Account",
  "Payment resolution",
  "Dispute intake",
  "Fraud review",
  "Escalation support",
] as const;

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"] as const;

function skillForSource(categoryTitle: string, rng: () => number): string {
  const t = categoryTitle.toLowerCase();
  if (t.includes("card") || t.includes("activation") || t.includes("pin")) return "Card services";
  if (t.includes("bill") || t.includes("invoice") || t.includes("fee") || t.includes("cycle")) return "Billing";
  if (t.includes("payment") || t.includes("refund") || t.includes("arrangement")) return pick(rng, BASE_SKILLS);
  if (t.includes("account") || t.includes("profile")) return "Account";
  return pick(rng, BASE_SKILLS);
}

function formatDateTime(rng: () => number): string {
  const month = MONTHS[Math.floor(rng() * MONTHS.length)]!;
  const day = 1 + Math.floor(rng() * 28);
  const year = 2025;
  let h = 9 + Math.floor(rng() * 8);
  const m = [0, 15, 24, 30, 45][Math.floor(rng() * 5)]!;
  const ampm = h >= 12 ? "PM" : "AM";
  if (h > 12) h -= 12;
  return `${month} ${day}, ${year}  ${h}:${String(m).padStart(2, "0")} ${ampm}`;
}

function formatDuration(rng: () => number): string {
  const mm = 4 + Math.floor(rng() * 12);
  const ss = 10 + Math.floor(rng() * 49);
  return `${mm}:${String(ss).padStart(2, "0")}`;
}

/** KPI cards + table rows unique to each category / topic / sub-topic label. */
export function getSampleInteractionsForSource(categoryTitle: string): {
  kpis: { label: string; value: string }[];
  rows: SampleInteractionRow[];
} {
  const rng = mulberry32(hashString(categoryTitle) || 1);
  const voiceN = 12 + Math.floor(rng() * 36);
  const chatN = 8 + Math.floor(rng() * 40);
  const teamN = 3 + Math.floor(rng() * 9);
  const agentN = 40 + Math.floor(rng() * 120);
  const sentiment = (3.85 + rng() * 0.85).toFixed(2);

  const kpis = [
    { label: "Voice Interactions", value: String(voiceN) },
    { label: "Chat Interactions", value: String(chatN) },
    { label: "Teams", value: String(teamN) },
    { label: "Agents", value: String(agentN) },
    { label: "Avg. Sentiment", value: sentiment },
  ];

  const rows: SampleInteractionRow[] = [];
  for (let i = 0; i < 6; i++) {
    const ri = mulberry32(hashString(`${categoryTitle}\0${i}`) || 1);
    const first = pick(ri, FIRST_NAMES);
    const last = pick(ri, LAST_NAMES);
    rows.push({
      id: `${hashString(categoryTitle)}-${i}`,
      agentName: `${first} ${last}`,
      team: pick(ri, TEAMS),
      dateTime: formatDateTime(ri),
      duration: formatDuration(ri),
      csat: (3.75 + ri() * 1.1).toFixed(2),
      skill: skillForSource(categoryTitle, ri),
    });
  }

  return { kpis, rows };
}

function firstName(full: string): string {
  const p = full.trim().split(/\s+/);
  return p[0] ?? "Agent";
}

function transcriptForSource(categoryTitle: string, row: SampleInteractionRow): InteractionTranscriptLine[] {
  const seed = hashString(`${categoryTitle}|${row.id}|transcript`);
  const rng = mulberry32(seed || 1);
  const agentShort = firstName(row.agentName);
  const t = categoryTitle.toLowerCase();
  const orderLine =
    t.includes("order") || t.includes("ship")
      ? "I still haven't received my package — can you check the tracking?"
      : "I need help with something on my account — can you walk me through the next steps?";
  const billingLine =
    t.includes("bill") || t.includes("charge") || t.includes("fee")
      ? "I'm not sure I recognize this charge on my statement. Can you explain what it's for?"
      : orderLine;
  const cardLine =
    t.includes("card") || t.includes("activation")
      ? "I'm trying to activate my new card and the app keeps timing out."
      : billingLine;
  const open = cardLine;

  const middle =
    t.includes("payment")
      ? "I can review the payment history on this account and confirm what posted on which dates."
      : t.includes("refund")
        ? "I'll check refund eligibility and the timeline you should expect for the credit."
        : "I'll verify the details in our system and make sure we resolve this for you today.";

  const lines: InteractionTranscriptLine[] = [
    {
      id: "0",
      role: "customer",
      speakerLabel: "Customer",
      time: "0:05",
      text: open,
    },
    {
      id: "1",
      role: "agent",
      speakerLabel: agentShort,
      time: "0:18",
      text: `Hi — this is ${agentShort}. Thanks for reaching out. ${middle} Can you confirm the reference number or last four of the account?`,
    },
    {
      id: "2",
      role: "customer",
      speakerLabel: "Customer",
      time: "0:42",
      text:
        rng() > 0.5
          ? "Yes — it should be under my phone number ending in 4412."
          : "The confirmation I have is #1284903.",
    },
    {
      id: "3",
      role: "agent",
      speakerLabel: agentShort,
      time: "1:04",
      text: "Got it — I see the profile now. Give me one moment while I pull up the latest notes.",
    },
    {
      id: "4",
      role: "customer",
      speakerLabel: "Customer",
      time: "1:28",
      text: "Sure, take your time.",
    },
    {
      id: "5",
      role: "agent",
      speakerLabel: agentShort,
      time: "1:55",
      text:
        t.includes("bill") || t.includes("fee")
          ? "Thanks for waiting — the charge maps to your monthly service bundle. I can send a line-item breakdown to your email on file."
          : "Thanks for waiting — everything looks consistent on our side. I'll document this interaction and share the next step before we wrap.",
    },
  ];

  return lines;
}

function aiSummaryFor(categoryTitle: string, row: SampleInteractionRow): string {
  return `${row.agentName} handled a ${row.skill.toLowerCase()} interaction under ${categoryTitle}. The customer remained engaged; suggested follow-up: send a confirmation summary and verify contact preferences.`;
}

function formatMmSs(totalSec: number): string {
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

function buildPlaybackDetails(categoryTitle: string, row: SampleInteractionRow): InteractionPlaybackDetails {
  const rng = mulberry32(hashString(`${categoryTitle}|${row.id}|playbackUI`) || 1);
  const custFirst = pick(rng, FIRST_NAMES);
  const custLast = pick(rng, LAST_NAMES);
  const customerDisplayName = `${custFirst} ${custLast}`;
  const parts = row.duration.split(":");
  const mm = parseInt(parts[0] || "7", 10) || 7;
  const ss = parseInt(parts[1] || "0", 10) || 0;
  const totalSec = Math.max(60, mm * 60 + ss);
  const seg1 = Math.floor(totalSec * 0.35);
  const seg2 = Math.floor(totalSec * 0.72);

  const sentiments: PlaybackSegmentRow["sentiment"][] = ["positive", "positive", "negative"];
  const segments: PlaybackSegmentRow[] = [
    { label: "Segment 1", timeRange: `${formatMmSs(0)} - ${formatMmSs(seg1)}`, sentiment: sentiments[0]! },
    { label: "Segment 2", timeRange: `${formatMmSs(seg1)} - ${formatMmSs(seg2)}`, sentiment: sentiments[1]! },
    { label: "Segment 3", timeRange: `${formatMmSs(seg2)} - ${formatMmSs(totalSec)}`, sentiment: sentiments[2]! },
  ];

  const corp = pick(rng, ["NICE LTD", "ACME Corp", "Northwind LLC", "Contoso Inc", "Globex LLC"] as const);

  return {
    customerDisplayName,
    segmentLabel: "Segment 01",
    segmentTimeRange: `00:00 - ${formatMmSs(totalSec)}`,
    interactionDetailLabel: "Interaction & Business details",
    segments,
    agentNote: `Note: ${rng() > 0.5 ? "Customer verified identity via IVR." : "Account authenticated with backup questions."} ${categoryTitle.toLowerCase().includes("bill") ? "Discussed statement line items and due dates." : "Documented resolution path and follow-up owner."}`,
    businessData: [
      { label: "customer ID:", value: String(11000 + Math.floor(rng() * 900)) },
      { label: "customer name:", value: corp },
    ],
    coachAgentName: pick(rng, ["Jean Gray", "Helen Parr", "Jordan Lee", "Alex Rivera"] as const),
    coachMessage:
      "Review customer tone in segment 3 before policy language. Offer a concise recap and confirm the committed follow-up window on the ticket.",
    coachTimestamp: "0:10",
    enlightenSentimentLabel: "Enlighten Sentiment",
    behaviorScoreLabel: "Behavior Score",
  };
}

export function buildPlaybackPayload(categoryTitle: string, row: SampleInteractionRow): InteractionPlaybackPayload {
  return {
    sourceCategory: categoryTitle,
    meta: {
      agentName: row.agentName,
      team: row.team,
      dateTime: row.dateTime,
      csat: row.csat,
      skill: row.skill,
      duration: row.duration,
    },
    transcript: transcriptForSource(categoryTitle, row),
    aiInsightsSummary: aiSummaryFor(categoryTitle, row),
    playback: buildPlaybackDetails(categoryTitle, row),
  };
}

/** Prefer popup; fall back to a new tab if blocked. Uses localStorage + ?sid= because sessionStorage is per window. */
export function openInteractionPlaybackWindow(payload: InteractionPlaybackPayload): void {
  const sid = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 12)}`;
  try {
    localStorage.setItem(`${SAMPLE_PLAYBACK_STORAGE_KEY}:${sid}`, JSON.stringify(payload));
  } catch {
    return;
  }

  const base = import.meta.env.BASE_URL || "/";
  const normalized = base.endsWith("/") ? base : `${base}/`;
  const urlObj = new URL("interaction-playback", `${window.location.origin}${normalized}`);
  urlObj.searchParams.set("sid", sid);
  const url = urlObj.href;

  const width = 1320;
  const height = 860;
  const left = Math.max(0, window.screenX + (window.outerWidth - width) / 2);
  const top = Math.max(0, window.screenY + (window.outerHeight - height) / 2);
  const features = [
    `popup=yes`,
    `width=${width}`,
    `height=${height}`,
    `left=${left}`,
    `top=${top}`,
    "menubar=no",
    "toolbar=no",
    "location=no",
    "status=no",
    "resizable=yes",
    "scrollbars=yes",
  ].join(",");

  const handle = window.open(url, "AutoInsightInteractionPlayback", features);
  if (!handle) {
    window.open(url, "_blank", "noopener,noreferrer");
  }
}
