import { defineEventHandler, getQuery } from "h3";
import { useApi } from "../utils/api";

export default defineEventHandler(async (event) => {
  const query = getQuery(event);
  const params = new URLSearchParams();
  const category =
    typeof query.category === "string" && query.category.trim()
      ? query.category
      : "all";

  params.append("category", category);

  return await useApi(event, `/support?${params.toString()}`, {
    method: "GET",
    useJwt: false,
  });
});
