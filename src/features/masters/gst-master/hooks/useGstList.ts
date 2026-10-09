import {
  fetchGstColumnDropdown,
  fetchGstsPaginated,
  syncGstMasterToStorage,
  updateGstStatusApi,
} from "../api/gstMasterApi";
import { useMasterListingController } from "../../shared/useMasterListingController";

const GST_SORT_FIELD_MAP: Record<string, string> = {
  gstPercentage: "percentage",
  percentage: "percentage",
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

export function useGstList() {
  return useMasterListingController({
    master: "gst",
    sortFieldMap: GST_SORT_FIELD_MAP,
    fetchPage: fetchGstsPaginated,
    fetchColumnDropdown: fetchGstColumnDropdown,
    onLoaded: syncGstMasterToStorage,
    updateStatus: updateGstStatusApi,
    statusErrorMessage: "Unable to update GST status.",
  });
}
