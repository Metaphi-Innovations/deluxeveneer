import type { MasterDefinition } from "../shared/types";
import { statusOptions } from "../shared/masterRecordHelpers";
import { getLiveMasterOptions } from "../shared/localMasterStore";

export function getGstMasterOptions() {
  return getLiveMasterOptions([], "gst-master", "gstPercentage");
}

export const gstMasterOptions = getGstMasterOptions();

export const gstMasterDefinition: MasterDefinition = {
  slug: "gst-master",
  title: "GST Master",
  gridColumns: 3,
  columns: [
    { key: "srNo", label: "Sr No" },
    { key: "gstPercentage", label: "GST %" },
    { key: "remark", label: "Remark" },
    { key: "createdBy", label: "Created By" },
    { key: "editedBy", label: "Updated By" },
    { key: "status", label: "Status" },
    { key: "createdDate", label: "Created Date" },
    { key: "updatedDate", label: "Updated Date" },
  ],
  filters: [
    { key: "gstPercentage", label: "GST %", options: gstMasterOptions },
    { key: "status", label: "Status", options: statusOptions },
    { key: "createdBy", label: "Created By", options: getLiveMasterOptions([], "gst-master", "createdBy") },
  ],
  fields: [
    { key: "gstPercentage", label: "GST %", type: "text" },
    { key: "status", label: "Status", type: "select", options: statusOptions },
    { key: "remark", label: "Remark", type: "text" },
  ],
  rows: [],
};
