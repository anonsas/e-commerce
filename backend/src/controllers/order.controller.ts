import { getAuth } from "@clerk/express";
import { asc, eq, desc, inArray } from "drizzle-orm";
import type { Request, Response, NextFunction } from "express";
import { db } from "@/db";
import { isStaff } from "@/lib/roles";
import { getLocalUser } from "@/lib/users";
import { orderItems, orders, products, users } from "@/db/schema";
import { getStreamChatServer, getStreamUserId, streamChatDisplayName } from "@/lib/stream";
import { env } from "@/lib/env";
import type { OrderPreviewItem } from "@ecommerce/shared";

type LocalUser = typeof users.$inferSelect;

// Looks up the local DB user for the authenticated Clerk session.
// Returns null (and sends 503) if the webhook hasn't synced the account yet.
async function resolveUser(request: Request, response: Response): Promise<LocalUser | null> {
  const { userId } = getAuth(request);
  const localUser = await getLocalUser(userId!);
  if (!localUser) {
    response.status(503).json({ error: "Account not synced yet" });
    return null;
  }
  return localUser;
}

export class OrderController {
  // Returns a list of orders. Staff see all orders; customers see only their own.
  // Each order includes a short preview of its line items for display in the orders list.
  async listOrders(request: Request, response: Response, next: NextFunction) {
    try {
      const localUser = await resolveUser(request, response);
      if (!localUser) return;

      const rows = isStaff(localUser.role)
        ? await db.select().from(orders).orderBy(desc(orders.createdAt))
        : await db
            .select()
            .from(orders)
            .where(eq(orders.userId, localUser.id))
            .orderBy(desc(orders.createdAt));

      const orderIds = rows.map((r) => r.id);
      const previewByOrder = new Map<string, OrderPreviewItem[]>();

      if (orderIds.length > 0) {
        const itemRows = await db
          .select({
            orderId: orderItems.orderId,
            quantity: orderItems.quantity,
            name: products.name,
            slug: products.slug,
            imageUrl: products.imageUrl,
          })
          .from(orderItems)
          .innerJoin(products, eq(orderItems.productId, products.id))
          .where(inArray(orderItems.orderId, orderIds))
          .orderBy(asc(orderItems.id));

        // Group items by order ID so we can attach them in a single pass below.
        for (const row of itemRows) {
          const list = previewByOrder.get(row.orderId) ?? [];
          list.push({
            name: row.name,
            slug: row.slug,
            imageUrl: row.imageUrl,
            quantity: row.quantity,
          });
          previewByOrder.set(row.orderId, list);
        }
      }

      const ordersPayload = rows.map((o) => ({
        ...o,
        previewItems: previewByOrder.get(o.id) ?? [],
      }));

      response.json({ orders: ordersPayload });
    } catch (e) {
      next(e);
    }
  }

  // Returns a single order with its full line items (including product details).
  // Customers can only fetch their own orders; staff can fetch any.
  // We return 404 for both "not found" and "no access" to avoid leaking order existence.
  async getOrder(request: Request, response: Response, next: NextFunction) {
    try {
      const localUser = await resolveUser(request, response);
      if (!localUser) return;

      const [order] = await db
        .select()
        .from(orders)
        .where(eq(orders.id, request.params.id as string))
        .limit(1);

      if (!order) {
        response.status(404).json({ error: "Not found" });
        return;
      }

      const canAccess = order.userId === localUser.id || isStaff(localUser.role);
      if (!canAccess) {
        response.status(404).json({ error: "Not found" });
        return;
      }

      const items = await db
        .select({
          id: orderItems.id,
          quantity: orderItems.quantity,
          unitPriceCents: orderItems.unitPriceCents,
          product: products,
        })
        .from(orderItems)
        .innerJoin(products, eq(orderItems.productId, products.id))
        .where(eq(orderItems.orderId, order.id));

      response.json({ order, items });
    } catch (e) {
      next(e);
    }
  }

