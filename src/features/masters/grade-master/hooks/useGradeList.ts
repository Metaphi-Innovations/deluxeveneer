import {
  fetchGradeColumnDropdown,
  fetchGradesPaginated,
  syncGradeMasterToStorage,
  updateGradeStatusApi,
} from "../api/gradeMasterApi";
import { useMasterListingController } from "../../shared/useMasterListingController";

const GRADE_SORT_FIELD_MAP: Record<string, string> = {
  gradeName: "name",
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

export function useGradeList() {
  return useMasterListingController({
    master: "grade",
    sortFieldMap: GRADE_SORT_FIELD_MAP,
    fetchPage: fetchGradesPaginated,
    fetchColumnDropdown: fetchGradeColumnDropdown,
    onLoaded: syncGradeMasterToStorage,
    updateStatus: updateGradeStatusApi,
    statusErrorMessage: "Unable to update grade status.",
  });
}
