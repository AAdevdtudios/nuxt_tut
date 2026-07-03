import { createError, getRouterParam } from "h3";
import { useApi } from "~~/server/utils/api";

export default defineEventHandler(async (event) => {
  const projectId = getRouterParam(event, "documentId");

  if (!projectId) {
    throw createError({ statusCode: 400, statusMessage: "Project ID is required" });
  }

  return await useApi(event, `/projects/${projectId}/adaptive/progress/report`, {
    method: "GET",
    useJwt: true,
  });
});
