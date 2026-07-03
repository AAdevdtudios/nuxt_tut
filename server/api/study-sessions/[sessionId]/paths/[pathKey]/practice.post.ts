import { createError, defineEventHandler, getRouterParam, readBody } from "h3";
import { useApi } from "../../../../../utils/api";

export default defineEventHandler(async (event) => {
  const sessionId = getRouterParam(event, "sessionId");
  const pathKey = getRouterParam(event, "pathKey");

  if (!sessionId || !pathKey) {
    throw createError({
      statusCode: 400,
      statusMessage: "Session ID and path key are required",
    });
  }

  const body = await readBody(event).catch(() => ({
    sessionId,
    pathKey,
    mode: "next",
  }));

  return await useApi(event, `/study-sessions/${sessionId}/paths/${pathKey}/practice`, {
    method: "POST",
    body,
    useJwt: true,
  });
});
