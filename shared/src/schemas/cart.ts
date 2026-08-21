import { z } from "zod";

export const cartSchema = z.object({
  items: z
    .array(
      z.object({
        productId: z.uuid(),
        quantity: z.number().int().positive(),
      }),
    )
    .min(1),
});

export type CartPayload = z.infer<typeof cartSchema>;
