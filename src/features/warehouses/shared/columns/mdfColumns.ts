import type { EnterpriseTableColumn } from "../../../../components/data-display/EnterpriseDataTable";
import type { WarehouseInventoryRow } from "../warehouseTableData";

export const warehouseAMdfColumns: readonly EnterpriseTableColumn<WarehouseInventoryRow>[] =
  [
    { key: "inwardDate", label: "Inward Date" },
    { key: "invoiceNo", label: "Invoice No" },
    { key: "supplierName", label: "Supplier Name" },
    { key: "itemName", label: "Item Name" },
    { key: "mdfType", label: "MDF Type" },
    { key: "length", label: "Length" },
    { key: "width", label: "Width" },
    { key: "thickness", label: "Thickness" },
    { key: "noOfLeaves", label: "No of Leaves" },
    { key: "totalSqm", label: "SQM" },
    { key: "totalSqf", label: "SQF" },
    { key: "currency", label: "Currency" },
    { key: "amount", label: "Amount" },
    { key: "remark", label: "Remarks" },
  ];

export const warehouseCMdfColumns: readonly EnterpriseTableColumn<WarehouseInventoryRow>[] =
  [
    { key: "inwardDate", label: "Inward Date" },
    { key: "itemName", label: "Item Name" },
    { key: "mdfType", label: "MDF Type" },
    { key: "length", label: "Length" },
    { key: "width", label: "Width" },
    { key: "thickness", label: "Thickness" },
    { key: "noOfLeaves", label: "No of Leaves" },
    { key: "totalSqm", label: "SQM" },
    { key: "totalSqf", label: "SQF" },
    { key: "currency", label: "Currency" },
    { key: "amount", label: "Amount" },
    { key: "remark", label: "Remarks" },
  ];
