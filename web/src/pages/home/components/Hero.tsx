import { Link } from "react-router";
import { Show } from "@clerk/react";
import { ArrowRightIcon, CompassIcon, SparklesIcon } from "lucide-react";
import { startTour } from "@lib";
import { DemoLoginButton } from "@components";
import type { CategoriesResponse } from "@ecommerce/shared";

type Props = {
  isLoading: boolean;
  categories: CategoriesResponse["categories"];
};

export function Hero({ isLoading, categories }: Props) {
  return (
    <section className="relative overflow-hidden rounded-box border border-base-300 bg-linear-to-br from-base-100 via-base-100 to-primary/10 shadow-lg">
      <div
        className="absolute right-0 top-0 h-64 w-64 translate-x-1/4 -translate-y-1/4 rounded-full bg-primary/10 blur-3xl"
        aria-hidden
      />

      <div className="relative grid gap-8 p-8 md:grid-cols-2 md:items-center md:p-12 lg:p-14">
        <div className="text-left">
          <h1 className="text-3xl font-bold tracking-tight text-base-content md:text-4xl lg:text-5xl">
            Hardware &amp; workspace, <span className="text-primary">ready to ship</span>
          </h1>

          <p className="mt-4 max-w-lg text-base leading-relaxed text-base-content/70">
            Audio, wearables, workspace, and travel—curated for work and home. Secure checkout;
            after payment, use your order page for support chat and video.
          </p>

          <div className="mt-6 flex flex-wrap gap-3">
            <a href="#catalog" className="btn btn-primary gap-2 shadow-md">
              Shop catalog
              <ArrowRightIcon className="size-4" aria-hidden />
            </a>

            <Link to="/cart" className="btn btn-outline btn-primary">
              View cart
            </Link>

            <Show when="signed-out">
              <DemoLoginButton />
            </Show>

            <button type="button" onClick={startTour} className="btn btn-ghost gap-2">
              <CompassIcon className="size-4" aria-hidden />
              Take a tour
            </button>
          </div>
        </div>

        <div className="grid gap-3">
          <div className="stat rounded-box border border-base-300 bg-base-100/80 px-4 py-3 shadow-sm">
            <div className="stat-title text-xs uppercase text-base-content/50">Categories</div>

            <div className="stat-value text-2xl text-secondary">
              {isLoading ? (
                <span className="skeleton inline-block h-8 w-10 rounded" aria-hidden />
              ) : (
                categories.length
              )}
            </div>

            <div className="stat-desc text-xs">Curated groups</div>
          </div>

          <div className="rounded-box border border-dashed border-primary/30 bg-primary/5 px-4 py-3">
            <div className="flex items-center gap-2 text-sm font-medium text-base-content">
              <SparklesIcon className="size-4 text-primary" aria-hidden />
              Secure checkout · Priority support on paid orders
            </div>
            <p className="mt-2 text-xs text-base-content/60">
              Demo store in payment sandbox. Pay with test card{" "}
              <code className="font-mono">4242 4242 4242 4242</code>, any future expiry and CVC.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
