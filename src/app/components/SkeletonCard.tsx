import { Card, CardContent, CardHeader } from "./ui/card";
import { Skeleton } from "./ui/skeleton";

/** A generic card skeleton for loading states */
export function SkeletonCard() {
  return (
    <Card>
      <CardHeader className="space-y-2">
        <Skeleton className="h-4 w-1/3" />
        <Skeleton className="h-3 w-2/3" />
      </CardHeader>
      <CardContent className="space-y-3">
        <Skeleton className="h-8 w-full" />
        <Skeleton className="h-8 w-full" />
        <Skeleton className="h-8 w-4/5" />
      </CardContent>
    </Card>
  );
}

/** A skeleton matching the insight stat cards on the Explore page */
export function SkeletonInsightCard() {
  return (
    <Card>
      <CardHeader className="pb-3 space-y-2">
        <Skeleton className="h-3 w-1/2" />
        <div className="flex items-baseline gap-2">
          <Skeleton className="h-8 w-16" />
          <Skeleton className="h-5 w-12 rounded-full" />
        </div>
      </CardHeader>
      <CardContent>
        <Skeleton className="h-3 w-3/4" />
      </CardContent>
    </Card>
  );
}

/** A table row skeleton */
export function SkeletonTableRow({ cols = 4 }: { cols?: number }) {
  return (
    <div className="flex items-center gap-4 py-3 px-2">
      {Array.from({ length: cols }).map((_, i) => (
        <Skeleton
          key={i}
          className={`h-4 ${i === 0 ? "w-6" : i === 1 ? "flex-1" : "w-20"}`}
        />
      ))}
    </div>
  );
}

/** A skeleton matching a chart widget card (for dashboard loading states) */
export function SkeletonChartCard({ colSpan = 1 }: { colSpan?: 1 | 2 | 3 }) {
  const colClass = colSpan === 3 ? "col-span-1 lg:col-span-3" : colSpan === 2 ? "col-span-1 lg:col-span-2" : "col-span-1";
  return (
    <div className={colClass}>
      <Card>
        <CardHeader className="pb-3 space-y-2">
          <div className="flex items-center gap-2">
            <Skeleton className="h-4 w-4 rounded" />
            <Skeleton className="h-4 w-1/3" />
          </div>
          <Skeleton className="h-3 w-2/3" />
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {/* Fake bar chart shape */}
            <div className="flex items-end gap-1.5 h-[200px] pt-4">
              {[65, 40, 80, 55, 90, 70, 45, 85, 60, 75].map((h, i) => (
                <Skeleton
                  key={i}
                  className="flex-1 rounded-t"
                  style={{ height: `${h}%` }}
                />
              ))}
            </div>
            <div className="flex justify-between">
              <Skeleton className="h-3 w-8" />
              <Skeleton className="h-3 w-8" />
              <Skeleton className="h-3 w-8" />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

/** A skeleton for the metric cards above dashboard charts */
export function SkeletonMetricCard() {
  return (
    <Card>
      <CardHeader className="pb-2 space-y-2">
        <Skeleton className="h-3 w-1/2" />
        <Skeleton className="h-8 w-20" />
      </CardHeader>
    </Card>
  );
}