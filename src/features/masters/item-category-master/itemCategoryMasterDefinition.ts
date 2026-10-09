import type { MasterDefinition } from "../shared/types";
import { statusOptions } from "../shared/masterRecordHelpers";
import { getLiveMasterOptions, getStoredMasterRows } from "../shared/localMasterStore";

export function getItemCategoryMasterOptions() {
  return getLiveMasterOptions([], "item-category-master", "categoryName");
}

export const itemCategoryMasterOptions = getItemCategoryMasterOptions();

export const itemCategoryMasterDefinition: MasterDefinition = {
  slug: "item-category-master",
  title: "Item Category Master",
  gridColumns: 3,
  columns: [
    { key: "srNo", label: "Sr No" },
    { key: "categoryName", label: "Category Name" },
    { key: "hsn", label: "HSN Code" },
    { key: "gst", label: "GST%" },
    { key: "remark", label: "Remark" },
    { key: "status", label: "Status" },
    { key: "createdBy", label: "Created By" },
    { key: "editedBy", label: "Updated By" },
    { key: "createdDate", label: "Created Date" },
    { key: "updatedDate", label: "Updated Date" },
  ],
  filters: [
    { key: "categoryName", label: "Category Name", options: itemCategoryMasterOptions },
    { key: "hsn", label: "HSN Code", options: getLiveMasterOptions([], "hsn-master", "hsnCode") },
    { key: "gst", label: "GST%", options: getLiveMasterOptions([], "hsn-master", "gstPercentage") },
    { key: "status", label: "Status", options: statusOptions },
  ],
  fields: [
    { key: "categoryName", label: "Category Name", type: "text" },
    { key: "hsn", label: "HSN Code", type: "select", options: getLiveMasterOptions([], "hsn-master", "hsnCode") },
    {
      key: "gst",
      label: "GST%",
      type: "select",
      options: getLiveMasterOptions([], "hsn-master", "gstPercentage"),
      readOnly: true,
      autoFillFrom: {
        rows: getStoredMasterRows("hsn-master"),
        sourceSlug: "hsn-master",
        sourceKey: "hsn",
        sourceMatchKey: "hsnCode",
        sourceValueKey: "gstPercentage",
      },
    },
    { key: "remark", label: "Remark", type: "text" },
    { key: "status", label: "Status", type: "select", options: statusOptions },
  ],
  rows: [],
};
