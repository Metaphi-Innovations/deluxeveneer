import type { EnterpriseTableColumn, EnterpriseTableRow } from "../../../../components/data-display/EnterpriseDataTable";

export type ProductionWarehouseTabSlug =
  | "raw-veneer"
  | "plywood"
  | "mdf"
  | "consumables"
  | "sawing"
  | "sample-sheets";

export const productionWarehouseTabs = [
  { label: "Raw Veneer", value: "raw-veneer" },
  { label: "Plywood", value: "plywood" },
  { label: "MDF", value: "mdf" },
  { label: "Consumables", value: "consumables" },
  { label: "Sawing", value: "sawing" },
  { label: "Sample Sheets", value: "sample-sheets" },
] as const;

export interface RawVeneerRow extends EnterpriseTableRow {
  productionSrNo: string;
  storageSrNo: string;
  inwardDate: string | Date;
  inwardItemCode: string;
  itemName: string;
  factoryCode: string;
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
  totalAmount: string;
  remark: string;
  inventorySlug?: string;
  inventoryRecordId?: string;
  updatedBy: string;
}

export const rawVeneerColumns: readonly EnterpriseTableColumn<RawVeneerRow>[] = [
  { key: "storageSrNo", label: "Storage Sr No" },
  { key: "inwardDate", label: "Inward Date" },
  { key: "inwardItemCode", label: "Inward Item Code" },
  { key: "itemName", label: "Item Name" },
  { key: "factoryCode", label: "Factory Code" },
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
  { key: "totalAmount", label: "Total Amount" },
  { key: "remark", label: "Remark" },
  { key: "updatedBy", label: "Updated By" },
];

export interface PlywoodRow extends EnterpriseTableRow {
  productionSrNo: string;
  storageSrNo: string;
  inwardDate: string | Date;
  inwardItemCode: string;
  itemName: string;
  factoryCode: string;
  subCategory: string;
  color: string;
  length: string;
  width: string;
  thickness: string;
  noOfSheets: string;
  sqm: string;
  sqf: string;
  grade: string;
  currency: string;
  amount: string;
  totalAmount: string;
  remark: string;
  inventorySlug?: string;
  inventoryRecordId?: string;
  updatedBy: string;
}

export const plywoodColumns: readonly EnterpriseTableColumn<PlywoodRow>[] = [
  { key: "storageSrNo", label: "Storage Sr No" },
  { key: "inwardDate", label: "Inward Date" },
  { key: "inwardItemCode", label: "Inward Item Code" },
  { key: "itemName", label: "Item Name" },
  { key: "factoryCode", label: "Factory Code" },
  { key: "subCategory", label: "Sub Category" },
  { key: "color", label: "Color" },
  { key: "length", label: "Length" },
  { key: "width", label: "Width" },
  { key: "thickness", label: "Thickness" },
  { key: "noOfSheets", label: "No of Sheets" },
  { key: "sqm", label: "SQM" },
  { key: "sqf", label: "SQF" },
  { key: "grade", label: "Grade" },
  { key: "currency", label: "Currency" },
  { key: "amount", label: "Amount" },
  { key: "totalAmount", label: "Total Amount" },
  { key: "remark", label: "Remark" },
  { key: "updatedBy", label: "Updated By" },
];

export interface MdfRow extends EnterpriseTableRow {
  productionSrNo: string;
  storageSrNo: string;
  inwardDate: string | Date;
  inwardItemCode: string;
  itemName: string;
  factoryCode: string;
  mdfType: string;
  length: string;
  width: string;
  thickness: string;
  noOfSheets: string;
  sqm: string;
  sqf: string;
  grade: string;
  currency: string;
  amount: string;
  totalAmount: string;
  remark: string;
  inventorySlug?: string;
  inventoryRecordId?: string;
  updatedBy: string;
}

export const mdfColumns: readonly EnterpriseTableColumn<MdfRow>[] = [
  { key: "storageSrNo", label: "Storage Sr No" },
  { key: "inwardDate", label: "Inward Date" },
  { key: "inwardItemCode", label: "Inward Item Code" },
  { key: "itemName", label: "Item Name" },
  { key: "factoryCode", label: "Factory Code" },
  { key: "mdfType", label: "MDF Type" },
  { key: "length", label: "Length" },
  { key: "width", label: "Width" },
  { key: "thickness", label: "Thickness" },
  { key: "noOfSheets", label: "No of Sheets" },
  { key: "sqm", label: "SQM" },
  { key: "sqf", label: "SQF" },
  { key: "grade", label: "Grade" },
  { key: "currency", label: "Currency" },
  { key: "amount", label: "Amount" },
  { key: "totalAmount", label: "Total Amount" },
  { key: "remark", label: "Remark" },
  { key: "updatedBy", label: "Updated By" },
];

export interface ConsumablesRow extends EnterpriseTableRow {
  productionSrNo: string;
  storageSrNo: string;
  inwardDate: string | Date;
  inwardItemCode: string;
  itemName: string;
  factoryCode: string;
  receivedQuantity: string;
  availableQuantity: string;
  currency: string;
  amount: string;
  totalAmount: string;
  remark: string;
  inventorySlug?: string;
  inventoryRecordId?: string;
  updatedBy: string;
}

export const consumablesColumns: readonly EnterpriseTableColumn<ConsumablesRow>[] =
  [
    { key: "storageSrNo", label: "Storage Sr No" },
    { key: "inwardDate", label: "Inward Date" },
    { key: "inwardItemCode", label: "Inward Item Code" },
    { key: "itemName", label: "Item Name" },
    { key: "factoryCode", label: "Factory Code" },
    { key: "receivedQuantity", label: "Received Qty" },
    { key: "availableQuantity", label: "Available Qty" },
    { key: "currency", label: "Currency" },
    { key: "amount", label: "Amount" },
    { key: "totalAmount", label: "Total Amount" },
    { key: "remark", label: "Remark" },
    { key: "updatedBy", label: "Updated By" },
  ];

export interface SawingRow extends EnterpriseTableRow {
  productionSrNo: string;
  storageSrNo: string;
  inwardDate: string | Date;
  itemName: string;
  subCategory: string;
  color: string;
  batchNo: string;
  length: string;
  width: string;
  height: string;
  cbm: string;
  cbf: string;
  amount: string;
  totalAmount: string;
  remark: string;
  inventorySlug?: string;
  inventoryRecordId?: string;
  updatedBy: string;
}

export const sawingColumns: readonly EnterpriseTableColumn<SawingRow>[] = [
  { key: "storageSrNo", label: "Storage Sr No" },
  { key: "inwardDate", label: "Process Date" },
  { key: "itemName", label: "Item Name" },
  { key: "subCategory", label: "Sub Category" },
  { key: "color", label: "Color" },
  { key: "batchNo", label: "Batch No" },
  { key: "length", label: "Length" },
  { key: "width", label: "Width" },
  { key: "height", label: "Thickness" },
  { key: "cbm", label: "CBM" },
  { key: "cbf", label: "CBF" },
  { key: "amount", label: "Amount" },
  { key: "totalAmount", label: "Total Amount" },
  { key: "remark", label: "Remark" },
  { key: "updatedBy", label: "Updated By" },
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
