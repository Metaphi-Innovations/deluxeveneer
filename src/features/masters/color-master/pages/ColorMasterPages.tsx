import { useCallback, useState } from "react";
import { keepPreviousData, useQuery, useQueryClient } from "@tanstack/react-query";
import { MasterFormPage, MasterListingPage } from "../../shared";
import type { MasterDefinition, MasterRecord } from "../../shared/types";
import type { ColumnFilterValue } from "../../../shared/columnFilters";
import { isActiveColumnFilter } from "../../../shared/columnFilters";
import { colorMasterDefinition } from "../mock/colorMasterData";
import {
  createColorApi,
  fetchColorsApi,
  fetchColorsPaginated,
  fetchColorColumnDropdown,
  syncColorMasterToStorage,
  updateColorApi,
  updateColorStatusApi,
} from "../colorMasterApi";
import { invalidateMaster } from "../../../../query/queryClient";
import { queryKeys } from "../../../../query/queryKeys";
import { useColumnDropdownQuery } from "../../../../query/useColumnDropdownQuery";
import { useDebouncedValue } from "../../../../query/useDebouncedValue";

const COLOR_SORT_FIELD_MAP: Record<string, string> = {
  colorName: "name",
  name: "name",
  status: "status",
  createdDate: "createdAt",
  createdAt: "createdAt",
  createdBy: "createdAt",
  updatedDate: "updatedAt",
  updatedAt: "updatedAt",
  editedBy: "updatedAt",
  updatedBy: "updatedAt",
};

function mapColorSortField(columnKey: string | null): string | undefined {
  if (!columnKey) return undefined;
  return COLOR_SORT_FIELD_MAP[columnKey];
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

export function ColorMasterListPage() {
  const queryClient = useQueryClient();
  const [searchValue, setSearchValue] = useState("");
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [sortBy, setSortBy] = useState<string | null>(null);
  const [sortOrder, setSortOrder] = useState<"asc" | "desc" | null>(null);
  const [columnFilters, setColumnFilters] = useState<Partial<Record<string, ColumnFilterValue>>>({});
  const [actionError, setActionError] = useState("");
  const debouncedSearch = useDebouncedValue(searchValue);
  const { filterOptionsByColumn, loadColumnDropdown } = useColumnDropdownQuery(
    queryKeys.masters.columnDropdowns("color"),
    fetchColorColumnDropdown,
  );
  const apiSortBy = mapColorSortField(sortBy);
  const apiFilters = toApiColumnFilters(columnFilters);
  const listParams = {
    page,
    limit: rowsPerPage,
    search: debouncedSearch,
    sortBy: apiSortBy ?? null,
    sortOrder,
    filters: apiFilters,
  };
  const listQuery = useQuery({
    queryKey: queryKeys.masters.list("color", listParams),
    placeholderData: keepPreviousData,
    queryFn: async () => {
      const result = await fetchColorsPaginated({
        page,
        limit: rowsPerPage,
        search: debouncedSearch,
        ...(apiSortBy ? { sortBy: apiSortBy } : {}),
        ...(sortOrder ? { sortOrder } : {}),
        ...(Object.keys(apiFilters).length > 0 ? { filters: apiFilters } : {}),
      });
      syncColorMasterToStorage(result.items);
      return result;
    },
  });
  const rows = listQuery.data?.items ?? [];
  const totalCount = listQuery.data?.pagination.total ?? 0;
  const isLoading = listQuery.isLoading || listQuery.isFetching;
  const errorMessage =
    actionError ||
    (listQuery.error instanceof Error ? listQuery.error.message : "");

  const handleStatusToggle = useCallback(async (row: MasterRecord, checked: boolean) => {
    try {
      await updateColorStatusApi(row.id, checked);
      setActionError("");
      await queryClient.invalidateQueries({ queryKey: queryKeys.masters.all("color") });
    } catch (error) {
      setActionError(
        error instanceof Error ? error.message : "Unable to update color status.",
      );
    }
  }, [queryClient]);

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
      definition={colorMasterDefinition}
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
      onColumnFilterOpen={(columnKey) => { loadColumnDropdown(columnKey); }}
      onColumnFiltersChange={handleColumnFiltersChange}
      filterOptionsByColumn={filterOptionsByColumn}
      rows={rows}
      searchValue={searchValue}
      serverSearch
    />
  );
}

export function AddColorMasterPage() {
  const handleSave = async (context: {
    definition: MasterDefinition;
    mode: "add" | "edit";
    row?: MasterRecord;
    values: Record<string, any>;
  }) => {
    try {
      const created = await createColorApi({
        colorName: String(context.values.colorName || context.values.name || ""),
        remark: context.values.remark || context.values.remarks || null,
        status: context.values.status ?? true,
      });
      if (created) {
        const allRecords = await fetchColorsApi();
        if (allRecords.length > 0) {
          syncColorMasterToStorage(allRecords);
        }
      }
      void invalidateMaster("color");
    } catch (error) {
      console.warn("Failed to create color via API, fallback will persist locally:", error);
    }
  };

  return (
    <MasterFormPage
      definition={colorMasterDefinition}
      mode="add"
      onSave={handleSave}
    />
  );
}

export function EditColorMasterPage() {
  const handleSave = async (context: {
    definition: MasterDefinition;
    mode: "add" | "edit";
    row?: MasterRecord;
    values: Record<string, any>;
  }) => {
    if (context.row?.id) {
      try {
        const updated = await updateColorApi(context.row.id, {
          colorName: String(context.values.colorName || context.values.name || ""),
          remark: context.values.remark || context.values.remarks || null,
          status: context.values.status,
        });
        if (updated) {
          const allRecords = await fetchColorsApi();
          if (allRecords.length > 0) {
            syncColorMasterToStorage(allRecords);
          }
        }
        void invalidateMaster("color");
      } catch (error) {
        console.warn("Failed to update color via API, fallback will persist locally:", error);
      }
    }
  };

  return (
    <MasterFormPage
      definition={colorMasterDefinition}
      mode="edit"
      onSave={handleSave}
    />
  );
}

export function ViewColorMasterPage() {
  return <MasterFormPage definition={colorMasterDefinition} mode="view" />;
}
