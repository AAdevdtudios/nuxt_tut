/**
 * Project Service - Utilities & Data Processing
 * Handles data transformation, formatting, and non-API operations
 *
 * SOLID Principles Applied:
 * - Single Responsibility: Only handles utilities, not API calls
 * - Open/Closed: Easy to extend with new utility methods
 * - Dependency Inversion: No external dependencies
 */

import type {
  ProjectCreateRequest,
  ProjectItem,
  ProjectIcon,
} from "~/types/project.types";

/**
 * ProjectService provides utility methods for project functionality
 * API calls are handled in composables where $fetch is available
 */
export class ProjectService {
  /**
   * Format date for display
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
   * Format date range for display
   * @param start - Start date ISO string
   * @param end - End date ISO string
   * @returns Formatted date range string
   */
  formatDateRange(start: string, end: string): string {
    try {
      const startFormatted = this.formatDate(start);
      const endFormatted = this.formatDate(end);
      return `${startFormatted} - ${endFormatted}`;
    } catch {
      return "Invalid date";
    }
  }

  /**
   * Calculate days remaining until end date
   * @param endDate - End date ISO string
   * @returns Number of days remaining
   */
  daysRemaining(endDate: string): number {
    try {
      const end = new Date(endDate);
      const now = new Date();
      const diffTime = end.getTime() - now.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return Math.max(0, diffDays);
    } catch {
      return 0;
    }
  }

  /**
   * Calculate progress percentage based on time elapsed
   * @param start - Start date ISO string
   * @param end - End date ISO string
   * @returns Progress percentage (0-100)
   */
  calculateProgress(start: string, end: string): number {
    try {
      const startDate = new Date(start);
      const endDate = new Date(end);
      const now = new Date();

      const totalDuration = endDate.getTime() - startDate.getTime();
      const elapsed = now.getTime() - startDate.getTime();

      if (elapsed <= 0) return 0;
      if (elapsed >= totalDuration) return 100;

      return Math.min(
        100,
        Math.max(0, Math.round((elapsed / totalDuration) * 100)),
      );
    } catch {
      return 0;
    }
  }

  /**
   * Check if project deadline is overdue
   * @param endDate - End date ISO string
   * @returns true if overdue
   */
  isOverdue(endDate: string): boolean {
    try {
      const end = new Date(endDate);
      return new Date() > end;
    } catch {
      return false;
    }
  }

