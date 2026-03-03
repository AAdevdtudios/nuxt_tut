import { defineEventHandler, deleteCookie } from "h3";

export default defineEventHandler(async (event) => {
  deleteCookie(event, "access_token", { path: "/" });
  deleteCookie(event, "refresh_token", { path: "/" });

  return {
    success: true,
  };
});
