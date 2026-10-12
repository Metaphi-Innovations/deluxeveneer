import type { MasterDefinition, MasterRecord } from "../shared/types";
import { statusOptions } from "../shared/masterRecordHelpers";
import { getCachedItemMasterRows } from "./api/itemMasterApi";
import { itemCategoryMasterOptions } from "../item-category-master/itemCategoryMasterDefinition";
import { itemSubCategoryMasterOptions } from "../item-sub-category-master/itemSubCategoryMasterDefinition";

export function getItemMasterOptions() {
  return getCachedItemMasterRows()
    .filter((row) => String(row.status ?? "Active").toLowerCase() !== "inactive")
    .map((row) => String(row.itemName ?? ""))
    .filter(Boolean);
}

export const itemMasterOptions = getItemMasterOptions();

export function getItemMasterRecord(itemName: string) {
  const normalizedName = itemName.trim().toLowerCase();

  if (!normalizedName) {
    return null;
  }

  return (
    getCachedItemMasterRows().find(
      (row: MasterRecord) =>
        String(row.itemName ?? "").trim().toLowerCase() === normalizedName &&
        String(row.status ?? "Active").toLowerCase() !== "inactive",
    ) ?? null
  );
}

export const itemMasterDefinition: MasterDefinition = {
  slug: "item-name-master",
  title: "Item Name Master",
  gridColumns: 4,
  columns: [
    { key: "srNo", label: "Sr No" },
    { key: "itemName", label: "Item Name" },
    { key: "itemCode", label: "Factory Item Code" },
    { key: "category", label: "Category" },
    { key: "subCategory", label: "Sub Category" },
    { key: "remark", label: "Remark" },
    { key: "status", label: "Status" },
    { key: "createdBy", label: "Created By" },
    { key: "editedBy", label: "Updated By" },
    { key: "createdDate", label: "Created Date" },
    { key: "updatedDate", label: "Updated Date" },
  ],
  filters: [
    { key: "category", label: "Category", options: itemCategoryMasterOptions },
    { key: "subCategory", label: "Sub Category", options: itemSubCategoryMasterOptions },
    { key: "status", label: "Status", options: statusOptions },
  ],
  fields: [
    { key: "itemName", label: "Item Name", type: "text" },
    { key: "itemCode", label: "Factory Item Code", type: "text" },
    { key: "category", label: "Category", type: "select", options: [] },
    { key: "subCategory", label: "Sub Category", type: "select", options: [] },
    { key: "color", label: "Color", type: "select", options: [] },
    { key: "unitName", label: "Unit Name", type: "select", options: [] },
    { key: "hsn", label: "HSN Code", type: "select", options: [], readOnly: true },
    { key: "gst", label: "GST%", type: "select", options: [], readOnly: true },
    { key: "remark", label: "Remark", type: "text" },
    { key: "status", label: "Status", type: "select", options: statusOptions },
  ],
  rows: [],
};
