import { cn } from "@propertyos/ui/lib/utils";
import { cva, type VariantProps } from "class-variance-authority";
import type * as React from "react";

const badgeVariants = cva(
  "inline-flex w-fit shrink-0 items-center gap-1 whitespace-nowrap rounded-none border px-2 py-0.5 font-medium text-[11px] leading-normal [&_svg]:pointer-events-none [&_svg]:size-3",
  {
    variants: {
      variant: {
        default: "border-transparent bg-primary text-primary-foreground",
        secondary: "border-transparent bg-secondary text-secondary-foreground",
        outline: "border-border bg-transparent text-foreground",
        success: "border-success/30 bg-success/10 text-success",
        warning: "border-warning/30 bg-warning/10 text-warning",
        destructive: "border-destructive/30 bg-destructive/10 text-destructive",
        muted: "border-transparent bg-muted text-muted-foreground",
        "solid-success": "border-transparent bg-success text-white",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

function Badge({
  className,
  variant,
  ...props
}: React.ComponentProps<"span"> & VariantProps<typeof badgeVariants>) {
  return (
    <span
      data-slot="badge"
      className={cn(badgeVariants({ variant }), className)}
      {...props}
    />
  );
}

export { Badge, badgeVariants };
