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
      payload.url &&
      payload.url.trim() !== ""
    ) {
      try {
        new URL(payload.url);
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

  return {
    errors,
    isValid,
    validateCreate,
    validateUpdate,
    clearErrors,
    getFieldError,
    hasFieldError,
  };
}
