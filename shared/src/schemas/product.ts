import { z } from "zod";

export const productCreateSchema = z.object({
  slug: z.string().min(1),
  name: z.string().min(1),
  category: z.string().min(1).default("General"),
  description: z.string().default(""),
  priceCents: z.number().int().positive(),
  currency: z.string().min(1).default("eur"),
  imageUrl: z
    .union([z.url(), z.literal("")])
    .optional()
    .nullable(),
  imageKitFileId: z.union([z.string().min(1), z.literal(""), z.null()]).optional(),
  active: z.boolean().default(true),
});

export const productPatchSchema = productCreateSchema.partial();

export type ProductCreateType = z.infer<typeof productCreateSchema>;
export type ProductPatchType = z.infer<typeof productPatchSchema>;
