import { PackageIcon, SettingsIcon, ShoppingBagIcon, ShoppingCartIcon } from "lucide-react";
import { NavLink } from "react-router";
import { Show, useAuth } from "@clerk/react";
import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@lib";
import { useCartContext } from "@context";
import { USER_ROLES } from "@ecommerce/shared";
import type { MeResponse } from "@ecommerce/shared";

// Shown only on mobile — mirrors the top navbar links but sits at the bottom for thumb reach.
export function BottomNav() {
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

  const linkClass = ({ isActive }: { isActive: boolean }) =>
    `flex flex-col items-center gap-0.5 px-3 py-2 text-xs font-medium transition-colors ${
      isActive ? "text-primary" : "text-base-content/60 hover:text-base-content"
    }`;

  return (
    // pb-safe accounts for iOS home bar on notched devices.
    <nav className="fixed bottom-0 left-0 right-0 z-50 flex items-center justify-around border-t border-base-300 bg-base-100/95 pb-safe backdrop-blur-md sm:hidden">
      <NavLink to="/" end className={linkClass}>
        <ShoppingBagIcon className="size-6" aria-hidden />
        Shop
      </NavLink>

      <Show when="signed-in">
        <NavLink to="/orders" className={linkClass}>
          <PackageIcon className="size-6" aria-hidden />
          Orders
        </NavLink>
      </Show>

      <NavLink
        to="/cart"
        className={linkClass}
        aria-label={cartCount > 0 ? `Cart, ${cartCount} items` : "Cart"}
      >
        <span className="relative">
          {cartCount > 0 ? (
            <span className="absolute -right-2 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 font-sans text-[10px] font-bold text-primary-content tabular-nums">
              {cartCount > 99 ? "99+" : cartCount}
            </span>
          ) : null}
          <ShoppingCartIcon className="size-6" aria-hidden />
        </span>
        Cart
      </NavLink>

      {role === USER_ROLES.admin ? (
        <NavLink to="/admin" className={linkClass}>
          <SettingsIcon className="size-6" aria-hidden />
          Admin
        </NavLink>
      ) : null}
    </nav>
  );
}
