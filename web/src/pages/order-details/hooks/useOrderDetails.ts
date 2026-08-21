import { useAuth } from "@clerk/react";
import { apiFetch } from "@lib";
import { useQuery } from "@tanstack/react-query";
import type { GetOrderResponse } from "@ecommerce/shared";

export function useOrderDetails(id: string | undefined) {
  const { getToken } = useAuth();

  const { isLoading, data, error } = useQuery({
    queryKey: ["order", id],
    queryFn: () => apiFetch<GetOrderResponse>(`/api/orders/${id}`, { getToken }),
    enabled: !!id,
  });

  const order = data?.order ?? null;
  const items = data?.items ?? [];
  const isPaid = order?.status === "paid";

  return { isLoading, order, items, isPaid, error };
}
