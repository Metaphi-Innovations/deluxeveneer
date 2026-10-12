import type { RouteObject } from "react-router";

import {
  AddOrderPage,
  EditOrderPage,
  OrdersPage,
  ViewOrderPage,
} from "./pages";

export const orderRoutes: RouteObject[] = [
  { path: "orders", Component: OrdersPage },
  { path: "orders/add", Component: AddOrderPage },
  { path: "orders/edit/:id", Component: EditOrderPage },
  { path: "orders/view/:id", Component: ViewOrderPage },
];
