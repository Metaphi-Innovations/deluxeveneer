import {
  fetchDepartmentColumnDropdown,
  fetchDepartmentsPaginated,
  syncDepartmentMasterToStorage,
  updateDepartmentStatusApi,
} from "../api/departmentMasterApi";
import { useMasterListingController } from "../../shared/useMasterListingController";

const DEPARTMENT_SORT_FIELD_MAP: Record<string, string> = {
  departmentName: "name",
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

export function useDepartmentList() {
  return useMasterListingController({
    master: "department",
    sortFieldMap: DEPARTMENT_SORT_FIELD_MAP,
    fetchPage: fetchDepartmentsPaginated,
    fetchColumnDropdown: fetchDepartmentColumnDropdown,
    onLoaded: syncDepartmentMasterToStorage,
    updateStatus: updateDepartmentStatusApi,
    statusErrorMessage: "Unable to update department status.",
  });
}
