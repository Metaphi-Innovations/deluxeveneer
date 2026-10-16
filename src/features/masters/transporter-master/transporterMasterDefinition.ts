import type { MasterDefinition } from "../shared/types";
import { uniqueOptions } from "../shared/masterRecordHelpers";
import {
  getCachedTransporterMasterRows,
  refreshTransporterMasterCache,
} from "./api/transporterMasterApi";

export { refreshTransporterMasterCache };

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

export const DEFAULT_TRANSPORTERS = [
  "Amardeep Cargo Logistic",
  "National Freight Carrier",
  "Deluxe Transport Services",
  "Blue Sky Air Cargo",
];

export function getTransporterMasterOptions(): string[] {
  const cached = uniqueOptions(getCachedTransporterMasterRows(), "transporterName");
  if (cached.length > 0) {
    return cached;
  }

  // Also check local master storage in case created locally
  if (typeof window !== "undefined") {
    try {
      const raw = window.localStorage.getItem("deluxe-veneers-local-master-records");
      if (raw) {
        const parsed = JSON.parse(raw);
        const rows = parsed["transporter-master"] ?? [];
        const localOptions = Array.from(
          new Set(
            rows
              .filter((r: any) => String(r.status ?? "Active").toLowerCase() !== "inactive")
              .map((r: any) => String(r.transporterName ?? r.name ?? "").trim())
              .filter(Boolean),
          ),
        ) as string[];
        if (localOptions.length > 0) {
          return localOptions;
        }
      }
    } catch {
      // Ignore JSON error
    }
  }

  // Trigger cache refresh in background if empty
  if (typeof window !== "undefined") {
    void refreshTransporterMasterCache().catch(() => {});
  }

  return [...DEFAULT_TRANSPORTERS];
}

/** @deprecated Prefer getTransporterMasterOptions() for live API cache values. */
export const transporterMasterOptions = getTransporterMasterOptions();

export const transporterTypeOptions = ["Road", "Air", "Rail"];

export function getTransporterAreaOfOperationOptions() {
  const cached = uniqueOptions(getCachedTransporterMasterRows(), "areaOfOperation");
  return cached.length > 0 ? cached : ["Pan India", "North India", "West India", "South India"];
}

/** @deprecated Prefer getTransporterAreaOfOperationOptions(). */
export const transporterAreaOfOperationOptions = getTransporterAreaOfOperationOptions();
