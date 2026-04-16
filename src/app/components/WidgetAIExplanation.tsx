import { useMemo } from "react";
import { Sparkles } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import { Button } from "./ui/button";
import { cn } from "./ui/utils";

interface WidgetAIExplanationProps {
  widgetTitle: string;
  chartType?: string;
  className?: string;
}

/**
 * Deterministic hash to pick a stable AI summary for a given widget title.
 */
function hashTitle(title: string): number {
  let hash = 0;
  for (let i = 0; i < title.length; i++) {
    hash = ((hash << 5) - hash) + title.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

const explanationPool: Record<string, string[]> = {
  bar: [
    "This bar chart shows the relative distribution across categories. The tallest bars indicate the highest-performing segments. Consider focusing on under-performing categories — small improvements there may yield outsized gains compared to optimizing already-strong segments.",
    "The data reveals a clear hierarchy among categories. The top two segments account for the majority of total volume. The gap between leading and trailing categories is widening, suggesting market concentration that may warrant strategic re-balancing.",
    "Comparing bar heights reveals an uneven distribution with a long tail of smaller contributors. The top 3 categories drive roughly 65% of total activity. Monitoring the smallest bars for growth signals could uncover emerging trends early.",
  ],
  line: [
    "This trend line shows directional movement over time. The overall trajectory is upward, though short-term fluctuations are normal. Look for sustained deviations from the trend — three or more consecutive data points moving in the same direction often signal a real shift rather than noise.",
    "The line reveals a cyclical pattern with periodic peaks and troughs. The amplitude of these cycles has been increasing, which could indicate growing volatility in the underlying metric. Consider whether this variability aligns with seasonal or operational patterns.",
    "This time series displays a steady progression with a notable inflection point mid-period. The rate of change accelerated after this point, suggesting an external factor or intervention took effect. Correlating with known events may help attribute causation.",
  ],
  area: [
    "This area chart emphasizes cumulative volume over time. The filled region highlights how total output has grown. The steepness of recent growth suggests accelerating activity — if sustained, current trajectories would exceed prior period benchmarks.",
    "The shaded area reveals both magnitude and trend simultaneously. Growth has been consistent, with the area expanding steadily. The lack of sharp contractions suggests stable underlying demand with minimal disruption events.",
    "Comparing the area's expansion rate across periods shows a compound growth pattern. Earlier periods show modest gains while recent intervals demonstrate faster accumulation, indicating positive momentum building over time.",
  ],
  donut: [
    "This breakdown shows the proportional share of each segment. The largest slice dominates at roughly one-third of the total. The remaining segments are relatively evenly distributed, suggesting no single secondary category has emerged as a clear runner-up.",
    "The distribution reveals a multi-segment landscape where the top two categories together represent about half of all activity. The balance across remaining segments indicates a diversified base rather than over-reliance on any single source.",
    "Proportionally, this shows healthy diversification with no single category exceeding 40%. This distribution pattern tends to be more resilient to disruption since risk is spread across multiple contributing segments.",
  ],
  metric: [
    "This key metric represents a single important measurement for your operations. The current value reflects recent trends and should be evaluated against your target benchmarks. Consistent monitoring for sudden changes can help catch issues early.",
    "The displayed metric provides a snapshot of current performance. Compare this against historical baselines — a deviation greater than 10% typically warrants investigation into root causes and potential corrective actions.",
    "This metric captures an essential operational indicator. Its current value is within expected ranges based on recent history. Setting threshold-based alerts would help automate the detection of meaningful deviations.",
  ],
  radar: [
    "This radar chart maps performance across multiple dimensions simultaneously. Areas where the shape extends furthest indicate strengths, while inward dips highlight opportunities for improvement. The overall symmetry suggests balanced capabilities.",
    "The multi-dimensional view reveals where focus has been concentrated. Two to three dimensions stand out as significantly stronger than others, suggesting an intentional or organic specialization that may be worth reinforcing.",
  ],
  radialBar: [
    "This radial bar visualization shows progress toward goals or benchmarks. Segments closer to completion are nearing their targets, while shorter bars indicate areas needing more attention. The overall fill rate provides a quick health check.",
    "The concentric bars provide a compact comparison of multiple metrics against their respective targets. Outer rings showing higher fill rates suggest those areas are on track, while inner rings with shorter fills may need prioritization.",
  ],
  default: [
    "This visualization surfaces patterns in your data that may not be immediately obvious from raw numbers alone. The key takeaway is the relationship between the primary variables — consider how changes in one dimension correlate with shifts in others.",
    "The data presented here provides actionable context for decision-making. Focus on the most significant movements first, then examine secondary patterns. Cross-referencing this with related dashboards may reveal deeper cause-and-effect relationships.",
    "AI analysis of this widget indicates the data follows expected patterns with a few notable deviations worth investigating. The overall signal is consistent with broader trends across related metrics in your analytics suite.",
  ],
};

export function WidgetAIExplanation({ widgetTitle, chartType, className }: WidgetAIExplanationProps) {
  const explanation = useMemo(() => {
    const type = chartType ?? "default";
    const pool = explanationPool[type] ?? explanationPool.default;
    const idx = hashTitle(widgetTitle) % pool.length;
    return pool[idx];
  }, [widgetTitle, chartType]);

  return (
    <div className={cn("widget-ai-explanation flex items-center justify-start", className)}>
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className="gap-1.5 text-xs font-normal text-muted-foreground transition-colors hover:bg-primary-25 hover:text-foreground"
            type="button"
          >
            <Sparkles className="shrink-0 text-primary" />
            <span>AI Explanation</span>
          </Button>
        </PopoverTrigger>
        <PopoverContent align="start" className="w-80 p-3">
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="h-3.5 w-3.5 text-primary shrink-0" />
            <div className="text-xs" style={{ fontWeight: 600 }}>
              AI Explanation
            </div>
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">
            {explanation}
          </p>
        </PopoverContent>
      </Popover>
    </div>
  );
}
