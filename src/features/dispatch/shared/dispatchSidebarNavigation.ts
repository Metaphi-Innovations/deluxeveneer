import { Truck } from "lucide-react";

import {
  matchesSidebarPath,
  type SidebarNavigationLink,
} from "../../../layouts/sidebarNavigationModel";

export const dispatchSidebarEntry: SidebarNavigationLink = {
  id: "dispatch",
  label: "Dispatch",
  icon: Truck,
  to: "/dispatch",
  match: (location) => matchesSidebarPath(location, "/dispatch"),
};
