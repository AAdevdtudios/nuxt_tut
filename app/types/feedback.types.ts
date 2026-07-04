export type FeedbackCategory =
  | "bug-report"
  | "feature-request"
  | "improvement"
  | "praise";

export type FeedbackStatus = "open" | "in-review" | "resolved";
export type FeedbackSortBy = "votes" | "newest";

export interface FeedbackItem {
  id: string;
  category: FeedbackCategory;
  title: string;
  description: string;
  overallExperienceRating: number;
  status: FeedbackStatus;
  adminResolution: string;
  voteCount: number;
  hasVoted: boolean;
  isOwner: boolean;
  createdAtUtc: string;
  updatedAtUtc: string;
  imageUrls?: string[];
  awardedPoints?: number;
}

export interface FeedbackListResponse {
  count: number;
  totalCount: number;
  page: number;
  pageSize: number;
  items: FeedbackItem[];
}

export interface FeedbackOption<TValue extends string> {
  label: string;
  value: TValue;
}

export interface FeedbackCategoryMeta {
  label: string;
  icon: string;
  chipClass: string;
}

export interface FeedbackStatusMeta {
  label: string;
  textClass: string;
  dotClass: string;
}
