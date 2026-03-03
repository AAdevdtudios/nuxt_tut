import { createError } from "h3";
import { useApi } from "../utils/api";

export default defineEventHandler(async (event) => {
  try {
    return await useApi(event, "/analytics", {
      method: "GET",
      useJwt: true,
    });
  } catch (error: any) {
    throw createError({
      statusCode: error?.statusCode || error?.status || 500,
      statusMessage:
        error?.statusMessage || error?.message || "Failed to fetch analytics",
      data: error?.data,
    });
  }
});
