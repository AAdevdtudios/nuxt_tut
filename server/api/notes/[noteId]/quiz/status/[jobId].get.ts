import { createError, defineEventHandler, getRouterParam } from "h3";
import { useApi } from "../../../../../utils/api";

export default defineEventHandler(async (event) => {
  const noteId = getRouterParam(event, "noteId");
  const jobId = getRouterParam(event, "jobId");

  if (!noteId || !jobId) {
    throw createError({
      statusCode: 400,
      statusMessage: "Note ID and job ID are required",
    });
  }

  return await useApi(event, `/notes/${noteId}/quiz/status/${jobId}`, {
    method: "GET",
    useJwt: true,
  });
});
