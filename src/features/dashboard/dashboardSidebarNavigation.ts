import { LayoutDashboard } from "lucide-react";

import {
  matchesSidebarPath,
  type SidebarNavigationLink,
} from "../../layouts/sidebarNavigationModel";

export const dashboardSidebarEntry: SidebarNavigationLink = {
  id: "dashboard",
  label: "Dashboard",
  icon: LayoutDashboard,
  to: "/dashboard",
  match: (location) => matchesSidebarPath(location, "/dashboard"),
};
