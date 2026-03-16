import type {
  FeedbackCategory,
  FeedbackCategoryMeta,
  FeedbackOption,
  FeedbackSortBy,
  FeedbackStatus,
  FeedbackStatusMeta,
} from "~/types/feedback.types";

export const FEEDBACK_CATEGORY_OPTIONS: readonly FeedbackOption<
  FeedbackCategory | "all"
>[] = [
  { label: "All", value: "all" },
  { label: "Bug Report", value: "bug-report" },
  { label: "Feature Request", value: "feature-request" },
  { label: "Improvement", value: "improvement" },
  { label: "Praise", value: "praise" },
];

export const FEEDBACK_STATUS_OPTIONS: readonly FeedbackOption<
  FeedbackStatus | "all"
>[] = [
  { label: "All Status", value: "all" },
  { label: "Open", value: "open" },
  { label: "In Review", value: "in-review" },
  { label: "Resolved", value: "resolved" },
];

export const FEEDBACK_SORT_OPTIONS: readonly FeedbackOption<FeedbackSortBy>[] = [
  { label: "Most Voted", value: "votes" },
  { label: "Newest", value: "newest" },
];

export const feedbackCategoryMeta: Record<
  FeedbackCategory,
  FeedbackCategoryMeta
> = {
  "bug-report": {
    label: "Bug Report",
    icon: "i-lucide-bug",
    chipClass: "bg-red-100 text-red-700 ring-red-200",
  },
  "feature-request": {
    label: "Feature Request",
    icon: "i-lucide-lightbulb",
    chipClass: "bg-amber-100 text-amber-700 ring-amber-200",
  },
  improvement: {
    label: "Improvement",
    icon: "i-lucide-arrow-up",
    chipClass: "bg-blue-100 text-blue-700 ring-blue-200",
  },
  praise: {
    label: "Praise",
    icon: "i-lucide-thumbs-up",
    chipClass: "bg-green-100 text-green-700 ring-green-200",
  },
};

export const feedbackStatusMeta: Record<FeedbackStatus, FeedbackStatusMeta> = {
  open: {
    label: "Open",
    textClass: "text-muted-foreground",
    dotClass: "bg-muted-foreground",
  },
  "in-review": {
    label: "In Review",
    textClass: "text-primary",
    dotClass: "bg-primary",
  },
  resolved: {
    label: "Resolved",
    textClass: "text-green-600",
    dotClass: "bg-green-500",
  },
};