  // Opens (or re-opens) a Stream Chat channel for support on a paid order.
  // Any party — the customer or a staff member — can call this; the channel ID is
  // deterministic ("order-<id>") so calling it twice just returns the same channel.
  async createStreamChannel(request: Request, response: Response, next: NextFunction) {
    try {
      const localUser = await resolveUser(request, response);
      if (!localUser) return;

      const chatServer = getStreamChatServer();
      const { userId: clerkUserId } = getAuth(request);

      const [order] = await db
        .select()
        .from(orders)
        .where(eq(orders.id, request.params.id as string))
        .limit(1);

      if (!order) {
        response.status(404).json({ error: "Not found" });
        return;
      }

      const canAccess = order.userId === localUser.id || isStaff(localUser.role);
      if (!canAccess) {
        response.status(404).json({ error: "Not found" });
        return;
      }

      if (order.status !== "paid") {
        response.status(403).json({ error: "Order must be paid to open support chat" });
        return;
      }

      const streamChatUserId = getStreamUserId(clerkUserId!);

      await chatServer.upsertUser({
        id: streamChatUserId,
        name: streamChatDisplayName(localUser.role, localUser.displayName, localUser.email),
      });

      const channelId = `order-${order.id}`;
      const channelInit = {
        name: `Support · order ${order.id.slice(0, 8)}`,
        created_by_id: streamChatUserId,
      };
      const channel = chatServer.channel("messaging", channelId, channelInit);

      await channel.create();
      await channel.addMembers([streamChatUserId]);

      response.json({ channelType: "messaging", channelId, streamUserId: streamChatUserId });
    } catch (e) {
      next(e);
    }
  }

  // Lets a staff member send a video-call invite into the order's support channel.
  // It ensures both the customer and the staff member exist as Stream users, then
  // posts a message with a custom payload the frontend uses to render a "Join" button.
  async createVideoInvite(request: Request, response: Response, next: NextFunction) {
    try {
      const localUser = await resolveUser(request, response);
      if (!localUser) return;

      const chatServer = getStreamChatServer();
      const { userId: clerkUserId } = getAuth(request);

      if (!isStaff(localUser.role)) {
        response.status(403).json({ error: "Only support or admin can send a video invite" });
        return;
      }

      const [order] = await db
        .select()
        .from(orders)
        .where(eq(orders.id, request.params.id as string))
        .limit(1);

      if (!order || order.status !== "paid") {
        response.status(404).json({ error: "Order not found or not paid" });
        return;
      }

      // Load the customer who placed the order so we can register them as a Stream user.
      const [orderOwner] = await db.select().from(users).where(eq(users.id, order.userId)).limit(1);

      const customerStreamId = getStreamUserId(orderOwner.clerkUserId);
      await chatServer.upsertUser({
        id: customerStreamId,
        name: orderOwner.displayName ?? orderOwner.email ?? "Customer",
      });

      // Register the staff member as a Stream user too before adding them to the channel.
      const staffStreamId = getStreamUserId(clerkUserId!);
      await chatServer.upsertUser({
        id: staffStreamId,
        name: streamChatDisplayName(localUser.role, localUser.displayName, localUser.email),
      });

      // Channel ID is deterministic so repeat calls land on the same channel.
      const channelId = `order-${order.id}`;
      const channelInit = {
        name: `Support · order ${order.id.slice(0, 8)}`,
        created_by_id: customerStreamId,
      };
      const supportChannel = chatServer.channel("messaging", channelId, channelInit);

      await supportChannel.create();
      // Deduplicate in case the staff member is also the order owner (e.g. in dev/test).
      const memberIds = [...new Set([customerStreamId, staffStreamId])];
      await supportChannel.addMembers(memberIds);

      // Build a join URL pointing to the in-app video call page for this order.
      const joinUrl = `${env.FRONTEND_URL.replace(/\/+$/, "")}/orders/${order.id}/call`;

      // The frontend detects video_invite in the message payload and renders a "Join" button.
      const inviteMessage = {
        text: `Video call — tap Join below (same link for everyone): ${joinUrl}`,
        user_id: staffStreamId,
        video_invite: true,
        join_url: joinUrl,
      };
      await supportChannel.sendMessage(inviteMessage);

      response.json({ ok: true, joinUrl });
    } catch (e) {
      next(e);
    }
  }
}
