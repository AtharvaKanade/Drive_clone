import { z } from "zod";

// Define schema for environment variables
const EnvSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.string().transform((v) => Number(v)).default("3000"),
  CORS_ORIGIN: z.string().optional().default("*"),

  DATABASE_URL: z.string(),

  JWT_SECRET: z.string().min(16, "JWT_SECRET must be at least 16 characters long"),
  JWT_EXPIRES_IN: z.string().default("15m"),
  JWT_REFRESH_EXPIRES_IN: z.string().default("7d"),

  // Supabase configuration
  SUPABASE_URL: z.string(),
  SUPABASE_SERVICE_KEY: z.string(),
  SUPABASE_BUCKET: z.string().default('gdrive-files'),

  // Legacy S3 configuration (optional for backward compatibility)
  S3_ENDPOINT: z.string().optional(),
  S3_REGION: z.string().optional(),
  S3_ACCESS_KEY: z.string().optional(),
  S3_SECRET_KEY: z.string().optional(),
  S3_BUCKET: z.string().optional(),
});

// Validate process.env
const parsed = EnvSchema.safeParse(process.env);

if (!parsed.success) {
  console.error("❌ Invalid environment variables detected:\n");

  // Print all invalid/missing variables in a clear way
  const errors = parsed.error.flatten().fieldErrors;
  Object.entries(errors).forEach(([key, messages]) => {
    console.error(`- ${key}: ${messages?.join(", ")}`);
  });

  console.error("\n👉 Please fix your .env file and restart the server.");
  throw new Error("Invalid environment configuration");
}

export const env = parsed.data;
