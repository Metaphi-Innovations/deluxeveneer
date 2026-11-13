import type { EnterpriseTableColumn, EnterpriseTableRow } from "../../../../components/data-display/EnterpriseDataTable";
import { renderGradeBadge } from "../../../factory/sawing-inspection/sawingInspectionColumns";
import { formatInspectionDateDDMMYY } from "../../../factory/inspection/inspectionListingColumns";

export type ProductionWarehouseTabSlug =
  | "raw-veneer"
  | "plywood"
  | "mdf"
  | "sawing"
  | "sample-sheets";

export const productionWarehouseTabs = [
  { label: "Raw Veneer", value: "raw-veneer" },
  { label: "Plywood", value: "plywood" },
  { label: "MDF", value: "mdf" },
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
  batchNo?: string;
  length: string;
  width: string;
  thickness: string;
  noOfLeaves: string;
  receivedNoOfLeaves?: string;
  availableNoOfLeaves?: string;
  sqm: string;
  receivedSqm?: string;
  availableSqm?: string;
  sqf: string;
  receivedSqf?: string;
  availableSqf?: string;
  grade: string;
  currency: string;
  amount: string;
  totalAmount: string;
  remark: string;
  inventorySlug?: string;
  inventoryRecordId?: string;
  createdBy: string;
  updatedBy: string;
}

export const rawVeneerColumns: readonly EnterpriseTableColumn<RawVeneerRow>[] = [
  { key: "storageSrNo", label: "Storage Sr No" },
  { key: "itemName", label: "Item Name" },
  { key: "factoryCode", label: "Factory Code" },
  { key: "subCategory", label: "Sub Category" },
  { key: "batchNo", label: "Batch No" },
  { key: "length", label: "Length" },
  { key: "width", label: "Width" },
  { key: "thickness", label: "Thickness" },
  { key: "receivedNoOfLeaves", label: "Received No of Leaves" },
  {
    key: "availableNoOfLeaves",
    label: "Available No of Leaves",
    filterable: false,
  },
  { key: "receivedSqm", label: "Received SQM" },
  { key: "availableSqm", label: "Available SQM", filterable: false },
  { key: "receivedSqf", label: "Received SQF" },
  { key: "availableSqf", label: "Available SQF", filterable: false },
  { key: "grade", label: "Grade" },
  { key: "remark", label: "Remark" },
  { key: "createdBy", label: "Created By" },
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
  receivedNoOfSheets?: string;
  availableNoOfSheets?: string;
  sqm: string;
  receivedSqm?: string;
  availableSqm?: string;
  sqf: string;
  receivedSqf?: string;
  availableSqf?: string;
  grade: string;
  currency: string;
  amount: string;
  totalAmount: string;
  remark: string;
  inventorySlug?: string;
  inventoryRecordId?: string;
  createdBy: string;
  updatedBy: string;
}

export const plywoodColumns: readonly EnterpriseTableColumn<PlywoodRow>[] = [
  { key: "storageSrNo", label: "Storage Sr No" },
  { key: "itemName", label: "Item Name" },
  { key: "factoryCode", label: "Factory Code" },
  { key: "subCategory", label: "Sub Category" },
  { key: "color", label: "Color" },
  { key: "length", label: "Length" },
  { key: "width", label: "Width" },
  { key: "thickness", label: "Thickness" },
  { key: "receivedNoOfSheets", label: "Received No of Sheets" },
  {
    key: "availableNoOfSheets",
    label: "Available No of Sheets",
    filterable: false,
  },
  { key: "receivedSqm", label: "Received SQM" },
  { key: "availableSqm", label: "Available SQM", filterable: false },
  { key: "receivedSqf", label: "Received SQF" },
  { key: "availableSqf", label: "Available SQF", filterable: false },
  { key: "grade", label: "Grade" },
  { key: "remark", label: "Remark" },
  { key: "createdBy", label: "Created By" },
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
  receivedNoOfSheets?: string;
  availableNoOfSheets?: string;
  sqm: string;
  receivedSqm?: string;
  availableSqm?: string;
  sqf: string;
  receivedSqf?: string;
  availableSqf?: string;
  grade: string;
  currency: string;
  amount: string;
  totalAmount: string;
  remark: string;
  inventorySlug?: string;
  inventoryRecordId?: string;
  createdBy: string;
  updatedBy: string;
}

