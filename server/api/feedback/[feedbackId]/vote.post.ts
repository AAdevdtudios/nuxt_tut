import { createError, defineEventHandler, getRouterParam } from "h3";
import { useApi } from "../../../utils/api";

export default defineEventHandler(async (event) => {
  const feedbackId = getRouterParam(event, "feedbackId");

  if (!feedbackId || typeof feedbackId !== "string") {
    throw createError({
      statusCode: 400,
      statusMessage: "Valid feedbackId is required",
    });
  }

  return await useApi(event, `/feedback/${feedbackId}/vote`, {
    method: "POST",
    useJwt: true,
  });
});
