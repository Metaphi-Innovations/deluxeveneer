import type { MasterDefinition } from "../shared/types";
import { statusOptions } from "../shared/masterRecordHelpers";
import { getLiveMasterOptions } from "../shared/localMasterStore";

export function getItemSubCategoryMasterOptions() {
  return getLiveMasterOptions([], "item-sub-category-master", "itemSubCategory");
}

export const itemSubCategoryMasterOptions = getItemSubCategoryMasterOptions();

export const itemSubCategoryMasterDefinition: MasterDefinition = {
  slug: "item-sub-category-master",
  title: "Item Sub-Category Master",
  gridColumns: 3,
  columns: [
    { key: "srNo", label: "Sr No" },
    { key: "itemSubCategory", label: "Item Sub Category" },
    { key: "category", label: "Category" },
    { key: "status", label: "Status" },
    { key: "createdBy", label: "Created By" },
    { key: "editedBy", label: "Updated By" },
    { key: "createdDate", label: "Created Date" },
    { key: "updatedDate", label: "Updated Date" },
  ],
  filters: [
    { key: "category", label: "Category", options: getLiveMasterOptions([], "item-sub-category-master", "category") },
    { key: "status", label: "Status", options: statusOptions },
  ],
  fields: [
    { key: "itemSubCategory", label: "Item Sub Category", type: "text" },
    { key: "category", label: "Category", type: "select", options: getLiveMasterOptions([], "item-category-master", "categoryName") },
    { key: "status", label: "Status", type: "select", options: statusOptions },
  ],
  rows: [],
};
