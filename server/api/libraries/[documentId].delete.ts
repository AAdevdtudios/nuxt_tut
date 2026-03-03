import { createError, getRouterParam } from "h3";
import { useApi } from "../../utils/api";

export default defineEventHandler(async (event) => {
  try {
    const libraryId = getRouterParam(event, "documentId");

    if (!libraryId || typeof libraryId !== "string") {
      throw createError({
        statusCode: 400,
        statusMessage: "Valid libraryId is required",
      });
    }

    const response = await useApi<{ success?: boolean }>(
      event,
      `/library/items/${libraryId}`,
      {
        method: "DELETE",
        useJwt: true,
      },
    );

    return response;
  } catch (error: any) {
    throw createError({
      statusCode: error.status || 500,
      statusMessage: error.message || "Failed to delete library",
    });
  }
});
