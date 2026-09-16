import type { RouteObject } from "react-router";

import {
  RolesPermissionsAddPage,
  RolesPermissionsConfigurePage,
  RolesPermissionsPage,
} from "./pages";

export const rolesPermissionsRoutes: RouteObject[] = [
  { path: "roles-permissions", Component: RolesPermissionsPage },
  { path: "roles-permissions/add", Component: RolesPermissionsAddPage },
  {
    path: "roles-permissions/configure/:id",
    Component: RolesPermissionsConfigurePage,
  },
];
