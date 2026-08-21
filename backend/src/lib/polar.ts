import { env } from "@/lib/env";

type CheckoutCreateBody = {
  products: string[];
  prices?: Record<
    string,
    Array<{
      amount_type: "fixed";
      price_amount: number;
      price_currency: string;
    }>
  >;
  success_url: string;
  return_url?: string;
  external_customer_id?: string;
  customer_email?: string;
  metadata?: Record<string, string | number | boolean>;
};

export async function polarCreateCheckout(body: CheckoutCreateBody) {
  const response = await fetch(`${env.POLAR_API_BASE}/v1/checkouts/`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.POLAR_ACCESS_TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Polar checkout failed: ${response.status} ${errorText}`);
  }

  const data = (await response.json()) as { id: string; url: string };
  return { id: data.id, url: data.url };
}
