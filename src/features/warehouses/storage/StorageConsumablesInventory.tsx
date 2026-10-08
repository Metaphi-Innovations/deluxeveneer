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
  type StorageQueryParams,
} from "./api/storageApi";
import {
  STORAGE_CONSUMABLES_COLUMNS,
  STORAGE_CONSUMABLES_HISTORY_COLUMNS,
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

interface StorageConsumablesInventoryProps extends StorageInventoryPanelProps {
  actions?: readonly EnterpriseTableAction<WarehouseInventoryRow>[];
  getRowActions?: (
    row: WarehouseInventoryRow
  ) => readonly EnterpriseTableAction<WarehouseInventoryRow>[];
}

export function StorageConsumablesInventory({
  warehouseId,
  section,
  searchValue = "",
  onRefreshTrigger = 0,
  onSelectionChange,
  selectionResetKey,
  actions,
  getRowActions,
}: StorageConsumablesInventoryProps) {
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
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    if (!warehouseId) return;

    setIsLoading(true);
    setErrorMessage(null);

    const queryParams: StorageQueryParams = {
      warehouseId,
      section,
      page,
      limit: rowsPerPage,
    };
    if (searchValue.trim()) queryParams.search = searchValue.trim();
    if (sortBy) queryParams.sortBy = sortBy;
    if (sortOrder) queryParams.sortOrder = sortOrder;

    const apiFilters = toApiColumnFilters(columnFilters);
    if (Object.keys(apiFilters).length > 0) {
      queryParams.filters = apiFilters;
    }

    try {
      const response = await fetchStorageInventoryPaginated(
        "consumables",
        queryParams
      );

      setRows(
        response.items.map((item) =>
          mapStorageItemToRow(item, "consumables")
        )
      );
      setTotalCount(response.pagination.total);
    } catch (err) {
      setErrorMessage(
        err instanceof Error ? err.message : "Failed to load consumables"
      );
      setRows([]);
      setTotalCount(0);
    } finally {
      setIsLoading(false);
    }
  }, [
    warehouseId,
    section,
    page,
    rowsPerPage,
    searchValue,
    sortBy,
    sortOrder,
    columnFilters,
    onRefreshTrigger,
  ]);

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
          "consumables",
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
      ? "No consumables history records are available."
      : "No consumables inventory records are available.";

  return (
    <Stack spacing={2}>
      {errorMessage ? <Alert severity="error">{errorMessage}</Alert> : null}
      <EnterpriseDataTable
        columns={
          section === "history"
            ? STORAGE_CONSUMABLES_HISTORY_COLUMNS
            : STORAGE_CONSUMABLES_COLUMNS
        }
        rows={rows}
        loading={isLoading}
        loadingLabel="Loading consumables inventory..."
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
