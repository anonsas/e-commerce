import { Link } from "react-router";
import { MinusIcon, PlusIcon, Trash2Icon } from "lucide-react";
import { formatPrice } from "@utils";
import { IK_PRESETS, imageKitOptimizedUrl } from "@lib";
import type { Product } from "@ecommerce/shared";

type Props = {
  productId: string;
  quantity: number;
  product: Product | null;
  handleRemoveItem: (productId: string) => void;
  handleSetQuantity: (productId: string, quantity: number) => void;
};

export function CartLineItem({
  productId,
  quantity,
  product,
  handleRemoveItem,
  handleSetQuantity,
}: Props) {
  return (
    <li className="card card-side border border-base-300 bg-base-100 shadow-sm">
      <figure className="p-4">
        {product?.imageUrl ? (
          <img
            src={imageKitOptimizedUrl(product.imageUrl, IK_PRESETS.cartThumb)}
            alt=""
            className="h-24 w-24 rounded-box object-cover"
            loading="lazy"
            decoding="async"
          />
        ) : (
          <div className="h-24 w-24 rounded-box bg-base-300" />
        )}
      </figure>

      <div className="card-body min-w-0 flex-row flex-wrap items-center justify-between gap-4">
        <div className="min-w-0 flex-1">
          <div className="card-title text-base">
            {product ? (
              <Link to={`/product/${product.slug}`} className="link-hover link-primary">
                {product.name}
              </Link>
            ) : (
              "Unknown product"
            )}
          </div>
          {product && (
            <p className="text-sm text-base-content/60">
              {formatPrice(product.priceCents, product.currency)} each
            </p>
          )}
          <div className="mt-2 flex flex-wrap items-center gap-3">
            <div className="inline-flex items-center gap-1 rounded-full bg-base-200 p-1">
              <button
                type="button"
                className="btn btn-circle btn-ghost btn-xs"
                onClick={() => handleSetQuantity(productId, quantity - 1)}
                aria-label={quantity <= 1 ? "Remove from cart" : "Decrease quantity"}
              >
                <MinusIcon className="size-3.5" aria-hidden />
              </button>
              <span
                className="min-w-7 text-center text-sm font-semibold tabular-nums"
                aria-live="polite"
              >
                {quantity}
              </span>
              <button
                type="button"
                className="btn btn-circle btn-primary btn-xs"
                onClick={() => handleSetQuantity(productId, Math.min(99, quantity + 1))}
                disabled={quantity >= 99}
                aria-label="Increase quantity"
              >
                <PlusIcon className="size-3.5" aria-hidden />
              </button>
            </div>
            <button
              type="button"
              onClick={() => handleRemoveItem(productId)}
              className="btn btn-ghost btn-square btn-sm text-error hover:bg-error/10"
              aria-label="Remove from cart"
              title="Remove from cart"
            >
              <Trash2Icon className="size-4" aria-hidden />
            </button>
          </div>
        </div>
        <div className="text-right font-semibold text-base-content">
          {product ? formatPrice(product.priceCents * quantity, product.currency) : "-"}
        </div>
      </div>
    </li>
  );
}
