import type { EnterpriseTableColumn } from "../../../../components/data-display/EnterpriseDataTable";
import type { WarehouseInventoryRow } from "../warehouseTableData";

export const warehouseAPlywoodColumns: readonly EnterpriseTableColumn<WarehouseInventoryRow>[] =
  [
    { key: "inwardDate", label: "Inward Date" },
    { key: "invoiceNo", label: "Invoice No" },
    { key: "supplierName", label: "Supplier Name" },
    { key: "subCategory", label: "Sub Category" },
    { key: "itemName", label: "Item Name" },
    { key: "color", label: "Color" },
    { key: "length", label: "Length" },
    { key: "width", label: "Width" },
    { key: "thickness", label: "Thickness" },
    { key: "totalNoOfSheets", label: "No of Sheets" },
    { key: "totalSqm", label: "SQM" },
    { key: "totalSqf", label: "SQF" },
    { key: "amount", label: "Amount" },
    { key: "remark", label: "Remark" },
  ];

export const warehouseCPlywoodColumns: readonly EnterpriseTableColumn<WarehouseInventoryRow>[] =
  [
    { key: "inwardDate", label: "Inward Date" },
    { key: "itemName", label: "Item Name" },
    { key: "subCategory", label: "Sub Category" },
    { key: "color", label: "Color" },
    { key: "length", label: "Length" },
    { key: "width", label: "Width" },
    { key: "thickness", label: "Thickness" },
    { key: "totalNoOfSheets", label: "No of Sheets" },
    { key: "totalSqm", label: "SQM" },
    { key: "totalSqf", label: "SQF" },
    { key: "amount", label: "Amount" },
    { key: "remark", label: "Remark" },
  ];
