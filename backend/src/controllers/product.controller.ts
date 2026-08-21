import { db } from "@/db";
import { products } from "@/db/schema";
import { and, eq, desc } from "drizzle-orm";
import type { Request, Response, NextFunction } from "express";
import type { Product, ListProductsResponse, GetProductResponse } from "@ecommerce/shared";

// Maps a DB row to the wire format: strips internal fields and converts Date → ISO string.
function toProductPayload(row: typeof products.$inferSelect): Product {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    category: row.category,
    description: row.description,
    priceCents: row.priceCents,
    currency: row.currency,
    imageUrl: row.imageUrl,
    active: row.active,
    createdAt: row.createdAt.toISOString(),
  };
}

export class ProductController {
  async listProducts(request: Request, response: Response, next: NextFunction) {
    try {
      const category =
        typeof request.query.category === "string" ? request.query.category.trim() : undefined;

      const conditions = [
        eq(products.active, true),
        ...(category ? [eq(products.category, category)] : []),
      ];

      const rows = await db
        .select()
        .from(products)
        .where(and(...conditions))
        .orderBy(desc(products.createdAt));

      response.json({ products: rows.map(toProductPayload) } satisfies ListProductsResponse);
    } catch (e) {
      next(e);
    }
  }

  async getCategories(_: Request, response: Response, next: NextFunction) {
    try {
      const rows = await db
        .select({ category: products.category })
        .from(products)
        .where(eq(products.active, true));

      const categories = [...new Set(rows.map((r) => r.category))].sort((a, b) =>
        a.localeCompare(b),
      );

      response.json({ categories });
    } catch (e) {
      next(e);
    }
  }

  async getProductBySlug(request: Request, response: Response, next: NextFunction) {
    try {
      const [row] = await db
        .select()
        .from(products)
        .where(eq(products.slug, request.params.slug as string))
        .limit(1);

      if (!row || !row.active) return response.status(404).json({ error: "Not found" });

      response.json({ product: toProductPayload(row) } satisfies GetProductResponse);
    } catch (e) {
      next(e);
    }
  }
}
