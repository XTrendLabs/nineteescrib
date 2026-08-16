"use client";

import { Progress as ProgressPrimitive } from "@base-ui/react/progress";
import { cn } from "@propertyos/ui/lib/utils";
import { motion } from "motion/react";
import type * as React from "react";

function Progress({
  className,
  value,
  ...props
}: React.ComponentProps<typeof ProgressPrimitive.Root>) {
  return (
    <ProgressPrimitive.Root
      data-slot="progress"
      value={value}
      className={cn(
        "relative h-1.5 w-full overflow-hidden bg-primary/10",
        className,
      )}
      {...props}
    >
      <ProgressPrimitive.Track className="h-full w-full">
        <ProgressPrimitive.Indicator
          data-slot="progress-indicator"
          render={
            <motion.div
              className="h-full bg-primary"
              initial={false}
              animate={{ width: `${value ?? 0}%` }}
              transition={{ type: "spring", stiffness: 100, damping: 30 }}
            />
          }
        />
      </ProgressPrimitive.Track>
    </ProgressPrimitive.Root>
  );
}

export { Progress };
