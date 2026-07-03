import { defineEventHandler, getQuery } from "h3";
import { useApi } from "../../utils/api";

export default defineEventHandler(async (event) => {
  const query = getQuery(event);
  const params = new URLSearchParams();

  for (const [key, value] of Object.entries(query)) {
    if (value === undefined || value === null || value === "") continue;
    if (Array.isArray(value)) {
      value.forEach((entry) => params.append(key, String(entry)));
    } else {
      params.set(key, String(value));
    }
  }

  return await useApi(event, `/notes${params.size ? `?${params}` : ""}`, {
    method: "GET",
    useJwt: true,
  });
});
