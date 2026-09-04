import { z } from "zod";

const envSchema = z.object({
  // Database
  DATABASE_URL: z.string().url("DATABASE_URL must be a valid PostgreSQL URL"),

  // NextAuth
  NEXTAUTH_SECRET: z.string().min(32, "NEXTAUTH_SECRET must be at least 32 characters"),
  NEXTAUTH_URL: z.string().url("NEXTAUTH_URL must be a valid URL"),

  // OAuth Providers
  GITHUB_CLIENT_ID: z.string().optional(),
  GITHUB_CLIENT_SECRET: z.string().optional(),
  GOOGLE_CLIENT_ID: z.string().optional(),
  GOOGLE_CLIENT_SECRET: z.string().optional(),

  // WebSocket
  WS_PORT: z.coerce.number().default(3001),
  WS_HOST: z.string().default("localhost"),

  // Redis (for caching & sessions)
  REDIS_URL: z.string().url().optional(),

  // AI
  OPENAI_API_KEY: z.string().optional(),
  AI_MODEL: z.string().default("gpt-4o"),

  // App
  APP_ENV: z.enum(["development", "staging", "production"]).default("development"),
  APP_PORT: z.coerce.number().default(3000),
  LOG_LEVEL: z.enum(["debug", "info", "warn", "error"]).default("info"),

  // Upload
  MAX_FILE_SIZE_MB: z.coerce.number().default(10),
  UPLOAD_DIR: z.string().default("./public/uploads"),

  // Rate Limiting
  RATE_LIMIT_WINDOW_MS: z.coerce.number().default(900000), // 15 minutes
  RATE_LIMIT_MAX_REQUESTS: z.coerce.number().default(100),
});

function validateEnv() {
  const parsed = envSchema.safeParse(process.env);

  if (!parsed.success) {
    console.error("❌ Invalid environment variables:");
    console.error(parsed.error.flatten().fieldErrors);
    throw new Error("Invalid environment variables. Check the server logs.");
  }

  return parsed.data;
}

const env = validateEnv();

export const config = {
  db: {
    url: env.DATABASE_URL,
  },
  auth: {
    secret: env.NEXTAUTH_SECRET,
    url: env.NEXTAUTH_URL,
  },
  github: {
    clientId: env.GITHUB_CLIENT_ID ?? "",
    clientSecret: env.GITHUB_CLIENT_SECRET ?? "",
  },
  google: {
    clientId: env.GOOGLE_CLIENT_ID ?? "",
    clientSecret: env.GOOGLE_CLIENT_SECRET ?? "",
  },
  ws: {
    port: env.WS_PORT,
    host: env.WS_HOST,
  },
  redis: {
    url: env.REDIS_URL,
  },
  ai: {
    apiKey: env.OPENAI_API_KEY ?? "",
    model: env.AI_MODEL,
  },
  app: {
    env: env.APP_ENV,
    port: env.APP_PORT,
    isDev: env.APP_ENV === "development",
    isProd: env.APP_ENV === "production",
  },
  logging: {
    level: env.LOG_LEVEL,
  },
  upload: {
    maxSizeMB: env.MAX_FILE_SIZE_MB,
    dir: env.UPLOAD_DIR,
  },
  rateLimit: {
    windowMs: env.RATE_LIMIT_WINDOW_MS,
    maxRequests: env.RATE_LIMIT_MAX_REQUESTS,
  },
} as const;

export type AppConfig = typeof config;
