import type { MasterDefinition } from "../shared/types";
import { statusOptions } from "../shared/masterRecordHelpers";
import { getLiveMasterOptions } from "../shared/localMasterStore";

export function getGradeMasterOptions() {
  return getLiveMasterOptions([], "grade-master", "gradeName");
}

export const gradeMasterOptions = getGradeMasterOptions();

export const gradeMasterDefinition: MasterDefinition = {
  slug: "grade-master",
  title: "Grade Master",
  gridColumns: 3,
  columns: [
    { key: "srNo", label: "Sr No" },
    { key: "gradeName", label: "Grade Name" },
    { key: "remark", label: "Remark" },
    { key: "status", label: "Status" },
    { key: "createdBy", label: "Created By" },
    { key: "editedBy", label: "Updated By" },
    { key: "createdDate", label: "Created Date" },
    { key: "updatedDate", label: "Updated Date" },
  ],
  filters: [
    { key: "gradeName", label: "Grade Name", options: gradeMasterOptions },
    { key: "status", label: "Status", options: statusOptions },
  ],
  fields: [
    { key: "gradeName", label: "Grade Name", type: "text" },
    { key: "remark", label: "Remark", type: "text" },
    { key: "status", label: "Status", type: "select", options: statusOptions },
  ],
  rows: [],
};
