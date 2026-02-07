/**
 * Library Types - Type definitions for library management
 * Includes DTOs, response types, and API contracts
 */

/**
 * Library Item - Represents a single library resource
 */
export interface LibraryItem {
  id: number;
  documentId: string;
  title: string;
  url?: string | null;
  content?: string | null;
  docID?: string | number | null;
  libraryType: "url" | "doc" | "note";
  createdAt: string;
  updatedAt: string;
  publishedAt: string;
  libUUID: string;
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
 * Library Response - API response for library list
 */
export interface LibrariesResponse {
  data: LibraryItem[];
  meta: {
    pagination: PaginationMeta;
  };
}

/**
 * Library Create Request - Data for creating a new library item
 */
export interface LibraryCreateRequest {
  title: string;
  libraryType: "url" | "doc" | "note";
  url?: string;
  content?: string;
  docID?: string | number;
  users_permissions_user?: string | number;
  libUUID?: string;
  locale?: string;
}

/**
 * Library Update Request - Data for updating a library item
 */
export interface LibraryUpdateRequest {
  title?: string;
  libraryType?: "url" | "doc" | "note";
  url?: string;
  content?: string;
  docID?: string | number;
  users_permissions_user?: string | number;
  libUUID?: string;
}

/**
 * Single Library Response - API response for single library item
 */
export interface LibrarySingleResponse {
  data: LibraryItem;
  meta?: any;
}

/**
 * Upload File Response - Response from file upload endpoint
 */
export interface UploadedFile {
  id: number;
  documentId: string;
  name: string;
  alternativeText: string | null;
  caption: string | null;
  width: number | null;
  height: number | null;
  formats: any | null;
  hash: string;
  ext: string;
  mime: string;
  size: number;
  url: string;
  previewUrl: string | null;
  provider: string;
  provider_metadata: any | null;
  createdAt: string;
  updatedAt: string;
  publishedAt: string;
}

/**
 * Upload Response - Array of uploaded files
 */
export type UploadResponse = UploadedFile[];

/**
 * Library Type Labels - Display names for library types
 */
export const LIBRARY_TYPE_LABELS: Record<string, string> = {
  url: "Web Link",
  doc: "Document",
  note: "Note",
};

/**
 * Library Type Icons - Icon names for library types
 */
export const LIBRARY_TYPE_ICONS: Record<string, string> = {
  url: "i-lucide-link",
  doc: "i-lucide-file-text",
  note: "i-lucide-sticky-note",
};
