import { PackageOpen } from "lucide-react";

import {
  matchesSidebarPath,
  type SidebarNavigationLink,
} from "../../../layouts/sidebarNavigationModel";

export const packingSidebarEntry: SidebarNavigationLink = {
  id: "packing",
  label: "Packing",
  icon: PackageOpen,
  to: "/packing",
  match: (location) => matchesSidebarPath(location, "/packing"),
};
