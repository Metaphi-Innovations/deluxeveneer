import {
  fetchItemCategoriesPaginated,
  fetchItemCategoryColumnDropdown,
  syncItemCategoryMasterToStorage,
  updateItemCategoryStatusApi,
} from "../api/itemCategoryMasterApi";
import { useMasterListingController } from "../../shared/useMasterListingController";

const ITEM_CATEGORY_SORT_FIELD_MAP: Record<string, string> = {
  categoryName: "name",
  name: "name",
  hsn: "hsn",
  hsnCode: "hsn",
  gst: "gst",
  gstNo: "gst",
  remark: "remarks",
  remarks: "remarks",
  status: "status",
  createdDate: "createdAt",
  createdAt: "createdAt",
  createdBy: "createdAt",
  updatedDate: "updatedAt",
  updatedAt: "updatedAt",
  editedBy: "updatedAt",
  updatedBy: "updatedAt",
};

export function useItemCategoryList() {
  return useMasterListingController({
    master: "itemCategory",
    sortFieldMap: ITEM_CATEGORY_SORT_FIELD_MAP,
    fetchPage: fetchItemCategoriesPaginated,
    fetchColumnDropdown: fetchItemCategoryColumnDropdown,
    onLoaded: syncItemCategoryMasterToStorage,
    updateStatus: updateItemCategoryStatusApi,
    statusErrorMessage: "Unable to update item category status.",
  });
}
