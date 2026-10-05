import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  EnterpriseDataTable,
} from "../../../../components/data-display/EnterpriseDataTable";
import {
  isActiveColumnFilter,
  type ColumnFilterValue,
} from "../../../shared/columnFilters";
import {
  consumablesColumns,
  type ConsumablesRow,
} from "../types/productionWarehouseTypes";
import {
  fetchProductionColumnDropdown,
  fetchProductionWarehouseInventory,
  type ProductionInventoryItem,
} from "../api/productionWarehouseApi";
import type { ProductionListQueryState } from "../productionListQuery";

export interface ConsumablesTabProps {
  warehouseName: string;
  warehouseId?: string | undefined;
  searchValue: string;
  canView: boolean;
  canEdit: boolean;
  onListQueryChange?: ((query: ProductionListQueryState) => void) | undefined;
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

function mapApiItem(item: ProductionInventoryItem): ConsumablesRow {
  const qtyFallback = item.noOfSheets ?? item.totalNoOfSheets ?? "";
  return {
    id: String(item.id),
    productionSrNo: String(item.productionSrNo ?? ""),
    storageSrNo: String(item.storageSrNo ?? ""),
    inwardDate: item.inwardDate,
    inwardItemCode: String(item.inwardItemCode ?? ""),
    itemName: String(item.itemName ?? ""),
    factoryCode: String(item.factoryCode ?? ""),
    receivedQuantity: String(item.receivedQuantity ?? qtyFallback ?? ""),
    availableQuantity: String(item.availableQuantity ?? qtyFallback ?? ""),
    currency: String(item.currency ?? ""),
    amount: String(item.amount ?? ""),
    totalAmount: String(item.totalAmount ?? item.amount ?? ""),
    remark: String(item.remark ?? ""),
    updatedBy: String(item.updatedBy ?? ""),
    inventorySlug: item.inventorySlug
      ? String(item.inventorySlug)
      : "consumables",
    inventoryRecordId: item.inventoryRecordId
      ? String(item.inventoryRecordId)
      : String(item.id),
  };
}

export function ConsumablesTab({
  warehouseId,
  searchValue,
  canView,
  onListQueryChange,
}: ConsumablesTabProps) {
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
  const [rows, setRows] = useState<ConsumablesRow[]>([]);
  const [isLoading, setIsLoading] = useState(Boolean(warehouseId));

  useEffect(() => {
    setPage(1);
  }, [searchValue, warehouseId]);

  const loadData = useCallback(async () => {
    if (!warehouseId) {
      setRows([]);
      setTotalCount(0);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      const apiFilters = toApiColumnFilters(columnFilters);
      const data = await fetchProductionWarehouseInventory({
        warehouseId,
        tab: "consumables",
        page,
        limit: rowsPerPage,
        ...(searchValue.trim() ? { search: searchValue.trim() } : {}),
        ...(sortBy ? { sortBy } : {}),
        ...(sortOrder ? { sortOrder } : {}),
        ...(Object.keys(apiFilters).length > 0 ? { filters: apiFilters } : {}),
      });

      setRows(
        data && Array.isArray(data.items) ? data.items.map(mapApiItem) : [],
      );
      setTotalCount(data?.total ?? 0);
    } catch {
      setRows([]);
      setTotalCount(0);
    } finally {
      setIsLoading(false);
    }
  }, [
    warehouseId,
    page,
    rowsPerPage,
    searchValue,
    sortBy,
    sortOrder,
    columnFilters,
  ]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadData();
    }, 150);
    return () => window.clearTimeout(timer);
  }, [loadData]);

  useEffect(() => {
    onListQueryChange?.({
      sortBy,
      sortOrder,
      filters: toApiColumnFilters(columnFilters),
      totalCount,
    });
  }, [sortBy, sortOrder, columnFilters, totalCount, onListQueryChange]);

  const loadDropdownOptions = useCallback(
    async (columnKey: string) => {
      if (!warehouseId) return;
      try {
        const result = await fetchProductionColumnDropdown({
          warehouseId,
          tab: "consumables",
          column: columnKey,
        });
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
    [warehouseId],
  );

  const actions = useMemo(() => [], []);

  return (
    <EnterpriseDataTable
      key="production-consumables"
      actions={actions}
      columns={consumablesColumns}
      columnFilters={columnFilters}
      emptyStateLabel="No consumables inventory records are available."
      filterOptionsByColumn={filterOptionsByColumn}
      loading={isLoading}
      loadingLabel="Loading consumables inventory..."
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
      rows={canView ? rows : []}
      sorting={{
        sortBy,
        sortOrder,
        onSortChange: (key: string, order: "asc" | "desc") => {
          setSortBy(key);
          setSortOrder(order);
          setPage(1);
        },
      }}
    />
  );
}
