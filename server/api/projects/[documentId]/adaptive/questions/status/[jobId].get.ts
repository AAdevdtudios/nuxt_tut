import { createError } from "h3";
import { useApi } from "~~/server/utils/api";

export default defineEventHandler(async (event) => {
  const documentId = getRouterParam(event, "documentId");
  const jobId = getRouterParam(event, "jobId");

  if (!documentId || !jobId) {
    throw createError({
      statusCode: 400,
      statusMessage: "Project ID and Job ID are required",
    });
  }

  try {
    return await useApi(
      event,
      `/projects/${documentId}/adaptive/questions/status/${jobId}`,
      {
        method: "GET",
        useJwt: true,
      },
    );
  } catch (error: any) {
    throw createError({
      statusCode: error?.statusCode || error?.status || 500,
      statusMessage:
        error?.statusMessage ||
        error?.message ||
        "Failed to fetch adaptive job status",
      data: error?.data,
    });
  }
});
