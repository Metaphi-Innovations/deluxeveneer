import { useCallback, useEffect, useState } from "react";
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
  type StorageInventoryPanelProps,
} from "./types";

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

interface StoragePlywoodInventoryProps extends StorageInventoryPanelProps {
  actions?: readonly EnterpriseTableAction<WarehouseInventoryRow>[];
  getRowActions?: (row: WarehouseInventoryRow) => readonly EnterpriseTableAction<WarehouseInventoryRow>[];
}

export function StoragePlywoodInventory({
  warehouseId,
  section,
  searchValue = "",
  onRefreshTrigger = 0,
  onSelectionChange,
  selectionResetKey,
  actions,
  getRowActions,
}: StoragePlywoodInventoryProps) {
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalCount, setTotalCount] = useState(0);
  const [sortBy, setSortBy] = useState<string | null>("inwardDate");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc" | null>("desc");
  const [columnFilters, setColumnFilters] = useState<
    Partial<Record<string, ColumnFilterValue>>
  >({});
  const [filterOptionsByColumn, setFilterOptionsByColumn] = useState<
    Record<string, Array<{ value: string; label: string }>>
  >({});
  const [rows, setRows] = useState<WarehouseInventoryRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    setPage(1);
  }, [searchValue, warehouseId, section]);

  const loadData = useCallback(async () => {
    if (!warehouseId) {
      setRows([]);
      setTotalCount(0);
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    setErrorMessage("");

    try {
      const apiFilters = toApiColumnFilters(columnFilters);
      const result = await fetchStorageInventoryPaginated("plywood", {
        warehouseId,
        section,
        page,
        limit: rowsPerPage,
        ...(searchValue.trim() ? { search: searchValue.trim() } : {}),
        ...(sortBy ? { sortBy } : {}),
        ...(sortOrder ? { sortOrder } : {}),
        ...(Object.keys(apiFilters).length > 0 ? { filters: apiFilters } : {}),
      });

      setRows(
        result.items.map((item) =>
          mapStorageItemToRow(item, "plywood")
        )
      );
      setTotalCount(result.pagination.total);
    } catch (error) {
      setRows([]);
      setTotalCount(0);
      setErrorMessage(
        error instanceof Error ? error.message : "Failed to load plywood."
      );
    } finally {
      setIsLoading(false);
    }
  }, [warehouseId, section, page, rowsPerPage, searchValue, sortBy, sortOrder, columnFilters, onRefreshTrigger]);

  useEffect(() => {
    setIsLoading(true);
    const timer = window.setTimeout(() => {
      void loadData();
    }, 250);
    return () => window.clearTimeout(timer);
  }, [loadData]);

  const loadDropdownOptions = useCallback(
    async (columnKey: string) => {
      if (!warehouseId) return;
      try {
        const result = await fetchStorageColumnDropdown(
          "plywood",
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
      ? "No plywood history records are available."
      : "No plywood inventory records are available.";

  return (
    <Stack spacing={2}>
      {errorMessage ? <Alert severity="error">{errorMessage}</Alert> : null}
      <EnterpriseDataTable
        columns={STORAGE_LISTING_COLUMNS}
        rows={rows}
        loading={isLoading}
        loadingLabel="Loading plywood inventory..."
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
