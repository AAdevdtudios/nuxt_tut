import { createError, defineEventHandler, getRouterParam } from "h3";
import { useApi } from "../../../../../utils/api";

export default defineEventHandler(async (event) => {
  const noteId = getRouterParam(event, "noteId");
  const sessionId = getRouterParam(event, "sessionId");

  if (!noteId || !sessionId) {
    throw createError({
      statusCode: 400,
      statusMessage: "Note ID and session ID are required",
    });
  }

  return await useApi(event, `/notes/${noteId}/chat/sessions/${sessionId}`, {
    method: "DELETE",
    useJwt: true,
  });
});
