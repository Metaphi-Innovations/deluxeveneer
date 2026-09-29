import type { EnterpriseTableColumn } from "../../../components/data-display/EnterpriseDataTable";
import type { WarehouseInventoryRow } from "../shared/warehouseTableData";

export type StorageInventoryTab =
  | "veneer-blocks"
  | "raw-veneer"
  | "plywood"
  | "mdf";

export type StorageSectionTab = "inventory" | "history";

/** Listing columns for QC-pass stock stored in a storage warehouse. */
export const STORAGE_LISTING_COLUMNS: readonly EnterpriseTableColumn<WarehouseInventoryRow>[] =
  [
    { key: "storageSrNo", label: "Storage Sr No" },
    { key: "inwardSrNo", label: "Inward Sr No" },
    { key: "inwardDate", label: "Inward Date" },
    { key: "invoiceNo", label: "Invoice No" },
    { key: "supplierName", label: "Supplier Name" },
    { key: "currency", label: "Currency" },
    { key: "amount", label: "Amount" },
    { key: "totalAmount", label: "Total Amount" },
    { key: "qcStatus", label: "QC Status" },
    { key: "remark", label: "Remark" },
    { key: "updatedBy", label: "Updated By" },
  ];

export const STORAGE_EXPORT_COLUMNS = [
  { key: "storageSrNo", label: "Storage Sr No" },
  { key: "inwardSrNo", label: "Inward Sr No" },
  { key: "inwardDate", label: "Inward Date" },
  { key: "invoiceNo", label: "Invoice No" },
  { key: "supplierName", label: "Supplier Name" },
  { key: "currency", label: "Currency" },
  { key: "amount", label: "Amount" },
  { key: "totalAmount", label: "Total Amount" },
  { key: "qcStatus", label: "QC Status" },
  { key: "remark", label: "Remark" },
  { key: "updatedBy", label: "Updated By" },
] as const;

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
