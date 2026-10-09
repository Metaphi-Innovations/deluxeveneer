import {
  fetchItemSubCategoriesPaginated,
  fetchItemSubCategoryColumnDropdown,
  syncItemSubCategoryMasterToStorage,
  updateItemSubCategoryStatusApi,
} from "../api/itemSubCategoryMasterApi";
import { useMasterListingController } from "../../shared/useMasterListingController";

const ITEM_SUB_CATEGORY_SORT_FIELD_MAP: Record<string, string> = {
  itemSubCategory: "name",
  name: "name",
  category: "category",
  categoryName: "category",
  status: "status",
  createdDate: "createdAt",
  createdAt: "createdAt",
  createdBy: "createdAt",
  updatedDate: "updatedAt",
  updatedAt: "updatedAt",
  editedBy: "updatedAt",
  updatedBy: "updatedAt",
};

export function useItemSubCategoryList() {
  return useMasterListingController({
    master: "itemSubCategory",
    sortFieldMap: ITEM_SUB_CATEGORY_SORT_FIELD_MAP,
    fetchPage: fetchItemSubCategoriesPaginated,
    fetchColumnDropdown: fetchItemSubCategoryColumnDropdown,
    onLoaded: syncItemSubCategoryMasterToStorage,
    updateStatus: updateItemSubCategoryStatusApi,
    statusErrorMessage: "Unable to update item sub-category status.",
  });
}
