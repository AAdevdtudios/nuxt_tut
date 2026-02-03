/**
 * Data Transfer Objects (DTOs) and Type Definitions for Explore Feature
 * Follows strict typing for API contracts and internal state management
 */

// ============================================================================
// DOMAIN MODELS - Core Entity Types
// ============================================================================

export interface Category {
  id: number;
  documentId: string;
  name: string;
  slug: string;
  description: string | null;
}

export interface Explore {
  id: number;
  documentId: string;
  Title: string;
  Description: string;
  Downloads: string;
  Copyright: string;
  url: string;
  slug: string;
  Language: string;
  Author: string;
}

// ============================================================================
// PAGINATION - Pagination Meta Information
// ============================================================================

export interface PaginationMeta {
  page: number;
  pageSize: number;
  pageCount: number;
  total: number;
}

// ============================================================================
// API RESPONSE DTOs - Standardized Response Structures
// ============================================================================

export interface CategoriesResponse {
  success: boolean;
  data: {
    data: Category[];
  };
  error?: string;
}

export interface ExploresResponse {
  success: boolean;
  data: {
    items: Explore[];
    pagination: PaginationMeta;
  };
  error?: string;
}

// ============================================================================
// REQUEST DTOs - Query Parameters for API Calls
// ============================================================================

export interface ExploresQueryParams {
  page: number;
  pageSize: number;
  search?: string;
  category?: string;
}

export interface CategoriesQueryParams {
  // Currently no params needed, but structured for future extensibility
}

// ============================================================================
// STATE MODELS - Internal State Management
// ============================================================================

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

// ============================================================================
// COMPOSITE STATE - Combined State for Feature
// ============================================================================

export interface ExploreFeatureState extends ExploreState {
  pagination: PaginationState;
  filters: FilterState;
}

// ============================================================================
// LANGUAGE UTILITIES
// ============================================================================

export type Language = string;

export interface LanguageOption {
  value: string;
  label: string;
}

// ============================================================================
// CONSTANTS
// ============================================================================

export const DEFAULT_PAGE_SIZE = 10;
export const PAGE_SIZE_OPTIONS = [3, 5, 10, 20, 50];
export const DEFAULT_CATEGORY = "all";
