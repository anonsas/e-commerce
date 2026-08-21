import { apiFetch } from "@lib";
import { useSearchParams } from "react-router";
import { useQuery } from "@tanstack/react-query";
import type { ListProductsResponse, CategoriesResponse } from "@ecommerce/shared";

// Drives the home page catalog: category filter state, category chip list, and product grid.
export function useHomeCatalog() {
  // Read the active category from the URL so the filter survives page refreshes and can be shared via link.
  const [searchParams, setSearchParams] = useSearchParams();
  const category = searchParams.get("category")?.trim() ?? "";

  // Writes the selected category back to the URL. Passing an empty string removes the filter.
  const setCategory = (category: string) => {
    const next = new URLSearchParams(searchParams);

    if (!category) next.delete("category");
    else next.set("category", category);

    setSearchParams(next, { replace: true });
  };

  // Fetch the list of available categories once and cache it — it changes rarely.
  const { data: categoriesResult, isLoading: isCategoriesLoading } = useQuery<CategoriesResponse>({
    queryKey: ["product-categories"],
    queryFn: () => apiFetch<CategoriesResponse>("/api/products/categories"),
  });

  // Re-fetch products whenever the active category changes.
  const {
    data: productsResult,
    isLoading: isProductsLoading,
    error: productsError,
  } = useQuery<ListProductsResponse>({
    queryKey: ["products", category],
    queryFn: () =>
      apiFetch<ListProductsResponse>(
        category ? `/api/products?category=${encodeURIComponent(category)}` : "/api/products",
      ),
  });

  const products = productsResult?.products ?? [];
  const categories = categoriesResult?.categories ?? [];
  // Only show a skeleton for the category filters on the very first load, not on every refetch.
  const isCategoriesInitialLoading = isCategoriesLoading && categories.length === 0;

  return {
    category,
    setCategory,
    products,
    productsError,
    isProductsLoading,
    categories,
    isCategoriesLoading,
    isCategoriesInitialLoading,
  };
}
