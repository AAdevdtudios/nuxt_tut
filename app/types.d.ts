export interface AuthResponse {
  jwt: string;
  user: User;
}

export interface User {
  id: number;
  username: string;
  email: string;
  confirmed: boolean;
  blocked: boolean;
  role?: {
    id: number;
    name: string;
    type: string;
  };
}
export interface ApiError {
  status: number;
  name: string;
  message: string;
  details?: {
    errors: Array<{ id: string; message: string; field: string }>;
  };
}

export interface LibraryListResponse {
  data: LibraryItem[];
  meta: {
    pagination: {
      page: number;
      pageSize: number;
      pageCount: number;
      total: number;
    };
  };
}

export interface LibraryItem {
  id: number;
  title: string;
  type: LibraryTypeValue;
  size: number;
  content: string;
  // createdAt: string;
  // updatedAt: string;
}

export interface LibraryType {
  label: string;
  value: string;
}
export const libraryTypes = [
  { label: "All", value: "all" },
  { label: "PDF", value: "pdf" },
  { label: "DOCX", value: "docx" },
  { label: "TXT", value: "txt" },
  { label: "Website", value: "website" },
  { label: "Note", value: "note" },
  { label: "AI Generated", value: "ai_generated" },
] as const;
export type LibraryTypeValue = (typeof libraryTypes)[number]["value"];
