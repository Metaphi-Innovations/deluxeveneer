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

function mapWarehouseSortField(columnKey: string | null): string | undefined {
  if (!columnKey) return undefined;
  return WAREHOUSE_SORT_FIELD_MAP[columnKey];
}

function toApiColumnFilters(
  columnFilters: Partial<Record<string, ColumnFilterValue>>,
): Record<string, string[]> {
  const filters: Record<string, string[]> = {};

  for (const [key, filter] of Object.entries(columnFilters)) {
    if (!isActiveColumnFilter(filter)) continue;
    filters[key] = filter.values;
  }

  return filters;
}

export function WarehouseLocationMasterListPage() {
  const queryClient = useQueryClient();
  const [searchValue, setSearchValue] = useState("");
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [sortBy, setSortBy] = useState<string | null>(null);
  const [sortOrder, setSortOrder] = useState<"asc" | "desc" | null>(null);
  const [columnFilters, setColumnFilters] = useState<
    Partial<Record<string, ColumnFilterValue>>
  >({});
  const [actionError, setActionError] = useState("");
  const { filterOptionsByColumn, loadColumnDropdown } = useColumnDropdownQuery(
    queryKeys.masters.columnDropdowns("warehouse"),
    fetchWarehouseMasterColumnDropdown,
  );

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
            options: (filterOptionsByColumn.country ?? []).map(
              (entry) => entry.label,
            ),
          };
        }
        if (filter.key === "state") {
          return {
            ...filter,
            options: (filterOptionsByColumn.state ?? []).map(
              (entry) => entry.label,
            ),
          };
        }
        return filter;
      }),
    }),
    [filterOptionsByColumn],
  );

  const apiSortBy = mapWarehouseSortField(sortBy);
  const apiFilters = toApiColumnFilters(columnFilters);
  const listQuery = useMasterListQuery({
    master: "warehouse",
    page,
    rowsPerPage,
    search: searchValue,
    ...(apiSortBy ? { sortBy: apiSortBy } : {}),
    sortOrder,
    filters: apiFilters,
    fetchPage: fetchWarehouseMasterPaginated,
  });
  const rows = listQuery.rows;
  const totalCount = listQuery.totalCount;
  const isLoading = listQuery.isLoading;
  const errorMessage =
    actionError ||
    (listQuery.error instanceof Error ? listQuery.error.message : "");

  const handleStatusChange = useCallback(
    async (row: MasterRecord, checked: boolean) => {
      try {
        await updateWarehouseMasterStatus(row.id, checked);
        setActionError("");
        notifyMasterWarehousesUpdated();
        await queryClient.invalidateQueries({
          queryKey: queryKeys.masters.all("warehouse"),
        });
      } catch (error) {
        setActionError(
          error instanceof Error
            ? error.message
            : "Unable to update warehouse status.",
        );
      }
    },
    [queryClient],
  );

  return (
    <MasterListingPage
      columnFilters={columnFilters}
      definition={definition}
      errorMessage={errorMessage}
      filterOptionsByColumn={filterOptionsByColumn}
      loading={isLoading}
      onColumnFilterOpen={(columnKey) => {
        void loadColumnDropdown(columnKey);
      }}
      onColumnFiltersChange={(nextFilters) => {
        setColumnFilters(nextFilters);
        setPage(1);
      }}
      onSearchChange={(value) => {
        setSearchValue(value);
        setPage(1);
      }}
      onStatusChange={handleStatusChange}
      pagination={{
        page,
        rowsPerPage,
        totalCount,
        onPageChange: setPage,
        onRowsPerPageChange: (nextRowsPerPage) => {
          setRowsPerPage(nextRowsPerPage);
          setPage(1);
        },
      }}
      rows={rows}
      searchValue={searchValue}
      serverSearch
      sorting={{
        sortBy,
        sortOrder,
        onSortChange: (nextSortBy, nextSortOrder) => {
          setSortBy(nextSortBy);
          setSortOrder(nextSortOrder);
          setPage(1);
        },
      }}
    />
  );
}

export function AddWarehouseLocationMasterPage() {
  return <WarehouseLocationMasterFormPage mode="add" />;
}

export function EditWarehouseLocationMasterPage() {
  return <WarehouseLocationMasterFormPage mode="edit" />;
}

export function ViewWarehouseLocationMasterPage() {
  return <WarehouseLocationMasterFormPage mode="view" />;
}

function WarehouseLocationMasterFormPage({
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
