import type { MasterDefinition } from "../shared/types";
import { statusOptions } from "../shared/masterRecordHelpers";
import { getLiveMasterOptions } from "../shared/localMasterStore";

export function getUnitMasterOptions() {
  return getLiveMasterOptions([], "unit-master", "unitName");
}

export const unitMasterOptions = getUnitMasterOptions();

export const unitMasterDefinition: MasterDefinition = {
  slug: "unit-master",
  title: "Unit Master",
  gridColumns: 3,
  columns: [
    { key: "srNo", label: "Sr No" },
    { key: "unitName", label: "Unit Name" },
    { key: "symbolicName", label: "Symbolic Name" },
    { key: "remark", label: "Remark" },
    { key: "status", label: "Status" },
    { key: "createdBy", label: "Created By" },
    { key: "editedBy", label: "Updated By" },
    { key: "createdDate", label: "Created Date" },
    { key: "updatedDate", label: "Updated Date" },
  ],
  filters: [
    { key: "status", label: "Status", options: statusOptions },
    { key: "createdBy", label: "Created By", options: getLiveMasterOptions([], "unit-master", "createdBy") },
  ],
  fields: [
    { key: "unitName", label: "Unit Name", type: "text" },
    { key: "symbolicName", label: "Symbolic Name", type: "text" },
    { key: "status", label: "Status", type: "select", options: statusOptions },
    { key: "remark", label: "Remark", type: "text" },
  ],
  rows: [],
};
