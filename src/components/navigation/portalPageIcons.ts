import type { LucideIcon } from "lucide-react";
import {
  Factory,
  LayoutDashboard,
  PackageOpen,
  Settings2,
  ShoppingCart,
  Star,
  Truck,
  UsersRound,
  Warehouse,
  Wrench,
} from "lucide-react";

/** Resolve a consistent line icon for the current portal route. */
export function resolvePortalPageIcon(pathname: string): LucideIcon {
  const path = pathname.toLowerCase();

  if (path.startsWith("/dashboard") || path === "/") {
    return LayoutDashboard;
  }

  if (path.startsWith("/user-management") || path.startsWith("/profile")) {
    return UsersRound;
  }

  if (path.startsWith("/roles-permissions")) {
    return Settings2;
  }

  if (path.startsWith("/masters") || path.startsWith("/master")) {
    return Star;
  }

  if (
    path.startsWith("/warehouse") ||
    path.startsWith("/inventory")
  ) {
    return Warehouse;
  }

  if (path.startsWith("/factory")) {
    return Factory;
  }

  if (path.startsWith("/orders")) {
    return ShoppingCart;
  }

  if (path.startsWith("/packing")) {
    return PackageOpen;
  }

  if (path.startsWith("/dispatch")) {
    return Truck;
  }

  if (path.startsWith("/component-library") || path.startsWith("/tools")) {
    return Wrench;
  }

  return LayoutDashboard;
}
