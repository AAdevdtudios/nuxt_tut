/**
 * Project Types - Type definitions for project management
 * Includes DTOs, response types, and API contracts
 */

/**
 * Icon type for projects
 */
export type ProjectIcon =
  | "graduation-cap"
  | "file-text"
  | "atom"
  | "presentation"
  | "book-open"
  | "folder"
  | "target"
  | "sparkles";

/**
 * Library item in project context
 */
export interface ProjectLibrary {
  id: string;
  documentId: string;
  title: string;
  url?: string | null;
  content?: string | null;
  docID?: string | number | null;
  libraryType: "url" | "doc" | "note";
  createdAt: string;
  updatedAt: string;
  publishedAt?: string;
  libUUID?: string;
}

/**
 * Project Item - Represents a single project resource
 */
export interface ProjectItem {
  id: string;
  documentId: string;
  title: string;
  description?: string | null;
  icons: ProjectIcon;
  color: string;
  start: string;
  end: string;
  createdAt: string;
  updatedAt: string;
  publishedAt?: string;
  libraries?: ProjectLibrary[];
  librariesCount: number; // Count of non-note libraries
  notesCount: number; // Count of note libraries
}

/**
 * Pagination metadata
 */
export interface PaginationMeta {
  page: number;
  pageSize: number;
  pageCount: number;
  total: number;
}

/**
 * Projects Response - API response for project list
 */
export interface ProjectsResponse {
  data: ProjectItem[];
  meta: {
    pagination: PaginationMeta;
  };
}

/**
 * Project Create Request - Data for creating a new project
 */
export interface ProjectCreateRequest {
  title: string;
  description?: string;
  icons: ProjectIcon;
  color: string;
  start: string;
  end: string;
  libraries?: string[];
}

/**
 * Project Update Request - Data for updating a project
 */
export interface ProjectUpdateRequest {
  title?: string;
  description?: string;
  icons?: ProjectIcon;
  color?: string;
  start?: string;
  end?: string;
  libraries?: string[];
}

/**
 * Single Project Response - API response for single project
 */
export interface ProjectSingleResponse {
  data: ProjectItem;
  meta?: any;
}
