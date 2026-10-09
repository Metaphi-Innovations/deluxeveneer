import { useCallback, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";

import { queryKeys } from "../../../query/queryKeys";
import { useColumnDropdownQuery } from "../../../query/useColumnDropdownQuery";
import { useMasterListQuery } from "../../../query/useMasterListQuery";
import type { ColumnFilterValue } from "../../shared/columnFilters";
import { isActiveColumnFilter } from "../../shared/columnFilters";
import type { MasterRecord } from "./types";

type MasterListParams = {
  page: number;
  limit: number;
  search: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
  filters?: Record<string, string[]>;
};

type ColumnDropdownResult = {
  column: string;
  options: Array<{ value: string; label: string }>;
};

export function useMasterListingController({
  master,
  sortFieldMap,
  fetchPage,
  fetchColumnDropdown,
  onLoaded,
  updateStatus,
  statusErrorMessage,
}: {
  master: string;
  sortFieldMap: Record<string, string>;
  fetchPage: (
    params: MasterListParams,
  ) => Promise<{ items: MasterRecord[]; pagination: { total: number } }>;
  fetchColumnDropdown: (columnKey: string) => Promise<ColumnDropdownResult>;
  onLoaded?: (items: MasterRecord[]) => void;
  updateStatus: (id: string, active: boolean) => Promise<unknown>;
  statusErrorMessage: string;
}) {
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
    queryKeys.masters.columnDropdowns(master),
    fetchColumnDropdown,
  );
  const apiSortBy = sortBy ? sortFieldMap[sortBy] : undefined;
  const apiFilters = toApiColumnFilters(columnFilters);
  const listQuery = useMasterListQuery({
    master,
    page,
    rowsPerPage,
    search: searchValue,
    ...(apiSortBy ? { sortBy: apiSortBy } : {}),
    sortOrder,
    filters: apiFilters,
    fetchPage,
    ...(onLoaded ? { onLoaded } : {}),
  });
  const errorMessage =
    actionError ||
    (listQuery.error instanceof Error ? listQuery.error.message : "");

  const handleStatusToggle = useCallback(
    async (row: MasterRecord, checked: boolean) => {
      try {
        await updateStatus(row.id, checked);
        setActionError("");
        await queryClient.invalidateQueries({
          queryKey: queryKeys.masters.all(master),
        });
      } catch (error) {
        setActionError(
          error instanceof Error ? error.message : statusErrorMessage,
        );
      }
    },
    [master, queryClient, statusErrorMessage, updateStatus],
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
