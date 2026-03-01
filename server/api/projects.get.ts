import { readBody, createError } from "h3";
import { useApi } from "../utils/api";
import { parseProjectsQuery } from "../schemas/project.schema";
import type { ProjectsResponse } from "~/types/project.types";

export default defineEventHandler(async (event) => {
  try {
    const query = getQuery(event);

    // Parse and validate query parameters
    const params = parseProjectsQuery(query);

    // Build Strapi params
    const strapiParams: Record<string, any> = {
      "pagination[page]": params.page,
      "pagination[pageSize]": params.pageSize,
      populate: "libraries", // Populate libraries
    };

    if (params.search && params.search.trim() !== "") {
      strapiParams["filters[title][$containsi]"] = params.search;
    }

    // Build query string
    const queryString = new URLSearchParams(strapiParams).toString();
    const path = `/projects?${queryString}`;

    const response = await useApi<ProjectsResponse>(event, path, {
      method: "GET",
      useJwt: true,
    });

    // Process response to add library counts and filter notes
    if (response?.data && Array.isArray(response.data)) {
      response.data = response.data.map((project: any) => {
        // Count non-note and note libraries
        const libraries = project.libraries || [];
        const nonNoteLibraries = libraries.filter(
          (lib: any) => lib.libraryType !== "note",
        );
        const noteLibraries = libraries.filter(
          (lib: any) => lib.libraryType === "note",
        );

        return {
          ...project,
          libraries: nonNoteLibraries, // Only return non-note libraries
          librariesCount: nonNoteLibraries.length,
          notesCount: noteLibraries.length,
        };
      });
    }

    return response;
  } catch (error: any) {
    console.error("[projects.get] Error:", error);

    // Handle validation errors from Zod
    if (error instanceof Error && error.name === "ZodError") {
      const zodError = error as any;
      const fieldErrors = (zodError.errors || [])
        .map(
          (err: any) => `${err.path?.join(".") || "unknown"} - ${err.message}`,
        )
        .join(", ");
      throw createError({
        statusCode: 400,
        statusMessage: `Validation failed: ${fieldErrors}`,
      });
    }

    throw createError({
      statusCode: error.status || 500,
      statusMessage: error.message || "Failed to fetch projects",
    });
  }
});
