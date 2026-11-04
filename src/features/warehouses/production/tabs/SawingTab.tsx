import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type Dispatch,
  type SetStateAction,
} from "react";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { EnterpriseDataTable } from "../../../../components/data-display/EnterpriseDataTable";
import {
  toApiColumnFilters,
  type ColumnFilterValue,
} from "../../../shared/columnFilters";
import {
  fetchProductionColumnDropdown,
  fetchProductionWarehouseInventory,
  type ProductionInventoryItem,
} from "../api/productionWarehouseApi";
import { queryKeys } from "../../../../query/queryKeys";
import { useDebouncedValue } from "../../../../query/useDebouncedValue";
import {
  sawingColumns,
  type SawingRow,
} from "../types/productionWarehouseTypes";
import type { ProductionListQueryState } from "../productionListQuery";

export interface SawingTabProps {
  warehouseName: string;
  warehouseId?: string | undefined;
  searchValue: string;
  canView: boolean;
  canEdit: boolean;
  onExportReady?:
    | Dispatch<SetStateAction<SawingRow[]>>
    | ((rows: SawingRow[]) => void)
    | undefined;
  onListQueryChange?: ((query: ProductionListQueryState) => void) | undefined;
}

function mapApiItem(item: ProductionInventoryItem): SawingRow {
  return {
    id: String(item.id),
    storageSrNo: String(item.storageSrNo ?? ""),
    issuedDate: (item.inwardDate ?? item.issuedDate ?? "") as string | Date,
    sawingDate: (item.sawingDate ?? item.processDate ?? "") as string | Date,
    itemName: String(item.itemName ?? ""),
    subCategory: String(item.subCategory ?? item.itemSubCategory ?? ""),
    batchNo: String(item.batchNo ?? item.logNo ?? ""),
    batchNoCode: String(item.batchNoCode ?? ""),
    length: String(item.length ?? ""),
    width: String(item.width ?? ""),
    thickness: String(item.thickness ?? item.height ?? ""),
    cbm: String(item.cbm ?? ""),
    cbf: String(item.cbf ?? ""),
    remark: String(item.remark ?? ""),
    createdBy: String(item.createdBy ?? ""),
    updatedBy: String(item.updatedBy ?? ""),
    createdAt: item.createdAt ? (item.createdAt as string | Date) : undefined,
    updatedAt: item.updatedAt ? (item.updatedAt as string | Date) : undefined,
    inventorySlug: "sawing",
    inventoryRecordId: item.inventoryRecordId
      ? String(item.inventoryRecordId)
      : String(item.id),
  };
}

export function SawingTab({
  searchValue,
  warehouseId,
  canView,
  onExportReady,
  onListQueryChange,
}: SawingTabProps) {
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [sortBy, setSortBy] = useState<string | null>("storageSrNo");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc" | null>("desc");
  const [columnFilters, setColumnFilters] = useState<
    Partial<Record<string, ColumnFilterValue>>
  >({});
  const [filterOptionsByColumn, setFilterOptionsByColumn] = useState<
    Record<string, Array<{ value: string; label: string }>>
  >({});
  const debouncedSearch = useDebouncedValue(searchValue, 150);

  useEffect(() => {
    setPage(1);
  }, [searchValue, warehouseId]);

  const apiFilters = toApiColumnFilters(columnFilters);
  const listParams = {
    warehouseId,
    page,
    limit: rowsPerPage,
    search: debouncedSearch.trim(),
    sortBy,
    sortOrder,
    filters: apiFilters,
  };
  const listQuery = useQuery({
    queryKey: queryKeys.warehouse.production.list("sawing", listParams),
    enabled: Boolean(warehouseId),
    placeholderData: keepPreviousData,
    queryFn: () =>
      fetchProductionWarehouseInventory({
        warehouseId,
        tab: "sawing",
        page,
        limit: rowsPerPage,
        ...(debouncedSearch.trim() ? { search: debouncedSearch.trim() } : {}),
        ...(sortBy ? { sortBy } : {}),
        ...(sortOrder ? { sortOrder } : {}),
        ...(Object.keys(apiFilters).length > 0 ? { filters: apiFilters } : {}),
      }),
  });

  const rows =
    listQuery.data && Array.isArray(listQuery.data.items)
      ? listQuery.data.items.map(mapApiItem)
      : [];
  const totalCount = listQuery.data?.total ?? 0;
  const isLoading = Boolean(warehouseId) && listQuery.isLoading;

  useEffect(() => {
    onListQueryChange?.({
      sortBy,
      sortOrder,
      filters: apiFilters,
      totalCount,
    });
  }, [sortBy, sortOrder, apiFilters, totalCount, onListQueryChange]);

  useEffect(() => {
    onExportReady?.(rows);
  }, [onExportReady, rows]);

  const loadDropdownOptions = useCallback(
    async (columnKey: string) => {
      if (!warehouseId) return;
      try {
        const result = await fetchProductionColumnDropdown({
          warehouseId,
          tab: "sawing",
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

  return (
    <EnterpriseDataTable
      key="production-sawing"
      actions={[]}
      columns={sawingColumns}
      columnFilters={columnFilters}
      emptyStateLabel="No sawing inventory records are available."
      filterOptionsByColumn={filterOptionsByColumn}
      loading={isLoading}
      loadingLabel="Loading sawing inventory..."
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
