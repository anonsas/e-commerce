import cors from "cors";
import fs from "node:fs";
import path from "node:path";
import express from "express";
import * as Sentry from "@sentry/node";
import { clerkMiddleware } from "@clerk/express";
import type { Request, Response, NextFunction } from "express";

import { env } from "@/lib/env";
import { router } from "@/routes/router";
import { polarWebhookHandler, clerkWebhookHandler } from "@/webhooks";
import { sentryClerkUserMiddleware } from "@/middlewares/sentry-clerk-user";

export const app = express();

const rawJson = express.raw({ type: "application/json", limit: "1mb" });

// webhook routes must come before express.json() to receive the raw body
app.post("/webhooks/clerk", rawJson, clerkWebhookHandler);
app.post("/webhooks/polar", rawJson, polarWebhookHandler);

app.use(cors({ origin: env.FRONTEND_URL }));
app.use(express.json());
app.use(clerkMiddleware());
app.use(sentryClerkUserMiddleware);

app.use("/api", router);
app.get("/health", (_, res) => res.json({ ok: true }));

// resolve relative to the compiled file, not wherever node was launched from
const publicDir = path.join(__dirname, "public");
if (fs.existsSync(publicDir)) {
  // serve Vite build assets (JS, CSS, images) with caching headers
  app.use(express.static(publicDir));

  // for every other GET, serve index.html so the React router handles it client-side
  app.get("/{*any}", (_req: Request, res: Response, next: NextFunction) => {
    res.sendFile(path.join(publicDir, "index.html"), (err) => {
      if (err) next(err);
    });
  });
}

// must be after all routes so Sentry can catch unhandled errors
Sentry.setupExpressErrorHandler(app);

// sends a JSON 500 instead of Express's default plain-text error page
app.use((_err: unknown, _req: Request, res: Response, _next: NextFunction) => {
  const sentryId = (res as Response & { sentry?: string }).sentry;
  res.status(500).json({
    error: "Internal server error",
    ...(sentryId !== undefined && { sentryId }),
  });
});
