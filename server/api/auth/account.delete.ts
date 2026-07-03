import { useApi } from "~~/server/utils/api";

export default defineEventHandler(async (event) => {
  return await useApi(event, "/auth/account", {
    method: "DELETE",
    useJwt: true,
  });
});
