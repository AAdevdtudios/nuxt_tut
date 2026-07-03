import { createError, defineEventHandler, getRouterParam, readBody } from "h3";
import { useApi } from "../../../../utils/api";

export default defineEventHandler(async (event) => {
  const sessionId = getRouterParam(event, "sessionId");

  if (!sessionId) {
    throw createError({ statusCode: 400, statusMessage: "Session ID is required" });
  }

  const body = await readBody(event);

  return await useApi(event, `/study-sessions/${sessionId}/diagnostic/answers`, {
    method: "POST",
    body,
    useJwt: true,
  });
});
