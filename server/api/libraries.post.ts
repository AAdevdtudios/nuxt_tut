import { readBody, createError } from "h3";
import { useApi } from "../utils/api";
import { validateLibraryCreate } from "../schemas/library.schema";
import type { LibrarySingleResponse } from "~/types/library.types";

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event);

    // Validate request body using Zod schema
    const validated = validateLibraryCreate(body);

    // Prepare request payload with validated data
    const payload = {
      data: {
        title: validated.title,
        libraryType: validated.libraryType,
        ...(validated.url && { url: validated.url }),
        ...(validated.content && { content: validated.content }),
        ...(validated.docID && { docID: validated.docID }),
        ...(validated.libUUID && { libUUID: validated.libUUID }),
        ...(validated.locale && { locale: validated.locale }),
      },
    };
    console.log("Payload request:");

    console.log(payload);

    const response = await useApi<LibrarySingleResponse>(event, "/libraries", {
      method: "POST",
      body: payload,
      useJwt: true,
    });

    console.log(response);

    return response;
  } catch (error: any) {
    console.error("[libraries.post] Error:", error);

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
      statusMessage: error.message || "Failed to create library",
    });
  }
});
