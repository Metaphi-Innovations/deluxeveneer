import { useCallback, useMemo, useState } from "react";
import { useParams } from "react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";

import { queryKeys } from "../../../../query/queryKeys";
import { useColumnDropdownQuery } from "../../../../query/useColumnDropdownQuery";
import { useMasterListQuery } from "../../../../query/useMasterListQuery";

import {
  MasterFormPage,
  MasterListingPage,
  type MasterRecord,
} from "../../shared";
import type { ColumnFilterValue } from "../../../shared/columnFilters";
import { isActiveColumnFilter } from "../../../shared/columnFilters";
import { warehouseLocationMasterDefinition } from "../warehouseLocationMasterDefinition";
import {
  createWarehouseMasterRecord,
  fetchWarehouseMasterColumnDropdown,
  fetchWarehouseMasterDetail,
  fetchWarehouseMasterPaginated,
  updateWarehouseMasterRecord,
  updateWarehouseMasterStatus,
  type WarehouseMasterDetail,
} from "../api/warehouseMasterApi";
import { notifyMasterWarehousesUpdated } from "../../../warehouses/shared/warehouseSidebarStore";

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

export function WarehouseLocationMasterFormPage({
  mode,
}: {
  mode: "add" | "edit" | "view";
}) {
  const params = useParams<{ id: string }>();
  const detailQuery = useQuery({
    queryKey: queryKeys.masters.detail("warehouse", params.id ?? ""),
    queryFn: () => fetchWarehouseMasterDetail(params.id!),
    enabled: mode !== "add" && Boolean(params.id),
  });
  const record = mode === "add" ? undefined : detailQuery.data;
  const isLoading = mode !== "add" && Boolean(params.id) && detailQuery.isLoading;
  const errorMessage =
    mode !== "add" && !params.id
      ? "Warehouse id is missing."
      : detailQuery.error instanceof Error
        ? detailQuery.error.message
        : "";

  const definition = useMemo(
    () => ({
      ...warehouseLocationMasterDefinition,
      fields: warehouseLocationMasterDefinition.fields.map((field) =>
        field.key === "warehouseType"
          ? { ...field, options: STATIC_WAREHOUSE_TYPE_OPTIONS }
          : field,
      ),
      rows: [],
    }),
    [],
  );

  return (
    <MasterFormPage
      definition={definition}
      errorMessage={errorMessage}
      loading={isLoading}
      mode={mode}
      {...(record ? { record } : {})}
      onSave={async ({ mode: saveMode, row, values }) => {
        if (saveMode === "edit" && row?.id) {
          await updateWarehouseMasterRecord(row.id, values);
          notifyMasterWarehousesUpdated();
          return;
        }

        await createWarehouseMasterRecord(values);
        notifyMasterWarehousesUpdated();
      }}
    />
  );
}
