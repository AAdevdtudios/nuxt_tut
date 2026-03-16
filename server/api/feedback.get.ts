import { defineEventHandler, getQuery } from "h3";
import { useApi } from "../utils/api";

export default defineEventHandler(async (event) => {
  const query = getQuery(event);
  const params = new URLSearchParams();

  if (typeof query.category === "string" && query.category.trim()) {
    params.append("category", query.category);
  }

  if (typeof query.status === "string" && query.status.trim()) {
    params.append("status", query.status);
  }

  if (typeof query.page === "string" && query.page.trim()) {
    params.append("page", query.page);
  }

  if (typeof query.pageSize === "string" && query.pageSize.trim()) {
    params.append("pageSize", query.pageSize);
  }

  const suffix = params.toString() ? `?${params.toString()}` : "";

  return await useApi(event, `/feedback${suffix}`, {
    method: "GET",
    useJwt: true,
  });
});
