import { createError, getQuery } from "h3";
import { useApi } from "../utils/api";

export default defineEventHandler(async (event) => {
  const query = getQuery(event);
  const url = typeof query.url === "string" ? query.url : "";
  const key = typeof query.key === "string" ? query.key : "";

  if (!url && !key) {
    throw createError({
      statusCode: 400,
      statusMessage: "Either url or key is required",
    });
  }

  const searchParams = new URLSearchParams();

  if (url) {
    searchParams.append("url", url);
  }

  if (key) {
    searchParams.append("key", key);
  }

  try {
    return await useApi(event, `/uploads?${searchParams.toString()}`, {
      method: "DELETE",
      useJwt: true,
    });
  } catch (error: any) {
    throw createError({
      statusCode: error?.statusCode || error?.status || 500,
      statusMessage:
        error?.statusMessage || error?.message || "Failed to delete upload",
      data: error?.data,
    });
  }
});
