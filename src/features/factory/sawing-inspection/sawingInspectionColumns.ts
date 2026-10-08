import type { EnterpriseTableColumn } from "../../../components/data-display/EnterpriseDataTable";

export const SAWING_INSPECTION_PENDING_COLUMNS: readonly EnterpriseTableColumn<any>[] = [
  { key: "storageSrNo", label: "Storage Sr No." },
  { key: "issuedDate", label: "Issued Inspection Date" },
  { key: "sawingDate", label: "Sawing Date" },
  { key: "itemName", label: "Item Name" },
  { key: "subCategory", label: "Sub Category" },
  { key: "batchNo", label: "Batch No" },
  { key: "batchNoCode", label: "Batch No. Code" },
  { key: "length", label: "Length" },
  { key: "width", label: "Width" },
  { key: "thickness", label: "Thickness" },
  { key: "cbm", label: "CBM" },
  { key: "cbf", label: "CBF" },
  { key: "qcStatus", label: "Status" },
  { key: "remark", label: "Remark" },
  { key: "createdBy", label: "Created" },
  { key: "updatedBy", label: "Updated" },
] as const;

export const SAWING_INSPECTION_DONE_COLUMNS: readonly EnterpriseTableColumn<any>[] = [
  { key: "storageSrNo", label: "Storage Sr No." },
  { key: "issuedDate", label: "Issued Inspection Date" },
  { key: "sawingDate", label: "Sawing Date" },
  { key: "itemName", label: "Item Name" },
  { key: "subCategory", label: "Sub Category" },
  { key: "batchNo", label: "Batch No" },
  { key: "batchNoCode", label: "Batch No. Code" },
  { key: "length", label: "Length" },
  { key: "width", label: "Width" },
  { key: "thickness", label: "Thickness" },
  { key: "cbm", label: "CBM" },
  { key: "cbf", label: "CBF" },
  { key: "qcStatus", label: "Status" },
  { key: "remark", label: "Remark" },
  { key: "createdBy", label: "Created" },
  { key: "updatedBy", label: "Updated" },
] as const;

export const SAWING_INSPECTION_FAIL_COLUMNS: readonly EnterpriseTableColumn<any>[] = [
  { key: "storageSrNo", label: "Storage Sr No." },
  { key: "issuedDate", label: "Issued Inspection Date" },
  { key: "sawingDate", label: "Sawing Date" },
  { key: "itemName", label: "Item Name" },
  { key: "subCategory", label: "Sub Category" },
  { key: "batchNo", label: "Batch No" },
  { key: "batchNoCode", label: "Batch No. Code" },
  { key: "length", label: "Length" },
  { key: "width", label: "Width" },
  { key: "thickness", label: "Thickness" },
  { key: "cbm", label: "CBM" },
  { key: "cbf", label: "CBF" },
  { key: "qcStatus", label: "Status" },
  { key: "remark", label: "Remark" },
  { key: "createdBy", label: "Created" },
  { key: "updatedBy", label: "Updated" },
] as const;

export const SAWING_INSPECTION_TABS = [
  { label: "Inspection Pending", value: "issued" },
  { label: "Inspection Done", value: "done" },
  { label: "Inspection Fail", value: "failed" },
] as const;

export type SawingInspectionTab = (typeof SAWING_INSPECTION_TABS)[number]["value"];
