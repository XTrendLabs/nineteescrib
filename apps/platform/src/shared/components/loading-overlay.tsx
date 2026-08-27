import { Loader2 } from "lucide-react";

/** Full-screen blocking spinner with a message. */
export function LoadingOverlay({ message }: { message: string }) {
  return (
    <output
      aria-live="polite"
      aria-busy="true"
      className="fixed inset-0 z-100 flex items-center justify-center bg-background/70 backdrop-blur-[2px]"
    >
      <span className="flex items-center gap-2.5 rounded-md border bg-background px-4 py-3 shadow-lg">
        <Loader2 className="size-4 animate-spin" />
        <span className="text-sm">{message}</span>
      </span>
    </output>
  );
}
