import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
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
import { useWarehouseCMovedRows } from "../../shared/warehouseCTransferStore";
import type { WarehouseInventoryRow } from "../../shared/warehouseTableData";
import {
  fetchProductionColumnDropdown,
  fetchProductionWarehouseInventory,
  type ProductionInventoryItem,
} from "../api/productionWarehouseApi";
import { queryKeys } from "../../../../query/queryKeys";
import { useDebouncedValue } from "../../../../query/useDebouncedValue";
import { IssueForGroupingDialog } from "../IssueForGroupingDialog";
import {
  groupingIssuedLeavesBySource,
  groupingIssuedSliceAreas,
  parseLeafCount,
  withGroupingAvailability,
} from "../rawVeneerGroupingQuantity";
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

const rawVeneerApiColumnKeys: Record<string, string> = {
  receivedNoOfLeaves: "noOfLeaves",
  receivedSqf: "sqf",
  receivedSqm: "sqm",
};

const clientQuantityColumnKeys = new Set([
  "availableNoOfLeaves",
  "availableSqf",
  "availableSqm",
]);

function toApiColumnKey(columnKey: string) {
  return rawVeneerApiColumnKeys[columnKey] ?? columnKey;
}

function toApiColumnFilters(
  columnFilters: Partial<Record<string, ColumnFilterValue>>,
): Record<string, string[]> {
  const filters: Record<string, string[]> = {};
  for (const [key, filter] of Object.entries(columnFilters)) {
    if (!isActiveColumnFilter(filter) || clientQuantityColumnKeys.has(key)) continue;
    filters[toApiColumnKey(key)] = filter.values;
  }
  return filters;
}

