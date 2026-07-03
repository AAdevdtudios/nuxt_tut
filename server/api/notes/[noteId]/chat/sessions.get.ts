import { createError, defineEventHandler, getRouterParam } from "h3";
import { useApi } from "../../../../utils/api";

export default defineEventHandler(async (event) => {
  const noteId = getRouterParam(event, "noteId");

  if (!noteId) {
    throw createError({ statusCode: 400, statusMessage: "Note ID is required" });
  }

  return await useApi(event, `/notes/${noteId}/chat/sessions`, {
    method: "GET",
    useJwt: true,
  });
});
