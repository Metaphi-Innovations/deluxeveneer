import type { EnterpriseTableColumn } from "../../../components/data-display/EnterpriseDataTable";
import type { WarehouseInventoryRow } from "../shared/warehouseTableData";

export type StorageInventoryTab =
  | "veneer-blocks"
  | "raw-veneer"
  | "plywood"
  | "mdf"
  | "consumables";

export type StorageSectionTab = "inventory" | "history";

const STORAGE_ITEM_IDENTITY_COLUMNS: readonly EnterpriseTableColumn<WarehouseInventoryRow>[] =
  [
    { key: "inwardItemCode", label: "Inward Item Code" },
    { key: "itemName", label: "Item Name" },
    { key: "factoryCode", label: "Factory Code" },
  ];

/** Listing columns for Veneer Blocks in storage warehouse. */
export const STORAGE_LISTING_COLUMNS: readonly EnterpriseTableColumn<WarehouseInventoryRow>[] =
  [
    { key: "storageSrNo", label: "Storage Sr No" },
    { key: "inwardSrNo", label: "Inward Sr No" },
    { key: "inwardDate", label: "Inward Date" },
    { key: "invoiceNo", label: "Invoice No" },
    { key: "supplierName", label: "Supplier Name" },
    ...STORAGE_ITEM_IDENTITY_COLUMNS,
    { key: "logCode", label: "Log No" },
    { key: "cbm", label: "CBM" },
    { key: "currency", label: "Currency" },
    { key: "rate", label: "Rate" },
    { key: "totalAmount", label: "Total Amount" },
    { key: "remark", label: "Remark" },
    { key: "createdBy", label: "Created By" },
    { key: "updatedBy", label: "Updated By" },
  ];

/** Listing columns for Veneer Blocks in storage warehouse history tab — includes "Issue To". */
export const STORAGE_VENEER_BLOCKS_HISTORY_COLUMNS: readonly EnterpriseTableColumn<WarehouseInventoryRow>[] =
  [
    { key: "storageSrNo", label: "Storage Sr No" },
    { key: "inwardSrNo", label: "Inward Sr No" },
    { key: "inwardDate", label: "Inward Date" },
    { key: "invoiceNo", label: "Invoice No" },
    { key: "supplierName", label: "Supplier Name" },
    { key: "issueTo", label: "Issue To" },
    { key: "logCode", label: "Log No" },
    { key: "cbm", label: "CBM" },
    { key: "currency", label: "Currency" },
    { key: "rate", label: "Rate" },
    { key: "totalAmount", label: "Total Amount" },
    { key: "qcStatus", label: "QC Status" },
    { key: "remark", label: "Remark" },
    { key: "createdBy", label: "Created By" },
    { key: "updatedBy", label: "Updated By" },
  ];


export const STORAGE_RAW_VENEER_COLUMNS: readonly EnterpriseTableColumn<WarehouseInventoryRow>[] =
  [
    { key: "storageSrNo", label: "Storage Sr No" },
    { key: "inwardSrNo", label: "Inward Sr No" },
    { key: "inwardDate", label: "Inward Date" },
    { key: "invoiceNo", label: "Invoice No" },
    { key: "supplierName", label: "Supplier Name" },
    ...STORAGE_ITEM_IDENTITY_COLUMNS,
    { key: "hsnCode", label: "HSN Code" },
    { key: "logCode", label: "Log Code" },
    { key: "bundleNumber", label: "Bundle Number" },
    { key: "palletNo", label: "Pallet No" },
    { key: "length", label: "Length" },
    { key: "width", label: "Width" },
    { key: "thickness", label: "Thickness" },
    { key: "totalUnits", label: "Received Leaves" },
    { key: "availableUnits", label: "Available Leaves" },
    { key: "totalSqm", label: "Total Sq Meter" },
    { key: "rate", label: "Rate" },
    { key: "currency", label: "Currency" },
    { key: "totalAmount", label: "Total Amount" },
    { key: "remark", label: "Remark" },
    { key: "createdBy", label: "Created By" },
    { key: "updatedBy", label: "Updated By" },
  ];

/** History columns — each row is one forward to production (partial or full). */
export const STORAGE_RAW_VENEER_HISTORY_COLUMNS: readonly EnterpriseTableColumn<WarehouseInventoryRow>[] =
  [
    { key: "storageSrNo", label: "Storage Sr No" },
    { key: "inwardSrNo", label: "Inward Sr No" },
    { key: "inwardDate", label: "Inward Date" },
    { key: "invoiceNo", label: "Invoice No" },
    { key: "supplierName", label: "Supplier Name" },
    ...STORAGE_ITEM_IDENTITY_COLUMNS,
    { key: "totalUnits", label: "Forwarded Leaves" },
    { key: "availableUnits", label: "Remaining Leaves" },
    { key: "rate", label: "Rate" },
    { key: "currency", label: "Currency" },
    { key: "totalAmount", label: "Total Amount" },
    { key: "remark", label: "Remark" },
    { key: "createdBy", label: "Created By" },
    { key: "updatedBy", label: "Forwarded By" },
  ];

