import type { FeedbackItem } from "~/types/feedback.types";

// Single source of truth for the feedback dialog. The dialog lives once in the
// dashboard layout; the header button, the feedback page, or anywhere else can
// open it and subscribe to submissions through this shared state.
export function useFeedbackDialog() {
  const isOpen = useState("feedback-dialog-open", () => false);
  // Bumped every time feedback is submitted, so listeners (e.g. the feedback
  // list page) can refresh without prop drilling.
  const lastSubmitted = useState<FeedbackItem | null>("feedback-last-submitted", () => null);

  function open() {
    isOpen.value = true;
  }

  function markSubmitted(item: FeedbackItem) {
    lastSubmitted.value = item;
  }

  return { isOpen, lastSubmitted, open, markSubmitted };
}
