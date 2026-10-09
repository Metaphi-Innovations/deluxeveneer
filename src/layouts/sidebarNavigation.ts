import { dashboardSidebarEntry } from "../features/dashboard/dashboardSidebarNavigation";
import { dispatchSidebarEntry } from "../features/dispatch/shared/dispatchSidebarNavigation";
import { factorySidebarEntry } from "../features/factory/shared/factorySidebarNavigation";
import { mastersSidebarEntry } from "../features/masters/shared/mastersSidebarNavigation";
import { ordersSidebarEntry } from "../features/orders/shared/ordersSidebarNavigation";
import { packingSidebarEntry } from "../features/packing/shared/packingSidebarNavigation";
import { userManagementSidebarEntry } from "../features/user-management/shared/userManagementSidebarNavigation";
import {
  buildWarehousesNavigationEntry,
  WAREHOUSE_TYPE_ICONS,
} from "../features/warehouses/shared/warehouseSidebarNavigation";
import type { SidebarWarehouseItem } from "../features/warehouses/shared/warehouseSidebarStore";
import type { SidebarNavigationEntry } from "./sidebarNavigationModel";

export type {
  SidebarMatchLocation,
  SidebarNavigationEntry,
  SidebarNavigationGroup,
  SidebarNavigationItem,
  SidebarNavigationLink,
} from "./sidebarNavigationModel";
export { WAREHOUSE_TYPE_ICONS };
export type { SidebarWarehouseItem as DynamicWarehouseSidebarItem };

const staticSidebarNavigation: SidebarNavigationEntry[] = [
  dashboardSidebarEntry,
  userManagementSidebarEntry,
  mastersSidebarEntry,
  factorySidebarEntry,
  ordersSidebarEntry,
  packingSidebarEntry,
  dispatchSidebarEntry,
];

export function getSidebarNavigation(
  warehouses: readonly SidebarWarehouseItem[] = [],
): SidebarNavigationEntry[] {
  const warehouseInsertIndex =
    staticSidebarNavigation.findIndex((entry) => entry.id === "masters") + 1;
  const insertIndex = warehouseInsertIndex || staticSidebarNavigation.length;

  return [
    ...staticSidebarNavigation.slice(0, insertIndex),
    buildWarehousesNavigationEntry(warehouses),
    ...staticSidebarNavigation.slice(insertIndex),
  ];
}

export const sidebarNavigation = getSidebarNavigation();
