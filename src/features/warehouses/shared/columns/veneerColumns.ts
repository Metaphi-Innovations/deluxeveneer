import type { EnterpriseTableColumn } from "../../../../components/data-display/EnterpriseDataTable";
import type { WarehouseInventoryRow } from "../warehouseTableData";

export const warehouseAVeneerColumns: readonly EnterpriseTableColumn<WarehouseInventoryRow>[] =
  [
    { key: "inwardDate", label: "Inward Date" },
    { key: "invoiceNo", label: "Invoice No" },
    { key: "supplierName", label: "Supplier Name" },
    { key: "subCategory", label: "Sub Category" },
    { key: "itemName", label: "Item Name" },
    { key: "length", label: "Length" },
    { key: "width", label: "Width" },
    { key: "thickness", label: "Thickness" },
    { key: "noOfLeaves", label: "No of Leaves" },
    { key: "totalSqm", label: "SQM" },
    { key: "totalSqf", label: "SQF" },
    { key: "grade", label: "Grade" },
    { key: "currency", label: "Currency" },
    { key: "amount", label: "Amount" },
    { key: "remark", label: "Remark" },
  ];

export const warehouseCVeneerColumns: readonly EnterpriseTableColumn<WarehouseInventoryRow>[] =
  [
    { key: "inwardDate", label: "Inward Date" },
    { key: "itemName", label: "Item Name" },
    { key: "subCategory", label: "Sub Category" },
    { key: "length", label: "Length" },
    { key: "width", label: "Width" },
    { key: "thickness", label: "Thickness" },
    { key: "noOfLeaves", label: "No of Leaves" },
    { key: "totalSqm", label: "SQM" },
    { key: "totalSqf", label: "SQF" },
    { key: "grade", label: "Grade" },
    { key: "currency", label: "Currency" },
    { key: "amount", label: "Amount" },
    { key: "remark", label: "Remark" },
  ];
