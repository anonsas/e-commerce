import { Link } from "react-router";
import { PackageIcon } from "lucide-react";
import { OrderCard } from "./components";
import { useOrders } from "./hooks/useOrders";
import { OrdersListSkeleton, PageError } from "@components";

export function OrdersPage() {
  const { orders, error, isLoading, isStaff } = useOrders();

  if (isLoading) {
    return (
      <div className="text-left">
        <div className="skeleton mb-2 h-10 w-64 max-w-full" />
        <div className="skeleton mb-8 h-4 w-96 max-w-full" />
        <OrdersListSkeleton />
      </div>
    );
  }

  if (error) {
    return (
      <PageError message="Could not load orders." action={{ to: "/", label: "Back to shop" }} />
    );
  }

  return (
    <div className="text-left">
      <h1 className="mb-2 flex items-center gap-2 text-3xl font-bold text-base-content">
        <PackageIcon className="size-8 text-primary" aria-hidden />
        {isStaff ? "Orders" : "Your orders"}
      </h1>

      <p className="mb-8 text-sm text-base-content/70">
        {isStaff
          ? "All store orders. Open one for customer support chat."
          : "Paid orders include customer support: open an order for chat."}
      </p>

      {orders.length === 0 ? (
        <p className="text-base-content/70">
          No orders yet.{" "}
          <Link to="/" className="link link-primary">
            Browse the shop
          </Link>
        </p>
      ) : (
        <ul className="space-y-4">
          {orders.map((order) => (
            <OrderCard key={order.id} order={order} />
          ))}
        </ul>
      )}
    </div>
  );
}
