import { useMemo } from "react";
import { ChartConfig, ChartContainer } from "./ui/chart";
import { EChartsCanvas } from "./EChartsCanvas";
import { buildInlineEChartsOption } from "./echartsChartOptions";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "./ui/card";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { WidgetAIExplanation } from "./WidgetAIExplanation";
import { WidgetAskAIAndOverflow } from "./WidgetAskAIAndOverflow";
import type { WidgetData } from "../contexts/ConversationContext";

interface InlineWidgetProps {
  widget: WidgetData;
}

export function InlineWidget({ widget }: InlineWidgetProps) {
  const chartConfig = useMemo<ChartConfig>(() => {
    return {
      [widget.yKey]: {
        label: widget.yKey.charAt(0).toUpperCase() + widget.yKey.slice(1),
      },
    };
  }, [widget]);

  const chartOption = useMemo(() => {
    if (widget.chartType === "metric") return null;
    return buildInlineEChartsOption({
      chartType: widget.chartType,
      data: widget.data as Array<Record<string, unknown>>,
      xKey: widget.xKey,
      yKey: widget.yKey,
    });
  }, [widget]);

  const TrendIcon =
    widget.trend === "up" ? TrendingUp : widget.trend === "down" ? TrendingDown : Minus;

  const trendColor =
    widget.trend === "up"
      ? "text-chart-2"
      : widget.trend === "down"
        ? "text-chart-5"
        : "text-muted-foreground";

  const renderChart = () => {
    if (!chartOption) return null;
    return (
      <ChartContainer config={chartConfig} className="h-[140px] w-full">
        <EChartsCanvas option={chartOption} />
      </ChartContainer>
    );
  };

  return (
    <Card className="w-full max-w-md overflow-hidden border-border/60 shadow-sm">
      <CardHeader className="pb-2 space-y-0">
        <div className="flex items-start justify-between gap-2">
          <div className="space-y-0.5 min-w-0">
            <CardTitle className="text-sm font-normal">{widget.title}</CardTitle>
            <CardDescription className="text-xs">{widget.description}</CardDescription>
          </div>
          <div className="flex items-start gap-1 shrink-0">
            <WidgetAskAIAndOverflow widgetTitle={widget.title} chartType={widget.chartType} />
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0 pb-4 space-y-2">
        {widget.chartType === "metric" ? (
          <div className="flex items-center justify-center h-[80px]">
            <div className="text-center">
              <p className="text-3xl tracking-tight" style={{ fontWeight: 600 }}>
                {widget.value}
              </p>
              {widget.change && (
                <div className={`flex items-center justify-center gap-1 mt-1 text-sm ${trendColor}`}>
                  <TrendIcon className="h-3.5 w-3.5" />
                  <span>{widget.change}</span>
                </div>
              )}
            </div>
          </div>
        ) : (
          renderChart()
        )}
        </CardContent>
        <CardFooter className="mt-auto pt-4">
          <WidgetAIExplanation
          widgetTitle={widget.title}
          chartType={widget.chartType}
        />
        </CardFooter>
    </Card>
  );
}
