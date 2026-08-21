import { useState } from "react";
import { useAuth } from "@clerk/react";
import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@lib";
import { useCartContext } from "@context";
import type { ListProductsResponse, CheckoutResponse } from "@ecommerce/shared";

export function useCart() {
  const { getToken } = useAuth();
  const [isCheckoutLoading, setIsCheckoutLoading] = useState(false);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);

  const savedItems = useCartContext((s) => s.items);
  const handleRemoveItem = useCartContext((s) => s.handleRemoveItem);
  const handleSetQuantity = useCartContext((s) => s.handleSetQuantity);

  const {
    data,
    isError: isProductsError,
    isLoading: isProductsLoading,
  } = useQuery<ListProductsResponse>({
    queryKey: ["products"],
    queryFn: () => apiFetch<ListProductsResponse>("/api/products", { getToken, method: "GET" }),
    enabled: savedItems.length > 0,
  });

  const fetchedProducts = data?.products ?? [];
  const productsById = new Map(fetchedProducts.map((p) => [p.id, p]));

  // The cart store only persists productId + quantity (minimal data for localStorage).
  // Here we join each saved item with its full product from the API so the UI has
  // the name, price, and image needed to render each row. Product can be null if
  // the fetch hasn't completed yet or the product was deleted since it was added.
  const lineItems = savedItems.map((saved) => ({
    saved,
    product: productsById.get(saved.productId) ?? null,
  }));

  // {
  //   "saved": {
  //       "productId": "d23a90c0-ba40-4a7e-bf78-c2b7301c99eb",
  //       "quantity": 1
  //   },
  //   "product": {
  //       "id": "d23a90c0-ba40-4a7e-bf78-c2b7301c99eb",
  //       "slug": "aurora-headphones",
  //       "name": "Aurora ANC Headphones",
  //       "category": "Audio",
  //       "description": "Hybrid active noise cancellation, 40mm titanium drivers, 32-hour battery (ANC on), multipoint Bluetooth 5.3, fold-flat case included. Tuned for balanced mids — ideal for travel and focused work.",
  //       "priceCents": 24900,
  //       "currency": "eur",
  //       "imageUrl": "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&q=80",
  //       "active": true,
  //       "createdAt": "2026-08-15T12:28:34.669Z"
  //   }
  // }

  const subtotalCents = lineItems.reduce(
    (sum, { saved, product }) => sum + (product ? product.priceCents * saved.quantity : 0),
    0,
  );

  async function handleCheckout() {
    setIsCheckoutLoading(true);
    setCheckoutError(null);
    try {
      const { checkoutUrl } = await apiFetch<CheckoutResponse>("/api/checkout", {
        getToken,
        method: "POST",
        body: { items: savedItems },
      });
      // Redirect to Polar-hosted payment page.
      window.location.href = checkoutUrl;
    } catch (err) {
      setCheckoutError(err instanceof Error ? err.message : "Checkout failed. Please try again.");
    } finally {
      setIsCheckoutLoading(false);
    }
  }

  return {
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
  };
}
