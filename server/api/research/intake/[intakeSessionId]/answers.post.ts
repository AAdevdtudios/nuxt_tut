import { createError, getRouterParam, readBody } from "h3";
import { useApi } from "~~/server/utils/api";

export default defineEventHandler(async (event) => {
  const intakeSessionId = getRouterParam(event, "intakeSessionId");
  if (!intakeSessionId) {
    throw createError({ statusCode: 400, statusMessage: "Intake session ID is required" });
  }

  return await useApi(event, `/research/intake/${intakeSessionId}/answers`, {
    method: "POST",
    body: await readBody(event),
    useJwt: true,
  });
});
