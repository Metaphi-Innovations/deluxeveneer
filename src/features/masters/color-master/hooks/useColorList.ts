import { useCallback, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";

import { queryKeys } from "../../../../query/queryKeys";
import { useColumnDropdownQuery } from "../../../../query/useColumnDropdownQuery";
import { useMasterListQuery } from "../../../../query/useMasterListQuery";
import type { ColumnFilterValue } from "../../../shared/columnFilters";
import { isActiveColumnFilter } from "../../../shared/columnFilters";
import type { MasterRecord } from "../../shared/types";
import {
  fetchColorColumnDropdown,
  fetchColorsPaginated,
  syncColorMasterToStorage,
  updateColorStatusApi,
} from "../api/colorMasterApi";

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
  if (!columnKey) {
    return undefined;
  }

  return COLOR_SORT_FIELD_MAP[columnKey];
}

function toApiColumnFilters(
  columnFilters: Partial<Record<string, ColumnFilterValue>>,
): Record<string, string[]> {
  const filters: Record<string, string[]> = {};

  for (const [key, filter] of Object.entries(columnFilters)) {
    if (!isActiveColumnFilter(filter)) {
      continue;
    }

    filters[key] = filter.values;
  }

  return filters;
}

export function useColorList() {
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
    queryKeys.masters.columnDropdowns("color"),
    fetchColorColumnDropdown,
  );
  const apiSortBy = mapColorSortField(sortBy);
  const apiFilters = toApiColumnFilters(columnFilters);
  const listQuery = useMasterListQuery({
    master: "color",
    page,
    rowsPerPage,
    search: searchValue,
    ...(apiSortBy ? { sortBy: apiSortBy } : {}),
    sortOrder,
    filters: apiFilters,
    fetchPage: async (params) => {
      const result = await fetchColorsPaginated(params);
      return {
        items: result.items,
        pagination: { total: result.pagination.total },
      };
    },
    onLoaded: syncColorMasterToStorage,
  });
  const errorMessage =
    actionError ||
    (listQuery.error instanceof Error ? listQuery.error.message : "");

  const handleStatusToggle = useCallback(
    async (row: MasterRecord, checked: boolean) => {
      try {
        await updateColorStatusApi(row.id, checked);
        setActionError("");
        await queryClient.invalidateQueries({
          queryKey: queryKeys.masters.all("color"),
        });
      } catch (error) {
        setActionError(
          error instanceof Error
            ? error.message
            : "Unable to update color status.",
        );
      }
    },
    [queryClient],
  );

  const handleSearchChange = useCallback((value: string) => {
    setSearchValue(value);
    setPage(1);
  }, []);

  const handleRowsPerPageChange = useCallback((nextRowsPerPage: number) => {
    setRowsPerPage(nextRowsPerPage);
    setPage(1);
  }, []);

  const handleSortChange = useCallback(
    (nextSortBy: string | null, nextSortOrder: "asc" | "desc" | null) => {
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

  return {
    actionError,
    columnFilters,
    errorMessage,
    filterOptionsByColumn,
    handleColumnFiltersChange,
    handleRowsPerPageChange,
    handleSearchChange,
    handleSortChange,
    handleStatusToggle,
    isLoading: listQuery.isLoading,
    loadColumnDropdown,
    page,
    rows: listQuery.rows,
    rowsPerPage,
    searchValue,
    setPage,
    sortBy,
    sortOrder,
    totalCount: listQuery.totalCount,
  };
}
