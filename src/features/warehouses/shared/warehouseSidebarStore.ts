import {
  fetchWarehouseMasterPaginated,
} from "../../masters/warehouse-location-master/api/warehouseMasterApi";
import { queryClient } from "../../../query/queryClient";
import { queryKeys } from "../../../query/queryKeys";
import { getDynamicWarehousePermissionKey } from "../../shared/warehousePermission";

export const MASTER_WAREHOUSES_UPDATED_EVENT =
  "deluxe-veneers-master-warehouses-updated";

export type WarehouseMasterType = "Inward" | "Storage" | "Production";

export interface SidebarWarehouseItem {
  id: string;
  label: string;
  warehouseType: WarehouseMasterType;
  permissionKey: string;
}

const WAREHOUSE_TYPE_SIDEBAR_ORDER: Record<WarehouseMasterType, number> = {
  Inward: 0,
  Storage: 1,
  Production: 2,
};

function isWarehouseMasterType(value: string): value is WarehouseMasterType {
  return value === "Inward" || value === "Storage" || value === "Production";
}

function compareSidebarWarehouses(
  left: SidebarWarehouseItem,
  right: SidebarWarehouseItem,
) {
  const typeOrder =
    WAREHOUSE_TYPE_SIDEBAR_ORDER[left.warehouseType] -
    WAREHOUSE_TYPE_SIDEBAR_ORDER[right.warehouseType];
  if (typeOrder !== 0) {
    return typeOrder;
  }

  return left.label.localeCompare(right.label, undefined, {
    sensitivity: "base",
  });
}

export function notifyMasterWarehousesUpdated() {
  if (typeof window === "undefined") {
    return;
  }

  window.dispatchEvent(new CustomEvent(MASTER_WAREHOUSES_UPDATED_EVENT));
  void queryClient.invalidateQueries({ queryKey: queryKeys.warehouse.sidebar });
  void queryClient.invalidateQueries({
    queryKey: queryKeys.masters.all("warehouse"),
  });
}

export async function fetchSidebarWarehouses(): Promise<SidebarWarehouseItem[]> {
  const result = await fetchWarehouseMasterPaginated({
    page: 1,
    limit: 200,
    status: true,
    sortBy: "name",
    sortOrder: "asc",
  });

  return result.items
    .map((item) => {
      const warehouseType =
        typeof item.warehouseType === "string" ? item.warehouseType.trim() : "";
      const warehouseName =
        typeof item.warehouseName === "string" ? item.warehouseName.trim() : "";

      if (!item.id || !warehouseName || !isWarehouseMasterType(warehouseType)) {
        return null;
      }

      return {
        id: item.id,
        label: warehouseName,
        warehouseType,
        permissionKey: getDynamicWarehousePermissionKey(item.id),
      } satisfies SidebarWarehouseItem;
    })
    .filter((item): item is SidebarWarehouseItem => item !== null)
    .sort(compareSidebarWarehouses);
}
