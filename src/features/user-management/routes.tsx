import type { RouteObject } from "react-router";

import {
  AddUserManagementPage,
  EditUserManagementPage,
  UserManagementPage,
  ViewUserManagementPage,
} from "./pages";

export const userManagementRoutes: RouteObject[] = [
  { path: "user-management", Component: UserManagementPage },
  { path: "user-management/add", Component: AddUserManagementPage },
  { path: "user-management/edit/:id", Component: EditUserManagementPage },
  { path: "user-management/view/:id", Component: ViewUserManagementPage },
];
