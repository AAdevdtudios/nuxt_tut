/**
 * Library Types - Type definitions for library management
 * Includes DTOs, response types, and API contracts
 */

/**
 * Library Item - Represents a single library resource
 */
export type LibraryType = "url" | "doc" | "note";

export interface LibraryItem {
  id: string;
  documentId: string;
  title: string;
  url?: string | null;
  content?: string | null;
  docID?: string | number | null;
  libraryType: LibraryType;
  createdAt: string;
  updatedAt: string;
  publishedAt?: string | null;
  libUUID?: string;
  fileName?: string | null;
  fileUrl?: string | null;
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
  libraryType: LibraryType;
  url?: string;
  content?: string;
  docsUrl?: string;
  file?: File | null;
}

/**
 * Library Update Request - Data for updating a library item
 */
export interface LibraryUpdateRequest {
  title?: string;
  libraryType?: LibraryType;
  url?: string;
  content?: string;
  docsUrl?: string;
  file?: File | null;
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
  id: string;
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

export const libraryTypeOptions = [
  { label: "All", value: "all" },
  { label: "Documents", value: "doc" },
  { label: "Links", value: "url" },
  { label: "Notes", value: "note" },
] as const;

export type LibraryTypeValue = (typeof libraryTypeOptions)[number]["value"];

export interface LibrarySelection {
  id: number;
  title: string;
  type: LibraryTypeValue;
}

/**
 * Library Type Icons - Icon names for library types
 */
export const LIBRARY_TYPE_ICONS: Record<string, string> = {
  url: "i-lucide-link",
  doc: "i-lucide-file-text",
  note: "i-lucide-sticky-note",
};
