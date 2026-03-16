import { createError, readBody } from "h3";
import { useApi } from "~~/server/utils/api";

export default defineEventHandler(async (event) => {
  const documentId = getRouterParam(event, "documentId");

  if (!documentId) {
    throw createError({
      statusCode: 400,
      statusMessage: "Project ID is required",
    });
  }

  try {
    const body = await readBody(event);

    return await useApi(
      event,
      `/projects/${documentId}/adaptive/questions/evaluate`,
      {
        method: "POST",
        body,
        useJwt: true,
      },
    );
  } catch (error: any) {
    throw createError({
      statusCode: error?.statusCode || error?.status || 500,
      statusMessage:
        error?.statusMessage ||
        error?.message ||
        "Failed to evaluate adaptive answers",
      data: error?.data,
    });
  }
});
