import { ShoppingCart } from "lucide-react";

import {
  matchesSidebarPath,
  type SidebarNavigationLink,
} from "../../../layouts/sidebarNavigationModel";

export const ordersSidebarEntry: SidebarNavigationLink = {
  id: "order",
  label: "Orders",
  icon: ShoppingCart,
  to: "/orders",
  match: (location) => matchesSidebarPath(location, "/orders"),
};
