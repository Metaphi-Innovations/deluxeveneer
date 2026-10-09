import type { EnterpriseTableColumn } from "../../../../components/data-display/EnterpriseDataTable";
import type { WarehouseInventoryRow } from "../warehouseTableData";

export const warehouseAConsumablesColumns: readonly EnterpriseTableColumn<WarehouseInventoryRow>[] =
  [
    { key: "inwardSrNo", label: "Inward Sr No" },
    { key: "inwardType", label: "Inward Type" },
    { key: "inwardDate", label: "Inward Date" },
    { key: "subCategory", label: "Category" },
    { key: "totalUnits", label: "Quantity" },
    { key: "availableUnits", label: "Available Quantity" },
    { key: "currency", label: "Currency" },
    { key: "amount", label: "Amount" },
    { key: "remark", label: "Remark" },
  ];
