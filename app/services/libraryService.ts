/**
 * Library Service - Utilities & Data Processing
 * Handles data transformation, formatting, and non-API operations
 *
 * SOLID Principles Applied:
 * - Single Responsibility: Only handles utilities, not API calls
 * - Open/Closed: Easy to extend with new utility methods
 * - Dependency Inversion: No external dependencies
 */

import type { LibraryItem } from "~/types/library.types";

/**
 * LibraryService provides utility methods for library functionality
 * API calls are handled in composables where $fetch is available
 */
export class LibraryService {
  /**
   * Opens a library resource (URL) in a new browser tab
   * @param url - The URL to open
   */
  openLibraryUrl(url: string): void {
    if (!url) {
      console.warn("[LibraryService] No URL provided to openLibraryUrl");
      return;
    }
    window.open(url, "_blank");
  }

  /**
   * Extracts unique library types from a list of library items
   * @param libraries - Array of library items
   * @returns Sorted array of unique library type strings
   */
  extractUniqueLibraryTypes(libraries: LibraryItem[]): string[] {
    const types = new Set(libraries.map((lib) => lib.libraryType));
    return Array.from(types).sort();
  }

  /**
   * Filters libraries by type
   * @param libraries - Array of library items
   * @param type - Library type to filter by
   * @returns Filtered array of library items
   */
  filterByType(libraries: LibraryItem[], type: string): LibraryItem[] {
    if (type === "all" || !type) return libraries;
    return libraries.filter((lib) => lib.libraryType === type);
  }

  /**
   * Formats library creation date for display
   * @param dateString - ISO date string
   * @returns Formatted date string
   */
  formatDate(dateString: string): string {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    } catch {
      return "Unknown";
    }
  }

  /**
   * Gets display name for library type
   * @param type - Library type
   * @returns Display name for the type
   */
  getTypeLabel(type: string): string {
    const labels: Record<string, string> = {
      url: "Web Link",
      doc: "Document",
      note: "Note",
    };
    return labels[type] || type;
  }

  /**
   * Truncates text to specified length with ellipsis
   * @param text - Text to truncate
   * @param length - Maximum length
   * @returns Truncated text
   */
  truncateText(text: string, length: number = 100): string {
    if (!text) return "";
    if (text.length <= length) return text;
    return text.substring(0, length) + "...";
  }
}
