import { Card, CardContent, CardHeader } from "@propertyos/ui/components/card";
import { Skeleton } from "@propertyos/ui/components/skeleton";

/**
 * The overview's loading state.
 *
 * Mirrors the real layout tile for tile and card for card, so the page does
 * not reflow when the data lands -- a skeleton of a different shape moves
 * every element once the response arrives, which reads as a second load.
 *
 * `showFinance` and `scope` are known before the request resolves (both come
 * from the session, not the response), so the skeleton can already draw the
 * right number of tiles and the right cards rather than guessing.
 */
function TileSkeleton() {
  return (
    <Card className="h-full">
      <CardHeader>
        <Skeleton className="h-4 w-28" />
      </CardHeader>
      <CardContent className="flex flex-1 flex-col justify-between gap-2">
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-3 w-24" />
      </CardContent>
    </Card>
  );
}

function CardSkeleton({
  rows = 5,
  headerWidth = "w-32",
  rowHeight = "h-11",
}: {
  rows?: number;
  headerWidth?: string;
  rowHeight?: string;
}) {
  return (
    <Card className="flex h-full flex-col">
      <CardHeader>
        <Skeleton className={`h-4 ${headerWidth}`} />
      </CardHeader>
      <CardContent className="flex flex-1 flex-col gap-2">
        {Array.from({ length: rows }, (_, i) => (
          // biome-ignore lint/suspicious/noArrayIndexKey: fixed-length placeholder
          <Skeleton key={i} className={`${rowHeight} w-full`} />
        ))}
      </CardContent>
    </Card>
  );
}

function ChartSkeleton() {
  return (
    <Card className="flex h-full flex-col">
      <CardHeader className="flex-row items-center justify-between">
        <Skeleton className="h-4 w-40" />
        <Skeleton className="h-6 w-32" />
      </CardHeader>
      <CardContent className="flex-1">
        {/* A bar silhouette rather than one flat block: the eye reads this as
            "a chart is coming here", where a rectangle reads as a panel. */}
        <div className="flex h-[280px] items-end gap-2">
          {[45, 70, 38, 82, 56, 91, 63, 74, 49, 86, 58, 68].map((height, i) => (
            <Skeleton
              // biome-ignore lint/suspicious/noArrayIndexKey: fixed-length placeholder
              key={i}
              className="flex-1"
              style={{ height: `${height}%` }}
            />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

export function OverviewSkeleton({
  scope,
  showFinance,
}: {
  scope: "hq" | "property";
  showFinance: boolean;
}) {
  // Matches the tile count the loaded page renders for this scope and role.
  const tileCount = showFinance ? 4 : 2;

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: tileCount }, (_, i) => (
          // biome-ignore lint/suspicious/noArrayIndexKey: fixed-length placeholder
          <TileSkeleton key={i} />
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
        {showFinance && (
          <div className="lg:col-span-8">
            <ChartSkeleton />
          </div>
        )}
        <div className={showFinance ? "lg:col-span-4" : "lg:col-span-12"}>
          <CardSkeleton rows={5} headerWidth="w-20" rowHeight="h-24" />
        </div>
      </div>

      {showFinance && scope === "hq" && (
        <CardSkeleton rows={4} headerWidth="w-24" />
      )}

      {/* Expenses by category and payments to chase, side by side. Both are
          money cards, so neither is drawn for a role without finance. */}
      {showFinance && (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <CardSkeleton rows={4} headerWidth="w-40" />
          <CardSkeleton rows={4} headerWidth="w-36" />
        </div>
      )}
    </div>
  );
}
