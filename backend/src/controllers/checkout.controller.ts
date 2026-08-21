import z from "zod";
import { getAuth } from "@clerk/express";
import { eq, and, inArray } from "drizzle-orm";
import type { Request, Response, NextFunction } from "express";
import { db } from "@/db";
import { env } from "@/lib/env";
import { getLocalUser } from "@/lib/users";
import { CheckoutSessionLine, checkoutSessions, products } from "@/db/schema";
import { polarCreateCheckout } from "@/lib/polar";
import { cartSchema } from "@ecommerce/shared";

export class CheckoutController {
  async createCheckout(request: Request, response: Response, next: NextFunction) {
    try {
      const { userId } = getAuth(request);

      // 1. Make sure the cart payload is valid
      const cartResult = cartSchema.safeParse(request.body);
      if (!cartResult.success) {
        response
          .status(400)
          .json({ error: "Invalid cart", details: z.treeifyError(cartResult.error) });
        return;
      }

      // 2. Look up the user in our database
      const localUser = await getLocalUser(userId!);
      if (!localUser) {
        response.status(503).json({ error: "Account not synced yet" });
        return;
      }

      const productIds = cartResult.data.items.map((i) => i.productId);

      // 3. Load only active products matching the cart
      const foundProducts = await db
        .select()
        .from(products)
        .where(and(inArray(products.id, productIds), eq(products.active, true)));

      // 4. Reject if any cart item doesn't exist or is no longer active
      if (foundProducts.length !== productIds.length) {
        response.status(400).json({ error: "One or more products are invalid" });
        return;
      }

      // 5. Calculate the total from DB prices, not client values
      const productsById = new Map(foundProducts.map((p) => [p.id, p]));
      let totalCents = 0;
      const orderLines: CheckoutSessionLine[] = [];

      for (const item of cartResult.data.items) {
        const product = productsById.get(item.productId)!;
        totalCents += product.priceCents * item.quantity;
        orderLines.push({
          productId: product.id,
          quantity: item.quantity,
          unitPriceCents: product.priceCents,
        });
      }

      // 6. Polar won't accept orders below 10 cents
      if (totalCents < 10) {
        response.status(400).json({
          error: "Total below Polar minimum (e.g. EUR requires at least 10 cents)",
        });
        return;
      }

      // 7. Save the cart snapshot now; the order is confirmed later via webhook
      const [checkoutSession] = await db
        .insert(checkoutSessions)
        .values({
          userId: localUser.id,
          lines: orderLines,
          totalCents,
          currency: "eur",
        })
        .returning();

      const successUrl = `${env.FRONTEND_URL}/checkout/return?checkout_id={CHECKOUT_ID}`;
      const returnUrl = `${env.FRONTEND_URL}/cart`;

      // 8. Hand off to Polar — they host the payment page
      const polarCheckout = await polarCreateCheckout({
        products: [env.POLAR_CHECKOUT_PRODUCT_ID],
        prices: {
          [env.POLAR_CHECKOUT_PRODUCT_ID]: [
            {
              amount_type: "fixed",
              price_currency: "eur",
              price_amount: totalCents,
            },
          ],
        },

        success_url: successUrl,
        return_url: returnUrl,
        external_customer_id: userId!,
        metadata: { checkout_session_id: checkoutSession.id },
      });

      // 9. Link the Polar payment to our checkout session so the webhook can find it
      await db
        .update(checkoutSessions)
        .set({ polarCheckoutId: polarCheckout.id })
        .where(eq(checkoutSessions.id, checkoutSession.id));

      response.json({ checkoutUrl: polarCheckout.url });
    } catch (e) {
      next(e);
    }
  }
}
