import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { MasterFormPage, MasterListingPage } from "../../shared";
import type { MasterDefinition, MasterRecord } from "../../shared/types";
import type { ColumnFilterValue } from "../../../shared/columnFilters";
import { isActiveColumnFilter } from "../../../shared/columnFilters";
import { hsnMasterDefinition } from "../mock/hsnMasterData";
import {
  createHsnApi,
  fetchHsnsApi,
  fetchHsnsPaginated,
  fetchHsnColumnDropdown,
  syncHsnMasterToStorage,
  updateHsnApi,
  updateHsnStatusApi,
} from "../hsnMasterApi";

const HSN_SORT_FIELD_MAP: Record<string, string> = {
  hsnCode: "code",
  code: "code",
  hsnCodeDescription: "description",
  description: "description",
  status: "status",
  createdDate: "createdAt",
  createdAt: "createdAt",
  createdBy: "createdAt",
  updatedDate: "updatedAt",
  updatedAt: "updatedAt",
  editedBy: "updatedAt",
  updatedBy: "updatedAt",
};

function mapHsnSortField(columnKey: string | null): string | undefined {
  if (!columnKey) return undefined;
  return HSN_SORT_FIELD_MAP[columnKey];
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

export function HSNMasterListPage() {
  const [rows, setRows] = useState<MasterRecord[]>([]);
  const [searchValue, setSearchValue] = useState("");
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalCount, setTotalCount] = useState(0);
  const [sortBy, setSortBy] = useState<string | null>(null);
  const [sortOrder, setSortOrder] = useState<"asc" | "desc" | null>(null);
  const [columnFilters, setColumnFilters] = useState<Partial<Record<string, ColumnFilterValue>>>({});
  const [filterOptionsByColumn, setFilterOptionsByColumn] = useState<Record<string, Array<{ value: string; label: string }>>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [reloadKey, setReloadKey] = useState(0);
  const hasLoadedRowsRef = useRef(false);
  const columnDropdownRequestIdRef = useRef(0);

  const loadColumnDropdown = useCallback(async (columnKey: string) => {
    const requestId = ++columnDropdownRequestIdRef.current;
    setFilterOptionsByColumn({});
    try {
      const result = await fetchHsnColumnDropdown(columnKey);
      if (requestId !== columnDropdownRequestIdRef.current) return;
      setFilterOptionsByColumn({ [result.column]: result.options });
    } catch {
      // keep page usable
    }
  }, []);

  useEffect(() => {
    let ignore = false;

    const timer = window.setTimeout(async () => {
      if (!hasLoadedRowsRef.current) {
        setIsLoading(true);
      }
      setErrorMessage("");

      try {
        const apiSortBy = mapHsnSortField(sortBy);
        const apiFilters = toApiColumnFilters(columnFilters);
        const result = await fetchHsnsPaginated({
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
          syncHsnMasterToStorage(result.items);
        }
      } catch (error) {
        if (!ignore) {
          setErrorMessage(
            error instanceof Error ? error.message : "Unable to load HSN records.",
          );
        }
      } finally {
        if (!ignore) {
          setIsLoading(false);
        }
      }
    }, 300);

    return () => {
      ignore = true;
      window.clearTimeout(timer);
    };
  }, [reloadKey, searchValue, page, rowsPerPage, sortBy, sortOrder, columnFilters]);

  const handleStatusToggle = useCallback(async (row: MasterRecord, checked: boolean) => {
    try {
      await updateHsnStatusApi(row.id, checked);
      setRows((current) =>
        current.map((entry) =>
          entry.id === row.id
            ? { ...entry, status: checked ? "Active" : "Inactive" }
            : entry,
        ),
      );
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Unable to update HSN status.",
      );
      setReloadKey((v) => v + 1);
    }
  }, []);

  const handleSearchChange = useCallback((value: string) => {
    setSearchValue(value);
    setPage(1);
  }, []);

  const handleRowsPerPageChange = useCallback((nextRowsPerPage: number) => {
    setRowsPerPage(nextRowsPerPage);
    setPage(1);
  }, []);

  const handleSortChange = useCallback(
    (nextSortBy: string, nextSortOrder: "asc" | "desc") => {
      setSortBy(nextSortBy);
      setSortOrder(nextSortOrder);
      setPage(1);
    },
    [],
  );

  const handleColumnFiltersChange = useCallback(
    (nextFilters: Partial<Record<string, ColumnFilterValue>>) => {
      setColumnFilters(nextFilters);
      setPage(1);
    },
    [],
  );

  return (
    <MasterListingPage
      definition={hsnMasterDefinition}
      errorMessage={errorMessage}
      loading={isLoading}
      onSearchChange={handleSearchChange}
      onStatusChange={handleStatusToggle}
      pagination={{
        page,
        rowsPerPage,
        totalCount,
        onPageChange: setPage,
        onRowsPerPageChange: handleRowsPerPageChange,
      }}
      sorting={{
        sortBy,
        sortOrder,
        onSortChange: handleSortChange,
      }}
      columnFilters={columnFilters}
      onColumnFilterOpen={(columnKey) => { void loadColumnDropdown(columnKey); }}
      onColumnFiltersChange={handleColumnFiltersChange}
      filterOptionsByColumn={filterOptionsByColumn}
      rows={rows}
      searchValue={searchValue}
      serverSearch
    />
  );
}

export function AddHSNMasterPage() {
  const handleSave = async (context: {
    definition: MasterDefinition;
    mode: "add" | "edit";
    row?: MasterRecord;
    values: Record<string, any>;
  }) => {
    try {
      const created = await createHsnApi({
        hsnCode: String(context.values.hsnCode || context.values.code || ""),
        hsnCodeDescription: String(context.values.hsnCodeDescription || context.values.description || ""),
        gstPercentage: context.values.gstPercentage || context.values.gst || "18%",
        remark: context.values.remark || context.values.remarks || null,
        status: context.values.status ?? true,
      });
      if (created) {
        const allRecords = await fetchHsnsApi();
        if (allRecords.length > 0) {
          syncHsnMasterToStorage(allRecords);
        }
      }
    } catch (error) {
      console.warn("Failed to create HSN record via API, fallback will persist locally:", error);
    }
  };

  return (
    <MasterFormPage
      definition={hsnMasterDefinition}
      mode="add"
      onSave={handleSave}
    />
  );
}

export function EditHSNMasterPage() {
  const handleSave = async (context: {
    definition: MasterDefinition;
    mode: "add" | "edit";
    row?: MasterRecord;
    values: Record<string, any>;
  }) => {
    if (context.row?.id) {
      try {
        const updated = await updateHsnApi(context.row.id, {
          hsnCode: String(context.values.hsnCode || context.values.code || ""),
          hsnCodeDescription: String(context.values.hsnCodeDescription || context.values.description || ""),
          gstPercentage: context.values.gstPercentage || context.values.gst,
          remark: context.values.remark || context.values.remarks || null,
          status: context.values.status,
        });
        if (updated) {
          const allRecords = await fetchHsnsApi();
          if (allRecords.length > 0) {
            syncHsnMasterToStorage(allRecords);
          }
        }
      } catch (error) {
        console.warn("Failed to update HSN record via API, fallback will persist locally:", error);
      }
    }
  };

  return (
    <MasterFormPage
      definition={hsnMasterDefinition}
      mode="edit"
      onSave={handleSave}
    />
  );
}

export function ViewHSNMasterPage() {
  return <MasterFormPage definition={hsnMasterDefinition} mode="view" />;
}
