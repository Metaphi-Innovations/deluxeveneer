import type { MasterDefinition } from "../shared/types";
import { statusOptions } from "../shared/masterRecordHelpers";
import { getLiveMasterOptions } from "../shared/localMasterStore";

export const colorMasterDefinition: MasterDefinition = {
  slug: "color-master",
  title: "Color Master",
  gridColumns: 3,
  columns: [
    { key: "srNo", label: "Sr No" },
    { key: "colorName", label: "Color name" },
    { key: "status", label: "Status" },
    { key: "createdBy", label: "Created By" },
    { key: "editedBy", label: "Updated By" },
    { key: "createdDate", label: "Created Date" },
    { key: "updatedDate", label: "Updated Date" },
  ],
  filters: [
    { key: "status", label: "Status", options: statusOptions },
    { key: "createdBy", label: "Created By", options: getLiveMasterOptions([], "color-master", "createdBy") },
    { key: "editedBy", label: "Updated By", options: getLiveMasterOptions([], "color-master", "editedBy") },
  ],
  fields: [
    { key: "colorName", label: "Color Name", type: "text" },
    { key: "status", label: "Status", type: "select", options: statusOptions },
  ],
  rows: [],
};