function mapWarehouseCRawVeneerRow(row: WarehouseInventoryRow): RawVeneerRow {
  return {
    id: row.id,
    productionSrNo: "",
    storageSrNo: row.storageSrNo ?? row.veneerSrNo ?? "",
    inwardDate: row.inwardDate,
    inwardItemCode: row.inwardItemCode ?? "",
    itemName: row.itemName,
    factoryCode: row.factoryCode ?? "",
    subCategory: row.subCategory,
    length: row.length,
    width: row.width,
    thickness: row.thickness,
    noOfLeaves: row.noOfLeaves || row.totalUnits,
    sqm: row.totalSqm,
    sqf: row.totalSqf,
    grade: row.grade,
    currency: row.currency,
    amount: row.amount,
    totalAmount: row.totalAmount ?? row.amount,
    remark: row.remark,
    updatedBy: row.updatedBy ?? "",
    inventorySlug: "raw-veneer",
    inventoryRecordId: row.inventoryRecordId,
  };
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
  const [groupingIssueRow, setGroupingIssueRow] = useState<RawVeneerRow | null>(
    null,
  );
  const isWarehouseC = warehouseName.trim().toLowerCase() === "warehouse c";
  const warehouseCMovedRows = useWarehouseCMovedRows();
  const factoryIssuedWorkItems = useFactoryIssuedWorkItems();
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
  const debouncedSearch = useDebouncedValue(searchValue, 150);

  useEffect(() => {
    setPage(1);
  }, [searchValue, warehouseId]);

  const movedWarehouseRowIds = useMemo(
    () =>
      new Set(
        factoryIssuedWorkItems
          .filter(
            (item) =>
              item.sourceSlug === warehouseName &&
              item.destinationSlug !== "grouping",
          )
          .map((item) => item.sourceRowId),
      ),
    [factoryIssuedWorkItems, warehouseName],
  );

  const groupingIssuedLeavesByRowId = useMemo(
    () => groupingIssuedLeavesBySource(factoryIssuedWorkItems, warehouseName),
    [factoryIssuedWorkItems, warehouseName],
  );

  const apiFilters = toApiColumnFilters(columnFilters);
  const apiSortBy =
    sortBy && !clientQuantityColumnKeys.has(sortBy) ? toApiColumnKey(sortBy) : null;
  const listParams = {
    warehouseId,
    page,
    limit: rowsPerPage,
    search: debouncedSearch.trim(),
    sortBy: apiSortBy,
    sortOrder,
    filters: apiFilters,
  };
  const listQuery = useQuery({
    queryKey: queryKeys.warehouse.production.list("raw-veneer", listParams),
    enabled: Boolean(warehouseId),
    placeholderData: keepPreviousData,
    queryFn: () =>
      fetchProductionWarehouseInventory({
        warehouseId,
        tab: "raw-veneer",
        page,
        limit: rowsPerPage,
        ...(debouncedSearch.trim() ? { search: debouncedSearch.trim() } : {}),
        ...(apiSortBy ? { sortBy: apiSortBy } : {}),
        ...(sortOrder ? { sortOrder } : {}),
        ...(Object.keys(apiFilters).length > 0 ? { filters: apiFilters } : {}),
      }),
  });
  const rows =
    listQuery.data && Array.isArray(listQuery.data.items)
      ? listQuery.data.items.map(mapApiItem)
      : [];
  const isLoading = Boolean(warehouseId) && listQuery.isLoading;

  const visibleRows = useMemo(
    () => {
      const localRows =
        isWarehouseC && !warehouseId
          ? warehouseCMovedRows
              .filter((row) => row.inventorySlug === "raw-veneer")
              .map(mapWarehouseCRawVeneerRow)
          : [];
      return [...localRows, ...rows]
        .filter(
          (row) =>
            !marquetryIssuedRowIds.includes(String(row.id)) &&
            !movedWarehouseRowIds.has(String(row.id)),
        )
        .map((row) => withGroupingAvailability(row, groupingIssuedLeavesByRowId));
    },
    [
      groupingIssuedLeavesByRowId,
      isWarehouseC,
      marquetryIssuedRowIds,
      movedWarehouseRowIds,
      rows,
      warehouseCMovedRows,
      warehouseId,
    ],
  );
  const totalCount = warehouseId
    ? (listQuery.data?.total ?? 0)
    : visibleRows.length;

  useEffect(() => {
    onListQueryChange?.({
      sortBy: apiSortBy,
      sortOrder,
      filters: toApiColumnFilters(columnFilters),
      totalCount,
    });
  }, [apiSortBy, sortOrder, columnFilters, totalCount, onListQueryChange]);

  const loadDropdownOptions = useCallback(
    async (columnKey: string) => {
      if (!warehouseId) return;
      try {
        const result = await fetchProductionColumnDropdown({
          warehouseId,
          tab: "raw-veneer",
          column: toApiColumnKey(columnKey),
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

        list.push({
          id: "issue-for-grouping",
          label: "Issue for Grouping",
          icon: Plus,
          tone: "primary",
          onSelect: (row: RawVeneerRow) => {
            setGroupingIssueRow(withGroupingAvailability(row, groupingIssuedLeavesByRowId));
          },
        });
      }

      return list;
    },
    [canView, canEdit, groupingIssuedLeavesByRowId, navigate, warehouseId, warehouseName],
  );

  const groupingIssueAvailableLeaves = parseLeafCount(
    groupingIssueRow?.availableNoOfLeaves ?? groupingIssueRow?.noOfLeaves,
  );

  return (
    <>
    <IssueForGroupingDialog
      availableLeaves={groupingIssueAvailableLeaves}
      onClose={() => setGroupingIssueRow(null)}
      onConfirm={(leaves) => {
        if (!groupingIssueRow) return;
        const availableLeaves = parseLeafCount(groupingIssueRow.availableNoOfLeaves);
        if (!Number.isInteger(leaves) || leaves < 1 || leaves > availableLeaves) return;
        const issuedAreas = groupingIssuedSliceAreas(groupingIssueRow, leaves);
        issueFactoryWork({
          destinationProcess: "Grouping",
          sourceSlug: warehouseName,
          sourceProcess: "Inventory",
          sourceWarehouseName: warehouseName,
          sourceRow: {
            ...groupingIssueRow,
            itemName: groupingIssueRow.itemName,
            productName: groupingIssueRow.itemName,
            factoryCode: groupingIssueRow.factoryCode,
            subCategory: groupingIssueRow.subCategory,
            itemSubCategory: groupingIssueRow.subCategory,
            length: groupingIssueRow.length,
            width: groupingIssueRow.width,
            thickness: groupingIssueRow.thickness,
            height: groupingIssueRow.thickness,
            grade: groupingIssueRow.grade,
            currency: groupingIssueRow.currency,
            remark: groupingIssueRow.remark,
            updatedBy: groupingIssueRow.updatedBy,
            storageSrNo: groupingIssueRow.storageSrNo,
            noOfLeaves: String(leaves),
            sqm: issuedAreas.sqm,
            sqf: issuedAreas.sqf,
            totalSqMeter: issuedAreas.sqm,
            totalSqm: issuedAreas.sqm,
            totalSqf: issuedAreas.sqf,
            issuedLeafCount: String(leaves),
            groupingIssuedLeaves: String(leaves),
            issuedFrom: "Inventory",
            issuedFor: "Grouping",
            issuedDate: new Date(),
            issueDate: new Date(),
            warehouseName,
          } as FactoryRecord,
        });
        setGroupingIssueRow(null);
      }}
      open={Boolean(groupingIssueRow)}
      row={groupingIssueRow}
    />
    <EnterpriseDataTable
      key="production-raw-veneer"
      actions={actions}
      columns={rawVeneerColumns}
      columnFilters={columnFilters}
      emptyStateLabel="No raw veneer inventory records are available."
      filterOptionsByColumn={filterOptionsByColumn}
      loading={isLoading}
      loadingLabel="Loading raw veneer inventory..."
      getRowActions={(row) =>
        parseLeafCount(row.availableNoOfLeaves) >= 1
          ? actions
          : actions.filter((action) => action.id !== "issue-for-grouping")
      }
      onColumnFilterOpen={(columnKey) => {
        if (clientQuantityColumnKeys.has(columnKey)) return;
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
          if (clientQuantityColumnKeys.has(key)) return;
          setSortBy(key);
          setSortOrder(order);
          setPage(1);
        },
      }}
    />
    </>
  );
}
