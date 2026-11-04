import { useCallback, useEffect, useState } from "react";

import {
  toApiColumnFilters,
  type ColumnFilterValue,
} from "../../../components/shared/columnFilters";
import {
  packingDoneListingColumns,
  packingIssuedListingColumns,
  type PackingRecord,
  type PackingTabValue,
} from "../shared/packingStore";
import {
  fetchPackingList,
  fetchPackingColumnDropdown,
  type PackingApiItem,
} from "../api/packingApi";

export function mapApiItemToPackingRecord(item: PackingApiItem): PackingRecord {
  return {
    id: item.id,
    packingId: item.packingId ?? "",
    issuedFrom: item.issuedFrom ?? "",
    orderNo: item.orderNo,
    orderItemNo: item.orderItemNo,
    customerName: item.customerName,
    orderType: item.orderType,
    productCategory: item.productCategory,
    preparedBy: item.preparedBy ?? "",
    checkedBy: item.checkedBy ?? "",
    itemName: item.itemName,
    length: String(item.length ?? ""),
    width: String(item.width ?? ""),
    thickness: String(item.thickness ?? ""),
    noOfSheets: String(item.noOfSheets ?? ""),
    sqm: String(item.sqm ?? ""),
    sqf: String(item.sqf ?? ""),
    series: item.series ?? "",
    grade: item.grade ?? "",
    amount: String(item.amount ?? ""),
    remark: item.remark ?? "",
    sourceRef: item.sourceRef ?? "",
    packingDate: item.packingDate ? new Date(item.packingDate) : null,
    dispatchDate: item.dispatchDate ? new Date(item.dispatchDate) : null,
    createdBy: item.createdBy ?? "",
    updatedBy: item.updatedBy ?? "",
    createdDate: new Date(item.createdAt),
    updatedDate: new Date(item.updatedAt),
    packingState: item.packingState,
  };
}

export function usePackingList() {
  const [activeTab, setActiveTabState] = useState<PackingTabValue>("issued");
  const [searchValue, setSearchValueState] = useState("");
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalCount, setTotalCount] = useState(0);
  const [rows, setRows] = useState<PackingRecord[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [sortConfig, setSortConfig] = useState<{
    sortBy: string | null;
    sortOrder: "asc" | "desc" | null;
  }>({ sortBy: null, sortOrder: null });
  const [columnFilters, setColumnFilters] = useState<
    Partial<Record<string, ColumnFilterValue>>
  >({});
  const [filterOptionsByColumn, setFilterOptionsByColumn] = useState<
    Record<string, Array<{ value: string; label: string }>>
  >({});
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const columns =
    activeTab === "issued"
      ? packingIssuedListingColumns
      : packingDoneListingColumns;

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const apiFilters = toApiColumnFilters(columnFilters);
      const hasFilters = Object.keys(apiFilters).length > 0;
      const result = await fetchPackingList({
        tab: activeTab,
        page,
        limit: rowsPerPage,
        search: searchValue.trim() || undefined,
        sortBy: sortConfig.sortBy ?? undefined,
        sortOrder: (sortConfig.sortOrder ?? "desc") as "asc" | "desc",
        filters: hasFilters ? apiFilters : undefined,
      });
      setRows(result.items.map(mapApiItemToPackingRecord));
      setTotalCount(result.total);
    } catch (err) {
      console.error("Failed to load packing list:", err);
    } finally {
      setIsLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, page, rowsPerPage, searchValue, sortConfig, columnFilters, refreshTrigger]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const setActiveTab = (tab: PackingTabValue) => {
    setActiveTabState(tab);
    setPage(1);
    setColumnFilters({});
  };

  const setSearchValue = (v: string) => {
    setSearchValueState(v);
    setPage(1);
  };

  const onColumnFilterOpen = async (columnKey: string) => {
    if (filterOptionsByColumn[columnKey]) return;
    try {
      const values = await fetchPackingColumnDropdown(columnKey, activeTab);
      setFilterOptionsByColumn((prev) => ({
        ...prev,
        [columnKey]: values.map((v) => ({ value: v, label: v })),
      }));
    } catch (err) {
      console.error("Failed to load column filter options:", err);
    }
  };

  const refresh = () => setRefreshTrigger((n) => n + 1);

  return {
    activeTab,
    setActiveTab,
    columns,
    rows,
    searchValue,
    setSearchValue,
    page,
    setPage,
    rowsPerPage,
    setRowsPerPage,
    totalCount,
    isLoading,
    sortConfig,
    setSortConfig,
    columnFilters,
    setColumnFilters,
    filterOptionsByColumn,
    onColumnFilterOpen,
    refresh,
    apiFilters: toApiColumnFilters(columnFilters),
  };
}
