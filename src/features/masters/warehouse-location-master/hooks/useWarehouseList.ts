import { useMemo } from "react";

import { notifyMasterWarehousesUpdated } from "../../../warehouses/shared/warehouseSidebarStore";
import { useMasterListingController } from "../../shared/useMasterListingController";
import {
  fetchWarehouseMasterColumnDropdown,
  fetchWarehouseMasterPaginated,
  updateWarehouseMasterStatus,
} from "../api/warehouseMasterApi";
import { warehouseLocationMasterDefinition } from "../warehouseLocationMasterDefinition";

const WAREHOUSE_SORT_FIELD_MAP: Record<string, string> = {
  warehouseName: "name",
  name: "name",
  warehouseCode: "code",
  code: "code",
  warehouseType: "type",
  type: "type",
  country: "country",
  state: "state",
  city: "city",
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

const STATIC_WAREHOUSE_TYPE_OPTIONS = ["Inward", "Storage", "Production"];

export function useWarehouseList() {
  const list = useMasterListingController({
    master: "warehouse",
    sortFieldMap: WAREHOUSE_SORT_FIELD_MAP,
    fetchPage: fetchWarehouseMasterPaginated,
    fetchColumnDropdown: fetchWarehouseMasterColumnDropdown,
    updateStatus: async (id, checked) => {
      await updateWarehouseMasterStatus(id, checked);
      notifyMasterWarehousesUpdated();
    },
    statusErrorMessage: "Unable to update warehouse status.",
  });
  const definition = useMemo(
    () => ({
      ...warehouseLocationMasterDefinition,
      filters: warehouseLocationMasterDefinition.filters.map((filter) => {
        if (filter.key === "warehouseType") {
          return { ...filter, options: STATIC_WAREHOUSE_TYPE_OPTIONS };
        }
        if (filter.key === "country") {
          return {
            ...filter,
            options: (list.filterOptionsByColumn.country ?? []).map(
              (entry) => entry.label,
            ),
          };
        }
        if (filter.key === "state") {
          return {
            ...filter,
            options: (list.filterOptionsByColumn.state ?? []).map(
              (entry) => entry.label,
            ),
          };
        }
        return filter;
      }),
    }),
    [list.filterOptionsByColumn],
  );

  return { ...list, definition };
}
