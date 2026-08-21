import { useEffect } from "react";
import { Link, useSearchParams } from "react-router";
import { useQueryClient } from "@tanstack/react-query";
import { CheckCircle2Icon, PackageIcon } from "lucide-react";
import { useCartContext } from "@context";

export function CheckoutReturnPage() {
  const handleClearCart = useCartContext((s) => s.handleClearCart);

  // Polar redirects here with checkout_id and customer_session_token in the URL.
  // We only read checkout_id for display — never trust these params to confirm payment.
  // Order creation is driven entirely by the Polar webhook on the backend.
  const [searchParams] = useSearchParams();
  const checkoutId = searchParams.get("checkout_id");

  const queryClient = useQueryClient();

  // Clear the local cart and drop the cached orders list so the next visit to /orders
  // fetches fresh data that includes the newly created order.
  useEffect(() => {
    handleClearCart();
    queryClient.invalidateQueries({ queryKey: ["orders"] });
  }, [handleClearCart, queryClient]);

  return (
    <div className="mx-auto max-w-lg text-center">
      <div className="avatar placeholder mx-auto mb-4">
        <div className="w-16 rounded-full bg-success/20 text-success flex items-center justify-center">
          <CheckCircle2Icon className="size-10" aria-hidden />
        </div>
      </div>

      <h1 className="text-2xl font-bold text-base-content">Thanks for your order</h1>

      <p className="mt-4 text-base-content/70">
        Your order is created after payment is confirmed. Open it from your orders list for{" "}
        <strong className="text-base-content">support chat</strong> (it appears there as{" "}
        <strong className="text-base-content">paid</strong>). We&apos;ll send video invites in that
        thread when needed.
      </p>

      {checkoutId ? (
        <p className="mt-2 font-mono text-xs text-base-content/50">Checkout: {checkoutId}</p>
      ) : null}

      <Link to="/orders" className="btn btn-primary mt-8 gap-2">
        <PackageIcon className="size-4" aria-hidden />
        View orders
      </Link>
    </div>
  );
}
