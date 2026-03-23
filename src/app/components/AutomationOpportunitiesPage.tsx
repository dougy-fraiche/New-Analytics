import { Badge } from "./ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Lightbulb, Target, TrendingUp, Zap } from "lucide-react";

export function AutomationOpportunitiesPage() {
  return (
    <div className="flex flex-col flex-1 min-h-0">
      <header className="shrink-0 sticky top-0 z-10 bg-background px-8 pt-6 pb-0">
        <div>
          <h1 className="text-3xl tracking-tight">Automation Opportunities</h1>
          <p className="text-muted-foreground mt-2">
            Dashboard view of high-impact opportunities to improve efficiency and customer outcomes.
          </p>
        </div>
      </header>

      <div className="flex-1 min-h-0 overflow-auto">
        <div className="space-y-6 p-8">
          <div className="flex flex-wrap gap-3">
            <Badge variant="secondary" className="text-sm px-3 py-1">
              12 opportunities identified
            </Badge>
            <Badge variant="secondary" className="text-sm px-3 py-1">
              4 high impact
            </Badge>
            <Badge variant="secondary" className="text-sm px-3 py-1">
              Updated 15m ago
            </Badge>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardDescription className="flex items-center gap-2">
                  <Lightbulb className="h-4 w-4" />
                  Total Opportunities
                </CardDescription>
                <CardTitle className="text-3xl">12</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                Opportunities currently recommended by analytics signals.
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardDescription className="flex items-center gap-2">
                  <Zap className="h-4 w-4" />
                  Estimated Weekly Savings
                </CardDescription>
                <CardTitle className="text-3xl">31h</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                Potential time reduction from automated workflows.
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardDescription className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4" />
                  Success Lift Potential
                </CardDescription>
                <CardTitle className="text-3xl">+8.4%</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                Forecasted improvement in targeted KPI outcomes.
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardDescription className="flex items-center gap-2">
                  <Target className="h-4 w-4" />
                  Priority Score
                </CardDescription>
                <CardTitle className="text-3xl">86/100</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                Aggregate urgency across open opportunities.
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
