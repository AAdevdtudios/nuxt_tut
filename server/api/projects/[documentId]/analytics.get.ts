import { createError } from "h3";
import { useApi } from "../../../utils/api";

export default defineEventHandler(async (event) => {
  const documentId = getRouterParam(event, "documentId");

  if (!documentId) {
    throw createError({
      statusCode: 400,
      statusMessage: "Project ID is required",
    });
  }

  try {
    return await useApi(event, `/projects/${documentId}/analytics`, {
      method: "GET",
      useJwt: true,
    });
  } catch (error: any) {
    throw createError({
      statusCode: error?.statusCode || error?.status || 500,
      statusMessage:
        error?.statusMessage ||
        error?.message ||
        "Failed to fetch project analytics",
      data: error?.data,
    });
  }
});
