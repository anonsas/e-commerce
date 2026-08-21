import z from "zod";
import ImageKit from "@imagekit/nodejs";
import { count, desc, eq } from "drizzle-orm";
import type { Request, Response, NextFunction } from "express";
import { db } from "@/db";
import { env } from "@/lib/env";
import { orderItems, products } from "@/db/schema";
import { deleteImageKitAsset } from "@/lib/imagekit";
import { productCreateSchema, productPatchSchema } from "@ecommerce/shared";

// Builds a partial DB update object from only the fields the caller actually sent.
// Empty string for imageUrl/imageKitFileId means "clear the value" → stored as null.
function buildProductUpdateSet(body: z.infer<typeof productPatchSchema>) {
  const data: Partial<typeof products.$inferInsert> = {};
  if (body.slug !== undefined) data.slug = body.slug;
  if (body.name !== undefined) data.name = body.name;
  if (body.category !== undefined) data.category = body.category;
  if (body.description !== undefined) data.description = body.description;
  if (body.priceCents !== undefined) data.priceCents = body.priceCents;
  if (body.currency !== undefined) data.currency = body.currency;
  if (body.imageUrl !== undefined) data.imageUrl = body.imageUrl === "" ? null : body.imageUrl;
  if (body.imageKitFileId !== undefined) {
    data.imageKitFileId = body.imageKitFileId === "" ? null : body.imageKitFileId;
  }
  if (body.active !== undefined) data.active = body.active;
  return data;
}

//============================================================================

export class AdminController {
  // The frontend calls this before uploading an image so it can prove to ImageKit that the
  // upload was authorised by our server. We sign a short-lived token with our private key
  // and send it back together with the public key and URL endpoint the frontend needs.
  async getImageKitAuth(_: Request, response: Response, next: NextFunction) {
    try {
      const client = new ImageKit({ privateKey: env.IMAGEKIT_PRIVATE_KEY });

      // token + expire + signature — all three are required by the ImageKit SDK on the client
      const authParams = client.helper.getAuthenticationParameters();
      // Result: { token: 'uuid-token', expire: timestamp, signature: 'hmac-signature' }
      response.json({
        ...authParams,
        publicKey: env.IMAGEKIT_PUBLIC_KEY,
        urlEndpoint: env.IMAGEKIT_URL_ENDPOINT,
      });
    } catch (error) {
      next(error);
    }
  }

  // Returns every product (including inactive ones) sorted newest-first for the admin dashboard.
  async listAdminProducts(_: Request, response: Response, next: NextFunction) {
    try {
      const rows = await db.select().from(products).orderBy(desc(products.createdAt));
      response.json({ products: rows });
    } catch (e) {
      next(e);
    }
  }

  // Validates the request body, then inserts a new product row.
  // imageUrl and imageKitFileId are optional — empty string is treated as "not set".
  async createAdminProduct(request: Request, response: Response, next: NextFunction) {
    try {
      const parsed = productCreateSchema.safeParse(request.body);
      if (!parsed.success) {
        response.status(400).json({ error: "Invalid body", details: z.treeifyError(parsed.error) });
        return;
      }
      const { imageUrl, imageKitFileId, ...rest } = parsed.data;

      const [row] = await db
        .insert(products)
        .values({
          ...rest,
          imageUrl: imageUrl || null,
          imageKitFileId: imageKitFileId || null,
        })
        .returning();
      response.status(201).json({ product: row });
    } catch (e) {
      next(e);
    }
  }
  // Applies a partial update to an existing product.
  // Only fields present in the request body are changed; everything else stays as-is.
  async updateAdminProduct(request: Request, response: Response, next: NextFunction) {
    try {
      const parsed = productPatchSchema.safeParse(request.body);
      if (!parsed.success) {
        response.status(400).json({ error: "Invalid body", details: z.treeifyError(parsed.error) });
        return;
      }

      const data = buildProductUpdateSet(parsed.data);

      // Reject requests that pass validation but carry no actual changes.
      if (Object.keys(data).length === 0) {
        response.status(400).json({ error: "No fields to update" });
        return;
      }

      const [row] = await db
        .update(products)
        .set(data)
        .where(eq(products.id, request.params.id as string))
        .returning();

      if (!row) {
        response.status(404).json({ error: "Not found" });
        return;
      }

      response.json({ product: row });
    } catch (e) {
      next(e);
    }
  }
  // Permanently removes a product. Blocked if any order has ever included it — in that case
  // the admin should deactivate instead so order history stays intact.
  // If the product has an image stored in ImageKit, that file is deleted first.
  async deleteAdminProduct(request: Request, response: Response, next: NextFunction) {
    try {
      const id = request.params.id as string;

      const [existing] = await db.select().from(products).where(eq(products.id, id)).limit(1);
      if (!existing) {
        response.status(404).json({ error: "Not found" });
        return;
      }

      // Atomically check for order references and delete. Without a transaction a concurrent
      // checkout could place an order between the count check and the delete.
      const blocked = await db.transaction(async (tx) => {
        const [{ total }] = await tx
          .select({ total: count() })
          .from(orderItems)
          .where(eq(orderItems.productId, id));

        if (total > 0) return true;

        await tx.delete(products).where(eq(products.id, id));
        return false;
      });

      if (blocked) {
        response.status(409).json({
          error:
            "This product is on one or more orders and cannot be deleted. Deactivate it instead.",
        });
        return;
      }

      // ImageKit cleanup runs after the DB delete — external calls can't be inside a transaction.
      await deleteImageKitAsset(existing.imageKitFileId);

      response.json({ ok: true });
    } catch (e) {
      next(e);
    }
  }
}
