import type { MasterDefinition, MasterRecord } from "../shared/types";
import { statusOptions } from "../shared/masterRecordHelpers";
import { getLiveMasterOptions, getStoredMasterRows } from "../shared/localMasterStore";

export function getHsnMasterOptions() {
  return getLiveMasterOptions([], "hsn-master", "hsnCode");
}

export const hsnMasterOptions = getHsnMasterOptions();

export function getHsnGstPercentage(hsnCode: string) {
  const normalizedCode = hsnCode.trim().toLowerCase();

  if (!normalizedCode) {
    return "";
  }

  const match = getStoredMasterRows("hsn-master").find(
    (row: MasterRecord) =>
      String(row.hsnCode ?? "").trim().toLowerCase() === normalizedCode &&
      String(row.status ?? "Active").toLowerCase() !== "inactive",
  );

  return match ? String(match.gstPercentage ?? "") : "";
}

export const hsnMasterDefinition: MasterDefinition = {
  slug: "hsn-master",
  title: "HSN Master",
  gridColumns: 4,
  columns: [
    { key: "srNo", label: "Sr No" },
    { key: "hsnCode", label: "HSN Code" },
    { key: "hsnCodeDescription", label: "HSN Code Description" },
    { key: "gstPercentage", label: "GST%" },
    { key: "status", label: "Status" },
    { key: "createdBy", label: "Created By" },
    { key: "editedBy", label: "Updated By" },
    { key: "createdDate", label: "Created Date" },
    { key: "updatedDate", label: "Updated Date" },
  ],
  filters: [
    { key: "gstPercentage", label: "GST%", options: getLiveMasterOptions([], "hsn-master", "gstPercentage") },
    { key: "status", label: "Status", options: statusOptions },
    { key: "createdBy", label: "Created By", options: getLiveMasterOptions([], "hsn-master", "createdBy") },
  ],
  fields: [
    { key: "hsnCode", label: "HSN Code", type: "text" },
    { key: "hsnCodeDescription", label: "HSN Code Description", type: "text" },
    { key: "gstPercentage", label: "GST%", type: "select", options: getLiveMasterOptions([], "gst-master", "gstPercentage") },
    { key: "status", label: "Status", type: "select", options: statusOptions },
  ],
  rows: [],
};
