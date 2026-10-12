import type { EnterpriseTableColumn } from "../../../components/data-display/EnterpriseDataTable";
import type { InventoryRecord } from "./types";

export type StockRecord = InventoryRecord & {
  amount: string;
  availableNoOfSheets: string;
  availableSqm: string;
  color: string;
  currency: string;
  exchangeRate: string;
  inwardDate: Date;
  inwardSrNo: string;
  inwardType: string;
  invoiceNo: string;
  itemName: string;
  itemSrNo: string;
  length: string;
  noOfTotalHours: string;
  noOfWorkingHours: string;
  palletNo: string;
  plywoodType: string;
  remark: string;
  shift: string;
  subCategory: string;
  supplierItemName: string;
  supplierName: string;
  thickness: string;
  totalNoOfSheets: string;
  totalSqm: string;
  width: string;
  workers: string;
};

export const stockColumns: ReadonlyArray<EnterpriseTableColumn<StockRecord>> = [
  { key: "inwardSrNo", label: "Inward Sr No" },
  { key: "inwardType", label: "Inward Type" },
  { key: "inwardDate", label: "Inward Date" },
  { key: "invoiceNo", label: "Invoice No" },
  { key: "itemSrNo", label: "Item Sr No" },
  { key: "supplierName", label: "Supplier Name" },
  { key: "supplierItemName", label: "Supplier Item Name" },
  { key: "itemName", label: "Item Name" },
  { key: "subCategory", label: "Sub Category" },
  { key: "color", label: "Color" },
  { key: "plywoodType", label: "Plywood Type" },
  { key: "palletNo", label: "Pallet No" },
  { key: "length", label: "Length" },
  { key: "width", label: "Width" },
  { key: "thickness", label: "Thickness" },
  { key: "totalNoOfSheets", label: "Total No of Sheets" },
  { key: "availableNoOfSheets", label: "Available No of Sheets" },
  { key: "totalSqm", label: "Total SQM" },
  { key: "availableSqm", label: "Available SQM" },
  { key: "currency", label: "Currency" },
  { key: "amount", label: "Amount" },
  { key: "remark", label: "Remark" },
];
