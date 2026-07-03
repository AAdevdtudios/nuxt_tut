import { createError, defineEventHandler, getQuery, getRouterParam } from "h3";
import { useApi } from "../../../utils/api";

export default defineEventHandler(async (event) => {
  const sessionId = getRouterParam(event, "sessionId");

  if (!sessionId) {
    throw createError({ statusCode: 400, statusMessage: "Session ID is required" });
  }

  const query = getQuery(event);
  const deleteSource = query.deleteSource ?? "true";

  return await useApi(event, `/study-sessions/${sessionId}?deleteSource=${deleteSource}`, {
    method: "DELETE",
    useJwt: true,
  });
});
