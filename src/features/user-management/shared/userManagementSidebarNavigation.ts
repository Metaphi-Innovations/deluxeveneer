import { UsersRound } from "lucide-react";

import {
  matchesSidebarPath,
  type SidebarNavigationLink,
} from "../../../layouts/sidebarNavigationModel";

export const userManagementSidebarEntry: SidebarNavigationLink = {
  id: "user-management",
  label: "User Management",
  icon: UsersRound,
  to: "/user-management",
  match: (location) => matchesSidebarPath(location, "/user-management"),
};
