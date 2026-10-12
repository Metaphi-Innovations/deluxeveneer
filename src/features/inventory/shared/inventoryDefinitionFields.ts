import type { MasterFieldDefinition } from "../../masters/shared";
import { uniqueInventoryOptions } from "./inventoryUtils";
import type { InventoryRecord } from "./types";

export const asInventoryDate = (value: string) => new Date(value);

export function createInventoryFormFields(
  rows: readonly InventoryRecord[],
): ReadonlyArray<MasterFieldDefinition> {
  return [
    {
      key: "inwardType",
      label: "Inward Type",
      type: "select",
      options: uniqueInventoryOptions(rows, "inwardType"),
    },
    {
      key: "inwardDate",
      label: "Inward Date",
      type: "date",
    },
    {
      key: "supplierName",
      label: "Supplier Name",
      type: "select",
      options: uniqueInventoryOptions(rows, "supplierName"),
    },
    {
      key: "invoiceNo",
      label: "Invoice No",
      type: "text",
    },
    {
      key: "currency",
      label: "Currency",
      type: "select",
      options: uniqueInventoryOptions(rows, "currency"),
    },
    {
      key: "exchangeRate",
      label: "Exchange Rate",
      type: "text",
    },
    {
      key: "shift",
      label: "Shift",
      type: "select",
      options: uniqueInventoryOptions(rows, "shift"),
    },
    {
      key: "workers",
      label: "Workers",
      type: "text",
    },
    {
      key: "noOfWorkingHours",
      label: "No of Working Hours",
      type: "text",
    },
    {
      key: "noOfTotalHours",
      label: "No of Total Hours",
      type: "text",
    },
  ];
}

const inventoryEditSelectKeys = new Set([
  "approvalStatus",
  "color",
  "currency",
  "inwardType",
  "itemName",
  "itemSrNo",
  "plywoodType",
  "subCategory",
  "supplierCode",
  "supplierItemName",
  "supplierName",
  "timberColor",
  "unitName",
  "veneerSrNo",
]);

export function createInventoryEditFields(
  columns: readonly { key: string; label: string }[],
  rows: readonly InventoryRecord[],
): ReadonlyArray<MasterFieldDefinition> {
  return columns.map<MasterFieldDefinition>((column) => {
    if (column.key === "inwardDate") {
      return {
        key: column.key,
        label: column.label,
        type: "date",
      };
    }

    if (inventoryEditSelectKeys.has(column.key)) {
      return {
        key: column.key,
        label: column.label,
        type: "select",
        options: uniqueInventoryOptions(rows, column.key),
      };
    }

    return {
      key: column.key,
      label: column.label,
      type: "text",
    };
  });
}
