/**
 * Validation Composable - useLibraryValidation
 * Provides client-side validation for library operations
 * Works in tandem with server-side Zod validation
 */

import { ref } from "vue";
import type { LibraryCreateRequest, LibraryUpdateRequest } from "~/types";

export interface ValidationError {
  field: string;
  message: string;
}

export function useLibraryValidation() {
  const errors = ref<ValidationError[]>([]);
  const isValid = ref(true);

  const isPdfFile = (file: File | null | undefined): boolean => {
    if (!file) return false;

    const mimeType = file.type?.toLowerCase();
    const fileName = file.name?.toLowerCase() || "";

    return mimeType === "application/pdf" || fileName.endsWith(".pdf");
  };

  const isBlockedUrl = (rawUrl: string): boolean => {
    try {
      const parsed = new URL(rawUrl);
      const path = parsed.pathname.toLowerCase();
      return path.endsWith(".epub");
    } catch {
      return false;
    }
  };

  const isHttpUrl = (rawUrl: string): boolean => {
    try {
      const parsed = new URL(rawUrl);
      return parsed.protocol === "http:" || parsed.protocol === "https:";
    } catch {
      return false;
    }
  };

  /**
   * Validates library creation payload
   */
  const validateCreate = (payload: Partial<LibraryCreateRequest>): boolean => {
    errors.value = [];

    // Title validation
    if (!payload.title || payload.title.trim() === "") {
      errors.value.push({ field: "title", message: "Title is required" });
    } else if (payload.title.length > 255) {
      errors.value.push({
        field: "title",
        message: "Title must be less than 255 characters",
      });
    }

    // Library type validation
    if (!payload.libraryType) {
      errors.value.push({
        field: "libraryType",
        message: "Library type is required",
      });
    } else if (!["url", "doc", "note"].includes(payload.libraryType)) {
      errors.value.push({
        field: "libraryType",
        message: 'Library type must be "url", "doc", or "note"',
      });
    }

    // URL validation (if type is URL and url is provided)
    if (
      payload.libraryType === "url" &&
      (!payload.url || payload.url.trim() === "")
    ) {
      errors.value.push({
        field: "url",
        message: "URL is required for website type",
      });
    } else if (
      payload.libraryType === "url" &&
      payload.url &&
      payload.url.trim() !== ""
    ) {
      try {
        new URL(payload.url);
        if (!isHttpUrl(payload.url)) {
          errors.value.push({
            field: "url",
            message: "URL must start with http:// or https://",
          });
        }
        if (isBlockedUrl(payload.url)) {
          errors.value.push({
            field: "url",
            message: "EPUB links are not supported. Use a website or PDF link.",
          });
        }
      } catch {
        errors.value.push({
          field: "url",
          message: "Invalid URL format",
        });
      }
    }

    // Content validation
    if (payload.content && payload.content.length > 10000) {
      errors.value.push({
        field: "content",
        message: "Content is too long (max 10,000 characters)",
      });
    }

    if (payload.libraryType === "note" && !payload.content?.trim()) {
      errors.value.push({
        field: "content",
        message: "Content is required for note type",
      });
    }

    if (payload.libraryType === "doc" && !payload.file) {
      errors.value.push({
        field: "file",
        message: "File is required for document type",
      });
    } else if (payload.libraryType === "doc" && !isPdfFile(payload.file)) {
      errors.value.push({
        field: "file",
        message: "Only PDF files are allowed for document uploads",
      });
    }

    isValid.value = errors.value.length === 0;
    return isValid.value;
  };

  /**
   * Validates library update payload
   */
  const validateUpdate = (payload: Partial<LibraryUpdateRequest>): boolean => {
    errors.value = [];

    // Title validation (if provided)
    if (payload.title !== undefined) {
      if (payload.title && payload.title.trim() === "") {
        errors.value.push({ field: "title", message: "Title cannot be empty" });
      } else if (payload.title && payload.title.length > 255) {
        errors.value.push({
          field: "title",
          message: "Title must be less than 255 characters",
        });
      }
    }

    // Library type validation (if provided)
    if (payload.libraryType !== undefined) {
      if (!["url", "doc", "note"].includes(payload.libraryType)) {
        errors.value.push({
          field: "libraryType",
          message: 'Library type must be "url", "doc", or "note"',
        });
      }
    }

    // URL validation (if provided)
    if (payload.url !== undefined && payload.url && payload.url.trim() !== "") {
      try {
        new URL(payload.url);
        if (!isHttpUrl(payload.url)) {
          errors.value.push({
            field: "url",
            message: "URL must start with http:// or https://",
          });
        }
        if (isBlockedUrl(payload.url)) {
          errors.value.push({
            field: "url",
            message: "EPUB links are not supported. Use a website or PDF link.",
          });
        }
      } catch {
        errors.value.push({
          field: "url",
          message: "Invalid URL format",
        });
      }
    }

    // Content validation (if provided)
    if (payload.content !== undefined && payload.content) {
      if (payload.content.length > 10000) {
        errors.value.push({
          field: "content",
          message: "Content is too long (max 10,000 characters)",
        });
      }
    }

    if (
      payload.libraryType === "doc" &&
      payload.file !== undefined &&
      payload.file !== null &&
      !isPdfFile(payload.file)
    ) {
      errors.value.push({
        field: "file",
        message: "Only PDF files are allowed for document uploads",
      });
    }

    isValid.value = errors.value.length === 0;
    return isValid.value;
  };

  /**
   * Clears all validation errors
   */
  const clearErrors = () => {
    errors.value = [];
    isValid.value = true;
  };

  /**
   * Gets error message for a specific field
   */
  const getFieldError = (field: string): string | undefined => {
    return errors.value.find((e) => e.field === field)?.message;
  };

  /**
   * Checks if a field has an error
   */
  const hasFieldError = (field: string): boolean => {
    return errors.value.some((e) => e.field === field);
  };

  /**
   * Set field errors from API response
   */
  const setFieldErrorsFromApi = (
    fieldErrors: Record<string, string[]>,
  ): void => {
    errors.value = [];
    Object.entries(fieldErrors).forEach(([field, messages]) => {
      if (messages && messages.length > 0) {
        errors.value.push({ field, message: messages[0] || "Invalid value" });
      }
    });
  };

  return {
    errors,
    isValid,
    validateCreate,
    validateUpdate,
    clearErrors,
    getFieldError,
    hasFieldError,
    setFieldErrorsFromApi,
  };
}
