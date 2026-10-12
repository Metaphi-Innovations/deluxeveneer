import {
  fetchUnitColumnDropdown,
  fetchUnitsPaginated,
  syncUnitMasterToStorage,
  updateUnitStatusApi,
} from "../api/unitMasterApi";
import { useMasterListingController } from "../../shared/useMasterListingController";

const UNIT_SORT_FIELD_MAP: Record<string, string> = {
  unitName: "name",
  name: "name",
  symbolicName: "symbolicName",
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

export function useUnitList() {
  return useMasterListingController({
    master: "unit",
    sortFieldMap: UNIT_SORT_FIELD_MAP,
    fetchPage: async (params) => {
      const result = await fetchUnitsPaginated(params);
      return { items: result.records, pagination: { total: result.totalCount } };
    },
    fetchColumnDropdown: fetchUnitColumnDropdown,
    onLoaded: syncUnitMasterToStorage,
    updateStatus: updateUnitStatusApi,
    statusErrorMessage: "Unable to update unit status.",
  });
}
