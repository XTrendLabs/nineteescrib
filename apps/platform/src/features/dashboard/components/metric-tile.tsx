import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@propertyos/ui/components/card";
import { cn } from "@propertyos/ui/lib/utils";
import { motion } from "motion/react";

/**
 * One headline figure.
 *
 * Deliberately has no delta badge: the previous period is not fetched, and a
 * "+8.4% vs 30d" that nothing computed is exactly the kind of number an owner
 * would make a decision on. When a comparison window is added, it belongs here.
 */
export function MetricTile({
  label,
  value,
  hint,
  tone = "default",
  index = 0,
}: {
  label: string;
  value: string;
  hint?: string;
  tone?: "default" | "positive" | "negative";
  index?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        delay: index * 0.05,
        type: "spring",
        stiffness: 220,
        damping: 26,
      }}
      className="h-full"
    >
      <Card className="h-full">
        <CardHeader>
          <CardTitle className="font-normal text-muted-foreground">
            {label}
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-1 flex-col justify-between gap-2">
          <p
            className={cn(
              "text-display-sm tabular-nums leading-none",
              tone === "positive" && "text-success",
              tone === "negative" && "text-destructive",
            )}
          >
            {value}
          </p>
          {hint && (
            <p className="text-muted-foreground text-xs leading-snug">{hint}</p>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
