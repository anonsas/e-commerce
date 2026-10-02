import { toast } from "sonner";
import { Link, useParams } from "react-router";
import { useProduct } from "./hooks/useProduct";
import { useCartContext } from "@context";
import { PageError, ProductPageSkeleton } from "@components";
import { IK_PRESETS, imageKitOptimizedUrl, imageKitWatermarkedUrl } from "@lib";
import { ArrowLeftIcon, CheckIcon, ExternalLinkIcon, ShoppingCartIcon } from "lucide-react";
import { formatPrice } from "@utils";

const HIGHLIGHTS = [
  "Secure checkout",
  "Support from your order after payment",
  "Specs listed for this catalog",
];

export function ProductPage() {
  const { slug } = useParams<{ slug: string }>();
  const { isLoading, product, error } = useProduct(slug);
  const handleAddItem = useCartContext((s) => s.handleAddItem);

  if (isLoading) return <ProductPageSkeleton />;

  if (error || !product) {
    return <PageError message="Product not found." action={{ to: "/", label: "Back to shop" }} />;
  }

  const category = product.category ?? "General";
  const watermarkedFullUrl = product.imageUrl
    ? imageKitWatermarkedUrl(product.imageUrl, IK_PRESETS.productHero)
    : null;

  return (
    <div>
      <nav className="breadcrumbs text-sm text-base-content/60">
        <ul>
          <li>
            <Link to="/">Shop</Link>
          </li>
          <li>
            <Link to={`/?category=${encodeURIComponent(category)}`}>{category}</Link>
          </li>
          <li className="text-base-content">{product.name}</li>
        </ul>
      </nav>

      <div className="mt-6 grid gap-10 lg:grid-cols-2 lg:gap-14">
        <div className="card overflow-hidden border border-base-300 bg-base-100 shadow-lg">
          <figure className="aspect-square bg-base-300">
            {product.imageUrl ? (
              <img
                src={imageKitOptimizedUrl(product.imageUrl, IK_PRESETS.productHero)}
                alt=""
                className="h-full w-full object-cover"
                fetchPriority="high"
                decoding="async"
              />
            ) : (
              <div className="h-full w-full" />
            )}
          </figure>

          {watermarkedFullUrl ? (
            <div className="flex flex-wrap items-center gap-2 border-t border-base-300 bg-base-200/40 px-3 py-2">
              <a
                className="btn btn-ghost btn-xs gap-1"
                href={watermarkedFullUrl}
                target="_blank"
                rel="noopener noreferrer"
              >
                <ExternalLinkIcon className="size-3.5" aria-hidden />
                Open full size
              </a>
            </div>
          ) : null}
        </div>

        <div className="flex flex-col text-left">
          <div className="flex flex-wrap items-center gap-2">
            <span className="badge badge-primary badge-outline">{category}</span>
            <span className="text-xs font-mono text-base-content/45">{product.slug}</span>
          </div>

          <h1 className="mt-3 text-3xl font-bold tracking-tight text-base-content md:text-4xl">
            {product.name}
          </h1>

          <p className="mt-3 text-3xl font-bold tabular-nums text-primary md:text-4xl">
            {formatPrice(product.priceCents, product.currency)}
          </p>

          <p className="mt-6 text-base leading-relaxed text-base-content/85">
            {product.description}
          </p>

          <ul className="mt-6 space-y-2 rounded-box border border-base-300 bg-base-200/50 p-4">
            {HIGHLIGHTS.map((h) => (
              <li key={h} className="flex items-center gap-2 text-sm text-base-content/80">
                <CheckIcon className="size-4 shrink-0 text-success" aria-hidden />
                {h}
              </li>
            ))}
          </ul>

          <div className="mt-8 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => {
                handleAddItem(product.id);
                toast.success(`${product.name} added to cart`);
              }}
              className="btn btn-primary btn-lg gap-2 shadow-lg"
            >
              <ShoppingCartIcon className="size-5" aria-hidden />
              Add to cart
            </button>

            <Link to="/" className="btn btn-ghost btn-lg gap-2 border border-base-300">
              <ArrowLeftIcon className="size-4" aria-hidden />
              Continue shopping
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
