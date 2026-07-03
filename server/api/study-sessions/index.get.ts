import { defineEventHandler, getQuery } from "h3";
import { useApi } from "../../utils/api";

export default defineEventHandler(async (event) => {
  const query = getQuery(event);
  const params = new URLSearchParams();

  for (const [key, value] of Object.entries(query)) {
    if (value === undefined || value === null) continue;
    if (Array.isArray(value)) {
      for (const item of value) params.append(key, String(item));
      continue;
    }
    params.set(key, String(value));
  }

  const path = params.toString()
    ? `/study-sessions?${params.toString()}`
    : "/study-sessions";

  return await useApi(event, path, {
    method: "GET",
    useJwt: true,
  });
});
