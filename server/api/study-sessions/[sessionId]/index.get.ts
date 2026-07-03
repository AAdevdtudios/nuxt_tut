import { createError, defineEventHandler, getRouterParam } from "h3";
import { useApi } from "../../../utils/api";

export default defineEventHandler(async (event) => {
  const sessionId = getRouterParam(event, "sessionId");

  if (!sessionId) {
    throw createError({ statusCode: 400, statusMessage: "Session ID is required" });
  }

  return await useApi(event, `/study-sessions/${sessionId}`, {
    method: "GET",
    useJwt: true,
  });
});
