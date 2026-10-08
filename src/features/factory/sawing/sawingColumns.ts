import type { EnterpriseTableColumn } from "../../../components/data-display/EnterpriseDataTable";

// ── Issued Tab Columns ──────────────────────────────────────────────
// storage sr no., issue date, Item Name, Batch No, Length, Width, Height, Received CBM, Available CBM, remark, created by, updated by, action
export const SAWING_ISSUED_COLUMNS: readonly EnterpriseTableColumn<any>[] = [
  { key: "storageSrNo", label: "Storage Sr No." },
  { key: "issueDate", label: "Issue Date" },
  { key: "itemName", label: "Item Name" },
  { key: "batchNo", label: "Batch No" },
  { key: "length", label: "Length" },
  { key: "width", label: "Width" },
  { key: "height", label: "Height" },
  { key: "receivedCbm", label: "Received CBM" },
  { key: "availableCbm", label: "Available CBM" },
  { key: "remark", label: "Remark" },
  { key: "createdBy", label: "Created By" },
  { key: "updatedBy", label: "Updated By" },
] as const;

// ── Done Tab Columns ────────────────────────────────────────────────
// Storage Sr No., Issued Date, Item Name, Batch No, Length, Width, Height, CBM, CBF, Remark, Created By, Updated By, Action
export const SAWING_DONE_COLUMNS: readonly EnterpriseTableColumn<any>[] = [
  { key: "storageSrNo", label: "Storage Sr No." },
  { key: "issuedDate", label: "Issued Date" },
  { key: "itemName", label: "Item Name" },
  { key: "batchNo", label: "Batch No" },
  { key: "length", label: "Length" },
  { key: "width", label: "Width" },
  { key: "height", label: "Height" },
  { key: "cbm", label: "CBM" },
  { key: "cbf", label: "CBF" },
  { key: "remark", label: "Remark" },
  { key: "createdBy", label: "Created By" },
  { key: "updatedBy", label: "Updated By" },
] as const;

// ── History Tab Columns ─────────────────────────────────────────────
// Storage Sr No., Date, Item Name, Batch No, Length, Width, Height, CBM, CBF, Amount, Remark, Created By, Updated By
export const SAWING_HISTORY_COLUMNS: readonly EnterpriseTableColumn<any>[] = [
  { key: "storageSrNo", label: "Storage Sr No." },
  { key: "processDate", label: "Date" },
  { key: "itemName", label: "Item Name" },
  { key: "batchNo", label: "Batch No" },
  { key: "length", label: "Length" },
  { key: "width", label: "Width" },
  { key: "height", label: "Height" },
  { key: "cbm", label: "CBM" },
  { key: "cbf", label: "CBF" },
  { key: "amount", label: "Amount" },
  { key: "remark", label: "Remark" },
  { key: "createdBy", label: "Created By" },
  { key: "updatedBy", label: "Updated By" },
] as const;

// ── Rejected Tab Columns ────────────────────────────────────
export const SAWING_REJECTED_COLUMNS: readonly EnterpriseTableColumn<any>[] = [
  { key: "storageSrNo", label: "Storage Sr No." },
  { key: "processDate", label: "Date" },
  { key: "itemName", label: "Item Name" },
  { key: "batchNo", label: "Batch No" },
  { key: "length", label: "Length" },
  { key: "width", label: "Width" },
  { key: "height", label: "Height" },
  { key: "cbm", label: "CBM" },
  { key: "cbf", label: "CBF" },
  { key: "remark", label: "Remark" },
  { key: "createdBy", label: "Created By" },
  { key: "updatedBy", label: "Updated By" },
] as const;

// ── Available Tab Columns ───────────────────────────────────────────
export const SAWING_AVAILABLE_COLUMNS: readonly EnterpriseTableColumn<any>[] = [
  { key: "storageSrNo", label: "Storage Sr No." },
  { key: "processDate", label: "Date" },
  { key: "itemName", label: "Item Name" },
  { key: "batchNo", label: "Batch No" },
  { key: "length", label: "Length" },
  { key: "width", label: "Width" },
  { key: "height", label: "Height" },
  { key: "availableCbm", label: "Available CBM" },
  { key: "availableCbf", label: "Available CBF" },
  { key: "remark", label: "Remark" },
  { key: "createdBy", label: "Created By" },
  { key: "updatedBy", label: "Updated By" },
] as const;

export const SAWING_PROCESS_TABS = [
  { label: "Issue for Sawing", value: "issued" },
  { label: "Sawing Done", value: "done" },
  { label: "Sawing History", value: "history" },
  { label: "Rejected Sawing", value: "rejected" },
] as const;

export type SawingProcessTab = (typeof SAWING_PROCESS_TABS)[number]["value"];
