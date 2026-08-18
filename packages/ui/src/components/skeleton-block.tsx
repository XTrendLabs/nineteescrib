import { Card, CardContent, CardHeader } from "@propertyos/ui/components/card";
import { cn } from "@propertyos/ui/lib/utils";
import { Skeleton } from "./skeleton";

/**
 * Declarative skeleton "shapes" so pages can describe their loading state as
 * config instead of hand-writing bespoke Skeleton JSX per screen/tab.
 *
 * Usage:
 *   <SkeletonBlock shape={{ type: "cards", count: 4, columns: 4 }} />
 *   <SkeletonBlock shape={{ type: "rows", count: 5 }} />
 *   <SkeletonBlock shape={{ type: "table", rows: 6, columns: 5 }} />
 *
 * Or compose a whole page/tab in one call:
 *   <SkeletonLayout shapes={[{ type: "hero" }, { type: "cards", count: 4 }]} />
 */
export type SkeletonShape =
  | { type: "text"; lines?: number; widths?: string[] }
  | { type: "hero" }
  | { type: "cards"; count?: number; columns?: 2 | 3 | 4 }
  | { type: "table"; rows?: number; columns?: number }
  | { type: "list"; count?: number }
  | { type: "form"; fields?: number; columns?: 1 | 2 };

const DEFAULT_WIDTHS = ["w-full", "w-5/6", "w-2/3"];

function TextShape({
  lines = 3,
  widths = DEFAULT_WIDTHS,
}: {
  lines?: number;
  widths?: string[];
}) {
  return (
    <div className="flex flex-col gap-2">
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          // biome-ignore lint/suspicious/noArrayIndexKey: static skeleton rows have no identity
          key={i}
          className={cn("h-3", widths[i % widths.length])}
        />
      ))}
    </div>
  );
}

function HeroShape() {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
      <Skeleton className="h-56 w-full" />
      <Card className="h-full">
        <CardContent className="flex flex-col gap-3 pt-4">
          <Skeleton className="h-5 w-1/2" />
          <Skeleton className="h-3 w-1/3" />
          <div className="mt-2 flex flex-col gap-2">
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-3 w-2/3" />
            <Skeleton className="h-3 w-1/2" />
            <Skeleton className="h-3 w-1/3" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

const COLUMN_CLASS: Record<2 | 3 | 4, string> = {
  2: "sm:grid-cols-2",
  3: "sm:grid-cols-2 lg:grid-cols-3",
  4: "sm:grid-cols-2 lg:grid-cols-4",
};

function CardsShape({
  count = 4,
  columns = 4,
}: {
  count?: number;
  columns?: 2 | 3 | 4;
}) {
  return (
    <div className={cn("grid grid-cols-1 gap-4", COLUMN_CLASS[columns])}>
      {Array.from({ length: count }).map((_, i) => (
        <Card
          // biome-ignore lint/suspicious/noArrayIndexKey: static skeleton cards have no identity
          key={i}
          className="h-full"
        >
          <CardHeader>
            <Skeleton className="h-3 w-2/3" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-6 w-1/2" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function TableShape({
  rows = 5,
  columns = 4,
}: {
  rows?: number;
  columns?: number;
}) {
  return (
    <div className="overflow-hidden border">
      <div className="flex items-center gap-4 border-b bg-muted/40 px-3 py-2.5">
        {Array.from({ length: columns }).map((_, i) => (
          <Skeleton
            // biome-ignore lint/suspicious/noArrayIndexKey: static skeleton columns have no identity
            key={i}
            className="h-3 flex-1"
          />
        ))}
      </div>
      {Array.from({ length: rows }).map((_, r) => (
        <div
          // biome-ignore lint/suspicious/noArrayIndexKey: static skeleton rows have no identity
          key={r}
          className="flex items-center gap-4 border-b px-3 py-2.5 last:border-b-0"
        >
          {Array.from({ length: columns }).map((_, c) => (
            <Skeleton
              // biome-ignore lint/suspicious/noArrayIndexKey: static skeleton cells have no identity
              key={c}
              className="h-3 flex-1"
            />
          ))}
        </div>
      ))}
    </div>
  );
}

function ListShape({ count = 4 }: { count?: number }) {
  return (
    <div className="flex flex-col gap-3">
      {Array.from({ length: count }).map((_, i) => (
        <Card
          // biome-ignore lint/suspicious/noArrayIndexKey: static skeleton rows have no identity
          key={i}
        >
          <CardContent className="flex flex-col gap-2 pt-4">
            <Skeleton className="h-3 w-1/3" />
            <Skeleton className="h-3 w-2/3" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function FormShape({
  fields = 4,
  columns = 2,
}: {
  fields?: number;
  columns?: 1 | 2;
}) {
  return (
    <div
      className={cn(
        "grid grid-cols-1 gap-4",
        columns === 2 && "sm:grid-cols-2",
      )}
    >
      {Array.from({ length: fields }).map((_, i) => (
        <div
          // biome-ignore lint/suspicious/noArrayIndexKey: static skeleton fields have no identity
          key={i}
          className="flex flex-col gap-1.5"
        >
          <Skeleton className="h-3 w-1/4" />
          <Skeleton className="h-8 w-full" />
        </div>
      ))}
    </div>
  );
}

export function SkeletonBlock({ shape }: { shape: SkeletonShape }) {
  switch (shape.type) {
    case "text":
      return <TextShape lines={shape.lines} widths={shape.widths} />;
    case "hero":
      return <HeroShape />;
    case "cards":
      return <CardsShape count={shape.count} columns={shape.columns} />;
    case "table":
      return <TableShape rows={shape.rows} columns={shape.columns} />;
    case "list":
      return <ListShape count={shape.count} />;
    case "form":
      return <FormShape fields={shape.fields} columns={shape.columns} />;
    default:
      return null;
  }
}

/**
 * Composes multiple SkeletonBlocks vertically to describe a whole
 * page/tab's loading state as one config array.
 */
export function SkeletonLayout({
  shapes,
  className,
}: {
  shapes: SkeletonShape[];
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col gap-6", className)}>
      {shapes.map((shape, i) => (
        // biome-ignore lint/suspicious/noArrayIndexKey: static shape config has no identity
        <SkeletonBlock key={i} shape={shape} />
      ))}
    </div>
  );
}
