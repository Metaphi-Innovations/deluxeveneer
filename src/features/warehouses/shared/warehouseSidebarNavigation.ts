import type { LucideIcon } from "lucide-react";
import { ArrowDownToLine, Boxes, Factory, Warehouse } from "lucide-react";

import {
  matchesSidebarPath,
  type SidebarNavigationGroup,
  type SidebarNavigationItem,
} from "../../../layouts/sidebarNavigationModel";
import type {
  SidebarWarehouseItem,
  WarehouseMasterType,
} from "./warehouseSidebarStore";

export const WAREHOUSE_TYPE_ICONS: Record<WarehouseMasterType, LucideIcon> = {
  Inward: ArrowDownToLine,
  Storage: Boxes,
  Production: Factory,
};

export function buildWarehousesNavigationEntry(
  warehouses: readonly SidebarWarehouseItem[] = [],
): SidebarNavigationGroup {
  return {
    id: "warehouses",
    label: "Warehouses",
    icon: Warehouse,
    items: warehouses.map((warehouse) => buildWarehouseNavigationItem(warehouse)),
  };
}

function buildWarehouseNavigationItem(
  warehouse: SidebarWarehouseItem,
): SidebarNavigationItem {
  return {
    id: `master-warehouse-${warehouse.id}`,
    label: warehouse.label,
    icon: WAREHOUSE_TYPE_ICONS[warehouse.warehouseType] ?? Warehouse,
    warehouseType: warehouse.warehouseType,
    permissionKey: warehouse.permissionKey,
    to: `/warehouses/${warehouse.id}`,
    match: (location) => {
      if (matchesSidebarPath(location, `/warehouses/${warehouse.id}`)) {
        return true;
      }

      if (!location.pathname.startsWith("/inventory/")) {
        return false;
      }

      const params = new URLSearchParams(location.search);
      if (params.get("warehouseId") === warehouse.id) {
        return true;
      }

      const returnTo = params.get("returnTo") ?? "";
      return (
        returnTo === `/warehouses/${warehouse.id}` ||
        returnTo.startsWith(`/warehouses/${warehouse.id}?`)
      );
    },
  };
}
