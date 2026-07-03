import { readBody } from "h3";
import { useApi } from "~~/server/utils/api";

export default defineEventHandler(async (event) => {
  return await useApi(event, "/reports", {
    method: "POST",
    body: await readBody(event),
    useJwt: true,
  });
});
