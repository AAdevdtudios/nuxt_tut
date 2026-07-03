import { defineEventHandler, getQuery } from "h3";
import { useApi } from "../../utils/api";

export default defineEventHandler(async (event) => {
  const query = getQuery(event);
  const params = new URLSearchParams();

  ["status", "module", "page", "pageSize"].forEach((key) => {
    const value = query[key];
    if (typeof value === "string" && value.trim()) {
      params.set(key, value);
    }
  });

  const suffix = params.toString() ? `?${params.toString()}` : "";

  return await useApi(event, `/support/tickets${suffix}`, {
    method: "GET",
    useJwt: true,
  });
});
