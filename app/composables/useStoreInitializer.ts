/**
 * useStoreInitializer Composable
 *
 * Handles smart data fetching:
 * - Check if data is already in Pinia stores
 * - Reuse existing data (avoid refetching)
 * - Fetch only if needed
 *
 * Usage:
 * - Call once on page mount
 * - Composable handles cache logic
 */

import { useProjectStore } from "~/stores/projects";
import { useLibraryStore } from "~/stores/libraries";

export interface InitializeOptions {
  projectsPage?: number;
  projectsPageSize?: number;
  projectsSearch?: string;
  librariesPage?: number;
  librariesPageSize?: number;
  librariesSearch?: string;
  librariesType?: string;
}

export function useStoreInitializer() {
  const projectStore = useProjectStore();
  const libraryStore = useLibraryStore();

  const initializeProjects = async (options: InitializeOptions = {}) => {
    // Skip if already loaded
    if (projectStore.allProjects.length > 0) {
      console.log("[StoreInit] Projects already loaded, reusing");
      return;
    }

    console.log("[StoreInit] Fetching projects...");
    await projectStore.fetchProjects(
      options.projectsPage || 1,
      options.projectsPageSize || 10,
      options.projectsSearch || "",
    );
  };

  const initializeLibraries = async (options: InitializeOptions = {}) => {
    // Skip if already loaded
    if (libraryStore.allLibraries.length > 0) {
      console.log("[StoreInit] Libraries already loaded, reusing");
      return;
    }

    console.log("[StoreInit] Fetching libraries...");
    await libraryStore.fetchLibraries(
      options.librariesPage || 1,
      options.librariesPageSize || 25,
      options.librariesSearch || "",
      options.librariesType || "all",
    );
  };

  /**
   * Initialize both stores
   */
  const initialize = async (options: InitializeOptions = {}) => {
    try {
      await Promise.all([
        initializeProjects(options),
        initializeLibraries(options),
      ]);
    } catch (err) {
      console.error("[StoreInit] Initialization error:", err);
      throw err;
    }
  };

  /**
   * Force refresh projects
   */
  const refreshProjects = async (options: InitializeOptions = {}) => {
    console.log("[StoreInit] Force refreshing projects...");
    await projectStore.fetchProjects(
      options.projectsPage || 1,
      options.projectsPageSize || 10,
      options.projectsSearch || "",
    );
  };

  /**
   * Force refresh libraries
   */
  const refreshLibraries = async (options: InitializeOptions = {}) => {
    console.log("[StoreInit] Force refreshing libraries...");
    await libraryStore.fetchLibraries(
      options.librariesPage || 1,
      options.librariesPageSize || 25,
      options.librariesSearch || "",
      options.librariesType || "all",
    );
  };

  return {
    initialize,
    initializeProjects,
    initializeLibraries,
    refreshProjects,
    refreshLibraries,
  };
}
