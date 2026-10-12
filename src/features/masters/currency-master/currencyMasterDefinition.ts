import type { MasterDefinition } from "../shared/types";
import { statusOptions } from "../shared/masterRecordHelpers";
import { getLiveMasterOptions } from "../shared/localMasterStore";

export function getCurrencyMasterOptions() {
  return getLiveMasterOptions([], "currency-master", "currencyName");
}

export const currencyMasterOptions = getCurrencyMasterOptions();

export const currencyMasterDefinition: MasterDefinition = {
  slug: "currency-master",
  title: "Currency Master",
  gridColumns: 3,
  columns: [
    { key: "srNo", label: "Sr No" },
    { key: "currencyName", label: "Currency Name" },
    { key: "remark", label: "Remark" },
    { key: "status", label: "Status" },
    { key: "createdBy", label: "Created By" },
    { key: "editedBy", label: "Updated By" },
    { key: "createdDate", label: "Created Date" },
    { key: "updatedDate", label: "Updated Date" },
  ],
  filters: [
    { key: "status", label: "Status", options: statusOptions },
    { key: "createdBy", label: "Created By", options: getLiveMasterOptions([], "currency-master", "createdBy") },
    { key: "currencyName", label: "Currency Name", options: currencyMasterOptions },
  ],
  fields: [
    { key: "currencyName", label: "Currency Name", type: "text" },
    { key: "status", label: "Status", type: "select", options: statusOptions },
    { key: "remark", label: "Remark", type: "text" },
  ],
  rows: [],
};
