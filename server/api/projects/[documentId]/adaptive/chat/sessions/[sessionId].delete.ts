import { createError } from "h3";
import { useApi } from "~~/server/utils/api";

export default defineEventHandler(async (event) => {
  const documentId = getRouterParam(event, "documentId");
  const sessionId = getRouterParam(event, "sessionId");

  if (!documentId) {
    throw createError({
      statusCode: 400,
      statusMessage: "Project ID is required",
    });
  }

  if (!sessionId) {
    throw createError({
      statusCode: 400,
      statusMessage: "Session ID is required",
    });
  }

  try {
    return await useApi(
      event,
      `/projects/${documentId}/adaptive/chat/sessions/${sessionId}`,
      {
        method: "DELETE",
        useJwt: true,
      },
    );
  } catch (error: any) {
    throw createError({
      statusCode: error?.statusCode || error?.status || 500,
      statusMessage:
        error?.statusMessage || error?.message || "Failed to delete chat session",
      data: error?.data,
    });
  }
});
