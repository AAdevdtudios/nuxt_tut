/**
 * Library Form Composable - useLibraryForm
 * Handles library form submission with file upload flow
 *
 * Workflow:
 * 1. User selects type (url, docID, note)
 * 2. For docID: Upload file → Get ID
 * 3. Create library item with all data
 */

import { ref } from "vue";
import type { LibraryCreateRequest } from "~/types/library.types";
import { useLibrary } from "./useLibrary";

export interface LibraryFormData {
  title: string;
  libraryType: "url" | "doc" | "note";
  url?: string;
  content?: string;
  file?: File | null;
}

export function useLibraryForm() {
  const { createLibrary, error, isLoading } = useLibrary();

  const formData = ref<LibraryFormData>({
    title: "",
    libraryType: "url",
    url: "",
    content: "",
    file: null,
  });

  /**
   * Submits form data, handling file upload if needed
   * @returns Promise<void>
   */
  const submitForm = async (): Promise<void> => {
    try {
      if (!formData.value.title.trim()) {
        throw new Error("Title is required");
      }

      let payload: LibraryCreateRequest = {
        title: formData.value.title.trim(),
        libraryType: formData.value.libraryType,
      };

      // Handle file upload for doc type
      if (formData.value.libraryType === "doc") {
        if (!formData.value.file) {
          throw new Error("File is required for document type");
        }

        payload.file = formData.value.file;
      }
      // Handle URL for website type
      else if (formData.value.libraryType === "url") {
        if (!formData.value.url?.trim()) {
          throw new Error("URL is required for website type");
        }
        payload.url = formData.value.url.trim();
      }
      // Handle content for note type
      else if (formData.value.libraryType === "note") {
        if (!formData.value.content?.trim()) {
          throw new Error("Content is required for note type");
        }
        payload.content = formData.value.content.trim();
      }

      await createLibrary(payload);
      resetForm();
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to submit form";
      throw new Error(errorMessage);
    }
  };

  /**
   * Resets form to initial state
   */
  const resetForm = (): void => {
    formData.value = {
      title: "",
      libraryType: "url",
      url: "",
      content: "",
      file: null,
    };
  };

  return {
    formData,
    isLoading,
    error,
    submitForm,
    resetForm,
  };
}
