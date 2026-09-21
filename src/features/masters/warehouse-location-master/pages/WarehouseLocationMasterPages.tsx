import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useParams } from "react-router";

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
  const [rows, setRows] = useState<MasterRecord[]>([]);
  const [searchValue, setSearchValue] = useState("");
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalCount, setTotalCount] = useState(0);
  const [sortBy, setSortBy] = useState<string | null>(null);
  const [sortOrder, setSortOrder] = useState<"asc" | "desc" | null>(null);
  const [columnFilters, setColumnFilters] = useState<
    Partial<Record<string, ColumnFilterValue>>
  >({});
  const [filterOptionsByColumn, setFilterOptionsByColumn] = useState<
    Record<string, Array<{ value: string; label: string }>>
  >({});
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [reloadKey, setReloadKey] = useState(0);
  const hasLoadedRowsRef = useRef(false);
  const columnDropdownRequestIdRef = useRef(0);

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

  const loadColumnDropdown = useCallback(async (columnKey: string) => {
    const requestId = ++columnDropdownRequestIdRef.current;
    setFilterOptionsByColumn({});

    try {
      const result = await fetchWarehouseMasterColumnDropdown(columnKey);
      if (requestId !== columnDropdownRequestIdRef.current) {
        return;
      }

      setFilterOptionsByColumn({
        [result.column]: result.options,
      });
    } catch {
      // Keep page usable; filter menus can fall back to page-local options.
    }
  }, []);

  useEffect(() => {
    let ignore = false;

    const timer = window.setTimeout(async () => {
      // Only show full-page loading before the first successful load so filter
      // /sort changes do not unmount the table.
      if (!hasLoadedRowsRef.current) {
        setIsLoading(true);
      }
      setErrorMessage("");

      try {
        const apiSortBy = mapWarehouseSortField(sortBy);
        const apiFilters = toApiColumnFilters(columnFilters);
        const result = await fetchWarehouseMasterPaginated({
          page,
          limit: rowsPerPage,
          search: searchValue,
          ...(apiSortBy ? { sortBy: apiSortBy } : {}),
          ...(sortOrder ? { sortOrder } : {}),
          ...(Object.keys(apiFilters).length > 0 ? { filters: apiFilters } : {}),
        });

        if (!ignore) {
          setRows(result.items);
          setTotalCount(result.pagination.total);
          hasLoadedRowsRef.current = true;
        }
      } catch (error) {
        if (!ignore) {
          setErrorMessage(
            error instanceof Error
              ? error.message
              : "Unable to load warehouses.",
          );
        }
      } finally {
        if (!ignore) setIsLoading(false);
      }
    }, 300);

    return () => {
      ignore = true;
      window.clearTimeout(timer);
    };
  }, [reloadKey, searchValue, page, rowsPerPage, sortBy, sortOrder, columnFilters]);

  const handleStatusChange = useCallback(
    async (row: MasterRecord, checked: boolean) => {
      try {
        await updateWarehouseMasterStatus(row.id, checked);
        setRows((current) =>
          current.map((entry) =>
            entry.id === row.id
              ? { ...entry, status: checked ? "Active" : "Inactive" }
              : entry,
          ),
        );
      } catch (error) {
        setErrorMessage(
          error instanceof Error
            ? error.message
            : "Unable to update warehouse status.",
        );
        setReloadKey((value) => value + 1);
      }
    },
    [],
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
  const [record, setRecord] = useState<WarehouseMasterDetail | undefined>();
  const [isLoading, setIsLoading] = useState(mode !== "add");
  const [errorMessage, setErrorMessage] = useState("");

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

  useEffect(() => {
    let ignore = false;

    async function loadDetail() {
      setErrorMessage("");

      if (mode === "add") {
        setRecord(undefined);
        setIsLoading(false);
        return;
      }

      if (!params.id) {
        setRecord(undefined);
        setIsLoading(false);
        setErrorMessage("Warehouse id is missing.");
        return;
      }

      setIsLoading(true);

      try {
        const nextRecord = await fetchWarehouseMasterDetail(params.id);
        if (!ignore) setRecord(nextRecord);
      } catch (error) {
        if (!ignore) {
          setRecord(undefined);
          setErrorMessage(
            error instanceof Error
              ? error.message
              : "Unable to load warehouse.",
          );
        }
      } finally {
        if (!ignore) setIsLoading(false);
      }
    }

    void loadDetail();

    return () => {
      ignore = true;
    };
  }, [mode, params.id]);

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
          return;
        }

        await createWarehouseMasterRecord(values);
      }}
    />
  );
}
