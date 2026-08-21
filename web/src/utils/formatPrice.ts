import { STORE_CURRENCY } from "@constants";

export function formatPrice(cents: number, currency: string) {
  return new Intl.NumberFormat(undefined, {
    style: "currency",
    currency: (currency ?? STORE_CURRENCY).toUpperCase(),
  }).format(cents / 100);
}