  /**
   * Check if project is starting soon (within 7 days)
   * @param startDate - Start date ISO string
   * @returns true if starting within 7 days
   */
  isStartingSoon(startDate: string): boolean {
    try {
      const start = new Date(startDate);
      const now = new Date();
      const daysUntilStart =
        (start.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
      return daysUntilStart > 0 && daysUntilStart <= 7;
    } catch {
      return false;
    }
  }

  /**
   * Get project status label
   * @param startDate - Start date ISO string
   * @param endDate - End date ISO string
   * @returns Status label
   */
  getStatus(
    startDate: string,
    endDate: string,
  ): "not-started" | "active" | "completed" | "overdue" {
    const now = new Date();
    const start = new Date(startDate);
    const end = new Date(endDate);

    if (now < start) return "not-started";
    if (now > end) return this.isOverdue(endDate) ? "overdue" : "completed";
    return "active";
  }

  /**
   * Extracts unique project colors from a list of projects
   * @param projects - Array of project items
   * @returns Sorted array of unique color hex strings
   */
  extractUniqueColors(projects: ProjectItem[]): string[] {
    const colors = new Set(projects.map((project) => project.color));
    return Array.from(colors).sort();
  }

  /**
   * Filters projects by color
   * @param projects - Array of project items
   * @param color - Color hex string to filter by
   * @returns Filtered array of projects
   */
  filterByColor(projects: ProjectItem[], color: string): ProjectItem[] {
    if (!color) return projects;
    return projects.filter((project) => project.color === color);
  }

  /**
   * Filters projects by status
   * @param projects - Array of project items
   * @param status - Status to filter by
   * @returns Filtered array of projects
   */
  filterByStatus(
    projects: ProjectItem[],
    status: "not-started" | "active" | "completed" | "overdue",
  ): ProjectItem[] {
    return projects.filter(
      (project) => this.getStatus(project.start, project.end) === status,
    );
  }

  /**
   * Sorts projects by end date
   * @param projects - Array of project items
   * @param order - Sort order ("asc" or "desc")
   * @returns Sorted array of projects
   */
  sortByDeadline(
    projects: ProjectItem[],
    order: "asc" | "desc" = "asc",
  ): ProjectItem[] {
    return [...projects].sort((a, b) => {
      const timeA = new Date(a.end).getTime();
      const timeB = new Date(b.end).getTime();
      return order === "asc" ? timeA - timeB : timeB - timeA;
    });
  }

  /**
   * Gets CSS class for project color background
   * @param colorHex - Hex color string (without #)
   * @returns CSS class name
   */
  getColorClass(colorHex: string): string {
    const colorMap: Record<string, string> = {
      f87171: "bg-red-500",
      fbbf24: "bg-amber-500",
      "34d399": "bg-emerald-500",
      "60a5fa": "bg-blue-500",
      a78bfa: "bg-violet-500",
      f472b6: "bg-pink-500",
      facc15: "bg-yellow-500",
      "38bdf8": "bg-sky-500",
      "4ade80": "bg-green-500",
      c084fc: "bg-fuchsia-500",
      ec4899: "bg-rose-500",
      "14b8a6": "bg-teal-500",
    };
    return colorMap[colorHex] || "bg-gray-500";
  }

  /**
   * Gets display name for project icon
   * @param icon - Icon value
   * @returns Display name
   */
  getIconLabel(icon: ProjectIcon): string {
    const labels: Record<ProjectIcon, string> = {
      "graduation-cap": "Education",
      "file-text": "Document",
      atom: "Science",
      presentation: "Presentation",
      "book-open": "Book",
      folder: "Folder",
      target: "Target",
      sparkles: "Creative",
    };
    return labels[icon] || icon;
  }

  /**
   * Validates ProjectCreateRequest fields
   * @param data - Request data
   * @returns Object with validation errors
   */
  validateProjectData(
    data: Partial<ProjectCreateRequest>,
  ): Record<string, string> {
    const errors: Record<string, string> = {};

    if (!data.title?.trim()) {
      errors.title = "Project title is required";
    } else if (data.title.length < 3) {
      errors.title = "Title must be at least 3 characters";
    } else if (data.title.length > 100) {
      errors.title = "Title must not exceed 100 characters";
    }

    if (data.description && data.description.length > 500) {
      errors.description = "Description must not exceed 500 characters";
    }

    if (!data.icons) {
      errors.icons = "Project icon is required";
    }

    if (!data.color) {
      errors.color = "Project color is required";
    }

    if (!data.start) {
      errors.start = "Start date is required";
    }

    if (!data.end) {
      errors.end = "End date is required";
    }

    if (data.start && data.end) {
      const startDate = new Date(data.start);
      const endDate = new Date(data.end);
      if (endDate <= startDate) {
        errors.end = "End date must be after start date";
      }
    }

    return errors;
  }

  /**
   * Gets icon name for UI display
   * @param icon - Icon value
   * @returns Lucide icon name
   */
  getIconName(icon: ProjectIcon): string {
    const iconMap: Record<ProjectIcon, string> = {
      "graduation-cap": "i-lucide-graduation-cap",
      "file-text": "i-lucide-file-text",
      atom: "i-lucide-atom",
      presentation: "i-lucide-presentation",
      "book-open": "i-lucide-book-open",
      folder: "i-lucide-folder",
      target: "i-lucide-target",
      sparkles: "i-lucide-sparkles",
    };
    return iconMap[icon] || "i-lucide-folder";
  }
}
