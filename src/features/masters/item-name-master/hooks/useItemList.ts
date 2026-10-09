import {
  fetchItemColumnDropdown,
  fetchItemsPaginated,
  syncItemMasterToStorage,
  updateItemStatusApi,
} from "../api/itemMasterApi";
import { useMasterListingController } from "../../shared/useMasterListingController";

const ITEM_SORT_FIELD_MAP: Record<string, string> = {
  itemName: "name",
  name: "name",
  itemCode: "factoryItemCode",
  factoryItemCode: "factoryItemCode",
  category: "category",
  categoryName: "category",
  subCategory: "subCategory",
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

export function useItemList() {
  return useMasterListingController({
    master: "item",
    sortFieldMap: ITEM_SORT_FIELD_MAP,
    fetchPage: fetchItemsPaginated,
    fetchColumnDropdown: fetchItemColumnDropdown,
    onLoaded: syncItemMasterToStorage,
    updateStatus: updateItemStatusApi,
    statusErrorMessage: "Unable to update item status.",
  });
}
