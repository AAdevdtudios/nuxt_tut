import { createError } from "h3";
import { useApi } from "../../utils/api";
import type { ProjectSingleResponse } from "~/types/project.types";
import { normalizeProjectSingleResponse } from "../../utils/project";

export default defineEventHandler(async (event) => {
  try {
    const documentId = getRouterParam(event, "documentId");

    if (!documentId) {
      throw createError({
        statusCode: 400,
        statusMessage: "Document ID is required",
      });
    }

    const response = await useApi<unknown>(event, `/projects/${documentId}`, {
      method: "GET",
      useJwt: true,
    });

    return normalizeProjectSingleResponse(response) as ProjectSingleResponse;
  } catch (error: any) {
    throw createError({
      statusCode: error.status || 500,
      statusMessage: error.message || "Failed to fetch project",
    });
  }
});
