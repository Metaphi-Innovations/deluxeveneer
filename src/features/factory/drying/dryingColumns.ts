import type { EnterpriseTableColumn } from "../../../components/data-display/EnterpriseDataTable";

export type DryingProcessTab = "issued" | "done" | "history" | "rejected";

export const DRYING_PROCESS_TABS = [
  { label: "Issued for Drying", value: "issued" },
  { label: "Drying Done", value: "done" },
  { label: "Drying History", value: "history" },
  { label: "Rejected Drying", value: "rejected" },
] as const;

export function formatDryingNumber(value: unknown, decimals = 2): string {
  if (value === null || value === undefined || value === "") return "-";
  const num = Number(value);
  if (!Number.isFinite(num)) return String(value);
  return num.toFixed(decimals);
}

export function formatDryingStorageSerial(value: unknown): string {
  const original = String(value ?? "").trim();
  if (!original || original === "null" || original === "undefined") return "-";
  return original;
}

const storageSerialColumn: EnterpriseTableColumn<any> = {
  key: "storageSrNo",
  label: "Storage Sr No.",
  renderCell: (row) => formatDryingStorageSerial(row.storageSrNo),
};

// ── Tab 1: Issued for Drying ──────────────────────────────────────────
export const DRYING_ISSUED_COLUMNS: readonly EnterpriseTableColumn<any>[] = [
  storageSerialColumn,
  { key: "issuedDate", label: "Issue Date" },
  { key: "itemName", label: "Item Name" },
  { key: "subCategory", label: "Sub Category" },
  { key: "logCode", label: "Log Code" },
  { key: "bundleNumber", label: "Bundle Number" },
  { key: "palletNo", label: "Pallet No" },
  { key: "length", label: "Length" },
  { key: "width", label: "Width" },
  { key: "thickness", label: "Thickness" },
  { key: "receivedLeaves", label: "Received No. of Leaves" },
  { key: "availableLeaves", label: "Available No. of Leaves" },
  {
    key: "receivedSqm",
    label: "Received SQM",
    renderCell: (row) => formatDryingNumber(row.receivedSqm, 3),
  },
  {
    key: "availableSqm",
    label: "Available SQM",
    renderCell: (row) => formatDryingNumber(row.availableSqm, 3),
  },
  { key: "remark", label: "Remark" },
  { key: "createdBy", label: "Created By" },
  { key: "updatedBy", label: "Updated By" },
];

// ── Tab 2: Drying Done ────────────────────────────────────────────────
export const DRYING_DONE_COLUMNS: readonly EnterpriseTableColumn<any>[] = [
  storageSerialColumn,
  { key: "dryingDate", label: "Drying Date" },
  { key: "issuedForInspectionDate", label: "Issued for Inspection Date" },
  { key: "itemName", label: "Item Name" },
  { key: "subCategory", label: "Sub Category" },
  { key: "logCode", label: "Log Code" },
  { key: "bundleNumber", label: "Bundle Number" },
  { key: "palletNo", label: "Pallet No" },
  { key: "length", label: "Length" },
  { key: "width", label: "Width" },
  { key: "thickness", label: "Thickness" },
  { key: "noOfLeaves", label: "No. of Leaves" },
  { key: "availableLeaves", label: "Available Leaves" },
  {
    key: "totalSqMeter",
    label: "Total Sq Meter",
    renderCell: (row) => formatDryingNumber(row.totalSqMeter, 3),
  },
  {
    key: "sqm",
    label: "SQM",
    renderCell: (row) => formatDryingNumber(row.sqm, 3),
  },
  {
    key: "sqf",
    label: "SQF",
    renderCell: (row) => formatDryingNumber(row.sqf, 3),
  },
  { key: "remark", label: "Remark" },
  { key: "createdBy", label: "Created By" },
  { key: "updatedBy", label: "Updated By" },
];

// ── Tab 3: Drying History ─────────────────────────────────────────────
export const DRYING_HISTORY_COLUMNS: readonly EnterpriseTableColumn<any>[] = [
  storageSerialColumn,
  { key: "issuedDryingDate", label: "Issued Drying Date" },
  { key: "dryingDate", label: "Drying Date" },
  { key: "itemName", label: "Item Name" },
  { key: "subCategory", label: "Sub Category" },
  { key: "logCode", label: "Log Code" },
  { key: "bundleNumber", label: "Bundle Number" },
  { key: "palletNo", label: "Pallet No" },
  { key: "length", label: "Length" },
  { key: "width", label: "Width" },
  { key: "thickness", label: "Thickness" },
  { key: "noOfLeaves", label: "No. of Leaves" },
  {
    key: "totalSqMeter",
    label: "Total Sq Meter",
    renderCell: (row) => formatDryingNumber(row.totalSqMeter, 3),
  },
  {
    key: "sqm",
    label: "SQM",
    renderCell: (row) => formatDryingNumber(row.sqm, 3),
  },
  {
    key: "sqf",
    label: "SQF",
    renderCell: (row) => formatDryingNumber(row.sqf, 3),
  },
  { key: "remark", label: "Remark" },
  { key: "createdBy", label: "Created By" },
  { key: "updatedBy", label: "Updated By" },
];

// ── Tab 4: Rejected Drying ────────────────────────────────────────────
export const DRYING_REJECTED_COLUMNS: readonly EnterpriseTableColumn<any>[] = [
  storageSerialColumn,
  { key: "rejectedDate", label: "Rejected Date" },
  { key: "itemName", label: "Item Name" },
  { key: "subCategory", label: "Sub Category" },
  { key: "logCode", label: "Log Code" },
  { key: "bundleNumber", label: "Bundle Number" },
  { key: "palletNo", label: "Pallet No" },
  { key: "length", label: "Length" },
  { key: "width", label: "Width" },
  { key: "thickness", label: "Thickness" },
  { key: "rejectedLeaves", label: "No. of Leaves" },
  {
    key: "rejectedSqm",
    label: "Total Sq Meter",
    renderCell: (row) => formatDryingNumber(row.rejectedSqm, 3),
  },
  { key: "rejectionReason", label: "Rejection Reason" },
  { key: "remark", label: "Remark" },
  { key: "createdBy", label: "Created By" },
  { key: "updatedBy", label: "Updated By" },
];

