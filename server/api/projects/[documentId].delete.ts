import { createError } from "h3";
import { useApi } from "../../utils/api";

export default defineEventHandler(async (event) => {
  try {
    const documentId = getRouterParam(event, "documentId");

    if (!documentId) {
      throw createError({
        statusCode: 400,
        statusMessage: "Document ID is required",
      });
    }

    await useApi(event, `/projects/${documentId}`, {
      method: "DELETE",
      useJwt: true,
    });

    return { success: true, message: "Project deleted successfully" };
  } catch (error: any) {
    throw createError({
      statusCode: error.status || 500,
      statusMessage: error.message || "Failed to delete project",
    });
  }
});
