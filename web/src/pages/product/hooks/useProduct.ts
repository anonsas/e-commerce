import { apiFetch } from "@lib";
import { useQuery } from "@tanstack/react-query";
import type { GetProductResponse } from "@ecommerce/shared";

export function useProduct(slug: string | undefined) {
  const { isLoading, data, error } = useQuery({
    queryKey: ["product", slug],
    queryFn: () => apiFetch<GetProductResponse>(`/api/products/${slug}`),
    enabled: !!slug,
  });

  return { isLoading, product: data?.product ?? null, error };
}
