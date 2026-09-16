import type { RouteObject } from "react-router";

import {
  AddPackingPage,
  EditPackingPage,
  PackingPage,
  ViewPackingPage,
} from "./pages";

export const packingRoutes: RouteObject[] = [
  { path: "packing", Component: PackingPage },
  { path: "packing/add", Component: AddPackingPage },
  { path: "packing/add/:id", Component: AddPackingPage },
  { path: "packing/edit/:id", Component: EditPackingPage },
  { path: "packing/view/:id", Component: ViewPackingPage },
];
