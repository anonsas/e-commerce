import { Link } from "react-router";
import { HeadphonesIcon, TruckIcon } from "lucide-react";
import { BRAND_NAME } from "@constants";

export function Footer() {
  function handleToggle(e: React.SyntheticEvent<HTMLDetailsElement>) {
    const details = e.target as HTMLDetailsElement;
    if (!details.open) return;
    // Scroll only after the grid-template-rows transition has fully completed.
    details.addEventListener(
      "transitionend",
      () => window.scrollTo({ top: document.documentElement.scrollHeight, behavior: "smooth" }),
      { once: true },
    );
  }

  return (
    <footer className="border-t border-base-300 bg-base-100">
      <div className="mx-auto max-w-7xl px-4 md:px-6">
        {/* collapse is a native <details> element — no JS required for open/close */}
        <details className="collapse collapse-arrow" onToggle={handleToggle}>
          <summary className="collapse-title flex min-h-0 items-center justify-center py-4 text-xs text-base-content/50 [&::-webkit-details-marker]:hidden">
            © {new Date().getFullYear()} {BRAND_NAME} Supply · All prices in EUR
          </summary>

          <div className="collapse-content pb-10">
            <div className="grid gap-10 pt-4 md:grid-cols-4">
              <div>
                <div className="flex items-center gap-2 font-semibold text-base-content">
                  <TruckIcon className="size-8 text-primary" aria-hidden />
                  {BRAND_NAME} Supply
                </div>
                <p className="mt-3 text-sm leading-relaxed text-base-content/65">
                  Curated hardware and workspace tools. Paid orders include priority support; chat
                  with our team and join a video call when we share a link.
                </p>
              </div>

              <div>
                <h3 className="text-xs font-semibold uppercase tracking-wider text-base-content/50">
                  Shop
                </h3>
                <ul className="mt-3 space-y-2 text-sm">
                  <li>
                    <Link to="/" className="link link-hover text-base-content/80">
                      All products
                    </Link>
                  </li>
                  <li>
                    <Link to="/cart" className="link link-hover text-base-content/80">
                      Cart
                    </Link>
                  </li>
                  <li>
                    <Link to="/orders" className="link link-hover text-base-content/80">
                      Orders
                    </Link>
                  </li>
                </ul>
              </div>

              <div>
                <h3 className="text-xs font-semibold uppercase tracking-wider text-base-content/50">
                  Support
                </h3>
                <ul className="mt-3 space-y-2 text-sm text-base-content/70">
                  <li className="flex items-start gap-2">
                    <HeadphonesIcon className="mt-0.5 size-5 shrink-0 text-primary" aria-hidden />
                    <span>Order-scoped chat after payment; video links shared in-thread.</span>
                  </li>
                </ul>
              </div>

              <div>
                <h3 className="text-xs font-semibold uppercase tracking-wider text-base-content/50">
                  Company
                </h3>
                <p className="mt-3 text-sm text-base-content/65">
                  Built for teams who care about clear specs, fast fulfillment, and human support
                  when it matters.
                </p>
              </div>
            </div>
          </div>
        </details>
      </div>
    </footer>
  );
}
