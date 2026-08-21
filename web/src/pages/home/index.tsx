import { useHomeCatalog } from "./hooks/useHomeCatalog";
import { Hero, TrustStrip, Catalog } from "./components";

export function HomePage() {
  const {
    category,
    setCategory,
    categories,
    isCategoriesLoading,
    isCategoriesInitialLoading,
    products,
    productsError,
    isProductsLoading,
  } = useHomeCatalog();

  return (
    <div className="space-y-12">
      <Hero isLoading={isCategoriesLoading} categories={categories} />
      <TrustStrip />
      <Catalog
        category={category}
        setCategory={setCategory}
        categories={categories}
        isCategoriesInitialLoading={isCategoriesInitialLoading}
        products={products}
        productsError={productsError}
        isProductsLoading={isProductsLoading}
      />
    </div>
  );
}
