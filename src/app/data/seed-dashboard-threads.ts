import type { ChatThread } from "../contexts/DashboardChatContext";
import type { ChatMessage } from "../contexts/DashboardChatContext";

export interface SeedThread {
  thread: ChatThread;
  messages: ChatMessage[];
}

/** Seed threads keyed by the OOTB dashboard ID used as the persist key */
export const SEED_DASHBOARD_THREADS: Record<string, SeedThread[]> = {
  // ── agent-queries (2 threads) ──────────────────────────────────────────────
  "agent-queries": [
    {
      thread: {
        id: "seed-aq-1",
        title: "Which queries have deflection potential?",
        createdAt: new Date("2026-01-28T10:10:00"),
        updatedAt: new Date("2026-01-28T10:12:29"),
      },
      messages: [
        {
          id: "seed-aq-1-m1",
          role: "user",
          content: "Which agent queries have the highest deflection potential?",
          timestamp: new Date("2026-01-28T10:10:00"),
        },
        {
          id: "seed-aq-1-m2",
          role: "assistant",
          content:
            "The top query clusters where self-service or automation could deflect agent workload are password resets, order status checks, and plan upgrade questions — together accounting for 41% of total query volume. All three have existing self-service paths that are underutilized. Estimated monthly agent hours saved if fully deflected: ~1,420 hrs.",
          timestamp: new Date("2026-01-28T10:10:18"),
        },
        {
          id: "seed-aq-1-m3",
          role: "user",
          content: "What would it take to actually deflect the password reset ones?",
          timestamp: new Date("2026-01-28T10:12:05"),
        },
        {
          id: "seed-aq-1-m4",
          role: "assistant",
          content:
            "Password reset deflection is mostly a routing problem. The self-service flow already exists — 73% of users who reach it successfully reset without agent help. The issue is that 62% of users who contact an agent about this never saw the self-service option. Surfacing it in the chat widget before opening a conversation could deflect the majority of these queries with minimal engineering lift.",
          timestamp: new Date("2026-01-28T10:12:29"),
        },
      ],
    },
    {
      thread: {
        id: "seed-aq-2",
        title: "Are agents searching before escalating?",
        createdAt: new Date("2026-02-10T15:40:00"),
        updatedAt: new Date("2026-02-10T15:41:38"),
      },
      messages: [
        {
          id: "seed-aq-2-m1",
          role: "user",
          content: "Are agents using internal search effectively before escalating?",
          timestamp: new Date("2026-02-10T15:40:00"),
        },
        {
          id: "seed-aq-2-m2",
          role: "assistant",
          content:
            "Search usage before escalation varies significantly by team. Tier 1 agents perform a search in 68% of conversations before escalating, but Tier 2 drops to 29%. Conversations with at least one search event resolve 22% faster on average, suggesting there's meaningful room to improve Tier 2 search habits.",
          timestamp: new Date("2026-02-10T15:40:14"),
        },
        {
          id: "seed-aq-2-m3",
          role: "user",
          content: "What are Tier 2 agents doing instead?",
          timestamp: new Date("2026-02-10T15:41:20"),
        },
        {
          id: "seed-aq-2-m4",
          role: "assistant",
          content:
            "Tier 2 agents are more likely to rely on direct colleague messaging, with 54% flagging 'asked a colleague' as their primary resolution path. This is faster in the short term but doesn't scale and bypasses the knowledge base, so those answers never get captured for future use.",
          timestamp: new Date("2026-02-10T15:41:38"),
        },
      ],
    },
  ],

  // ── auto-summary (1 thread) ────────────────────────────────────────────────
  "auto-summary": [
    {
      thread: {
        id: "seed-as-1",
        title: "AI summary accuracy this week",
        createdAt: new Date("2026-02-03T08:55:00"),
        updatedAt: new Date("2026-02-03T08:55:20"),
      },
      messages: [
        {
          id: "seed-as-1-m1",
          role: "user",
          content: "How accurate are the AI-generated conversation summaries this week?",
          timestamp: new Date("2026-02-03T08:55:00"),
        },
        {
          id: "seed-as-1-m2",
          role: "assistant",
          content:
            "This week's auto-summary accuracy is sitting at 91.4% — up from 88.7% last week. The main improvement came from better handling of multi-intent conversations after the model update on Monday. However, summaries for conversations involving billing disputes still lag at 84.2% accuracy.",
          timestamp: new Date("2026-02-03T08:55:20"),
        },
      ],
    },
  ],

  // ── task-assist (2 threads) ────────────────────────────────────────────────
  "task-assist": [
    {
      thread: {
        id: "seed-ta-1",
        title: "Fastest tasks completed with Task Assist",
        createdAt: new Date("2026-02-06T13:20:00"),
        updatedAt: new Date("2026-02-06T13:20:22"),
      },
      messages: [
        {
          id: "seed-ta-1-m1",
          role: "user",
          content: "What tasks are agents completing fastest with Task Assist?",
          timestamp: new Date("2026-02-06T13:20:00"),
        },
        {
          id: "seed-ta-1-m2",
          role: "assistant",
          content:
            "The three fastest-completed task types are subscription downgrades (avg 38 sec), address updates (avg 52 sec), and refund initiations (avg 1 min 14 sec). All three have pre-filled form templates in Task Assist, which accounts for the speed advantage versus free-form task handling.",
          timestamp: new Date("2026-02-06T13:20:22"),
        },
      ],
    },
    {
      thread: {
        id: "seed-ta-2",
        title: "Task Assist adoption month over month",
        createdAt: new Date("2026-02-18T09:05:00"),
        updatedAt: new Date("2026-02-18T09:07:01"),
      },
      messages: [
        {
          id: "seed-ta-2-m1",
          role: "user",
          content: "Is Task Assist adoption growing month over month?",
          timestamp: new Date("2026-02-18T09:05:00"),
        },
        {
          id: "seed-ta-2-m2",
          role: "assistant",
          content:
            "Adoption has grown consistently: 41% in November, 51% in December, 57% in January, and 63% so far in February. The jump from December to January correlates with the onboarding module released Jan 6th. Teams that completed onboarding show 79% adoption vs 47% for those who haven't.",
          timestamp: new Date("2026-02-18T09:05:19"),
        },
        {
          id: "seed-ta-2-m3",
          role: "user",
          content: "Which teams still have low adoption?",
          timestamp: new Date("2026-02-18T09:06:40"),
        },
        {
          id: "seed-ta-2-m4",
          role: "assistant",
          content:
            "The Technical Escalations team is the outlier at 31% adoption. Their team lead noted that agents feel the task templates don't map well to their more complex workflows. This suggests a template gap rather than a training issue — adding 3–4 technical task templates could move the needle significantly.",
          timestamp: new Date("2026-02-18T09:07:01"),
        },
      ],
    },
  ],

  // ── intent-nlu (3 threads) ────────────────────────────────────────────────
  "intent-nlu": [
    {
      thread: {
        id: "seed-nlu-1",
        title: "Most misclassified intents this month",
        createdAt: new Date("2026-01-31T14:00:00"),
        updatedAt: new Date("2026-01-31T14:00:17"),
      },
      messages: [
        {
          id: "seed-nlu-1-m1",
          role: "user",
          content: "What intents are being misclassified the most?",
          timestamp: new Date("2026-01-31T14:00:00"),
        },
        {
          id: "seed-nlu-1-m2",
          role: "assistant",
          content:
            "The top misclassification pairs this month involve intents that are semantically close. 'Billing dispute' is confused with 'payment failed' in 9.3% of cases, and 'cancel subscription' is misrouted as 'downgrade plan' 7.1% of the time. Both pairs share vocabulary overlap that the current model handles inconsistently.",
          timestamp: new Date("2026-01-31T14:00:17"),
        },
      ],
    },
    {
      thread: {
        id: "seed-nlu-2",
        title: "NLU confidence dropping on billing topics",
        createdAt: new Date("2026-02-12T16:30:00"),
        updatedAt: new Date("2026-02-12T16:32:10"),
      },
      messages: [
        {
          id: "seed-nlu-2-m1",
          role: "user",
          content: "Why is NLU confidence dropping on billing-related topics this week?",
          timestamp: new Date("2026-02-12T16:30:00"),
        },
        {
          id: "seed-nlu-2-m2",
          role: "assistant",
          content:
            "The dip in billing NLU confidence (down from 91% to 86% since Monday) correlates with an influx of conversations referencing the new tiered pricing plan announced Feb 10th. The model hasn't seen training examples that include the new plan names and SKU identifiers, so it's falling back to lower-confidence classifications.",
          timestamp: new Date("2026-02-12T16:30:21"),
        },
        {
          id: "seed-nlu-2-m3",
          role: "user",
          content: "How quickly can we fix this?",
          timestamp: new Date("2026-02-12T16:31:45"),
        },
        {
          id: "seed-nlu-2-m4",
          role: "assistant",
          content:
            "Adding 50–80 labeled examples covering the new plan terminology should recover accuracy within 24–48 hours of a retrain. The fastest path is to sample today's misclassified conversations, have a reviewer label them, and trigger a lightweight fine-tuning run. The model should stabilize before the weekend volume spike.",
          timestamp: new Date("2026-02-12T16:32:10"),
        },
      ],
    },
    {
      thread: {
        id: "seed-nlu-3",
        title: "Intent accuracy: Feb vs Mar comparison",
        createdAt: new Date("2026-03-02T11:15:00"),
        updatedAt: new Date("2026-03-02T11:15:25"),
      },
      messages: [
        {
          id: "seed-nlu-3-m1",
          role: "user",
          content: "Compare intent recognition accuracy this month versus last month",
          timestamp: new Date("2026-03-02T11:15:00"),
        },
        {
          id: "seed-nlu-3-m2",
          role: "assistant",
          content:
            "Overall intent accuracy improved from 91.4% in February to 93.8% in March so far. The biggest gains were in billing (up 4.2 pp) following the February retraining, and in 'feature request' intents (up 2.8 pp) after the taxonomy refinement. 'Technical troubleshooting' is the only intent cluster that declined, down 1.1 pp.",
          timestamp: new Date("2026-03-02T11:15:25"),
        },
      ],
    },
  ],

  // ── goals-outcomes (1 thread) ──────────────────────────────────────────────
  "goals-outcomes": [
    {
      thread: {
        id: "seed-go-1",
        title: "AI agent goals with lowest completion rates",
        createdAt: new Date("2026-02-20T10:45:00"),
        updatedAt: new Date("2026-02-20T10:45:30"),
      },
      messages: [
        {
          id: "seed-go-1-m1",
          role: "user",
          content: "Which AI agent goals have the lowest completion rate right now?",
          timestamp: new Date("2026-02-20T10:45:00"),
        },
        {
          id: "seed-go-1-m2",
          role: "assistant",
          content:
            "Three goals are significantly underperforming: 'Schedule a callback' (38% completion), 'Initiate a return' (44%), and 'Upgrade plan upsell' (29%). All three require API calls to external systems that have elevated latency this month, causing timeouts and abandoned flows before goal completion.",
          timestamp: new Date("2026-02-20T10:45:30"),
        },
      ],
    },
  ],

  // ── agent-ops (2 threads) ──────────────────────────────────────────────────
  "agent-ops": [
    {
      thread: {
        id: "seed-aops-1",
        title: "AI agent throughput during volume spikes",
        createdAt: new Date("2026-02-14T08:30:00"),
        updatedAt: new Date("2026-02-14T08:32:44"),
      },
      messages: [
        {
          id: "seed-aops-1-m1",
          role: "user",
          content: "Is our AI agent throughput keeping up with volume spikes?",
          timestamp: new Date("2026-02-14T08:30:00"),
        },
        {
          id: "seed-aops-1-m2",
          role: "assistant",
          content:
            "Throughput is generally keeping pace, but there's a pattern of degradation during Tuesday and Thursday afternoon spikes (2–5pm). During those windows, p95 response latency climbs from a baseline of 1.2s to 4.7s, and queue depth briefly exceeds the auto-scale threshold, causing a 6–8 minute lag before new instances spin up.",
          timestamp: new Date("2026-02-14T08:30:22"),
        },
        {
          id: "seed-aops-1-m3",
          role: "user",
          content: "Can we pre-warm instances to avoid the scale lag?",
          timestamp: new Date("2026-02-14T08:32:10"),
        },
        {
          id: "seed-aops-1-m4",
          role: "assistant",
          content:
            "Yes — pre-warming is viable given the predictability of the spikes. Provisioning 2 additional warm instances by 1:45pm on Tuesdays and Thursdays would absorb the initial surge before auto-scale kicks in. Based on current instance costs, this adds roughly $180/month.",
          timestamp: new Date("2026-02-14T08:32:44"),
        },
      ],
    },
    {
      thread: {
        id: "seed-aops-2",
        title: "What's causing weekend latency spikes?",
        createdAt: new Date("2026-03-09T09:50:00"),
        updatedAt: new Date("2026-03-09T09:50:18"),
      },
      messages: [
        {
          id: "seed-aops-2-m1",
          role: "user",
          content: "What's causing AI agent latency spikes on weekends?",
          timestamp: new Date("2026-03-09T09:50:00"),
        },
        {
          id: "seed-aops-2-m2",
          role: "assistant",
          content:
            "Weekend latency spikes trace back to a scheduled batch job — the knowledge base re-indexing process — running every Saturday at 11pm UTC. It competes with live agent traffic for database read throughput, pushing p99 latency up by 2.1× for about 35 minutes. Weekday nights aren't affected because volume is low enough that there's no contention.",
          timestamp: new Date("2026-03-09T09:50:18"),
        },
      ],
    },
  ],

  // ── ai-agent-vs-agent (1 thread — standalone category) ────────────────────
  "ai-agent-vs-agent": [
    {
      thread: {
        id: "seed-ava-1",
        title: "AI vs human agent resolution rate",
        createdAt: new Date("2026-02-26T13:00:00"),
        updatedAt: new Date("2026-02-26T13:02:41"),
      },
      messages: [
        {
          id: "seed-ava-1-m1",
          role: "user",
          content: "How does AI agent resolution rate compare to human agents right now?",
          timestamp: new Date("2026-02-26T13:00:00"),
        },
        {
          id: "seed-ava-1-m2",
          role: "assistant",
          content:
            "For conversations the AI agent handles end-to-end, the resolution rate is 74.2%. Human agents resolve 88.6% of conversations, but the comparison isn't apples-to-apples — human agents primarily handle complex escalations the AI routed away. For overlap intents where both handle similar cases, AI resolution is 81.3% vs human 86.9%.",
          timestamp: new Date("2026-02-26T13:00:22"),
        },
        {
          id: "seed-ava-1-m3",
          role: "user",
          content: "Where does the AI actually outperform humans?",
          timestamp: new Date("2026-02-26T13:02:15"),
        },
        {
          id: "seed-ava-1-m4",
          role: "assistant",
          content:
            "The AI outperforms human agents on three dimensions: response speed (median 2s vs 4.2 min), consistency (variance in resolution steps is 3× lower for AI), and after-hours handling (AI maintains 74% resolution at 2am; overnight human coverage resolves only 61%). CSAT scores are also nearly identical for routine transactional intents like order tracking and password resets.",
          timestamp: new Date("2026-02-26T13:02:41"),
        },
      ],
    },
  ],

  // ── knowledge-responses (2 threads) ───────────────────────────────────────
  "knowledge-responses": [
    {
      thread: {
        id: "seed-kr-1",
        title: "Highest usage knowledge articles",
        createdAt: new Date("2026-03-05T10:20:00"),
        updatedAt: new Date("2026-03-05T10:20:28"),
      },
      messages: [
        {
          id: "seed-kr-1-m1",
          role: "user",
          content: "Which knowledge articles are being served the most?",
          timestamp: new Date("2026-03-05T10:20:00"),
        },
        {
          id: "seed-kr-1-m2",
          role: "assistant",
          content:
            "The top 5 articles account for 38% of all knowledge responses this month. 'How to reset your password' leads at 12,400 serves, followed by 'Understanding your invoice' (9,800), 'Cancellation policy' (7,200), 'How to add a user' (5,900), and 'Connecting integrations' (4,700). The cancellation policy article has a notably high deflection failure rate — 31% of users who receive it still contact an agent afterward.",
          timestamp: new Date("2026-03-05T10:20:28"),
        },
      ],
    },
    {
      thread: {
        id: "seed-kr-2",
        title: "Are knowledge responses resolving conversations?",
        createdAt: new Date("2026-03-11T14:55:00"),
        updatedAt: new Date("2026-03-11T14:57:02"),
      },
      messages: [
        {
          id: "seed-kr-2-m1",
          role: "user",
          content: "Are knowledge responses actually resolving conversations or just delaying escalation?",
          timestamp: new Date("2026-03-11T14:55:00"),
        },
        {
          id: "seed-kr-2-m2",
          role: "assistant",
          content:
            "68.4% of conversations that receive a knowledge response close without further contact within 24 hours — that's the true deflection rate. However, 18% of users return within 72 hours with the same intent, suggesting the resolution was incomplete. The remaining 13.6% immediately escalate to an agent, meaning the article actively failed to help.",
          timestamp: new Date("2026-03-11T14:55:21"),
        },
        {
          id: "seed-kr-2-m3",
          role: "user",
          content: "Which articles have the highest re-contact rate?",
          timestamp: new Date("2026-03-11T14:56:40"),
        },
        {
          id: "seed-kr-2-m4",
          role: "assistant",
          content:
            "The 'Cancellation policy' article has a 31% re-contact rate — highest in the knowledge base. 'Refund timelines' (26%) and 'API rate limits' (24%) are next. All three share a common issue: they describe policy without giving the user a clear next action. Adding a 'what to do next' section to each could meaningfully reduce re-contact.",
          timestamp: new Date("2026-03-11T14:57:02"),
        },
      ],
    },
  ],

  // ── llm-ai-agent (1 thread) ────────────────────────────────────────────────
  "llm-ai-agent": [
    {
      thread: {
        id: "seed-llm-1",
        title: "What's driving LLM token costs this month?",
        createdAt: new Date("2026-03-14T09:30:00"),
        updatedAt: new Date("2026-03-14T09:32:55"),
      },
      messages: [
        {
          id: "seed-llm-1-m1",
          role: "user",
          content: "What's driving our LLM token costs this month?",
          timestamp: new Date("2026-03-14T09:30:00"),
        },
        {
          id: "seed-llm-1-m2",
          role: "assistant",
          content:
            "LLM costs are up 22% month-over-month, driven by two factors: a 14% increase in AI agent conversation volume and a 7% increase in average tokens per conversation. The token-per-conversation increase traces to longer system prompts added in the Feb 28th release — the new context injection adds ~340 tokens per turn on average.",
          timestamp: new Date("2026-03-14T09:30:25"),
        },
        {
          id: "seed-llm-1-m3",
          role: "user",
          content: "Can we reduce the token count without hurting quality?",
          timestamp: new Date("2026-03-14T09:32:10"),
        },
        {
          id: "seed-llm-1-m4",
          role: "assistant",
          content:
            "Yes — there are three levers. First, trimming the new context injection to include only fields relevant to the current intent could cut 180–220 tokens per turn with minimal quality impact. Second, caching repeated system prompt segments across turns in long conversations could save another 80–120 tokens. Together, these optimizations could save an estimated $2,100–2,600/month at current volume.",
          timestamp: new Date("2026-03-14T09:32:55"),
        },
      ],
    },
  ],

  // ── Saved folder dashboards ────────────────────────────────────────────────

  // proj-1 / dash-1 — Q1 Escalations (2 threads)
  "proj-1/dash-1": [
    {
      thread: {
        id: "seed-p1d1-1",
        title: "What's driving the Q1 escalation spike?",
        createdAt: new Date("2026-01-20T11:00:00"),
        updatedAt: new Date("2026-01-20T11:03:12"),
      },
      messages: [
        {
          id: "seed-p1d1-1-m1",
          role: "user",
          content: "Escalations jumped 18% in the first two weeks of January. What's driving it?",
          timestamp: new Date("2026-01-20T11:00:00"),
        },
        {
          id: "seed-p1d1-1-m2",
          role: "assistant",
          content:
            "The spike maps almost entirely to one root cause: the Jan 6th billing system migration introduced a mismatch between displayed invoice dates and actual charge dates. This generated a surge of 'incorrect charge' contacts that agents couldn't resolve with standard tooling — they had to manually file corrections, which categorizes as an escalation. The affected customer segment is monthly subscribers on legacy plans.",
          timestamp: new Date("2026-01-20T11:00:28"),
        },
        {
          id: "seed-p1d1-1-m3",
          role: "user",
          content: "Is it still ongoing or has it stabilized?",
          timestamp: new Date("2026-01-20T11:02:44"),
        },
        {
          id: "seed-p1d1-1-m4",
          role: "assistant",
          content:
            "The volume peaked on Jan 9th and has been declining since the billing team pushed a patch on Jan 14th. Escalations are still 6% above baseline but trending down. At the current rate you should be back to normal within 4–5 business days. I'd recommend flagging the ~340 affected accounts proactively so they receive a credit notice before they contact support.",
          timestamp: new Date("2026-01-20T11:03:12"),
        },
      ],
    },
    {
      thread: {
        id: "seed-p1d1-2",
        title: "Which tier is responsible for most escalations?",
        createdAt: new Date("2026-02-11T14:20:00"),
        updatedAt: new Date("2026-02-11T14:20:33"),
      },
      messages: [
        {
          id: "seed-p1d1-2-m1",
          role: "user",
          content: "Which support tier is generating the most escalations in Q1?",
          timestamp: new Date("2026-02-11T14:20:00"),
        },
        {
          id: "seed-p1d1-2-m2",
          role: "assistant",
          content:
            "Tier 1 originates 61% of all Q1 escalations by volume, but that's proportional to their share of overall contact volume. When normalized by contacts handled, Tier 2 actually has the higher escalation rate — 14.2% of their cases escalate vs 9.7% for Tier 1. Tier 2 escalations are concentrated in billing dispute and enterprise account categories, suggesting a skills or tooling gap for complex account issues.",
          timestamp: new Date("2026-02-11T14:20:33"),
        },
      ],
    },
  ],

  // proj-1 / dash-2 — Self-Service Trends (2 threads)
  "proj-1/dash-2": [
    {
      thread: {
        id: "seed-p1d2-1",
        title: "Why is self-service containment dropping?",
        createdAt: new Date("2026-02-04T09:30:00"),
        updatedAt: new Date("2026-02-04T09:32:08"),
      },
      messages: [
        {
          id: "seed-p1d2-1-m1",
          role: "user",
          content: "Containment rate dropped from 68% to 61% in January. What changed?",
          timestamp: new Date("2026-02-04T09:30:00"),
        },
        {
          id: "seed-p1d2-1-m2",
          role: "assistant",
          content:
            "Two overlapping causes: the billing migration confusion drove users to abandon the chatbot mid-flow (those are counted as non-contained), and a UI regression in the help center search introduced Jan 3rd returned blank results for queries longer than 8 words — affecting about 19% of searches. The second issue was patched Jan 22nd but recovery in containment lags the fix by about 2 weeks as user habits adjust.",
          timestamp: new Date("2026-02-04T09:30:44"),
        },
        {
          id: "seed-p1d2-1-m3",
          role: "user",
          content: "Where are users dropping off in the chatbot flow?",
          timestamp: new Date("2026-02-04T09:31:50"),
        },
        {
          id: "seed-p1d2-1-m4",
          role: "assistant",
          content:
            "The sharpest drop-off is at the account verification step — 38% of users who reach it abandon. This step asks for a 6-digit account PIN that many customers don't have readily accessible. Replacing PIN verification with the last 4 digits of the billing email could reduce abandonment here by an estimated 40–50%, based on benchmarks from similar flows.",
          timestamp: new Date("2026-02-04T09:32:08"),
        },
      ],
    },
    {
      thread: {
        id: "seed-p1d2-2",
        title: "Top self-service intents by containment rate",
        createdAt: new Date("2026-03-01T10:10:00"),
        updatedAt: new Date("2026-03-01T10:10:22"),
      },
      messages: [
        {
          id: "seed-p1d2-2-m1",
          role: "user",
          content: "Which self-service intents have the highest containment rates?",
          timestamp: new Date("2026-03-01T10:10:00"),
        },
        {
          id: "seed-p1d2-2-m2",
          role: "assistant",
          content:
            "Top containment rates: password reset (94%), order status check (91%), return label generation (88%), and plan details lookup (85%). These four intents share two traits — they have unambiguous outcomes and require no agent judgment. The worst performers are billing dispute (29%) and enterprise onboarding (34%), both of which need contextual account data that the self-service layer can't surface.",
          timestamp: new Date("2026-03-01T10:10:22"),
        },
      ],
    },
  ],

  // proj-1 / dash-10 — Agent Handle Time Breakdown (1 thread)
  "proj-1/dash-10": [
    {
      thread: {
        id: "seed-p1d10-1",
        title: "Does AI co-pilot usage reduce handle time?",
        createdAt: new Date("2026-02-24T13:45:00"),
        updatedAt: new Date("2026-02-24T13:47:30"),
      },
      messages: [
        {
          id: "seed-p1d10-1-m1",
          role: "user",
          content: "Is there a measurable difference in handle time between agents using AI co-pilot vs those who aren't?",
          timestamp: new Date("2026-02-24T13:45:00"),
        },
        {
          id: "seed-p1d10-1-m2",
          role: "assistant",
          content:
            "Yes — the gap is significant and consistent. Agents using AI co-pilot average 4.1 min handle time vs 6.8 min for those who aren't (39% faster). The biggest time savings come from the suggested-response feature, which accounts for ~1.4 min of the gap on average. The knowledge augmentation feature saves ~0.8 min. The remaining ~0.5 min gap is harder to attribute but likely reflects co-pilot's role in reducing context-switching.",
          timestamp: new Date("2026-02-24T13:45:38"),
        },
        {
          id: "seed-p1d10-1-m3",
          role: "user",
          content: "Which agents have the highest handle time and are they using co-pilot?",
          timestamp: new Date("2026-02-24T13:47:05"),
        },
        {
          id: "seed-p1d10-1-m4",
          role: "assistant",
          content:
            "Of the top 10 agents by handle time, 7 are not using co-pilot at all. The top outlier is averaging 12.4 min per conversation — nearly 3× the team median. Three of the 10 are using co-pilot but still have elevated handle times, which suggests a workflow issue rather than a tooling issue for those specific agents.",
          timestamp: new Date("2026-02-24T13:47:30"),
        },
      ],
    },
  ],

  // proj-2 / dash-3 — Feature Adoption (2 threads)
  "proj-2/dash-3": [
    {
      thread: {
        id: "seed-p2d3-1",
        title: "Billing portal adoption funnel drop-off",
        createdAt: new Date("2026-01-28T15:00:00"),
        updatedAt: new Date("2026-01-28T15:01:15"),
      },
      messages: [
        {
          id: "seed-p2d3-1-m1",
          role: "user",
          content: "Where are users dropping off in the billing portal adoption funnel?",
          timestamp: new Date("2026-01-28T15:00:00"),
        },
        {
          id: "seed-p2d3-1-m2",
          role: "assistant",
          content:
            "The funnel shows a sharp drop between 'first login' (74% of invitees) and 'completed first action' (41%). Users who log in but take no action most commonly view the invoice list and exit — survey data suggests they expected to find their next payment date prominently displayed, but it's currently buried two tabs deep. Surfacing that date on the portal home screen is the single highest-leverage fix based on where attention drops.",
          timestamp: new Date("2026-01-28T15:01:15"),
        },
      ],
    },
    {
      thread: {
        id: "seed-p2d3-2",
        title: "Which features have stalled after initial adoption?",
        createdAt: new Date("2026-02-19T11:30:00"),
        updatedAt: new Date("2026-02-19T11:32:44"),
      },
      messages: [
        {
          id: "seed-p2d3-2-m1",
          role: "user",
          content: "Which recently launched features are showing stalled adoption after the initial wave?",
          timestamp: new Date("2026-02-19T11:30:00"),
        },
        {
          id: "seed-p2d3-2-m2",
          role: "assistant",
          content:
            "Three features show adoption plateau within 2 weeks of launch: custom notification preferences (adopted by 31% of users, but 68% of adopters haven't touched it since day 3), the team activity feed (23% adoption, nearly zero repeat visits), and bulk ticket tagging (19% adoption, 80% single-use). Contrast this with billing portal and smart search, which both show growing weekly active usage 4+ weeks post-launch.",
          timestamp: new Date("2026-02-19T11:31:10"),
        },
        {
          id: "seed-p2d3-2-m3",
          role: "user",
          content: "What do the stalled features have in common?",
          timestamp: new Date("2026-02-19T11:32:20"),
        },
        {
          id: "seed-p2d3-2-m4",
          role: "assistant",
          content:
            "All three require multi-step configuration before delivering value — users need to invest time upfront before the feature does anything useful. The features with sustained adoption were immediately useful on first interaction. The fix is likely guided setup: a 2–3 step onboarding flow that delivers a 'wow moment' before asking users to configure anything.",
          timestamp: new Date("2026-02-19T11:32:44"),
        },
      ],
    },
  ],

  // proj-2 / dash-11 — Bug Report Trends (1 thread)
  "proj-2/dash-11": [
    {
      thread: {
        id: "seed-p2d11-1",
        title: "Bug categories spiking this sprint",
        createdAt: new Date("2026-03-03T10:00:00"),
        updatedAt: new Date("2026-03-03T10:01:55"),
      },
      messages: [
        {
          id: "seed-p2d11-1-m1",
          role: "user",
          content: "Which bug categories are spiking in the current sprint?",
          timestamp: new Date("2026-03-03T10:00:00"),
        },
        {
          id: "seed-p2d11-1-m2",
          role: "assistant",
          content:
            "Authentication-related bugs are up 44% this sprint — specifically session timeout errors on mobile Safari after the v4.2 release. UI rendering bugs are also elevated (+28%), concentrated in the new dashboard builder component. Data sync errors are flat. The authentication spike is the most urgent; it affects 8–12% of mobile sessions and is generating high-priority support contacts.",
          timestamp: new Date("2026-03-03T10:00:42"),
        },
        {
          id: "seed-p2d11-1-m3",
          role: "user",
          content: "Is resolution time keeping up with the volume increase?",
          timestamp: new Date("2026-03-03T10:01:30"),
        },
        {
          id: "seed-p2d11-1-m4",
          role: "assistant",
          content:
            "No — median resolution time for P1 bugs has slipped from 6.2h to 9.4h this sprint, a 52% increase. The engineering team is carrying 3 open P1s concurrently, which is above the typical threshold. P2 resolution time is within normal range. This suggests P1 capacity is the bottleneck, not process.",
          timestamp: new Date("2026-03-03T10:01:55"),
        },
      ],
    },
  ],

  // proj-2 / dash-12 — NPS by Product Area (2 threads)
  "proj-2/dash-12": [
    {
      thread: {
        id: "seed-p2d12-1",
        title: "Which product areas are dragging down NPS?",
        createdAt: new Date("2026-02-07T09:00:00"),
        updatedAt: new Date("2026-02-07T09:01:20"),
      },
      messages: [
        {
          id: "seed-p2d12-1-m1",
          role: "user",
          content: "Which product areas have the lowest NPS scores right now?",
          timestamp: new Date("2026-02-07T09:00:00"),
        },
        {
          id: "seed-p2d12-1-m2",
          role: "assistant",
          content:
            "The three lowest-NPS areas are billing & invoicing (NPS +12), integrations (NPS +18), and mobile app (NPS +24). For context, overall product NPS is +47. Billing is the biggest drag — it has the highest detractor rate at 31%, with verbatim themes clustering around 'confusing charges' and 'hard to find invoice history'. Both themes are directly addressable with the billing portal improvements already in flight.",
          timestamp: new Date("2026-02-07T09:01:20"),
        },
      ],
    },
    {
      thread: {
        id: "seed-p2d12-2",
        title: "What are promoters saying about the AI features?",
        createdAt: new Date("2026-03-10T14:15:00"),
        updatedAt: new Date("2026-03-10T14:16:48"),
      },
      messages: [
        {
          id: "seed-p2d12-2-m1",
          role: "user",
          content: "What themes are showing up in promoter verbatims for the AI features area?",
          timestamp: new Date("2026-03-10T14:15:00"),
        },
        {
          id: "seed-p2d12-2-m2",
          role: "assistant",
          content:
            "AI features has the highest NPS in the product at +68. Promoter verbatims cluster around three themes: speed ('instant answers', 'saves so much time'), accuracy ('gets it right without me having to re-explain'), and proactivity ('it flagged an issue before I noticed'). The proactivity theme has grown from 8% to 21% of promoter mentions over the last two quarters, suggesting the anomaly detection and smart suggestions features are resonating strongly.",
          timestamp: new Date("2026-03-10T14:15:55"),
        },
        {
          id: "seed-p2d12-2-m3",
          role: "user",
          content: "Any detractor themes in the AI area we should watch?",
          timestamp: new Date("2026-03-10T14:16:30"),
        },
        {
          id: "seed-p2d12-2-m4",
          role: "assistant",
          content:
            "Two detractor themes are emerging despite the high overall score: 'hallucinations on edge cases' (14% of detractors) and 'AI responses feel generic for my industry' (11%). The second theme is worth watching — it's grown 6 percentage points in 90 days and suggests an opportunity for vertical-specific fine-tuning or configurable personas.",
          timestamp: new Date("2026-03-10T14:16:48"),
        },
      ],
    },
  ],

  // ── Standalone saved dashboards ────────────────────────────────────────────

  // dash-4 — Weekly KPI Summary (2 threads)
  "dash-4": [
    {
      thread: {
        id: "seed-d4-1",
        title: "Is containment rate on track this week?",
        createdAt: new Date("2026-03-10T08:30:00"),
        updatedAt: new Date("2026-03-10T08:31:05"),
      },
      messages: [
        {
          id: "seed-d4-1-m1",
          role: "user",
          content: "How is containment rate trending so far this week vs our weekly target?",
          timestamp: new Date("2026-03-10T08:30:00"),
        },
        {
          id: "seed-d4-1-m2",
          role: "assistant",
          content:
            "As of Monday–Tuesday, containment is running at 71.4% against a weekly target of 74%. The shortfall is driven by a cluster of 'plan comparison' queries that are routing to agents because the comparison table in the chatbot is returning stale data since Sunday's pricing update. The data team has a fix in staging — if it deploys today, containment should recover by end of week.",
          timestamp: new Date("2026-03-10T08:31:05"),
        },
      ],
    },
    {
      thread: {
        id: "seed-d4-2",
        title: "Agent utilization looks high — should I be concerned?",
        createdAt: new Date("2026-03-13T11:00:00"),
        updatedAt: new Date("2026-03-13T11:02:10"),
      },
      messages: [
        {
          id: "seed-d4-2-m1",
          role: "user",
          content: "Agent utilization hit 91% last week. Is that something to be concerned about?",
          timestamp: new Date("2026-03-13T11:00:00"),
        },
        {
          id: "seed-d4-2-m2",
          role: "assistant",
          content:
            "91% utilization is above the healthy ceiling of 85% — at that level, agents don't have enough breathing room between conversations, which typically leads to quality degradation and burnout over 2–3 weeks. The spike correlates with the volume increase from the new product launch campaign. You have two levers: expand AI containment to absorb more simple queries, or add temporary surge capacity.",
          timestamp: new Date("2026-03-13T11:00:35"),
        },
        {
          id: "seed-d4-2-m3",
          role: "user",
          content: "Which lever is faster to act on?",
          timestamp: new Date("2026-03-13T11:01:50"),
        },
        {
          id: "seed-d4-2-m4",
          role: "assistant",
          content:
            "Expanding AI containment is faster if you already have untapped coverage — and you do. The 'plan comparison' and 'shipping status' query clusters are currently routing to agents unnecessarily due to the stale-data issue mentioned earlier. Fixing that alone could drop utilization by 4–6 percentage points within 48 hours, no headcount change required.",
          timestamp: new Date("2026-03-13T11:02:10"),
        },
      ],
    },
  ],

  // dash-5 — Monthly Business Review (2 threads)
  "dash-5": [
    {
      thread: {
        id: "seed-d5-1",
        title: "AI co-pilot ROI — is it measurable?",
        createdAt: new Date("2026-02-28T14:00:00"),
        updatedAt: new Date("2026-02-28T14:02:55"),
      },
      messages: [
        {
          id: "seed-d5-1-m1",
          role: "user",
          content: "Can we put a hard ROI number on the AI co-pilot program for the February business review?",
          timestamp: new Date("2026-02-28T14:00:00"),
        },
        {
          id: "seed-d5-1-m2",
          role: "assistant",
          content:
            "Yes — February data supports a solid ROI calculation. Co-pilot-assisted conversations have 39% lower handle time (2.7 min saved per conversation) across 28,400 assisted conversations this month. At your blended agent cost of $0.82/min, that's ~$64,200 in saved labor time. Co-pilot program cost (licensing + infrastructure) was $18,400 in February. Net ROI: ~$45,800, or a 3.5× return.",
          timestamp: new Date("2026-02-28T14:01:20"),
        },
        {
          id: "seed-d5-1-m3",
          role: "user",
          content: "Is that ROI improving or flat compared to prior months?",
          timestamp: new Date("2026-02-28T14:02:30"),
        },
        {
          id: "seed-d5-1-m4",
          role: "assistant",
          content:
            "Improving — December ROI was 2.1×, January was 2.8×, February is 3.5×. The trend reflects increasing adoption (63% of agents now using it vs 41% in December) and improving suggestion acceptance rate (71% vs 58%). If adoption reaches 80% by April as projected, ROI should cross 4× and the program will have paid for its full-year cost before mid-year.",
          timestamp: new Date("2026-02-28T14:02:55"),
        },
      ],
    },
    {
      thread: {
        id: "seed-d5-2",
        title: "Cost per interaction trending down?",
        createdAt: new Date("2026-03-01T09:15:00"),
        updatedAt: new Date("2026-03-01T09:15:48"),
      },
      messages: [
        {
          id: "seed-d5-2-m1",
          role: "user",
          content: "Is cost per interaction improving month over month?",
          timestamp: new Date("2026-03-01T09:15:00"),
        },
        {
          id: "seed-d5-2-m2",
          role: "assistant",
          content:
            "Yes — blended cost per interaction has declined from $4.82 in November to $3.71 in February, a 23% reduction over four months. The driver is a shift in channel mix: AI-handled interactions (cost ~$0.09 each) now represent 38% of total volume vs 24% in November. Human-only interactions remain flat at ~$8.40 each. The trend should continue as AI containment keeps expanding.",
          timestamp: new Date("2026-03-01T09:15:48"),
        },
      ],
    },
  ],

  // dash-13 — Quarterly Board Deck Metrics (1 thread)
  "dash-13": [
    {
      thread: {
        id: "seed-d13-1",
        title: "YoY automation rate growth for board deck",
        createdAt: new Date("2026-03-12T10:00:00"),
        updatedAt: new Date("2026-03-12T10:03:20"),
      },
      messages: [
        {
          id: "seed-d13-1-m1",
          role: "user",
          content: "What's the year-over-year automation rate growth we can report for the Q1 board deck?",
          timestamp: new Date("2026-03-12T10:00:00"),
        },
        {
          id: "seed-d13-1-m2",
          role: "assistant",
          content:
            "Automation rate (AI-handled conversations without human intervention) has grown from 21% in Q1 2025 to 38% in Q1 2026 — a 17 percentage point increase year-over-year. That's the strongest annual improvement since the AI program launched. Expressed as a multiplier: 1.8× more conversations are now fully automated than a year ago.",
          timestamp: new Date("2026-03-12T10:00:44"),
        },
        {
          id: "seed-d13-1-m3",
          role: "user",
          content: "What cost savings does that translate to for the board narrative?",
          timestamp: new Date("2026-03-12T10:02:40"),
        },
        {
          id: "seed-d13-1-m4",
          role: "assistant",
          content:
            "The 17pp automation lift on Q1 volume (estimated 1.24M interactions) represents approximately 211,000 interactions shifted from human-handled (~$8.40 each) to AI-handled (~$0.09 each). Gross cost avoidance: ~$1.77M in Q1 alone against a program investment of ~$420K — a 4.2× return for the quarter. Annualized, the program is on track to deliver $6.8–7.2M in cost avoidance for the full year.",
          timestamp: new Date("2026-03-12T10:03:20"),
        },
      ],
    },
  ],
};