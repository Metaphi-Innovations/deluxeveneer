import type { RouteObject } from "react-router";

import {
  AddConsumablesPage,
  ConsumablesListPage,
  EditConsumablesPage,
  ViewConsumablesPage,
} from "./consumables";
import {
  AddMDFPage,
  EditMDFPage,
  MDFListPage,
  ViewMDFPage,
} from "./mdf";
import {
  AddPlywoodPage,
  EditPlywoodPage,
  PlywoodListPage,
  ViewPlywoodPage,
} from "./plywood";
import {
  AddRawVeneerPage,
  EditRawVeneerPage,
  RawVeneerListPage,
  ViewRawVeneerPage,
} from "./raw-veneer";
import {
  AddVeneerBlocksPage,
  EditVeneerBlocksPage,
  VeneerBlocksListPage,
  ViewVeneerBlocksPage,
} from "./veneer-blocks";

export const inventoryRoutes: RouteObject[] = [
  { path: "inventory/consumables", Component: ConsumablesListPage },
  { path: "inventory/consumables/add", Component: AddConsumablesPage },
  { path: "inventory/consumables/edit/:id", Component: EditConsumablesPage },
  { path: "inventory/consumables/view/:id", Component: ViewConsumablesPage },

  { path: "inventory/raw-veneer", Component: RawVeneerListPage },
  { path: "inventory/raw-veneer/add", Component: AddRawVeneerPage },
  { path: "inventory/raw-veneer/edit/:id", Component: EditRawVeneerPage },
  { path: "inventory/raw-veneer/view/:id", Component: ViewRawVeneerPage },

  { path: "inventory/veneer-blocks", Component: VeneerBlocksListPage },
  { path: "inventory/veneer-blocks/add", Component: AddVeneerBlocksPage },
  { path: "inventory/veneer-blocks/edit/:id", Component: EditVeneerBlocksPage },
  { path: "inventory/veneer-blocks/view/:id", Component: ViewVeneerBlocksPage },

  { path: "inventory/plywood", Component: PlywoodListPage },
  { path: "inventory/plywood/add", Component: AddPlywoodPage },
  { path: "inventory/plywood/edit/:id", Component: EditPlywoodPage },
  { path: "inventory/plywood/view/:id", Component: ViewPlywoodPage },

  { path: "inventory/mdf", Component: MDFListPage },
  { path: "inventory/mdf/add", Component: AddMDFPage },
  { path: "inventory/mdf/edit/:id", Component: EditMDFPage },
  { path: "inventory/mdf/view/:id", Component: ViewMDFPage },
];
