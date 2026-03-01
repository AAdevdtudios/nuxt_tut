/**
 * useProjectForm Composable - Project Form Submission & Validation
 *
 * Handles project form submission with validation
 * Separates form logic from feature logic
 */

import { ref } from "vue";
import type {
  ProjectCreateRequest,
  ProjectUpdateRequest,
  ProjectIcon,
} from "~/types/project.types";

export interface ProjectFormData {
  title: string;
  description: string;
  icons: ProjectIcon;
  color: string;
  start: string;
  end: string;
  libraries?: (string | number)[];
}

export interface UseProjectFormReturn {
  formData: Ref<ProjectFormData>;
  errors: Ref<Array<{ field: string; message: string }>>;
  isSubmitting: Ref<boolean>;
  validateForm: () => boolean;
  resetForm: () => void;
  hasFieldError: (field: string) => boolean;
  getFieldError: (field: string) => string | undefined;
}

const defaultFormData: ProjectFormData = {
  title: "",
  description: "",
  icons: "graduation-cap",
  color: "f87171",
  start: new Date().toISOString().split("T")[0] || "",
  end: new Date(Date.now() + 86400000).toISOString().split("T")[0] || "",
};

/**
 * Composable for project form handling
 */
export function useProjectForm(): UseProjectFormReturn {
  const formData = ref<ProjectFormData>({ ...defaultFormData });
  const errors = ref<Array<{ field: string; message: string }>>([]);
  const isSubmitting = ref(false);

  /**
   * Validate form data
   */
  const validateForm = (): boolean => {
    errors.value = [];

    // Title validation
    if (!formData.value.title?.trim()) {
      errors.value.push({ field: "title", message: "Title is required" });
    } else if (formData.value.title.length > 255) {
      errors.value.push({
        field: "title",
        message: "Title must be less than 255 characters",
      });
    }

    // Icon validation
    const validIcons = [
      "graduation-cap",
      "file-text",
      "atom",
      "presentation",
      "book-open",
      "folder",
      "target",
      "sparkles",
    ];
    if (!validIcons.includes(formData.value.icons)) {
      errors.value.push({ field: "icons", message: "Invalid icon selected" });
    }

    // Color validation (hex code)
    if (!formData.value.color.match(/^[0-9a-fA-F]{6}$/)) {
      errors.value.push({
        field: "color",
        message: "Color must be a valid hex code",
      });
    }

    // Date validation
    if (!formData.value.start) {
      errors.value.push({ field: "start", message: "Start date is required" });
    }

    if (!formData.value.end) {
      errors.value.push({ field: "end", message: "End date is required" });
    }

    if (formData.value.start && formData.value.end) {
      const startDate = new Date(formData.value.start);
      const endDate = new Date(formData.value.end);

      if (endDate < startDate) {
        errors.value.push({
          field: "end",
          message: "End date must be after start date",
        });
      }
    }

    return errors.value.length === 0;
  };

  /**
   * Reset form to default state
   */
  const resetForm = (): void => {
    formData.value = { ...defaultFormData };
    errors.value = [];
  };

  /**
   * Check if field has error
   */
  const hasFieldError = (field: string): boolean => {
    return errors.value.some((err) => err.field === field);
  };

  /**
   * Get field error message
   */
  const getFieldError = (field: string): string | undefined => {
    return errors.value.find((err) => err.field === field)?.message;
  };

  return {
    formData,
    errors,
    isSubmitting,
    validateForm,
    resetForm,
    hasFieldError,
    getFieldError,
  };
}
