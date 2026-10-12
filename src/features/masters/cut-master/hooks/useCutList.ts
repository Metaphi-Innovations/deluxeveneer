import {
  fetchCutColumnDropdown,
  fetchCutsPaginated,
  syncCutMasterToStorage,
  updateCutStatusApi,
} from "../api/cutMasterApi";
import { useMasterListingController } from "../../shared/useMasterListingController";

const CUT_SORT_FIELD_MAP: Record<string, string> = {
  cutName: "name",
  name: "name",
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

export function useCutList() {
  return useMasterListingController({
    master: "cut",
    sortFieldMap: CUT_SORT_FIELD_MAP,
    fetchPage: fetchCutsPaginated,
    fetchColumnDropdown: fetchCutColumnDropdown,
    onLoaded: syncCutMasterToStorage,
    updateStatus: updateCutStatusApi,
    statusErrorMessage: "Unable to update cut status.",
  });
}
