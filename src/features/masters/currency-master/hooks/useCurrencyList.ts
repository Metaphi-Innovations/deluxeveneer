import {
  fetchCurrenciesPaginated,
  fetchCurrencyColumnDropdown,
  syncCurrencyMasterToStorage,
  updateCurrencyStatusApi,
} from "../api/currencyMasterApi";
import { useMasterListingController } from "../../shared/useMasterListingController";

const CURRENCY_SORT_FIELD_MAP: Record<string, string> = {
  currencyName: "name",
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

export function useCurrencyList() {
  return useMasterListingController({
    master: "currency",
    sortFieldMap: CURRENCY_SORT_FIELD_MAP,
    fetchPage: fetchCurrenciesPaginated,
    fetchColumnDropdown: fetchCurrencyColumnDropdown,
    onLoaded: syncCurrencyMasterToStorage,
    updateStatus: updateCurrencyStatusApi,
    statusErrorMessage: "Unable to update currency status.",
  });
}
