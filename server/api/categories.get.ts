import { getQuery, createError } from "h3";
import { useApi } from "../utils/api";

export default defineEventHandler(async (event) => {
  try {
    const data = await useApi<any>(event, "/categories", {
      method: "GET",
      useJwt: true,
    });

    return {
      success: true,
      data: data,
    };
  } catch (error: any) {
    console.error("Error fetching categories:", error);

    // Re-throw auth errors
    if (error.status === 401) {
      throw createError({
        statusCode: 401,
        statusMessage: "Unauthorized",
      });
    }

    return {
      success: false,
      error: error.message || "Failed to fetch categories",
    };
  }
});
