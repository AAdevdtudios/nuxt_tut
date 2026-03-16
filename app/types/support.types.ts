export type SupportTab = "faq" | "guides" | "contact";

export interface SupportArticle {
  id: string;
  category: string;
  question: string;
  answer: string;
  sortOrder: number;
  updatedAtUtc: string;
}

export interface SupportResponse {
  categories: string[];
  items: SupportArticle[];
}

export interface GuideItem {
  id: string;
  title: string;
  description: string;
  icon: string;
  category: string;
}
