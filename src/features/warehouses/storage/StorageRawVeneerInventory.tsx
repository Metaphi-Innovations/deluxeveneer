import { useCallback, useEffect, useState } from "react";
import { Alert, Stack } from "@mui/material";
import {
  EnterpriseDataTable,
  type EnterpriseTableColumn,
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
import type { StorageInventoryPanelProps } from "./types";

const rawVeneerColumns: readonly EnterpriseTableColumn<WarehouseInventoryRow>[] = [
  { key: "inwardSrNo", label: "Inward Sr No" },
  { key: "inwardDate", label: "Inward Date" },
  { key: "invoiceNo", label: "Invoice No" },
  { key: "supplierName", label: "Supplier" },
  { key: "itemName", label: "Item Name" },
  { key: "subCategory", label: "Sub Category" },
  { key: "logCode", label: "Log Code" },
  { key: "bundleNumber", label: "Bundle No" },
  { key: "palletNo", label: "Pallet No" },
  { key: "length", label: "Length" },
  { key: "width", label: "Width" },
  { key: "thickness", label: "Thickness" },
  { key: "noOfLeaves", label: "Leaves" },
  { key: "totalNoOfSheets", label: "Sheets" },
  { key: "totalSqm", label: "Total SQM" },
  { key: "totalSqf", label: "Total SQF" },
  { key: "rate" as any, label: "Rate" },
  { key: "amount", label: "Amount" },
  { key: "totalAmount", label: "Total Amount" },
  { key: "currency", label: "Currency" },
  { key: "qcStatus", label: "QC Status" },
  { key: "remark", label: "Remark" },
];

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

interface StorageRawVeneerInventoryProps extends StorageInventoryPanelProps {
  searchValue?: string;
  onRefreshTrigger?: number;
}

export function StorageRawVeneerInventory({
  warehouseId,
  section,
  searchValue = "",
  onRefreshTrigger = 0,
}: StorageRawVeneerInventoryProps) {
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
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const loadData = useCallback(async () => {
    if (!warehouseId) return;
    setIsLoading(true);
    setErrorMessage("");

    try {
      const apiFilters = toApiColumnFilters(columnFilters);
      const result = await fetchStorageInventoryPaginated("raw-veneer", {
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
          mapStorageItemToRow(item, "raw-veneer")
        )
      );
      setTotalCount(result.pagination.total);
    } catch (error) {
      setRows([]);
      setTotalCount(0);
      setErrorMessage(
        error instanceof Error ? error.message : "Failed to load raw veneer."
      );
    } finally {
      setIsLoading(false);
    }
  }, [warehouseId, section, page, rowsPerPage, searchValue, sortBy, sortOrder, columnFilters, onRefreshTrigger]);

  useEffect(() => {
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
          "raw-veneer",
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
    [warehouseId]
  );

  const emptyLabel =
    section === "history"
      ? "No raw veneer history records are available."
      : "No raw veneer inventory records are available.";

  return (
    <Stack spacing={2}>
      {errorMessage ? <Alert severity="error">{errorMessage}</Alert> : null}
      <EnterpriseDataTable
        columns={rawVeneerColumns}
        rows={isLoading ? [] : rows}
        filterOptionsByColumn={filterOptionsByColumn}
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
      />
    </Stack>
  );
}
