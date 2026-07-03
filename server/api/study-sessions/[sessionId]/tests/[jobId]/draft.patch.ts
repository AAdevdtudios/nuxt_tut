import { createError, defineEventHandler, getRouterParam, readBody } from "h3";
import { useApi } from "../../../../../utils/api";

export default defineEventHandler(async (event) => {
  const sessionId = getRouterParam(event, "sessionId");
  const jobId = getRouterParam(event, "jobId");

  if (!sessionId || !jobId) {
    throw createError({
      statusCode: 400,
      statusMessage: "Session ID and job ID are required",
    });
  }

  const body = await readBody(event);

  return await useApi(event, `/study-sessions/${sessionId}/tests/${jobId}/draft`, {
    method: "PATCH",
    body,
    useJwt: true,
  });
});
