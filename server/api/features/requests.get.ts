import { defineEventHandler, getQuery } from "h3";
import { useApi } from "../../utils/api";

export default defineEventHandler(async (event) => {
  const query = getQuery(event);
  const page = Number(query.page || 1);
  const pageSize = Number(query.pageSize || 20);

  return await useApi(
    event,
    `/features/requests?page=${page}&pageSize=${pageSize}`,
    {
      method: "GET",
      useJwt: false,
    },
  );
});
