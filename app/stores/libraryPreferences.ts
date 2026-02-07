import { defineStore } from "pinia";
import { ref } from "vue";

/**
 * Library Preferences Store
 * Persists user preferences for library view such as:
 * - View mode (grid or list)
 */
export const useLibraryPreferencesStore = defineStore(
  "libraryPreferences",
  () => {
    // View mode - defaults to "grid"
    const viewMode = ref<"grid" | "list">("grid");

    /**
     * Set the view mode preference
     * @param mode - "grid" or "list"
     */
    function setViewMode(mode: "grid" | "list") {
      viewMode.value = mode;
    }

    /**
     * Toggle between grid and list view
     */
    function toggleViewMode() {
      viewMode.value = viewMode.value === "grid" ? "list" : "grid";
    }

    return {
      viewMode,
      setViewMode,
      toggleViewMode,
    };
  },
  {
    persist: true,
  },
);
