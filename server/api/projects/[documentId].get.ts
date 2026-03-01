import { createError } from "h3";
import { useApi } from "../../utils/api";
import type { ProjectSingleResponse } from "~/types/project.types";

export default defineEventHandler(async (event) => {
  try {
    const documentId = getRouterParam(event, "documentId");

    if (!documentId) {
      throw createError({
        statusCode: 400,
        statusMessage: "Document ID is required",
      });
    }

    // Build path with populate parameter
    const path = `/projects/${documentId}?populate=libraries`;

    // Call Strapi API with library population
    const response = await useApi<ProjectSingleResponse>(event, path, {
      method: "GET",
      useJwt: true,
    });

    // Process response to add library counts and filter notes
    if (response?.data) {
      const libraries = response.data.libraries || [];
      const nonNoteLibraries = libraries.filter(
        (lib: any) => lib.libraryType !== "note",
      );
      const noteLibraries = libraries.filter(
        (lib: any) => lib.libraryType === "note",
      );

      response.data = {
        ...response.data,
        libraries: nonNoteLibraries,
        librariesCount: nonNoteLibraries.length,
        notesCount: noteLibraries.length,
      };
    }

    return response;
  } catch (error: any) {
    console.error("[projects.get by id] Error:", error);

    throw createError({
      statusCode: error.status || 500,
      statusMessage: error.message || "Failed to fetch project",
    });
  }
});
