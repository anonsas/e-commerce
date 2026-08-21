import {
  LockIcon,
  ArrowLeftIcon,
  HeadphonesIcon,
  LayoutListIcon,
  MessageCircleIcon,
} from "lucide-react";
import { Link, NavLink, Outlet, useParams } from "react-router";
import { OrderHeader } from "./components";
import type { Order, OrderItem } from "@ecommerce/shared";
import { useOrderDetails } from "./hooks/useOrderDetails";
import { OrderDetailSkeleton, PageError } from "@components";

export type OrderDetailsOutletContext = {
  order: Order;
  items: OrderItem[];
  isPaid: boolean;
};

const tabClass = ({ isActive }: { isActive: boolean }) =>
  `tab gap-2 whitespace-nowrap ${isActive ? "tab-active" : ""}`;

export function OrderDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const { isLoading, order, items, isPaid, error } = useOrderDetails(id);

  if (isLoading) return <OrderDetailSkeleton />;

  if (error || !order) {
    return (
      <PageError message="Order not found." action={{ to: "/orders", label: "Back to orders" }} />
    );
  }

  return (
    <div className="space-y-8 text-left">
      <Link
        to="/orders"
        className="btn btn-ghost btn-sm gap-2 px-0 text-base-content/70 hover:text-primary"
      >
        <ArrowLeftIcon className="size-4" aria-hidden />
        Back to orders
      </Link>

      <OrderHeader order={order} isPaid={isPaid} />

      <div>
        <div className="flex items-center gap-2 border-b border-base-300 pb-3">
          <HeadphonesIcon className="size-5 text-primary" aria-hidden />
          <h2 className="text-sm font-semibold uppercase tracking-wide text-base-content">
            Customer support
          </h2>
        </div>

        <div className="tabs tabs-boxed mt-3 w-fit flex-wrap bg-base-300/50 p-1">
          <NavLink to={`/orders/${id}`} end className={tabClass}>
            <LayoutListIcon className="size-4 shrink-0" aria-hidden />
            Summary
          </NavLink>

          {isPaid ? (
            <NavLink to={`/orders/${id}/chat`} className={tabClass}>
              <MessageCircleIcon className="size-4 shrink-0" aria-hidden />
              Support chat
            </NavLink>
          ) : (
            <span className="tab tab-disabled gap-2 cursor-not-allowed opacity-50">
              <LockIcon className="size-4 shrink-0" aria-hidden />
              Support chat
            </span>
          )}
        </div>

        {!isPaid ? (
          <div role="alert" className="alert alert-warning mt-4 text-sm">
            <LockIcon className="size-4 shrink-0" aria-hidden />
            <span>
              Support unlocks when this order is marked{" "}
              <strong className="text-warning-content">paid</strong> (once payment is confirmed).
            </span>
          </div>
        ) : null}

        <div className="mt-5">
          <Outlet context={{ order, items, isPaid }} />
        </div>
      </div>
    </div>
  );
}
