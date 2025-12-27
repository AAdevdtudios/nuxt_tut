import { z } from "zod";

export const envSchema = z.object({
  APP_NAME: z.string().min(1, "App name is required"),
  APP_LOGO: z.string().min(1, "App logo path is required"),
  API_BASE_URL: z.url("API_BASE_URL must be a valid URL"),
  SERVER_API_ENDPOINTS: z.object({
    LOGIN: z.string().min(1),
    REGISTER: z.string().min(1),
    ME: z.string().min(1),
  }),
  API_ENDPOINTS: z.object({
    LOGIN: z.string().min(1),
    REGISTER: z.string().min(1),
    ME: z.string().min(1),
  }),
});

export type EnvSchema = z.infer<typeof envSchema>;
