import { useEffect } from "react";
import { hasSeenTour, startTour } from "@lib";
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

  // Show the guided tour once, on a first visit, after products render.
  const catalogReady = !isProductsLoading && products.length > 0;
  useEffect(() => {
    if (!catalogReady || hasSeenTour()) return;
    const timer = setTimeout(startTour, 800);
    return () => clearTimeout(timer);
  }, [catalogReady]);

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
