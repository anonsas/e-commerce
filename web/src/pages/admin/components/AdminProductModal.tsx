import { AdminProductForm } from "./AdminProductForm";
import type { AdminProduct, ProductCreateType, ProductPatchType } from "@ecommerce/shared";

type Props = {
  isOpen: boolean;
  editingProduct: AdminProduct | null;
  saving: boolean;
  error: boolean;
  getToken: () => Promise<string | null>;
  onClose: () => void;
  onSubmit: (body: ProductCreateType | ProductPatchType) => void;
};

export function AdminProductModal({
  isOpen,
  editingProduct,
  saving,
  error,
  getToken,
  onClose,
  onSubmit,
}: Props) {
  return (
    <dialog className={`modal ${isOpen ? "modal-open" : ""}`}>
      <div className="modal-box max-w-lg">
        <h3 className="text-lg font-bold">{editingProduct ? "Edit product" : "New product"}</h3>

        <AdminProductForm
          key={editingProduct?.id ?? "new"}
          initial={editingProduct}
          saving={saving}
          error={error}
          getToken={getToken}
          onCancel={onClose}
          onSubmit={onSubmit}
        />
      </div>

      <button type="button" className="modal-backdrop bg-neutral/50" onClick={onClose} />
    </dialog>
  );
}
