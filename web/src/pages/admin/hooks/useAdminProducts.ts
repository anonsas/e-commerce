import { useState } from "react";
import { useAuth } from "@clerk/react";
import { useQueryClient, useQuery, useMutation } from "@tanstack/react-query";
import type {
  MeResponse,
  AdminProduct,
  ProductPatchType,
  ProductCreateType,
  ListAdminProductsResponse,
} from "@ecommerce/shared";
import { apiFetch } from "@lib";
import { USER_ROLES } from "@ecommerce/shared";

export function useAdminProducts() {
  const { getToken, isSignedIn } = useAuth();
  const queryClient = useQueryClient();

  // editingProductId is set to a product's ID when the edit modal is open, null otherwise.
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProductId, setEditingProductId] = useState<string | null>(null);

  // Fetch the current user's role so we can gate admin queries behind the isAdmin check.
  const { data: meData } = useQuery<MeResponse>({
    queryKey: ["me"],
    queryFn: () => apiFetch<MeResponse>("/api/me", { method: "GET", getToken }),
    enabled: isSignedIn,
  });

  const isAdmin = meData?.user?.role === USER_ROLES.admin;

  // Only runs once we know the user is an admin — avoids a 403 on page load.
  const { data: adminProductsData, isLoading: isProductsLoading } =
    useQuery<ListAdminProductsResponse>({
      queryKey: ["admin", "products"],
      queryFn: () => apiFetch<ListAdminProductsResponse>("/api/admin/products", { getToken }),
      enabled: isSignedIn && isAdmin,
    });

  // Handles both create (no id) and update (id present) with one mutation.
  const saveMutation = useMutation({
    mutationFn: async ({
      body,
      id,
    }: {
      body: ProductCreateType | ProductPatchType;
      id?: string;
    }) => {
      if (id) {
        return apiFetch(`/api/admin/products/${id}`, { getToken, method: "PATCH", body });
      }
      return apiFetch("/api/admin/products", { getToken, method: "POST", body });
    },
    onSuccess: () => {
      // Invalidate both admin and public product caches so changes are reflected everywhere.
      queryClient.invalidateQueries({ queryKey: ["admin", "products"] });
      queryClient.invalidateQueries({ queryKey: ["products"] });
      queryClient.invalidateQueries({ queryKey: ["product-categories"] });
      setIsModalOpen(false);
      setEditingProductId(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (productId: string) =>
      apiFetch(`/api/admin/products/${productId}`, { getToken, method: "DELETE" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "products"] });
      queryClient.invalidateQueries({ queryKey: ["products"] });
      queryClient.invalidateQueries({ queryKey: ["product-categories"] });
    },
    onError: (err) => {
      console.log(err);
      window.alert(err instanceof Error ? err.message : "Delete failed");
    },
  });

  return {
    getToken,
    isSignedIn,
    isAdmin,
    isModalOpen,
    setIsModalOpen,
    editingProductId,
    setEditingProductId,
    products: (adminProductsData?.products ?? []) as AdminProduct[],
    isProductsLoading,
    saveMutation,
    deleteMutation,
  };
}