/** Listing columns for Plywood & MDF: Received Stock before Available Stock. */
export const STORAGE_SHEET_GOODS_COLUMNS: readonly EnterpriseTableColumn<WarehouseInventoryRow>[] =
  [
    { key: "storageSrNo", label: "Storage Sr No" },
    { key: "inwardSrNo", label: "Inward Sr No" },
    { key: "inwardDate", label: "Inward Date" },
    { key: "invoiceNo", label: "Invoice No" },
    { key: "supplierName", label: "Supplier Name" },
    ...STORAGE_ITEM_IDENTITY_COLUMNS,
    { key: "hsnCode", label: "HSN Code" },
    { key: "palletNo", label: "Pallet No" },
    { key: "length", label: "Length" },
    { key: "width", label: "Width" },
    { key: "thickness", label: "Thickness" },
    { key: "totalUnits", label: "Received Sheets" },
    { key: "availableUnits", label: "Available Sheets" },
    { key: "totalSqm", label: "Total Sq Meter" },
    { key: "rate", label: "Rate" },
    { key: "currency", label: "Currency" },
    { key: "totalAmount", label: "Total Amount" },
    { key: "remark", label: "Remark" },
    { key: "createdBy", label: "Created By" },
    { key: "updatedBy", label: "Updated By" },
  ];

export const STORAGE_SHEET_GOODS_HISTORY_COLUMNS: readonly EnterpriseTableColumn<WarehouseInventoryRow>[] =
  [
    { key: "storageSrNo", label: "Storage Sr No" },
    { key: "inwardSrNo", label: "Inward Sr No" },
    { key: "inwardDate", label: "Inward Date" },
    { key: "invoiceNo", label: "Invoice No" },
    { key: "supplierName", label: "Supplier Name" },
    ...STORAGE_ITEM_IDENTITY_COLUMNS,
    { key: "hsnCode", label: "HSN Code" },
    { key: "palletNo", label: "Pallet No" },
    { key: "length", label: "Length" },
    { key: "width", label: "Width" },
    { key: "thickness", label: "Thickness" },
    { key: "totalUnits", label: "Forwarded Sheets" },
    { key: "availableUnits", label: "Remaining Sheets" },
    { key: "totalSqm", label: "Total Sq Meter" },
    { key: "rate", label: "Rate" },
    { key: "currency", label: "Currency" },
    { key: "totalAmount", label: "Total Amount" },
    { key: "remark", label: "Remark" },
    { key: "createdBy", label: "Created By" },
    { key: "updatedBy", label: "Forwarded By" },
  ];

export const STORAGE_CONSUMABLES_COLUMNS: readonly EnterpriseTableColumn<WarehouseInventoryRow>[] =
  [
    { key: "storageSrNo", label: "Storage Sr No" },
    { key: "inwardSrNo", label: "Inward Sr No" },
    { key: "inwardDate", label: "Inward Date" },
    { key: "invoiceNo", label: "Invoice No" },
    { key: "supplierName", label: "Supplier Name" },
    ...STORAGE_ITEM_IDENTITY_COLUMNS,
    { key: "subCategory", label: "Sub Category" },
    { key: "specification", label: "Specification / Model" },
    { key: "brandName", label: "Brand / Make" },
    { key: "batchNo", label: "Batch / Lot No" },
    { key: "unitName", label: "Unit" },
    { key: "totalUnits", label: "Received Qty" },
    { key: "availableUnits", label: "Available Qty" },
    { key: "rate", label: "Rate" },
    { key: "currency", label: "Currency" },
    { key: "totalAmount", label: "Total Amount" },
    { key: "remark", label: "Remark" },
    { key: "createdBy", label: "Created By" },
    { key: "updatedBy", label: "Updated By" },
  ];

export const STORAGE_CONSUMABLES_HISTORY_COLUMNS: readonly EnterpriseTableColumn<WarehouseInventoryRow>[] =
  [
    { key: "storageSrNo", label: "Storage Sr No" },
    { key: "inwardSrNo", label: "Inward Sr No" },
    { key: "inwardDate", label: "Inward Date" },
    { key: "invoiceNo", label: "Invoice No" },
    { key: "supplierName", label: "Supplier Name" },
    ...STORAGE_ITEM_IDENTITY_COLUMNS,
    { key: "subCategory", label: "Sub Category" },
    { key: "specification", label: "Specification / Model" },
    { key: "brandName", label: "Brand / Make" },
    { key: "batchNo", label: "Batch / Lot No" },
    { key: "unitName", label: "Unit" },
    { key: "totalUnits", label: "Forwarded Qty" },
    { key: "availableUnits", label: "Remaining Qty" },
    { key: "rate", label: "Rate" },
    { key: "currency", label: "Currency" },
    { key: "totalAmount", label: "Total Amount" },
    { key: "remark", label: "Remark" },
    { key: "createdBy", label: "Created By" },
    { key: "updatedBy", label: "Forwarded By" },
  ];

export const STORAGE_EXPORT_COLUMNS = [
  { key: "storageSrNo", label: "Storage Sr No" },
  { key: "inwardSrNo", label: "Inward Sr No" },
  { key: "inwardDate", label: "Inward Date" },
  { key: "invoiceNo", label: "Invoice No" },
  { key: "supplierName", label: "Supplier Name" },
  { key: "inwardItemCode", label: "Inward Item Code" },
  { key: "itemName", label: "Item Name" },
  { key: "factoryCode", label: "Factory Code" },
  { key: "currency", label: "Currency" },
  { key: "rate", label: "Rate" },
  { key: "totalAmount", label: "Total Amount" },
  { key: "remark", label: "Remark" },
  { key: "createdBy", label: "Created By" },
  { key: "updatedBy", label: "Updated By" },
] as const;

export const STORAGE_INVENTORY_TABS = [
  { label: "Veneer Blocks", value: "veneer-blocks" },
  { label: "Raw Veneer", value: "raw-veneer" },
  { label: "Plywood", value: "plywood" },
  { label: "MDF", value: "mdf" },
  { label: "Consumables", value: "consumables" },
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
  consumables: "Consumables",
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
    value === "mdf" ||
    value === "consumables"
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
