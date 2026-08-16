import { Button } from "@propertyos/ui/components/button";
import type { ErrorComponentProps } from "@tanstack/react-router";

export function ErrorFallback({ error, reset }: ErrorComponentProps) {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-4 p-8 text-center">
      <h1 className="font-bold text-2xl">Something went wrong</h1>
      <p className="max-w-md text-muted-foreground text-sm">
        {error.message || "An unexpected error occurred."}
      </p>
      <Button onClick={reset}>Try again</Button>
    </div>
  );
}
