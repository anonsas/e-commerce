import { Navigate } from "react-router";
import type { ProductCreateType, ProductPatchType } from "@ecommerce/shared";
import { AdminProductsTableSkeleton } from "@components";
import { useAdminProducts } from "./hooks/useAdminProducts";
import { AdminPageHeader, AdminProductRow, AdminProductModal } from "./components";

export function AdminPage() {
  const {
    getToken,
    isAdmin,
    saveMutation,
    deleteMutation,
    products,
    isProductsLoading,
    isModalOpen,
    setIsModalOpen,
    editingProductId,
    setEditingProductId,
  } = useAdminProducts();

  if (!isAdmin) return <Navigate to="/" replace />;

  const editingProduct = products.find((p) => p.id === editingProductId) ?? null;

  function closeModal() {
    setIsModalOpen(false);
    setEditingProductId(null);
  }

  return (
    <div className="text-left">
      <AdminPageHeader
        onAddProduct={() => {
          setEditingProductId(null);
          setIsModalOpen(true);
        }}
      />

      {isProductsLoading ? (
        <AdminProductsTableSkeleton />
      ) : (
        <div className="overflow-x-auto rounded-box border border-base-300 bg-base-100">
          <table className="table table-zebra">
            <thead>
              <tr>
                <th className="w-24">Preview</th>
                <th>Name</th>
                <th>Category</th>
                <th>Slug</th>
                <th>Price</th>
                <th>Active</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {products.map((p) => (
                <AdminProductRow
                  key={p.id}
                  product={p}
                  isDeleting={deleteMutation.isPending && deleteMutation.variables === p.id}
                  onEdit={() => {
                    setEditingProductId(p.id);
                    setIsModalOpen(true);
                  }}
                  onDelete={() => {
                    if (!window.confirm(`Delete "${p.name}" permanently?`)) return;
                    deleteMutation.mutate(p.id);
                  }}
                />
              ))}
            </tbody>
          </table>
        </div>
      )}

      <AdminProductModal
        isOpen={isModalOpen}
        editingProduct={editingProduct}
        saving={saveMutation.isPending}
        error={saveMutation.isError}
        getToken={getToken}
        onClose={closeModal}
        onSubmit={(body: ProductCreateType | ProductPatchType) =>
          saveMutation.mutate({ body, id: editingProductId ?? undefined })
        }
      />
    </div>
  );
}
