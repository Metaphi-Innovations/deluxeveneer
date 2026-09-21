import {
  fetchWarehouseMasterPaginated,
} from "../../masters/warehouse-location-master/api/warehouseMasterApi";

export const MASTER_WAREHOUSES_UPDATED_EVENT =
  "deluxe-veneers-master-warehouses-updated";

export type WarehouseMasterType = "Inward" | "Storage" | "Production";

export interface SidebarWarehouseItem {
  id: string;
  label: string;
  warehouseType: WarehouseMasterType;
  permissionKey: string;
}

const WAREHOUSE_TYPE_PERMISSION_KEY: Record<WarehouseMasterType, string> = {
  Inward: "warehouseA",
  Storage: "warehouseB",
  Production: "warehouseC",
};

function isWarehouseMasterType(value: string): value is WarehouseMasterType {
  return value === "Inward" || value === "Storage" || value === "Production";
}

export function getWarehouseTypePermissionKey(
  warehouseType: WarehouseMasterType,
) {
  return WAREHOUSE_TYPE_PERMISSION_KEY[warehouseType];
}

export function notifyMasterWarehousesUpdated() {
  if (typeof window === "undefined") {
    return;
  }

  window.dispatchEvent(new CustomEvent(MASTER_WAREHOUSES_UPDATED_EVENT));
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
        permissionKey: getWarehouseTypePermissionKey(warehouseType),
      } satisfies SidebarWarehouseItem;
    })
    .filter((item): item is SidebarWarehouseItem => item !== null);
}
