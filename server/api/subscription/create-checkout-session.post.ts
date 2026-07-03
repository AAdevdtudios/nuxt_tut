import { createError, defineEventHandler, readBody } from "h3";
import { useApi } from "~~/server/utils/api";

export default defineEventHandler(async (event) => {
  const body = await readBody(event);
  const planCode = body?.planCode || body?.planId || body?.planName;

  if (!planCode) {
    throw createError({
      statusCode: 400,
      statusMessage: "Missing required field: planCode",
    });
  }

  return await useApi(event, "/billing/checkout", {
    method: "POST",
    body: {
      planCode: String(planCode).toLowerCase(),
    },
    useJwt: true,
  });
});
