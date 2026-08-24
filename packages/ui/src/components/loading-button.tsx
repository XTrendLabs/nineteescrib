import type { Button as ButtonPrimitive } from "@base-ui/react/button";
import type { VariantProps } from "class-variance-authority";
import { Loader2Icon } from "lucide-react";

import { Button, type buttonVariants } from "./button";

function LoadingButton({
  loading = false,
  loadingText,
  disabled,
  children,
  ...props
}: ButtonPrimitive.Props &
  VariantProps<typeof buttonVariants> & {
    loading?: boolean;
    loadingText?: string;
  }) {
  return (
    <Button disabled={disabled || loading} {...props}>
      {loading && <Loader2Icon className="size-4 animate-spin" />}
      {loading && loadingText ? loadingText : children}
    </Button>
  );
}

export { LoadingButton };
