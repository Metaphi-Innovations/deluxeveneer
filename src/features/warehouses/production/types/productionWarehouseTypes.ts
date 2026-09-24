import type { EnterpriseTableColumn, EnterpriseTableRow } from "../../../../components/data-display/EnterpriseDataTable";

export type ProductionWarehouseTabSlug =
  | "raw-veneer"
  | "plywood"
  | "mdf"
  | "sample-sheets";

export const productionWarehouseTabs = [
  { label: "Raw Veneer", value: "raw-veneer" },
  { label: "Plywood", value: "plywood" },
  { label: "MDF", value: "mdf" },
  { label: "Sample Sheets", value: "sample-sheets" },
] as const;

export interface RawVeneerRow extends EnterpriseTableRow {
  inwardDate: string | Date;
  itemName: string;
  subCategory: string;
  length: string;
  width: string;
  thickness: string;
  noOfLeaves: string;
  sqm: string;
  sqf: string;
  grade: string;
  currency: string;
  amount: string;
  remark: string;
  inventorySlug?: string;
  inventoryRecordId?: string;
}

export const rawVeneerColumns: readonly EnterpriseTableColumn<RawVeneerRow>[] = [
  { key: "inwardDate", label: "Inward Date" },
  { key: "itemName", label: "Item Name" },
  { key: "subCategory", label: "Sub Category" },
  { key: "length", label: "Length" },
  { key: "width", label: "Width" },
  { key: "thickness", label: "Thickness" },
  { key: "noOfLeaves", label: "No of Leaves" },
  { key: "sqm", label: "SQM" },
  { key: "sqf", label: "SQF" },
  { key: "grade", label: "Grade" },
  { key: "currency", label: "Currency" },
  { key: "amount", label: "Amount" },
  { key: "remark", label: "Remark" },
];

export interface PlywoodRow extends EnterpriseTableRow {
  inwardDate: string | Date;
  itemName: string;
  subCategory: string;
  color: string;
  length: string;
  width: string;
  thickness: string;
  noOfSheets: string;
  sqm: string;
  sqf: string;
  amount: string;
  remark: string;
  inventorySlug?: string;
  inventoryRecordId?: string;
}

export const plywoodColumns: readonly EnterpriseTableColumn<PlywoodRow>[] = [
  { key: "inwardDate", label: "Inward Date" },
  { key: "itemName", label: "Item Name" },
  { key: "subCategory", label: "Sub Category" },
  { key: "color", label: "Color" },
  { key: "length", label: "Length" },
  { key: "width", label: "Width" },
  { key: "thickness", label: "Thickness" },
  { key: "noOfSheets", label: "No of Sheets" },
  { key: "sqm", label: "SQM" },
  { key: "sqf", label: "SQF" },
  { key: "amount", label: "Amount" },
  { key: "remark", label: "Remark" },
];

export interface MdfRow extends EnterpriseTableRow {
  inwardDate: string | Date;
  itemName: string;
  mdfType: string;
  length: string;
  width: string;
  thickness: string;
  noOfLeaves: string;
  sqm: string;
  sqf: string;
  currency: string;
  amount: string;
  remark: string;
  inventorySlug?: string;
  inventoryRecordId?: string;
}

export const mdfColumns: readonly EnterpriseTableColumn<MdfRow>[] = [
  { key: "inwardDate", label: "Inward Date" },
  { key: "itemName", label: "Item Name" },
  { key: "mdfType", label: "MDF Type" },
  { key: "length", label: "Length" },
  { key: "width", label: "Width" },
  { key: "thickness", label: "Thickness" },
  { key: "noOfLeaves", label: "No of Leaves" },
  { key: "sqm", label: "SQM" },
  { key: "sqf", label: "SQF" },
  { key: "currency", label: "Currency" },
  { key: "amount", label: "Amount" },
  { key: "remark", label: "Remarks" },
];

export interface SampleSheetTableRow extends EnterpriseTableRow {
  sampleNo: string;
  issueDate: Date | string;
  itemName: string;
  subCategory: string;
  color: string;
  length: string;
  width: string;
  thickness: string;
  availableQuantity: string;
  processRoute: string;
  currentStage: string;
  currentStatus: string;
}

export const sampleSheetColumns: readonly EnterpriseTableColumn<SampleSheetTableRow>[] = [
  { key: "sampleNo", label: "Sample No." },
  { key: "issueDate", label: "Issue Date" },
  { key: "itemName", label: "Item Name" },
  { key: "subCategory", label: "Sub Category" },
  { key: "color", label: "Color" },
  { key: "length", label: "Length" },
  { key: "width", label: "Width" },
  { key: "thickness", label: "Thickness" },
  { key: "availableQuantity", label: "No. of Leaves / Quantity" },
  { key: "processRoute", label: "Process Route / Type" },
  { key: "currentStage", label: "Current Stage" },
  { key: "currentStatus", label: "Current Status" },
];
