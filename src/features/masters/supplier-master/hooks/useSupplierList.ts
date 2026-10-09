import { useMemo } from "react";

import { useMasterListingController } from "../../shared/useMasterListingController";
import {
  fetchSupplierMasterColumnDropdown,
  fetchSupplierMasterPaginated,
  refreshSupplierMasterCache,
  updateSupplierMasterStatus,
} from "../api/supplierMasterApi";
import { supplierMasterDefinition } from "../supplierMasterDefinition";

const SUPPLIER_SORT_FIELD_MAP: Record<string, string> = {
  supplierName: "name",
  name: "name",
  gstNo: "gstNo",
  msmeType: "msmeType",
  country: "country",
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

export function useSupplierList() {
  const list = useMasterListingController({
    master: "supplier",
    sortFieldMap: SUPPLIER_SORT_FIELD_MAP,
    fetchPage: fetchSupplierMasterPaginated,
    fetchColumnDropdown: fetchSupplierMasterColumnDropdown,
    onLoaded: (items) => {
      void refreshSupplierMasterCache(items);
    },
    updateStatus: updateSupplierMasterStatus,
    statusErrorMessage: "Unable to update supplier status.",
  });
  const definition = useMemo(
    () => ({
      ...supplierMasterDefinition,
      filters: supplierMasterDefinition.filters.map((filter) => {
        if (filter.key === "country") {
          return {
            ...filter,
            options: (list.filterOptionsByColumn.country ?? []).map(
              (entry) => entry.label,
            ),
          };
        }
        if (filter.key === "msmeType") {
          return {
            ...filter,
            options:
              list.filterOptionsByColumn.msmeType &&
              list.filterOptionsByColumn.msmeType.length > 0
                ? list.filterOptionsByColumn.msmeType.map((entry) => entry.label)
                : filter.options,
          };
        }
        return filter;
      }),
    }),
    [list.filterOptionsByColumn],
  );

  return { ...list, definition };
}
