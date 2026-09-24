import type { WarehouseInventoryRow } from "../shared/warehouseTableData";

export type StorageInventoryTab =
  | "veneer-blocks"
  | "raw-veneer"
  | "plywood"
  | "mdf";

export type StorageSectionTab = "inventory" | "history";

export const STORAGE_INVENTORY_TABS = [
  { label: "Veneer Blocks", value: "veneer-blocks" },
  { label: "Raw Veneer", value: "raw-veneer" },
  { label: "Plywood", value: "plywood" },
  { label: "MDF", value: "mdf" },
] as const satisfies readonly {
  label: string;
  value: StorageInventoryTab;
}[];

export const STORAGE_SECTION_TABS = [
  { label: "Inventory", value: "inventory" },
  { label: "History", value: "history" },
] as const satisfies readonly {
  label: string;
  value: StorageSectionTab;
}[];

export const STORAGE_INVENTORY_TITLES: Record<StorageInventoryTab, string> = {
  "veneer-blocks": "Veneer Blocks",
  "raw-veneer": "Raw Veneer",
  plywood: "Plywood",
  mdf: "MDF",
};

export type StorageRawVeneerSourceTab = "all" | "purchase" | "production";

export interface StorageInventoryPanelProps {
  warehouseId: string;
  warehouseName: string;
  warehouseRootPath: string;
  section: StorageSectionTab;
  searchValue?: string;
  onRefreshTrigger?: number;
  rawTab?: StorageRawVeneerSourceTab;
  onSelectionChange?: (rows: WarehouseInventoryRow[]) => void;
  selectionResetKey?: string | number;
}

export function isStorageInventoryTab(
  value: string | null,
): value is StorageInventoryTab {
  return (
    value === "veneer-blocks" ||
    value === "raw-veneer" ||
    value === "plywood" ||
    value === "mdf"
  );
}

export function isStorageSectionTab(
  value: string | null,
): value is StorageSectionTab {
  return value === "inventory" || value === "history";
}

export function getActiveStorageInventoryTab(
  value: string | null,
): StorageInventoryTab {
  return isStorageInventoryTab(value) ? value : "veneer-blocks";
}

export function getActiveStorageSectionTab(
  value: string | null,
): StorageSectionTab {
  return isStorageSectionTab(value) ? value : "inventory";
}
