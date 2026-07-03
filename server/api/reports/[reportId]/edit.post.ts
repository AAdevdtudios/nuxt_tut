import { createError, getRouterParam, readBody } from "h3";
import { useApi } from "~~/server/utils/api";

export default defineEventHandler(async (event) => {
  const reportId = getRouterParam(event, "reportId");
  if (!reportId) throw createError({ statusCode: 400, statusMessage: "Report ID is required" });

  return await useApi(event, `/reports/${reportId}/edit`, {
    method: "POST",
    body: await readBody(event),
    useJwt: true,
  });
});
