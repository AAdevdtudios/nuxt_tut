import { readBody, createError } from "h3";
import { useApi } from "../utils/api";
import { validateProjectCreate } from "../schemas/project.schema";
import type { ProjectSingleResponse } from "~/types/project.types";

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event);

    // Validate request body using Zod schema
    const validated = validateProjectCreate(body);

    // Prepare request payload with validated data
    const payload = {
      data: {
        title: validated.title,
        description: validated.description || null,
        icons: validated.icons,
        color: validated.color,
        start: validated.start,
        end: validated.end,
        ...(validated.libraries && { libraries: validated.libraries }),
      },
    };

    console.log("[projects.post] Payload:", payload);

    const response = await useApi<ProjectSingleResponse>(event, "/projects", {
      method: "POST",
      body: payload,
      useJwt: true,
    });

    // Process response to add library counts
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

    console.log("[projects.post] Response:", response);

    return response;
  } catch (error: any) {
    console.error("[projects.post] Error:", error);

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

    // Handle array-formatted validation errors
    if (Array.isArray(error)) {
      const fieldErrors = error
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
      statusMessage: error.message || "Failed to create project",
    });
  }
});
