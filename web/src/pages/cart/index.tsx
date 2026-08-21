import { ShoppingCartIcon } from "lucide-react";
import { useCart } from "./hooks/useCart";
import { STORE_CURRENCY } from "@constants";
import { CartSkeleton, PageError } from "@components";
import { EmptyCart, CartLineItem, CartSummary } from "./components";

export function CartPage() {
  const {
    savedItems,
    lineItems,
    subtotalCents,
    isProductsError,
    isProductsLoading,
    handleRemoveItem,
    handleSetQuantity,
    handleCheckout,
    checkoutError,
    isCheckoutLoading,
  } = useCart();

  return (
    <div className="text-left">
      <h1 className="mb-8 flex items-center gap-2 text-3xl font-bold text-base-content">
        <ShoppingCartIcon className="size-8 text-primary" aria-hidden />
        Cart
      </h1>

      {savedItems.length === 0 ? (
        <EmptyCart />
      ) : isProductsLoading ? (
        <CartSkeleton lines={savedItems.length} />
      ) : isProductsError ? (
        <PageError message="Could not load product details. Refresh the page or try again shortly." />
      ) : (
        <div className="grid gap-10 lg:grid-cols-[1fr_320px]">
          <ul className="space-y-4">
            {lineItems.map(({ saved, product }) => (
              <CartLineItem
                key={saved.productId}
                productId={saved.productId}
                quantity={saved.quantity}
                product={product}
                handleRemoveItem={handleRemoveItem}
                handleSetQuantity={handleSetQuantity}
              />
            ))}
          </ul>

          <CartSummary
            subtotalCents={subtotalCents}
            currency={lineItems[0]?.product?.currency ?? STORE_CURRENCY}
            checkoutError={checkoutError}
            isCheckoutLoading={isCheckoutLoading}
            handleCheckout={handleCheckout}
          />
        </div>
      )}
    </div>
  );
}
