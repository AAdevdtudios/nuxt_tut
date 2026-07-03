import { envSchema, type EnvSchema } from "./env.schema";

// Gather values from process.env and hardcoded defaults
const rawEnv = {
  APP_NAME: process.env.APP_NAME || "GapAi App",
  APP_LOGO: process.env.APP_LOGO || "/logo.png",
  API_BASE_URL: process.env.API_BASE_URL || "http://localhost:5296",
  API_ENDPOINTS: {
    LOGIN: process.env.API_LOGIN_ENDPOINT || "/api/auth/login",
    REGISTER: process.env.API_REGISTER_ENDPOINT || "/api/auth/register",
    REFRESH: process.env.API_REFRESH_ENDPOINT || "/api/auth/refresh",
    ME: process.env.API_ME_ENDPOINT || "/api/auth/me",
    LOGOUT: process.env.API_LOGOUT_ENDPOINT || "/api/auth/logout",
    FORGOT_PASSWORD:
      process.env.API_FORGOT_PASSWORD_ENDPOINT || "/api/auth/password/forgot",
    RESET_PASSWORD:
      process.env.API_RESET_PASSWORD_ENDPOINT || "/api/auth/password/reset",
    UPDATE_PROFILE_NAME:
      process.env.API_UPDATE_PROFILE_NAME_ENDPOINT || "/api/auth/profile/name",
    UPDATE_PROFILE_USERNAME:
      process.env.API_UPDATE_PROFILE_USERNAME_ENDPOINT ||
      "/api/auth/profile/username",
    DELETE_ACCOUNT:
      process.env.API_DELETE_ACCOUNT_ENDPOINT || "/api/auth/account",
    RECOVER_ACCOUNT:
      process.env.API_RECOVER_ACCOUNT_ENDPOINT || "/api/auth/account/recover",
  },
  SERVER_API_ENDPOINTS: {
    LOGIN: "/api/auth/login",
    REGISTER: "/api/auth/register",
    REFRESH: "/api/auth/refresh",
    ME: "/api/auth/me",
    LOGOUT: "/api/auth/logout",
    FORGOT_PASSWORD: "/api/auth/password/forgot",
    RESET_PASSWORD: "/api/auth/password/reset",
    UPDATE_PROFILE_NAME: "/api/auth/profile/name",
    UPDATE_PROFILE_USERNAME: "/api/auth/profile/username",
    DELETE_ACCOUNT: "/api/auth/account",
    RECOVER_ACCOUNT: "/api/auth/account/recover",
  },
};

// Validate at runtime
export const ENV: EnvSchema = envSchema.parse(rawEnv);
