import { createError, defineEventHandler, getRouterParam, readBody } from "h3";
import { useApi } from "../../../utils/api";

export default defineEventHandler(async (event) => {
  const noteId = getRouterParam(event, "noteId");

  if (!noteId) {
    throw createError({ statusCode: 400, statusMessage: "Note ID is required" });
  }

  const body = await readBody(event);

  return await useApi(event, `/notes/${noteId}/activity`, {
    method: "POST",
    body,
    useJwt: true,
  });
});
