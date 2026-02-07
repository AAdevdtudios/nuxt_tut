import { createError, getRouterParam } from "h3";
import { useApi } from "../../utils/api";
import type { LibrarySingleResponse } from "~/types/library.types";

export default defineEventHandler(async (event) => {
  try {
    const documentId = getRouterParam(event, "documentId");

    if (!documentId) {
      throw createError({
        statusCode: 400,
        statusMessage: "documentId is required",
      });
    }

    const response = await useApi<LibrarySingleResponse>(
      event,
      `/libraries/${documentId}`,
      {
        method: "GET",
        useJwt: true,
      },
    );

    return response;
  } catch (error: any) {
    console.error("[libraries-get-one] Error:", error);
    throw createError({
      statusCode: error.status || 500,
      statusMessage: error.message || "Failed to fetch library",
    });
  }
});
