import { createError, getRouterParam } from "h3";
import { useApi } from "../../utils/api";
import type { LibrarySingleResponse } from "~/types/library.types";
import { normalizeLibrarySingleResponse } from "../../utils/library";

export default defineEventHandler(async (event) => {
  try {
    const libraryId = getRouterParam(event, "documentId");

    if (!libraryId) {
      throw createError({
        statusCode: 400,
        statusMessage: "libraryId is required",
      });
    }

    const response = await useApi<unknown>(event, `/library/items/${libraryId}`, {
      method: "GET",
      useJwt: true,
    });

    return normalizeLibrarySingleResponse(response) as LibrarySingleResponse;
  } catch (error: any) {
    throw createError({
      statusCode: error.status || 500,
      statusMessage: error.message || "Failed to fetch library",
    });
  }
});
