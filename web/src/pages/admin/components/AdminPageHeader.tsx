import { PackageIcon, PlusIcon } from "lucide-react";

type Props = {
  onAddProduct: () => void;
};

export function AdminPageHeader({ onAddProduct }: Props) {
  return (
    <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
      <div className="flex items-center gap-2">
        <PackageIcon className="size-8 text-secondary" aria-hidden />
        <div>
          <h1 className="text-2xl font-bold text-base-content">Products</h1>
          <p className="text-sm text-base-content/60">Manage catalog (admin only).</p>
        </div>
      </div>
      <button type="button" className="btn btn-primary btn-sm gap-2" onClick={onAddProduct}>
        <PlusIcon className="size-4" aria-hidden />
        Add product
      </button>
    </div>
  );
}
