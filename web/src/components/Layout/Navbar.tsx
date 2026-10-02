import {
  LogInIcon,
  LayersIcon,
  PackageIcon,
  SettingsIcon,
  ShoppingBagIcon,
  ShoppingCartIcon,
} from "lucide-react";
import { Link } from "react-router";
import { useQuery } from "@tanstack/react-query";
import { Show, SignInButton, useAuth, UserButton } from "@clerk/react";
import { apiFetch } from "@lib";
import { BRAND_NAME } from "@constants";
import { useCartContext } from "@context";
import { ThemeToggle } from "../ThemeToggle";
import { DemoLoginButton } from "../DemoLoginButton";
import { USER_ROLES } from "@ecommerce/shared";
import type { MeResponse } from "@ecommerce/shared";

export function Navbar() {
  const { getToken, isSignedIn } = useAuth();
  const cartCount = useCartContext((state) =>
    state.items.reduce((total, item) => total + item.quantity, 0),
  );

  const { data } = useQuery<MeResponse>({
    queryKey: ["me"],
    queryFn: () => apiFetch<MeResponse>("/api/me", { method: "GET", getToken }),
    enabled: isSignedIn,
  });

  const role = data?.user.role;

  return (
    <header className="sticky top-0 z-50 border-b border-base-300 bg-base-100/95 shadow-sm backdrop-blur-md">
      <div className="navbar mx-auto min-h-14 max-w-7xl px-4 py-2.5 md:px-6 md:py-3">
        <div className="flex-1">
          <Link
            to="/"
            className="btn btn-ghost gap-2 px-2 font-mono text-lg font-semibold uppercase tracking-wide md:text-xl"
          >
            <LayersIcon className="size-8 text-primary" aria-hidden />
            <span className="leading-none">{BRAND_NAME}</span>
          </Link>
        </div>

        <nav className="flex items-center gap-1 md:gap-1.5">
          {/* Nav links are hidden on mobile — they live in the bottom tab bar instead. */}
          <Link to="/" className="btn btn-ghost hidden gap-2 font-medium sm:flex">
            <ShoppingBagIcon className="size-6 opacity-90" aria-hidden />
            <span className="hidden sm:inline">Shop</span>
          </Link>

          <Show when="signed-in">
            <Link to="/orders" className="btn btn-ghost hidden gap-2 font-medium sm:flex">
              <PackageIcon className="size-6 opacity-90" aria-hidden />
              <span className="hidden sm:inline">Orders</span>
            </Link>

            {role === USER_ROLES.admin ? (
              <Link
                to="/admin"
                className="btn btn-ghost hidden gap-2 font-medium text-secondary sm:flex"
              >
                <SettingsIcon className="size-6" aria-hidden />
                <span className="hidden sm:inline">Admin</span>
              </Link>
            ) : null}
          </Show>

          <Link
            to="/cart"
            data-tour="cart"
            className="btn btn-ghost hidden gap-2 font-medium indicator sm:flex"
            aria-label={cartCount > 0 ? `Cart, ${cartCount} items` : "Cart"}
          >
            {cartCount > 0 ? (
              <span className="indicator-item badge badge-sm badge-primary min-w-2 px-1.5 font-sans text-xs tabular-nums">
                {cartCount > 99 ? "99+" : cartCount}
              </span>
            ) : null}
            <ShoppingCartIcon className="size-6 opacity-90" aria-hidden />
            <span className="hidden sm:inline">Cart</span>
          </Link>

          <Show when="signed-out">
            <div data-tour="auth" className="flex items-center gap-1.5">
              <DemoLoginButton className="btn btn-secondary btn-sm hidden gap-1.5 px-3 sm:inline-flex" />
              <SignInButton mode="modal">
                <button type="button" className="btn btn-primary btn-sm gap-1.5 px-3 shadow-md">
                  <LogInIcon className="size-4 drop-shadow-sm" aria-hidden />
                  Sign in
                </button>
              </SignInButton>
            </div>
          </Show>

          <ThemeToggle />

          <Show when={"signed-in"}>
            <div className="flex items-center gap-2 border-l border-base-300 pl-3">
              <UserButton
                appearance={{ elements: { avatarBox: "h-10 w-10 ring-2 ring-base-300" } }}
              />
              {role === USER_ROLES.support || role === USER_ROLES.admin ? (
                <span className="badge badge-primary badge-sm hidden capitalize md:inline-flex">
                  {role}
                </span>
              ) : null}
            </div>
          </Show>
        </nav>
      </div>
    </header>
  );
}
