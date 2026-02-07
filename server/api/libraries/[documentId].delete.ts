import { createError, getRouterParam } from "h3";
import { useApi } from "../../utils/api";
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

    const response = await useApi<LibrarySingleResponse>(
      event,
      `/libraries/${documentId}`,
      {
        method: "DELETE",
        useJwt: true,
      },
    );

    return response;
  } catch (error: any) {
    console.error("[libraries-delete] Error:", error);

    throw createError({
      statusCode: error.status || 500,
      statusMessage: error.message || "Failed to delete library",
    });
  }
});
