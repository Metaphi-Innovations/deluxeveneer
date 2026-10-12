import type { MasterDefinition } from "../shared/types";
import { uniqueOptions } from "../shared/masterRecordHelpers";
import { getCachedTransporterMasterRows } from "./api/transporterMasterApi";

export const transporterMasterDefinition: MasterDefinition = {
  slug: "transporter-master",
  title: "Transporter Master",
  gridColumns: 3,
  columns: [
    { key: "transporterName", label: "Transporter Name" },
    { key: "branchName", label: "Branch Name" },
    { key: "transporterId", label: "Transporter Id" },
    { key: "type", label: "Type" },
    { key: "status", label: "Status" },
    { key: "createdBy", label: "Created By" },
    { key: "editedBy", label: "Updated By" },
    { key: "createdDate", label: "Created Date" },
    { key: "updatedDate", label: "Updated Date" },
  ],
  filters: [
    { key: "type", label: "Type", options: ["Road", "Air", "Rail"] },
    { key: "status", label: "Status", options: ["Active", "Inactive"] },
  ],
  fields: [
    { key: "transporterName", label: "Transporter Name", type: "text" },
    { key: "branchName", label: "Branch Name", type: "text" },
    { key: "transporterId", label: "Transporter Id", type: "text" },
    {
      key: "type",
      label: "Type",
      type: "select",
      options: ["Road", "Air", "Rail"],
    },
    { key: "remark", label: "Remark", type: "text" },
    { key: "status", label: "Status", type: "select", options: ["Active", "Inactive"] },
  ],
  rows: [],
};

export function getTransporterMasterOptions() {
  return uniqueOptions(getCachedTransporterMasterRows(), "transporterName");
}

/** @deprecated Prefer getTransporterMasterOptions() for live API cache values. */
export const transporterMasterOptions = getTransporterMasterOptions();

export const transporterTypeOptions = ["Road", "Air", "Rail"];

export function getTransporterAreaOfOperationOptions() {
  return uniqueOptions(getCachedTransporterMasterRows(), "areaOfOperation");
}

/** @deprecated Prefer getTransporterAreaOfOperationOptions(). */
export const transporterAreaOfOperationOptions = getTransporterAreaOfOperationOptions();
