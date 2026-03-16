import { defineEventHandler, readBody } from "h3";
import { useApi } from "../../utils/api";

export default defineEventHandler(async (event) => {
  const body = await readBody(event);

  return await useApi(event, "/support/tickets", {
    method: "POST",
    body,
    useJwt: true,
  });
});
