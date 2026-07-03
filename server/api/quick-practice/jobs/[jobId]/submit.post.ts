import { createError, defineEventHandler, getRouterParam, readBody } from "h3";
import { useApi } from "../../../../utils/api";

export default defineEventHandler(async (event) => {
  const jobId = getRouterParam(event, "jobId");
  if (!jobId) {
    throw createError({ statusCode: 400, statusMessage: "Job ID is required" });
  }

  const body = await readBody(event);
  return await useApi(event, `/quick-practice/jobs/${jobId}/submit`, {
    method: "POST",
    body,
    useJwt: true,
  });
});
