import { createError, defineEventHandler, getRouterParam } from "h3";
import { useApi } from "../../../utils/api";

export default defineEventHandler(async (event) => {
  const practiceId = getRouterParam(event, "practiceId");
  if (!practiceId) {
    throw createError({ statusCode: 400, statusMessage: "Practice ID is required" });
  }

  return await useApi(event, `/quick-practice/${practiceId}`, {
    method: "DELETE",
    useJwt: true,
  });
});
