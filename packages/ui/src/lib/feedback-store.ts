export type FeedbackVariant = "success" | "error";

export type FeedbackState = {
  open: boolean;
  variant: FeedbackVariant;
  title: string;
  message?: string;
};

type Listener = () => void;

let state: FeedbackState = {
  open: false,
  variant: "success",
  title: "",
  message: undefined,
};

const listeners = new Set<Listener>();

function emit() {
  for (const listener of listeners) {
    listener();
  }
}

export function subscribeFeedback(listener: Listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function getFeedbackState() {
  return state;
}

export function showFeedback(input: {
  variant: FeedbackVariant;
  title: string;
  message?: string;
}) {
  state = { open: true, ...input };
  emit();
}

export function hideFeedback() {
  state = { ...state, open: false };
  emit();
}
