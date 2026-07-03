import { defineEventHandler, readBody } from "h3";
import { useApi } from "~~/server/utils/api";

export default defineEventHandler(async (event) => {
  const body = await readBody(event);

  return await useApi(event, "/auth/password/forgot", {
    method: "POST",
    body: {
      email: body?.email,
    },
    useJwt: false,
  });
});
