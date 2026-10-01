import "dotenv/config";
import { env } from "@/lib/env";
import * as Sentry from "@sentry/node";
import { nodeProfilingIntegration } from "@sentry/profiling-node";

// nodeProfilingIntegration is for performance debugging in Sentry.

if (env.SENTRY_DSN) {
  Sentry.init({
    dsn: env.SENTRY_DSN,
    environment: process.env.NODE_ENV ?? "development",
    integrations: [nodeProfilingIntegration()],
    tracesSampleRate: 1.0,
    profileSessionSampleRate: 1.0,
    profileLifecycle: "trace",
    dataCollection: {
      userInfo: true,
      cookies: true,
      httpHeaders: { request: true, response: true },
      urlQueryParams: true,
    },
  });
}
