import {
  fetchHsnColumnDropdown,
  fetchHsnsPaginated,
  syncHsnMasterToStorage,
  updateHsnStatusApi,
} from "../api/hsnMasterApi";
import { useMasterListingController } from "../../shared/useMasterListingController";

const HSN_SORT_FIELD_MAP: Record<string, string> = {
  hsnCode: "code",
  code: "code",
  hsnCodeDescription: "description",
  description: "description",
  status: "status",
  createdDate: "createdAt",
  createdAt: "createdAt",
  createdBy: "createdAt",
  updatedDate: "updatedAt",
  updatedAt: "updatedAt",
  editedBy: "updatedAt",
  updatedBy: "updatedAt",
};

export function useHsnList() {
  return useMasterListingController({
    master: "hsn",
    sortFieldMap: HSN_SORT_FIELD_MAP,
    fetchPage: fetchHsnsPaginated,
    fetchColumnDropdown: fetchHsnColumnDropdown,
    onLoaded: syncHsnMasterToStorage,
    updateStatus: updateHsnStatusApi,
    statusErrorMessage: "Unable to update HSN status.",
  });
}
