import { readBody, createError, getRouterParam } from "h3";
import { useApi } from "../../utils/api";
import { validateLibraryUpdate } from "../../schemas/library.schema";
import type { LibrarySingleResponse } from "~/types/library.types";

export default defineEventHandler(async (event) => {
  try {
    const documentId = getRouterParam(event, "documentId");

    if (!documentId || typeof documentId !== "string") {
      throw createError({
        statusCode: 400,
        statusMessage: "Valid documentId is required",
      });
    }

    const body = await readBody(event);

    // Validate request body using Zod schema
    const validated = validateLibraryUpdate(body);

    // Prepare request payload with validated data
    const payload = {
      data: {
        ...(validated.title && { title: validated.title }),
        ...(validated.libraryType && { libraryType: validated.libraryType }),
        ...(validated.url !== undefined && { url: validated.url }),
        ...(validated.content !== undefined && { content: validated.content }),
        ...(validated.docID !== undefined && { docID: validated.docID }),
      },
    };

    const response = await useApi<LibrarySingleResponse>(
      event,
      `/libraries/${documentId}`,
      {
        method: "PUT",
        body: payload,
        useJwt: true,
      },
    );

    return response;
  } catch (error: any) {
    console.error("[libraries-update] Error:", error);

    // Handle validation errors
    if (error.name === "ZodError") {
      const fieldErrors = error.errors
        .map((err: any) => `${err.path.join(".")} - ${err.message}`)
        .join(", ");
      throw createError({
        statusCode: 400,
        statusMessage: `Validation failed: ${fieldErrors}`,
      });
    }

    throw createError({
      statusCode: error.status || 500,
      statusMessage: error.message || "Failed to update library",
    });
  }
});