export const mdfColumns: readonly EnterpriseTableColumn<MdfRow>[] = [
  { key: "storageSrNo", label: "Storage Sr No" },
  { key: "itemName", label: "Item Name" },
  { key: "factoryCode", label: "Factory Code" },
  { key: "mdfType", label: "MDF Type" },
  { key: "length", label: "Length" },
  { key: "width", label: "Width" },
  { key: "thickness", label: "Thickness" },
  { key: "receivedNoOfSheets", label: "Received No of Sheets" },
  {
    key: "availableNoOfSheets",
    label: "Available No of Sheets",
    filterable: false,
  },
  { key: "receivedSqm", label: "Received SQM" },
  { key: "availableSqm", label: "Available SQM", filterable: false },
  { key: "receivedSqf", label: "Received SQF" },
  { key: "availableSqf", label: "Available SQF", filterable: false },
  { key: "grade", label: "Grade" },
  { key: "remark", label: "Remark" },
  { key: "createdBy", label: "Created By" },
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
  createdBy: string;
  updatedBy: string;
}

export const consumablesColumns: readonly EnterpriseTableColumn<ConsumablesRow>[] =
  [
    { key: "storageSrNo", label: "Storage Sr No" },
    { key: "itemName", label: "Item Name" },
    { key: "factoryCode", label: "Factory Code" },
    { key: "receivedQuantity", label: "Received Qty" },
    { key: "availableQuantity", label: "Available Qty" },
    { key: "remark", label: "Remark" },
    { key: "createdBy", label: "Created By" },
    { key: "updatedBy", label: "Updated By" },
  ];

export interface SawingRow extends EnterpriseTableRow {
  storageSrNo: string;
  inspectionDate: string | Date;
  sawingDate: string | Date;
  itemName: string;
  subCategory: string;
  grade: string;
  batchNo: string;
  batchNoCode: string;
  length: string;
  width: string;
  thickness: string;
  cbm: string;
  cft?: string;
  cbf: string;
  productionWarehouse: string;
  remark: string;
  createdBy: string;
  updatedBy: string;
  createdAt?: string | Date | undefined;
  updatedAt?: string | Date | undefined;
  inventorySlug?: string;
  inventoryRecordId?: string;
}

export const sawingColumns: readonly EnterpriseTableColumn<SawingRow>[] = [
  { key: "storageSrNo", label: "Storage Sr No." },
  {
    key: "inspectionDate",
    label: "Inspection Date",
    renderCell: (row) => formatInspectionDateDDMMYY(row.inspectionDate),
  },
  {
    key: "sawingDate",
    label: "Sawing Date",
    renderCell: (row) => formatInspectionDateDDMMYY(row.sawingDate),
  },
  { key: "itemName", label: "Item Name" },
  { key: "subCategory", label: "Sub Category" },
  {
    key: "grade",
    label: "Grade",
    renderCell: (row) => renderGradeBadge(row.grade),
  },
  { key: "batchNo", label: "Batch No." },
  { key: "length", label: "Length" },
  { key: "width", label: "Width" },
  { key: "thickness", label: "Thickness" },
  { key: "cbm", label: "CBM" },
  { key: "cft", label: "CFT", renderCell: (row) => row.cft || row.cbf || "-" },
  { key: "productionWarehouse", label: "Production Warehouse" },
  { key: "remark", label: "Remark" },
  { key: "createdBy", label: "Created By" },
  { key: "updatedBy", label: "Updated By" },
];

export interface SampleSheetTableRow extends EnterpriseTableRow {
  groupNo: string;
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
  { key: "groupNo", label: "Group No." },
  { key: "issueDate", label: "Issue Date" },
  { key: "itemName", label: "Item Name" },
  { key: "subCategory", label: "Sub Category" },
  { key: "color", label: "Color" },
  { key: "length", label: "Length" },
  { key: "width", label: "Width" },
  { key: "thickness", label: "Thickness" },
  { key: "availableQuantity", label: "No. of Leaves / Quantity" },
  { key: "processRoute", label: "Process Route / Type" },
  { key: "currentStage", label: "Current Process" },
  { key: "currentStatus", label: "Process Status" },
];
