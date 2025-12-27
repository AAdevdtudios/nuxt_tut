import { envSchema, type EnvSchema } from "./env.schema";

// Gather values from process.env and hardcoded defaults
const rawEnv = {
  APP_NAME: process.env.APP_NAME || "GapAi App",
  APP_LOGO: process.env.APP_LOGO || "/logo.png",
  API_BASE_URL: process.env.API_BASE_URL || "http://localhost:3000",
  API_ENDPOINTS: {
    LOGIN: process.env.API_LOGIN_ENDPOINT || "/api/auth/login",
    REGISTER: process.env.API_REGISTER_ENDPOINT || "/api/auth/register",
    ME: process.env.API_ME_ENDPOINT || "/api/auth/me",
  },
  SERVER_API_ENDPOINTS: {
    LOGIN: "/api/auth/login",
    REGISTER: "/api/auth/register",
    ME: "/api/auth/me",
  },
};

// Validate at runtime
export const ENV: EnvSchema = envSchema.parse(rawEnv);
