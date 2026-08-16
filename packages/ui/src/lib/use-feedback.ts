import { showFeedback } from "@propertyos/ui/lib/feedback-store";

export function useFeedback() {
  return {
    success: (title: string, message?: string) =>
      showFeedback({ variant: "success", title, message }),
    error: (title: string, message?: string) =>
      showFeedback({ variant: "error", title, message }),
  };
}
