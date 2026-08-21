import { PackageIcon, PencilIcon, Trash2Icon } from "lucide-react";
import { formatPrice } from "@utils";
import { IK_PRESETS, imageKitOptimizedUrl } from "@lib";
import type { AdminProduct } from "@ecommerce/shared";

type Props = {
  product: AdminProduct;
  isDeleting: boolean;
  onEdit: () => void;
  onDelete: () => void;
};

export function AdminProductRow({ product, isDeleting, onEdit, onDelete }: Props) {
  return (
    <tr>
      <td className="align-middle">
        <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-xl border border-base-300 bg-base-200 shadow-sm ring-1 ring-base-300/50 sm:h-18 sm:w-18">
          {product.imageUrl ? (
            <img
              src={imageKitOptimizedUrl(product.imageUrl, IK_PRESETS.adminThumb)}
              alt=""
              className="h-full w-full object-cover"
              loading="lazy"
              decoding="async"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-linear-to-br from-base-300 to-base-200">
              <PackageIcon className="size-6 text-base-content/35" aria-hidden />
            </div>
          )}
        </div>
      </td>
      <td className="font-medium">{product.name}</td>
      <td>
        <span className="badge badge-ghost badge-sm">{product.category ?? "-"}</span>
      </td>
      <td className="font-mono text-sm opacity-80">{product.slug}</td>
      <td>{formatPrice(product.priceCents, product.currency)}</td>
      <td>
        {product.active ? (
          <span className="badge badge-success badge-sm">yes</span>
        ) : (
          <span className="badge badge-ghost badge-sm">no</span>
        )}
      </td>
      <td>
        <div className="flex flex-wrap items-center justify-end gap-1">
          <button type="button" className="btn btn-ghost btn-xs gap-1" onClick={onEdit}>
            <PencilIcon className="size-3" aria-hidden />
            Edit
          </button>

          <button
            type="button"
            className="btn btn-ghost btn-xs gap-1 text-error hover:bg-error/10"
            disabled={isDeleting}
            onClick={onDelete}
          >
            {isDeleting ? (
              <span className="loading loading-spinner loading-xs" />
            ) : (
              <Trash2Icon className="size-3" aria-hidden />
            )}
            Delete
          </button>
        </div>
      </td>
    </tr>
  );
}
