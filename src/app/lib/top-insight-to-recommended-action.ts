import type { RecommendedAction, ActionType, PriorityLevel } from "../data/recommended-actions";
import type { TopInsightCard } from "../data/explore-data";

/** Avoid collision with `recommendedActionsData` ids (used for icon map). */
const TOP_INSIGHT_ACTION_ID_OFFSET = 90_000;

function stableHandoffs(seed: string, cardId: number): number {
  let h = cardId * 7919;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) | 0;
  return 380 + (Math.abs(h) % 900);
}

function opportunityImpact(card: Extract<TopInsightCard, { segment: "opportunity" }>): {
  impactValue: string;
  impactLabel: string;
  projectedROI: string;
} {
  const d = card.detail;
  if (d.includes("deflection")) {
    const m = d.match(/(\d+(?:\.\d+)?)%/);
    const pct = m ? m[1] : "18";
    return {
      impactValue: `+${pct}% Deflection`,
      impactLabel: "Weekly chat volume",
      projectedROI: "$1,800/wk",
    };
  }
  if (d.includes("agent-hours") || d.includes("reduction")) {
    return {
      impactValue: "-45 agent-hrs/wk",
      impactLabel: "Manual review time",
      projectedROI: "$2,400/wk",
    };
  }
  const annual = d.match(/\$[\d,]+K?(?:\s*\/\s*yr|\s*annual)/i);
  if (annual) {
    const raw = annual[0].replace(/\s*annual/i, "/yr").trim();
    return {
      impactValue: "+16% Containment",
      impactLabel: card.title,
      projectedROI: raw.includes("/yr") ? raw : `${raw}/yr`,
    };
  }
  if (d.includes("calls")) {
    return {
      impactValue: "+14% Containment",
      impactLabel: card.title,
      projectedROI: "$2,200/wk",
    };
  }
  return {
    impactValue: "+12% Containment",
    impactLabel: card.title,
    projectedROI: "$2,100/wk",
  };
}

/**
 * Builds a {@link RecommendedAction} for {@link RecommendedActionSheet} from a Top Insights card.
 */
export function topInsightCardToRecommendedAction(card: TopInsightCard): RecommendedAction {
  const id = TOP_INSIGHT_ACTION_ID_OFFSET + card.id;
  const handoffs = stableHandoffs(card.title + card.description, card.id);

  if (card.segment === "anomaly") {
    const priority: PriorityLevel = card.severity === "Critical" ? "High" : "Medium";
    const csatHeavy = card.title.toLowerCase().includes("csat");
    return {
      id,
      title: card.title,
      description: card.description,
      note: card.detail,
      type: "Process Change",
      priority,
      impactValue: csatHeavy ? "+18% CSAT stabilization" : "-35% excess handle time",
      impactLabel: csatHeavy ? "Customer satisfaction" : "AHT variance",
      projectedROI: "$2,400/wk",
      handoffsPerDay: handoffs,
      affectedIntent: "Operations & survey signals",
      escalationsToday: handoffs,
      csatImpact: csatHeavy ? "-15.0%" : "-4.2%",
      estFixTime: card.severity === "Critical" ? "< 1 hour" : "< 4 hours",
      whatWillHappen:
        "Correlated intents, queue segments, and agent cohorts surface automatically. Owners get a prioritized playbook—temporary staffing, macro updates, or knowledge refreshes—so the signal does not compound across channels.",
    };
  }

  const type: ActionType = card.showActionPill ? "Tool Build" : "AI Agent";
  const { impactValue, impactLabel, projectedROI } = opportunityImpact(card);

  return {
    id,
    title: card.title,
    description: card.description,
    note: card.detail,
    type,
    priority: "High",
    impactValue,
    impactLabel,
    projectedROI,
    handoffsPerDay: handoffs,
    affectedIntent: card.title,
    escalationsToday: handoffs,
    csatImpact: "+2.4%",
    estFixTime: "< 45 min",
    whatWillHappen: `A targeted automation is scoped for “${card.title}” using your interaction mix and handle-time profile. The agent handles repeatable steps with guardrails, hands off edge cases cleanly, and measures containment lift weekly.`,
  };
}
