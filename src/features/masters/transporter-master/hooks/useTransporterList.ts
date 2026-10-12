import { useMemo } from "react";

import { useMasterListingController } from "../../shared/useMasterListingController";
import {
  fetchTransporterMasterColumnDropdown,
  fetchTransporterMasterPaginated,
  refreshTransporterMasterCache,
  updateTransporterMasterStatus,
} from "../api/transporterMasterApi";
import { transporterMasterDefinition } from "../transporterMasterDefinition";

const TRANSPORTER_SORT_FIELD_MAP: Record<string, string> = {
  transporterName: "name",
  name: "name",
  branchName: "branchName",
  transporterId: "transporterCode",
  transporterCode: "transporterCode",
  type: "type",
  areaOfOperation: "areaOfOperation",
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

const STATIC_TRANSPORTER_TYPE_OPTIONS = ["Road", "Air", "Rail"];

export function useTransporterList() {
  const list = useMasterListingController({
    master: "transporter",
    sortFieldMap: TRANSPORTER_SORT_FIELD_MAP,
    fetchPage: fetchTransporterMasterPaginated,
    fetchColumnDropdown: fetchTransporterMasterColumnDropdown,
    onLoaded: (items) => {
      void refreshTransporterMasterCache(items);
    },
    updateStatus: updateTransporterMasterStatus,
    statusErrorMessage: "Unable to update transporter status.",
  });
  const definition = useMemo(
    () => ({
      ...transporterMasterDefinition,
      filters: transporterMasterDefinition.filters.map((filter) => {
        if (filter.key === "type") {
          return { ...filter, options: STATIC_TRANSPORTER_TYPE_OPTIONS };
        }
        return filter;
      }),
    }),
    [],
  );

  return { ...list, definition };
}
