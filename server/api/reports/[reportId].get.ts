import { createError, getRouterParam } from "h3";
import { useApi } from "~~/server/utils/api";

export default defineEventHandler(async (event) => {
  const reportId = getRouterParam(event, "reportId");
  if (!reportId) throw createError({ statusCode: 400, statusMessage: "Report ID is required" });

  return await useApi(event, `/reports/${reportId}`, {
    method: "GET",
    useJwt: true,
  });
});
