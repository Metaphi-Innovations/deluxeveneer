import type { EnterpriseTableColumn } from "../../../components/data-display/EnterpriseDataTable";

export type SlicingProcessTab = "issued" | "done" | "history" | "rejected";

export const SLICING_PROCESS_TABS = [
  { label: "Issued for Slicing", value: "issued" },
  { label: "Slicing Done", value: "done" },
  { label: "Slicing History", value: "history" },
  { label: "Rejected Slicing", value: "rejected" },
] as const;

export function formatSlicingNumber(value: unknown, decimals = 2): string {
  if (value === null || value === undefined || value === "") return "-";
  const num = Number(value);
  if (!Number.isFinite(num)) return String(value);
  return num.toFixed(decimals);
}

export function formatSlicingStorageSerial(value: unknown): string {
  const original = String(value ?? "").trim();
  if (!original || original === "null" || original === "undefined") return "-";
  return original;
}

const storageSerialColumn: EnterpriseTableColumn<any> = {
  key: "storageSrNo",
  label: "Storage Sr No.",
  renderCell: (row) => formatSlicingStorageSerial(row.storageSrNo),
};

// ── Tab 1: Issued for Slicing ──────────────────────────────────────────
export const SLICING_ISSUED_COLUMNS: readonly EnterpriseTableColumn<any>[] = [
  storageSerialColumn,
  { key: "issuedDate", label: "Issue Date" },
  { key: "itemName", label: "Item Name" },
  { key: "subCategory", label: "Sub Category" },
  { key: "logCode", label: "Log Code" },
  { key: "length", label: "Length" },
  { key: "width", label: "Width" },
  { key: "height", label: "Height" },
  {
    key: "receivedCbm",
    label: "Received CBM",
    renderCell: (row) => formatSlicingNumber(row.receivedCbm, 3),
  },
  {
    key: "availableCbm",
    label: "Available CBM",
    renderCell: (row) => formatSlicingNumber(row.availableCbm, 3),
  },
  { key: "remark", label: "Remark" },
  { key: "createdBy", label: "Created By" },
  { key: "updatedBy", label: "Updated By" },
];

// ── Tab 2: Slicing Done ────────────────────────────────────────────────
export const SLICING_DONE_COLUMNS: readonly EnterpriseTableColumn<any>[] = [
  storageSerialColumn,
  { key: "slicingDate", label: "Slicing Date" },
  { key: "itemName", label: "Item Name" },
  { key: "subCategory", label: "Sub Category" },
  { key: "logCode", label: "Log Code" },
  { key: "bundleNumber", label: "Bundle Number" },
  { key: "palletNo", label: "Pallet No" },
  { key: "length", label: "Length" },
  { key: "width", label: "Width" },
  { key: "thickness", label: "Thickness" },
  { key: "receivedLeaves", label: "Received Leaves" },
  { key: "availableLeaves", label: "Available Leaves" },
  {
    key: "sqm",
    label: "SQM",
    renderCell: (row) => formatSlicingNumber(row.sqm, 2),
  },
  {
    key: "sqf",
    label: "SQF",
    renderCell: (row) => formatSlicingNumber(row.sqf, 2),
  },
  {
    key: "totalSqMeter",
    label: "Total Sq Meter",
    renderCell: (row) => formatSlicingNumber(row.totalSqMeter, 2),
  },
  { key: "remark", label: "Remark" },
  { key: "createdBy", label: "Created By" },
  { key: "updatedBy", label: "Updated By" },
];

// ── Tab 3: Slicing History ─────────────────────────────────────────────
export const SLICING_HISTORY_COLUMNS: readonly EnterpriseTableColumn<any>[] = [
  storageSerialColumn,
  { key: "issuedDate", label: "Issued Date" },
  { key: "slicingDate", label: "Slicing Date" },
  { key: "itemName", label: "Item Name" },
  { key: "subCategory", label: "Sub Category" },
  { key: "logCode", label: "Log Code" },
  { key: "bundleNumber", label: "Bundle Number" },
  { key: "palletNo", label: "Pallet No" },
  { key: "length", label: "Length" },
  { key: "width", label: "Width" },
  { key: "thickness", label: "Thickness" },
  { key: "noOfLeaves", label: "No of Leaves" },
  {
    key: "sqm",
    label: "SQM",
    renderCell: (row) => formatSlicingNumber(row.sqm, 2),
  },
  {
    key: "sqf",
    label: "SQF",
    renderCell: (row) => formatSlicingNumber(row.sqf, 2),
  },
  {
    key: "totalSqMeter",
    label: "Total Sq Meter",
    renderCell: (row) => formatSlicingNumber(row.totalSqMeter, 2),
  },
  { key: "remark", label: "Remark" },
  { key: "createdBy", label: "Created By" },
  { key: "updatedBy", label: "Updated By" },
];

// ── Tab 4: Rejected Slicing ────────────────────────────────────────────
export const SLICING_REJECTED_COLUMNS: readonly EnterpriseTableColumn<any>[] = [
  storageSerialColumn,
  { key: "rejectedDate", label: "Rejected Date" },
  { key: "slicingDate", label: "Slicing Date" },
  { key: "itemName", label: "Item Name" },
  { key: "subCategory", label: "Sub Category" },
  { key: "logCode", label: "Log Code" },
  { key: "bundleNumber", label: "Bundle Number" },
  { key: "palletNo", label: "Pallet No" },
  { key: "length", label: "Length" },
  { key: "width", label: "Width" },
  { key: "thickness", label: "Thickness" },
  {
    key: "cbm",
    label: "CBM",
    renderCell: (row) => formatSlicingNumber(row.cbm, 3),
  },
  {
    key: "cbf",
    label: "CBF",
    renderCell: (row) => formatSlicingNumber(row.cbf, 3),
  },
  { key: "noOfLeaves", label: "No of Leaves" },
  {
    key: "sqm",
    label: "SQM",
    renderCell: (row) => formatSlicingNumber(row.sqm, 2),
  },
  { key: "remark", label: "Remark" },
  { key: "createdBy", label: "Created By" },
  { key: "updatedBy", label: "Updated By" },
];

