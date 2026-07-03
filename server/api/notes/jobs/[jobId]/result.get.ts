import { createError, defineEventHandler, getRouterParam } from "h3";
import { useApi } from "../../../../utils/api";

export default defineEventHandler(async (event) => {
  const jobId = getRouterParam(event, "jobId");

  if (!jobId) {
    throw createError({ statusCode: 400, statusMessage: "Job ID is required" });
  }

  return await useApi(event, `/notes/jobs/${jobId}/result`, {
    method: "GET",
    useJwt: true,
  });
});
