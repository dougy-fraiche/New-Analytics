import { CircleGauge, LineChart } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./ui/table";
import { EChartsCanvas } from "./EChartsCanvas";
import {
  type KnowledgePerformanceArticleRow,
  knowledgeOverviewKpiTiles,
  knowledgeRetrievalSuccessTrendOption,
  topPerformingKnowledgeArticles,
  underperformingKnowledgeArticles,
} from "../data/knowledge-performance-overview";
import { cn } from "./ui/utils";

const OVERVIEW_CARD_HOVER =
  "group/widget transition-[box-shadow,border-color] hover:shadow-md hover:border-primary/30";

function ArticleTable({
  title,
  rows,
  tone = "positive",
}: {
  title: string;
  rows: KnowledgePerformanceArticleRow[];
  tone?: "positive" | "negative";
}) {
  const badgeClassName =
    tone === "positive"
      ? "h-5 border-emerald-500/35 bg-emerald-500/10 px-2 text-xs font-normal text-[#10743f]"
      : "h-5 border-red-500/35 bg-red-500/10 px-2 text-xs font-normal text-[#a0152a]";

  return (
    <Card className={cn(OVERVIEW_CARD_HOVER)}>
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-medium tracking-tight">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Title</TableHead>
              <TableHead className="text-right">Retrievals</TableHead>
              <TableHead className="text-right">Relevancy Score</TableHead>
              <TableHead className="text-right">Helpful Rate</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row) => (
              <TableRow key={`${title}-${row.title}`}>
                <TableCell className="font-medium">{row.title}</TableCell>
                <TableCell className="text-right tabular-nums">{row.retrievals}</TableCell>
                <TableCell className="text-right tabular-nums">
                  <Badge variant="outline" className={cn("tabular-nums", badgeClassName)}>
                    {row.relevancyScore.toFixed(2)}
                  </Badge>
                </TableCell>
                <TableCell className="text-right tabular-nums">
                  <Badge variant="outline" className={cn("tabular-nums", badgeClassName)}>
                    {row.helpfulRatePct}%
                  </Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

export function KnowledgePerformanceOverviewTab() {
  return (
    <div className="space-y-4">
      <h3 className="mt-8 flex items-center gap-2 text-lg font-medium tracking-tight">
        <CircleGauge className="h-4 w-4 shrink-0 text-primary" aria-hidden />
        Key Performance Indicators
      </h3>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
        {knowledgeOverviewKpiTiles.map((kpi) => (
          <Card key={kpi.label} className={cn(OVERVIEW_CARD_HOVER)}>
            <CardContent className="space-y-1.5 p-4">
              <p className="text-sm text-muted-foreground">{kpi.label}</p>
              <p className="text-xl font-semibold tracking-tight tabular-nums">{kpi.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <h3 className="!mt-8 flex items-center gap-2 text-lg font-medium tracking-tight">
        <LineChart className="h-4 w-4 shrink-0 text-primary" aria-hidden />
        Insights & Analysis
      </h3>

      <Card className={cn(OVERVIEW_CARD_HOVER)}>
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-medium tracking-tight">Retrieval Success Trend</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[300px] w-full">
            <EChartsCanvas option={knowledgeRetrievalSuccessTrendOption} />
          </div>
        </CardContent>
      </Card>

      <ArticleTable title="Top Performing Articles" rows={topPerformingKnowledgeArticles} tone="positive" />
      <ArticleTable title="Underperforming Articles" rows={underperformingKnowledgeArticles} tone="negative" />
    </div>
  );
}
