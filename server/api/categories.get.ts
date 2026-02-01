export default defineEventHandler(async (event) => {
  try {
    // Get JWT from Authorization header
    const authHeader = getHeader(event, "authorization");
    if (!authHeader) {
      throw createError({
        statusCode: 401,
        statusMessage: "Unauthorized - Missing token",
      });
    }

    const data = await $fetch("http://localhost:1337/api/categories", {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: authHeader,
      },
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
