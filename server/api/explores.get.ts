import { getQuery, createError } from "h3";
import { useApi } from "../utils/api";

export default defineEventHandler(async (event) => {
  try {
    const query = getQuery(event);
    const page = query.page ? parseInt(query.page as string) : 1;
    const pageSize = query.pageSize ? parseInt(query.pageSize as string) : 10;
    const search = query.search as string | undefined;
    const category = query.category as string | undefined;

    // Build Strapi params
    const params: Record<string, any> = {
      "pagination[page]": page,
      "pagination[pageSize]": pageSize,
    };
    if (search && search.trim() !== "") {
      params["filters[$or][0][Title][$containsi]"] = search;
      params["filters[$or][1][Description][$containsi]"] = search;
      params["filters[$or][2][Author][$containsi]"] = search;
    }
    if (category && category !== "all") {
      params["filters[category][slug][$eq]"] = category;
    }

    // Build query string
    // http://localhost:1337/api/explores?pagination%5Bpage%5D=1&pagination%5BpageSize%5D=5&filters%5Bcategory%5D[slug]=history
    const queryString = new URLSearchParams(params).toString();
    const path = `/explores?${queryString}`;

    // Use the shared API utility (handles JWT from cookies)
    const data = await useApi<any>(event, path, {
      method: "GET",
      useJwt: true,
    });

    // Custom response structure
    return {
      success: true,
      data: {
        items: data.data || [],
        pagination: data.meta?.pagination || {},
      },
    };
  } catch (error: any) {
    console.error("Error fetching explores:", error);
    return {
      success: false,
      error: error.message || "Failed to fetch explores",
    };
  }
});
