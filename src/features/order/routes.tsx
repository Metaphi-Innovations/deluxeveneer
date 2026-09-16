import type { RouteObject } from "react-router";

import {
  AddOrderModulePage,
  EditOrderModulePage,
  OrderPage,
  ViewOrderModulePage,
} from "./pages";

export const orderRoutes: RouteObject[] = [
  { path: "orders", Component: OrderPage },
  { path: "orders/add", Component: AddOrderModulePage },
  { path: "orders/edit/:id", Component: EditOrderModulePage },
  { path: "orders/view/:id", Component: ViewOrderModulePage },
];
