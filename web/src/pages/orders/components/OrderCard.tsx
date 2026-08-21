import { Link } from "react-router";
import { ChevronRightIcon } from "lucide-react";
import type { OrderWithPreview } from "@ecommerce/shared";
import { OrderPreview } from "./OrderPreview";
import { formatOrderWhen, formatPrice } from "@utils";
import { STORE_CURRENCY } from "@constants";

type Props = { order: OrderWithPreview };

export function OrderCard({ order }: Props) {
  const previewItems = order.previewItems ?? [];
  const totalUnits = previewItems.reduce((sum, row) => sum + row.quantity, 0);
  const lineCount = previewItems.length;
  const summary =
    lineCount === 0
      ? "No line items"
      : lineCount === 1
        ? `${totalUnits} ${totalUnits === 1 ? "item" : "items"}`
        : `${lineCount} products · ${totalUnits} items`;

  return (
    <li>
      <Link
        to={`/orders/${order.id}`}
        className="group card border border-base-300 bg-base-100 shadow-sm transition hover:border-primary/45 hover:shadow-md"
      >
        <div className="card-body flex-row flex-wrap items-center gap-4 py-5 sm:gap-5">
          <OrderPreview items={previewItems} />

          <div className="flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-mono text-xs text-base-content/55 sm:text-sm">
                {order.id.slice(0, 8)}…
              </span>

              <span
                className={`badge badge-sm capitalize ${
                  order.status === "paid"
                    ? "badge-success"
                    : order.status === "pending"
                      ? "badge-warning"
                      : "badge-error"
                }`}
              >
                {order.status}
              </span>
            </div>

            <p className="mt-1 text-sm text-base-content/60">{formatOrderWhen(order.createdAt)}</p>

            <p className="mt-2 text-sm text-base-content/75">{summary}</p>
          </div>

          <div className="flex shrink-0 items-center gap-3">
            <div className="text-right">
              <p className="text-xs font-medium uppercase tracking-wide text-base-content/50">
                Total
              </p>
              <p className="text-lg font-bold tabular-nums text-base-content sm:text-xl">
                {formatPrice(order.totalCents, STORE_CURRENCY)}
              </p>
            </div>
            <ChevronRightIcon
              className="size-5 shrink-0 text-base-content/40 transition group-hover:translate-x-0.5 group-hover:text-primary"
              aria-hidden
            />
          </div>
        </div>
      </Link>
    </li>
  );
}
