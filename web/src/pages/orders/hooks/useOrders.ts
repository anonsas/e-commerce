import { useAuth } from "@clerk/react";
import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@lib";
import { USER_ROLES } from "@ecommerce/shared";
import type { ListOrdersResponse, MeResponse } from "@ecommerce/shared";

export function useOrders() {
  const { isSignedIn, getToken } = useAuth();

  const { isLoading, data, error } = useQuery({
    queryKey: ["orders"],
    queryFn: () => apiFetch<ListOrdersResponse>("/api/orders", { getToken }),
    enabled: isSignedIn,
  });

  const { data: meData } = useQuery({
    queryKey: ["me"],
    queryFn: () => apiFetch<MeResponse>("/api/me", { getToken }),
    enabled: isSignedIn,
  });

  const isStaff =
    meData?.user.role === USER_ROLES.support || meData?.user.role === USER_ROLES.admin;
  const orders = data?.orders ?? [];

  return { orders, error, isLoading, isStaff };
}
