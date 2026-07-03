import { createError } from "h3";
import { useApi } from "../../../../utils/api";

export default defineEventHandler(async (event) => {
  const reportId = getRouterParam(event, "reportId");

  if (!reportId) {
    throw createError({
      statusCode: 400,
      statusMessage: "Report ID is required",
    });
  }

  try {
    return await useApi<any>(event, `/reports/${reportId}`, {
      method: "GET",
      useJwt: true,
    });
  } catch (error: any) {
    throw createError({
      statusCode: error?.statusCode || error?.status || 500,
      statusMessage:
        error?.statusMessage || error?.message || "Failed to fetch report",
      data: error?.data,
    });
  }
});
