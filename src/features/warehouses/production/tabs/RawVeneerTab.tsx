import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  EnterpriseDataTable,
  type EnterpriseTableAction,
} from "../../../../components/data-display/EnterpriseDataTable";
import { Eye, Pencil, Plus } from "lucide-react";
import { useNavigate } from "react-router";
import {
  isActiveColumnFilter,
  type ColumnFilterValue,
} from "../../../shared/columnFilters";
import {
  rawVeneerColumns,
  type RawVeneerRow,
} from "../types/productionWarehouseTypes";
import {
  issueFactoryWork,
  useFactoryIssuedWorkItems,
} from "../../../factory/shared/factoryIssuedWorkStore";
import type { FactoryRecord } from "../../../factory/shared/types";
import {
  fetchProductionColumnDropdown,
  fetchProductionWarehouseInventory,
  type ProductionInventoryItem,
} from "../api/productionWarehouseApi";
import { getProductionInventoryRecordPath } from "../productionInventoryPaths";
import type { ProductionListQueryState } from "../productionListQuery";

export interface RawVeneerTabProps {
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

function mapApiItem(item: ProductionInventoryItem): RawVeneerRow {
  return {
    id: String(item.id),
    productionSrNo: String(item.productionSrNo ?? ""),
    storageSrNo: String(item.storageSrNo ?? ""),
    inwardDate: item.inwardDate,
    inwardItemCode: String(item.inwardItemCode ?? ""),
    itemName: String(item.itemName ?? ""),
    factoryCode: String(item.factoryCode ?? ""),
    subCategory: String(item.subCategory ?? ""),
    length: String(item.length ?? ""),
    width: String(item.width ?? ""),
    thickness: String(item.thickness ?? ""),
    noOfLeaves: String(item.noOfLeaves ?? ""),
    sqm: String(item.sqm ?? item.totalSqm ?? ""),
    sqf: String(item.sqf ?? item.totalSqf ?? ""),
    grade: String(item.grade ?? ""),
    currency: String(item.currency ?? ""),
    amount: String(item.amount ?? ""),
    totalAmount: String(item.totalAmount ?? item.amount ?? ""),
    remark: String(item.remark ?? ""),
    updatedBy: String(item.updatedBy ?? ""),
    inventorySlug: item.inventorySlug
      ? String(item.inventorySlug)
      : "raw-veneer",
    inventoryRecordId: item.inventoryRecordId
      ? String(item.inventoryRecordId)
      : String(item.id),
  };
}

export function RawVeneerTab({
  warehouseName,
  warehouseId,
  searchValue,
  canView,
  canEdit,
  onListQueryChange,
}: RawVeneerTabProps) {
  const navigate = useNavigate();
  const [marquetryIssuedRowIds, setMarquetryIssuedRowIds] = useState<string[]>(
    [],
  );
  const factoryIssuedWorkItems = useFactoryIssuedWorkItems();
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
  const [rows, setRows] = useState<RawVeneerRow[]>([]);
  const [isLoading, setIsLoading] = useState(Boolean(warehouseId));

  useEffect(() => {
    setPage(1);
  }, [searchValue, warehouseId]);

  const movedWarehouseRowIds = useMemo(
    () =>
      new Set(
        factoryIssuedWorkItems
          .filter((item) => item.sourceSlug === warehouseName)
          .map((item) => item.sourceRowId),
      ),
    [factoryIssuedWorkItems, warehouseName],
  );

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
        tab: "raw-veneer",
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

  const visibleRows = useMemo(
    () =>
      rows.filter(
        (row) =>
          !marquetryIssuedRowIds.includes(String(row.id)) &&
          !movedWarehouseRowIds.has(String(row.id)),
      ),
    [rows, marquetryIssuedRowIds, movedWarehouseRowIds],
  );

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
          tab: "raw-veneer",
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

  const actions = useMemo<ReadonlyArray<EnterpriseTableAction<RawVeneerRow>>>(
    () => {
      const list: EnterpriseTableAction<RawVeneerRow>[] = [];
      const returnTo = warehouseId
        ? `/warehouses/${warehouseId}?inventory=raw-veneer`
        : "/warehouse-c?section=inventory&inventory=raw-veneer";

      if (canView && warehouseId) {
        list.push({
          id: "view",
          label: "View",
          icon: Eye,
          onSelect: (row: RawVeneerRow) =>
            navigate(
              getProductionInventoryRecordPath({
                slug: "raw-veneer",
                id: row.inventoryRecordId || String(row.id),
                mode: "view",
                warehouseId,
                warehouseName,
                returnTo,
              }),
            ),
        });
      }

      if (canEdit && warehouseId) {
        list.push({
          id: "edit",
          label: "Edit",
          icon: Pencil,
          onSelect: (row: RawVeneerRow) =>
            navigate(
              getProductionInventoryRecordPath({
                slug: "raw-veneer",
                id: row.inventoryRecordId || String(row.id),
                mode: "edit",
                warehouseId,
                warehouseName,
                returnTo,
              }),
            ),
        });

        list.push({
          id: "issue-for-marquetry",
          label: "Issue for Marquetry",
          icon: Plus,
          tone: "primary",
          onSelect: (row: RawVeneerRow) => {
            issueFactoryWork({
              destinationProcess: "Marquetry",
              sourceSlug: warehouseName,
              sourceProcess: "Inventory",
              sourceWarehouseName: warehouseName,
              sourceRow: {
                ...row,
                issuedFrom: "Inventory",
                issuedFor: "Marquetry",
                issuedDate: new Date(),
                warehouseName,
              } as FactoryRecord,
            });
            setMarquetryIssuedRowIds((current) =>
              current.includes(String(row.id))
                ? current
                : [...current, String(row.id)],
            );
          },
        });
      }

      return list;
    },
    [canView, canEdit, navigate, warehouseId, warehouseName],
  );

  return (
    <EnterpriseDataTable
      key="production-raw-veneer"
      actions={actions}
      columns={rawVeneerColumns}
      columnFilters={columnFilters}
      emptyStateLabel="No raw veneer inventory records are available."
      filterOptionsByColumn={filterOptionsByColumn}
      loading={isLoading}
      loadingLabel="Loading raw veneer inventory..."
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
      rows={canView ? visibleRows : []}
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
