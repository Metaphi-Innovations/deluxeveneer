import type { MasterDefinition } from "../shared/types";
import { statusOptions } from "../shared/masterRecordHelpers";
import { getLiveMasterOptions } from "../shared/localMasterStore";

export function getCutMasterOptions() {
  return getLiveMasterOptions([], "cut-master", "cutName");
}

export const cutMasterOptions = getCutMasterOptions();

export const cutMasterDefinition: MasterDefinition = {
  slug: "cut-master",
  title: "Cut Master",
  gridColumns: 3,
  columns: [
    { key: "srNo", label: "Sr No" },
    { key: "cutName", label: "Cut Name" },
    { key: "remark", label: "Remark" },
    { key: "status", label: "Status" },
    { key: "createdBy", label: "Created By" },
    { key: "editedBy", label: "Updated By" },
    { key: "createdDate", label: "Created Date" },
    { key: "updatedDate", label: "Updated Date" },
  ],
  filters: [
    { key: "cutName", label: "Cut Name", options: cutMasterOptions },
    { key: "status", label: "Status", options: statusOptions },
  ],
  fields: [
    { key: "cutName", label: "Cut Name", type: "text" },
    { key: "remark", label: "Remark", type: "text" },
    { key: "status", label: "Status", type: "select", options: statusOptions },
  ],
  rows: [],
};
