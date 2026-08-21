import { eq } from "drizzle-orm";
import { Webhook } from "standardwebhooks";
import type { Request, Response } from "express";
import { db } from "@/db";
import { env } from "@/lib/env";
import { checkoutSessions, orderItems, orders } from "@/db/schema.js";

// Picks the first value if Polar sends the same header more than once
function headerString(headers: Request["headers"], name: string) {
  const value = headers[name];
  return Array.isArray(value) ? value[0] : value;
}

// Pulls our internal checkout session ID out of the metadata we attached when creating the Polar checkout
function checkoutSessionIdFromMetadata(order: Record<string, unknown>) {
  const metadata = order.metadata;
  if (!metadata || typeof metadata !== "object") return undefined;
  const sessionId = (metadata as Record<string, unknown>).checkout_session_id;
  return typeof sessionId === "string" ? sessionId : undefined;
}

// Checks whether this payment was already processed — Polar can send the same event more than once
async function alreadyPaid(polarOrderId?: string, checkoutId?: string) {
  if (polarOrderId) {
    const [row] = await db
      .select()
      .from(orders)
      .where(eq(orders.polarOrderId, polarOrderId))
      .limit(1);
    if (row?.status === "paid") return true;
  }
  if (checkoutId) {
    const [row] = await db
      .select()
      .from(orders)
      .where(eq(orders.polarCheckoutId, checkoutId))
      .limit(1);
    if (row?.status === "paid") return true;
  }
  return false;
}

// Creates the order + order items and removes the temporary checkout session — all or nothing
async function fulfillCheckoutSession(
  sessionId: string,
  polarOrderId: string | undefined,
  checkoutId: string | undefined,
) {
  return await db.transaction(async (tx) => {
    const [session] = await tx
      .select()
      .from(checkoutSessions)
      .where(eq(checkoutSessions.id, sessionId))
      .for("update");

    if (!session) return false;

    const [order] = await tx
      .insert(orders)
      .values({
        userId: session.userId,
        status: "paid",
        totalCents: session.totalCents,
        polarCheckoutId: checkoutId ?? session.polarCheckoutId ?? null,
        ...(polarOrderId ? { polarOrderId } : {}),
      })
      .returning();

    if (session.lines.length) {
      await tx.insert(orderItems).values(
        session.lines.map((line) => ({
          orderId: order.id,
          productId: line.productId,
          quantity: line.quantity,
          unitPriceCents: line.unitPriceCents,
        })),
      );
    }

    await tx.delete(checkoutSessions).where(eq(checkoutSessions.id, sessionId));
    return true;
  });
}

export async function polarWebhookHandler(req: Request, res: Response) {
  try {
    // 1. Read the raw bytes — the signature check requires the exact original body
    const raw = req.body instanceof Buffer ? req.body : Buffer.from(String(req.body));
    const wh = new Webhook(Buffer.from(env.POLAR_WEBHOOK_SECRET!, "utf8").toString("base64"));

    // 2. Make sure all three signature headers are present before trying to verify
    const id = headerString(req.headers, "webhook-id");
    const timestamp = headerString(req.headers, "webhook-timestamp");
    const signature = headerString(req.headers, "webhook-signature");

    if (!id || !timestamp || !signature) {
      res.status(400).json({ error: "Missing webhook headers" });
      return;
    }

    // 3. Confirm the request genuinely came from Polar and wasn't modified in transit
    wh.verify(raw, {
      "webhook-id": id,
      "webhook-timestamp": timestamp,
      "webhook-signature": signature,
    });

    // 4. Parse the event and only act on successful payments
    const event = JSON.parse(raw.toString("utf8")) as {
      type: string;
      data?: Record<string, unknown>;
    };

    if (event.type === "order.paid" && event.data) {
      const data = event.data;
      const polarOrderId = typeof data.id === "string" ? data.id : undefined;
      const checkoutId = typeof data.checkout_id === "string" ? data.checkout_id : undefined;

      // 5. Skip if we already handled this payment — Polar retries until we respond 200
      if (await alreadyPaid(polarOrderId, checkoutId)) {
        res.json({ ok: true, duplicate: true });
        return;
      }

      // 6. Find the checkout session we saved when the user started paying
      const sessionId = checkoutSessionIdFromMetadata(data);

      if (sessionId) {
        // 7. Create the order and clean up the checkout session
        const ok = await fulfillCheckoutSession(sessionId, polarOrderId, checkoutId);

        if (ok) {
          res.json({ ok: true });
          return;
        }

        // 8. If fulfillment failed, check if a parallel webhook delivery already did the job
        if (await alreadyPaid(polarOrderId, checkoutId)) {
          res.json({ ok: true, duplicate: true });
          return;
        }

        console.error("Polar order.paid: could not fulfill checkout session", {
          sessionId,
          checkoutId,
        });

        res.status(500).json({ error: "Checkout fulfillment failed" });
        return;
      }
    }

    // Unknown event type — acknowledge so Polar stops retrying
    res.json({ ok: true });
  } catch (err) {
    // Bad signature or unexpected error — don't reveal details to the caller
    console.error("Polar webhook error", err);
    res.status(400).json({ error: "Invalid webhook" });
  }
}
