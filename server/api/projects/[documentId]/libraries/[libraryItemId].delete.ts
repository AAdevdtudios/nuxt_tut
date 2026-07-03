import { createError, getRouterParam } from "h3";
import { useApi } from "~~/server/utils/api";

export default defineEventHandler(async (event) => {
  const projectId = getRouterParam(event, "documentId");
  const libraryItemId = getRouterParam(event, "libraryItemId");

  if (!projectId || !libraryItemId) {
    throw createError({
      statusCode: 400,
      statusMessage: "Project ID and library item ID are required",
    });
  }

  return await useApi(event, `/projects/${projectId}/libraries/${libraryItemId}`, {
    method: "DELETE",
    useJwt: true,
  });
});
