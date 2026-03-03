export interface Category {
  id: string;
  name: string;
  description: string | null;
  createdAtUtc?: string;
}

export interface Explore {
  id: string;
  title: string;
  description: string;
  copyright: string;
  url: string;
  categoryId: string;
  downloads: number;
  createdAtUtc?: string;
  updatedAtUtc?: string;
}

export interface PaginationMeta {
  page: number;
  pageSize: number;
  pageCount: number;
  total: number;
}

export interface CategoriesResponse {
  items: Category[];
  count: number;
  totalCount: number;
  page: number;
  pageSize: number;
}

export interface ExploresResponse {
  items: Explore[];
  count: number;
  totalCount: number;
  page: number;
  pageSize: number;
}

export interface ExploresQueryParams {
  page: number;
  pageSize: number;
  search?: string;
  categoryId?: string;
}

export interface CategoriesQueryParams {
  page?: number;
  pageSize?: number;
  search?: string;
}

export interface ExploreState {
  explores: Explore[];
  categories: Category[];
  loading: boolean;
  error: string | null;
}

export interface PaginationState {
  page: number;
  pageSize: number;
  total: number;
  pageCount: number;
  pageSizeOptions: number[];
}

export interface FilterState {
  searchQuery: string;
  selectedCategory: string;
}

export interface ExploreFeatureState extends ExploreState {
  pagination: PaginationState;
  filters: FilterState;
}

export type Language = string;

export interface LanguageOption {
  value: string;
  label: string;
}

export const DEFAULT_PAGE_SIZE = 10;
export const PAGE_SIZE_OPTIONS = [3, 5, 10, 20, 50];
export const DEFAULT_CATEGORY = "all";
