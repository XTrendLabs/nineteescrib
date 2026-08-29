import { Card, CardContent } from "@propertyos/ui/components/card";
import { Skeleton } from "@propertyos/ui/components/skeleton";

/**
 * Placeholder shaped like `StaffCard`.
 *
 * A plain block would collapse into the real card and shift the page, so this
 * mirrors the card's own structure -- avatar, name, badges, three detail rows
 * and the profile button -- keeping the grid still while a switch loads.
 */
export function StaffCardSkeleton() {
  return (
    <Card className="gap-3 p-4">
      <CardContent className="flex flex-col gap-3 px-0">
        <div className="flex items-start gap-3">
          <Skeleton className="size-10 shrink-0 rounded-full" />
          <div className="flex min-w-0 flex-1 flex-col gap-2">
            <Skeleton className="h-4 w-32" />
            <div className="flex gap-1.5">
              <Skeleton className="h-5 w-20 rounded-md" />
              <Skeleton className="h-5 w-24 rounded-md" />
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <Skeleton className="h-3 w-40" />
          <Skeleton className="h-3 w-32" />
          <Skeleton className="h-3 w-44" />
        </div>

        <Skeleton className="h-8 w-full rounded-md" />
      </CardContent>
    </Card>
  );
}
