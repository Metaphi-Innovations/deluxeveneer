import { useCallback, useEffect, useState } from "react";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { Alert, Stack } from "@mui/material";
import {
  EnterpriseDataTable,
  type EnterpriseTableAction,
} from "../../../components/data-display/EnterpriseDataTable";
import {
  isActiveColumnFilter,
  type ColumnFilterValue,
} from "../../shared/columnFilters";
import { type WarehouseInventoryRow } from "../shared/warehouseTableData";
import {
  fetchStorageColumnDropdown,
  fetchStorageInventoryPaginated,
  mapStorageItemToRow,
} from "./api/storageApi";
import {
  STORAGE_LISTING_COLUMNS,
  STORAGE_VENEER_BLOCKS_HISTORY_COLUMNS,
  type StorageInventoryPanelProps,
} from "./types";
import { queryKeys } from "../../../query/queryKeys";
import { useDebouncedValue } from "../../../query/useDebouncedValue";

function toApiColumnFilters(
  columnFilters: Partial<Record<string, ColumnFilterValue>>
): Record<string, string[]> {
  const filters: Record<string, string[]> = {};
  for (const [key, filter] of Object.entries(columnFilters)) {
    if (!isActiveColumnFilter(filter)) continue;
    filters[key] = filter.values;
  }
  return filters;
}

interface StorageVeneerBlocksInventoryProps extends StorageInventoryPanelProps {
  actions?: readonly EnterpriseTableAction<WarehouseInventoryRow>[];
  getRowActions?: (row: WarehouseInventoryRow) => readonly EnterpriseTableAction<WarehouseInventoryRow>[];
}

export function StorageVeneerBlocksInventory({
  warehouseId,
  section,
  searchValue = "",
  onRefreshTrigger = 0,
  onSelectionChange,
  selectionResetKey,
  actions,
  getRowActions,
}: StorageVeneerBlocksInventoryProps) {
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [sortBy, setSortBy] = useState<string | null>("inwardDate");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc" | null>("desc");
  const [columnFilters, setColumnFilters] = useState<
    Partial<Record<string, ColumnFilterValue>>
  >({});
  const [filterOptionsByColumn, setFilterOptionsByColumn] = useState<
    Record<string, Array<{ value: string; label: string }>>
  >({});
  const debouncedSearch = useDebouncedValue(searchValue, 250);

  useEffect(() => {
    setPage(1);
  }, [searchValue, warehouseId, section]);

  const apiFilters = toApiColumnFilters(columnFilters);
  const listParams = {
    warehouseId,
    section,
    page,
    limit: rowsPerPage,
    search: debouncedSearch.trim(),
    sortBy,
    sortOrder,
    filters: apiFilters,
    refresh: onRefreshTrigger,
  };
  const listQuery = useQuery({
    queryKey: queryKeys.warehouse.storage.list("veneer-blocks", listParams),
    enabled: Boolean(warehouseId),
    placeholderData: keepPreviousData,
    queryFn: () =>
      fetchStorageInventoryPaginated("veneer-blocks", {
        warehouseId,
        section,
        page,
        limit: rowsPerPage,
        ...(debouncedSearch.trim() ? { search: debouncedSearch.trim() } : {}),
        ...(sortBy ? { sortBy } : {}),
        ...(sortOrder ? { sortOrder } : {}),
        ...(Object.keys(apiFilters).length > 0 ? { filters: apiFilters } : {}),
      }),
  });
  const rows = (listQuery.data?.items ?? []).map((item) =>
    mapStorageItemToRow(item, "veneer-blocks"),
  );
  const totalCount = listQuery.data?.pagination.total ?? 0;
  const isLoading = Boolean(warehouseId) && listQuery.isLoading;
  const errorMessage =
    listQuery.error instanceof Error ? listQuery.error.message : "";

  const loadDropdownOptions = useCallback(
    async (columnKey: string) => {
      if (!warehouseId) return;
      try {
        const result = await fetchStorageColumnDropdown(
          "veneer-blocks",
          warehouseId,
          columnKey,
          section
        );
        setFilterOptionsByColumn((prev) => ({
          ...prev,
          [columnKey]: result.options,
        }));
      } catch {
        setFilterOptionsByColumn((prev) => ({
          ...prev,
          [columnKey]: [],
        }));
      }
    },
    [warehouseId, section]
  );

  const emptyLabel =
    section === "history"
      ? "No veneer blocks history records are available."
      : "No veneer blocks inventory records are available.";

  return (
    <Stack spacing={2}>
      {errorMessage ? <Alert severity="error">{errorMessage}</Alert> : null}
      <EnterpriseDataTable
        columns={section === "history" ? STORAGE_VENEER_BLOCKS_HISTORY_COLUMNS : STORAGE_LISTING_COLUMNS}
        rows={rows}
        loading={isLoading}
        loadingLabel="Loading veneer blocks inventory..."
        filterOptionsByColumn={filterOptionsByColumn}
        columnFilters={columnFilters}
        onColumnFilterOpen={(columnKey) => {
          void loadDropdownOptions(columnKey);
        }}
        onColumnFiltersChange={(next) => {
          setColumnFilters(next);
          setPage(1);
        }}
        pagination={{
          page,
          rowsPerPage,
          totalCount,
          onPageChange: setPage,
          onRowsPerPageChange: (newPerPage: number) => {
            setRowsPerPage(newPerPage);
            setPage(1);
          },
        }}
        sorting={{
          sortBy,
          sortOrder,
          onSortChange: (key: string, order: "asc" | "desc") => {
            setSortBy(key);
            setSortOrder(order);
            setPage(1);
          },
        }}
        emptyStateLabel={emptyLabel}
        selectable={section === "inventory"}
        {...(onSelectionChange !== undefined ? { onSelectionChange } : {})}
        {...(selectionResetKey !== undefined ? { selectionResetKey } : {})}
        {...(actions !== undefined ? { actions } : {})}
        {...(getRowActions !== undefined ? { getRowActions } : {})}
      />
    </Stack>
  );
}
