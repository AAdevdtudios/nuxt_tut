import { createError, getRouterParam } from "h3";
import { useApi } from "~~/server/utils/api";

export default defineEventHandler(async (event) => {
  const jobId = getRouterParam(event, "jobId");
  if (!jobId) throw createError({ statusCode: 400, statusMessage: "Job ID is required" });

  return await useApi(event, `/reports/result/${jobId}`, {
    method: "GET",
    useJwt: true,
  });
});
