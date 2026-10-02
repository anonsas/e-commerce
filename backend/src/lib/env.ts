import { z } from "zod";

const envSchema = z
  .object({
    PORT: z.coerce.number().default(3001),
    NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
    DATABASE_URL: z.url(),

    FRONTEND_URL: z.url(),

    CLERK_PUBLISHABLE_KEY: z.string().min(1),
    CLERK_SECRET_KEY: z.string().min(1),
    CLERK_WEBHOOK_SECRET: z.string().min(1),

    POLAR_ACCESS_TOKEN: z.string().min(1).optional(),
    POLAR_WEBHOOK_SECRET: z.string().min(1).optional(),
    POLAR_API_BASE: z.url().default("https://api.polar.sh"),
    POLAR_CHECKOUT_PRODUCT_ID: z.uuid(),

    // Clerk user id (user_...) of the shared demo account. Unset = demo login disabled.
    DEMO_USER_ID: z.string().min(1).optional(),

    SENTRY_DSN: z.string().min(1),

    STREAM_API_KEY: z.string().min(1),
    STREAM_API_SECRET: z.string().min(1),

    IMAGEKIT_PUBLIC_KEY: z.string().min(1),
    IMAGEKIT_PRIVATE_KEY: z.string().min(1),
    IMAGEKIT_URL_ENDPOINT: z.url(),
  })
  .superRefine((data, ctx) => {
    if (data.NODE_ENV === "production") {
      for (const key of ["POLAR_ACCESS_TOKEN", "POLAR_WEBHOOK_SECRET"] as const) {
        if (!data[key]) {
          ctx.addIssue({ code: "custom", path: [key], message: "Required in production" });
        }
      }
    }
  });

const result = envSchema.safeParse(process.env);
export type ENV = z.infer<typeof envSchema>;

if (!result.success) {
  const missing = result.error.issues.map((e) => `  ${String(e.path[0])}: ${e.message}`).join("\n");
  throw new Error(`Invalid environment variables:\n${missing}`);
}

export const env = result.data;
