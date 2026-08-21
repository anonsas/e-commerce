import { HeadphonesIcon, LogInIcon, ShoppingCartIcon } from "lucide-react";
import { Show, SignInButton } from "@clerk/react";
import { formatPrice } from "@utils";

type Props = {
  subtotalCents: number;
  currency: string;
  checkoutError: string | null;
  isCheckoutLoading: boolean;
  handleCheckout: () => void;
};

export function CartSummary({
  subtotalCents,
  currency,
  checkoutError,
  isCheckoutLoading,
  handleCheckout,
}: Props) {
  return (
    <aside className="card border border-base-300 bg-base-100 p-6 shadow-md">
      <div className="flex justify-between text-sm">
        <span className="text-base-content/70">Subtotal</span>
        <span className="font-semibold text-base-content">
          {formatPrice(subtotalCents, currency)}
        </span>
      </div>

      {checkoutError && (
        <div role="alert" className="alert alert-error mt-4 text-sm">
          {checkoutError}
        </div>
      )}

      <Show when="signed-in">
        <button
          type="button"
          onClick={handleCheckout}
          disabled={isCheckoutLoading}
          aria-busy={isCheckoutLoading}
          className="btn btn-primary mt-6 w-full gap-2"
        >
          {isCheckoutLoading ? (
            <span className="loading loading-spinner loading-sm" aria-hidden />
          ) : (
            <ShoppingCartIcon className="size-4" aria-hidden />
          )}
          {isCheckoutLoading ? "Opening checkout…" : "Checkout securely"}
        </button>
      </Show>

      <Show when="signed-out">
        <SignInButton mode="modal">
          <button type="button" className="btn btn-outline btn-primary mt-6 w-full gap-2">
            <LogInIcon className="size-4" aria-hidden />
            Sign in to checkout
          </button>
        </SignInButton>
      </Show>

      <p className="mt-4 flex items-start gap-2 text-xs text-base-content/60">
        <HeadphonesIcon className="mt-0.5 size-3.5 shrink-0 text-primary" aria-hidden />
        <span>
          After payment, open your order for{" "}
          <strong className="text-base-content">support chat</strong>. Video invites appear in that
          thread.
        </span>
      </p>
    </aside>
  );
}
