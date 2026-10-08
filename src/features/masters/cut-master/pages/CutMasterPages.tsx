import { useCallback, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { MasterFormPage, MasterListingPage } from "../../shared";
import type { MasterDefinition, MasterRecord } from "../../shared/types";
import type { ColumnFilterValue } from "../../../shared/columnFilters";
import { isActiveColumnFilter } from "../../../shared/columnFilters";
import { cutMasterDefinition } from "../mock/cutMasterData";
import {
  createCutApi,
  fetchCutsApi,
  fetchCutsPaginated,
  fetchCutColumnDropdown,
  syncCutMasterToStorage,
  updateCutApi,
  updateCutStatusApi,
} from "../cutMasterApi";
import { invalidateMaster } from "../../../../query/queryClient";
import { queryKeys } from "../../../../query/queryKeys";
import { useColumnDropdownQuery } from "../../../../query/useColumnDropdownQuery";
import { useMasterListQuery } from "../../../../query/useMasterListQuery";

const CUT_SORT_FIELD_MAP: Record<string, string> = {
  cutName: "name",
  name: "name",
  remark: "remarks",
  remarks: "remarks",
  status: "status",
  createdDate: "createdAt",
  createdAt: "createdAt",
  createdBy: "createdAt",
  updatedDate: "updatedAt",
  updatedAt: "updatedAt",
  editedBy: "updatedAt",
  updatedBy: "updatedAt",
};

function mapCutSortField(columnKey: string | null): string | undefined {
  if (!columnKey) return undefined;
  return CUT_SORT_FIELD_MAP[columnKey];
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

export function CutMasterListPage() {
  const queryClient = useQueryClient();
  const [searchValue, setSearchValue] = useState("");
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [sortBy, setSortBy] = useState<string | null>(null);
  const [sortOrder, setSortOrder] = useState<"asc" | "desc" | null>(null);
  const [columnFilters, setColumnFilters] = useState<Partial<Record<string, ColumnFilterValue>>>({});
  const [actionError, setActionError] = useState("");
  const { filterOptionsByColumn, loadColumnDropdown } = useColumnDropdownQuery(
    queryKeys.masters.columnDropdowns("cut"),
    fetchCutColumnDropdown,
  );
  const apiSortBy = mapCutSortField(sortBy);
  const apiFilters = toApiColumnFilters(columnFilters);
  const listQuery = useMasterListQuery({
    master: "cut",
    page,
    rowsPerPage,
    search: searchValue,
    ...(apiSortBy ? { sortBy: apiSortBy } : {}),
    sortOrder,
    filters: apiFilters,
    fetchPage: fetchCutsPaginated,
    onLoaded: syncCutMasterToStorage,
  });
  const rows = listQuery.rows;
  const totalCount = listQuery.totalCount;
  const isLoading = listQuery.isLoading;
  const errorMessage =
    actionError ||
    (listQuery.error instanceof Error ? listQuery.error.message : "");

  const handleStatusToggle = useCallback(async (row: MasterRecord, checked: boolean) => {
    try {
      await updateCutStatusApi(row.id, checked);
      setActionError("");
      await queryClient.invalidateQueries({ queryKey: queryKeys.masters.all("cut") });
    } catch (error) {
      setActionError(
        error instanceof Error ? error.message : "Unable to update cut status.",
      );
    }
  }, [queryClient]);

  const handleSearchChange = useCallback((value: string) => {
    setSearchValue(value);
    setPage(1);
  }, []);

  const handleRowsPerPageChange = useCallback((nextRowsPerPage: number) => {
    setRowsPerPage(nextRowsPerPage);
    setPage(1);
  }, []);

  const handleSortChange = useCallback(
    (nextSortBy: string, nextSortOrder: "asc" | "desc") => {
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

  return (
    <MasterListingPage
      definition={cutMasterDefinition}
      errorMessage={errorMessage}
      loading={isLoading}
      onSearchChange={handleSearchChange}
      onStatusChange={handleStatusToggle}
      pagination={{
        page,
        rowsPerPage,
        totalCount,
        onPageChange: setPage,
        onRowsPerPageChange: handleRowsPerPageChange,
      }}
      sorting={{
        sortBy,
        sortOrder,
        onSortChange: handleSortChange,
      }}
      columnFilters={columnFilters}
      onColumnFilterOpen={(columnKey) => { void loadColumnDropdown(columnKey); }}
      onColumnFiltersChange={handleColumnFiltersChange}
      filterOptionsByColumn={filterOptionsByColumn}
      rows={rows}
      searchValue={searchValue}
      serverSearch
    />
  );
}

export function AddCutMasterPage() {
  const handleSave = async (context: {
    definition: MasterDefinition;
    mode: "add" | "edit";
    row?: MasterRecord;
    values: Record<string, any>;
  }) => {
    try {
      const created = await createCutApi({
        cutName: String(context.values.cutName || context.values.name || ""),
        remark: context.values.remark || context.values.remarks || null,
        status: context.values.status ?? true,
      });
      if (created) {
        const allRecords = await fetchCutsApi();
        if (allRecords.length > 0) {
          syncCutMasterToStorage(allRecords);
        }
      }
      void invalidateMaster("cut");
    } catch (error) {
      console.warn("Failed to create cut via API:", error);
    }
  };

  return (
    <MasterFormPage
      definition={cutMasterDefinition}
      mode="add"
      onSave={handleSave}
    />
  );
}

export function EditCutMasterPage() {
  const handleSave = async (context: {
    definition: MasterDefinition;
    mode: "add" | "edit";
    row?: MasterRecord;
    values: Record<string, any>;
  }) => {
    if (context.row?.id) {
      try {
        const updated = await updateCutApi(context.row.id, {
          cutName: String(context.values.cutName || context.values.name || ""),
          remark: context.values.remark || context.values.remarks || null,
          status: context.values.status,
        });
        if (updated) {
          const allRecords = await fetchCutsApi();
          if (allRecords.length > 0) {
            syncCutMasterToStorage(allRecords);
          }
        }
        void invalidateMaster("cut");
      } catch (error) {
        console.warn("Failed to update cut via API:", error);
      }
    }
  };

  return (
    <MasterFormPage
      definition={cutMasterDefinition}
      mode="edit"
      onSave={handleSave}
    />
  );
}

export function ViewCutMasterPage() {
  return <MasterFormPage definition={cutMasterDefinition} mode="view" />;
}
