import { eq } from "drizzle-orm";
import type { Request, Response } from "express";
import { verifyWebhook } from "@clerk/backend/webhooks";
import type { WebhookEvent, UserJSON } from "@clerk/backend";

import { db } from "@/db";
import { env } from "@/lib/env";
import { users } from "@/db/schema";
import { parseRole } from "@/lib/roles";

export async function clerkWebhookHandler(req: Request, res: Response) {
  try {
    // 1. Read the raw request body — Clerk needs the exact bytes to verify the signature
    const payload = req.body instanceof Buffer ? req.body.toString("utf8") : String(req.body);

    // Wrap into a Web API Request so Clerk's verifier accepts it — the URL is a dummy, it's never fetched
    const request = new Request("http://internal/webhooks/clerk", {
      method: "POST",
      headers: new Headers(req.headers as HeadersInit),
      body: payload,
    });

    // 2. Verify the request actually came from Clerk, otherwise rejects fakes or modified bodies
    const event: WebhookEvent = await verifyWebhook(request, {
      signingSecret: env.CLERK_WEBHOOK_SECRET,
    });

    // 3. When a user signs up or updates their profile, keep our database in sync
    if (event.type === "user.created" || event.type === "user.updated") {
      const clerkUser: UserJSON = event.data;

      const email =
        clerkUser.email_addresses?.find((e) => e.id === clerkUser.primary_email_address_id)
          ?.email_address ?? clerkUser.email_addresses?.[0]?.email_address;

      const displayName =
        [clerkUser.first_name, clerkUser.last_name].filter(Boolean).join(" ") ||
        clerkUser.username ||
        null;

      const role = parseRole(clerkUser.public_metadata?.role);

      await db
        .insert(users)
        .values({
          clerkUserId: clerkUser.id,
          email,
          displayName,
          role,
        })
        .onConflictDoUpdate({
          target: users.clerkUserId,
          set: { email, displayName, role, updatedAt: new Date() },
        });
    }

    if (event.type === "user.deleted") {
      const { id } = event.data;
      if (!id) {
        // Clerk omits the id on GDPR erasure — nothing we can do, skip it
        console.warn("user.deleted received without id, skipping");
        res.json({ ok: true });
        return;
      }
      await db.delete(users).where(eq(users.clerkUserId, id));
      console.log(`user.deleted: removed ${id} from db`);
    }

    res.json({ ok: true });
  } catch (err) {
    // 4. Bad signature or unexpected error — don't reveal details to the caller
    console.error("Clerk webhook error", err);
    res.status(400).json({ error: "Invalid webhook" });
  }
}
