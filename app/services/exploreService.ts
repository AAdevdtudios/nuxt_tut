/**
 * Explore Service - Utilities & Data Processing
 * Handles data transformation, formatting, and non-API operations
 *
 * SOLID Principles Applied:
 * - Single Responsibility: Only handles utilities, not API calls
 * - Open/Closed: Easy to extend with new utility methods
 * - Dependency Inversion: No external dependencies
 */

import type { Category, Explore } from "~/types/explore.types";

/**
 * ExploreService provides utility methods for explore functionality
 * API calls are handled in composables where $fetch is available
 */
export class ExploreService {
  /**
   * Opens an explore resource in a new browser tab
   * @param url - The URL to open
   */
  openResource(url: string): void {
    if (!url) {
      console.warn("[ExploreService] No URL provided to openResource");
      return;
    }
    window.open(url, "_blank");
  }

  /**
   * Extracts unique languages from a list of explores
   * @param explores - Array of explore items
   * @returns Sorted array of unique language strings
   */
  extractUniqueLanguages(explores: Explore[]): string[] {
    return Array.from(new Set(explores.map((explore) => explore.copyright)))
      .filter(Boolean)
      .sort();
  }

  /**
   * Formats download count for display
   * @param downloads - Download count as string or number
   * @returns Formatted string with locale-specific thousands separator
   */
  formatDownloadCount(downloads: string | number): string {
    try {
      return Number(downloads).toLocaleString();
    } catch {
      return "0";
    }
  }
}
