import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { invalidateMaster } from "../../../../query/queryClient";
import { queryKeys } from "../../../../query/queryKeys";
import { useColumnDropdownQuery } from "../../../../query/useColumnDropdownQuery";
import { useMasterListQuery } from "../../../../query/useMasterListQuery";
import { useParams } from "react-router";
import { MasterFormPage, MasterListingPage } from "../../shared";
import type { MasterRecord } from "../../shared/types";
import type { ColumnFilterValue } from "../../../shared/columnFilters";
import { isActiveColumnFilter } from "../../../shared/columnFilters";
import { currencyMasterDefinition } from "../mock/currencyMasterData";
import {
  createCurrencyApi,
  fetchCurrenciesPaginated,
  fetchCurrencyColumnDropdown,
  getCurrencyByIdApi,
  syncCurrencyMasterToStorage,
  updateCurrencyApi,
  updateCurrencyStatusApi,
} from "../currencyMasterApi";

const CURRENCY_SORT_FIELD_MAP: Record<string, string> = {
  currencyName: "name",
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

function mapCurrencySortField(columnKey: string | null): string | undefined {
  if (!columnKey) return undefined;
  return CURRENCY_SORT_FIELD_MAP[columnKey];
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

export function CurrencyMasterListPage() {
  const queryClient = useQueryClient();
  const [searchValue, setSearchValue] = useState("");
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [sortBy, setSortBy] = useState<string | null>(null);
  const [sortOrder, setSortOrder] = useState<"asc" | "desc" | null>(null);
  const [columnFilters, setColumnFilters] = useState<Partial<Record<string, ColumnFilterValue>>>({});
  const [actionError, setActionError] = useState("");
  const { filterOptionsByColumn, loadColumnDropdown } = useColumnDropdownQuery(
    queryKeys.masters.columnDropdowns("currency"),
    fetchCurrencyColumnDropdown,
  );
  const apiSortBy = mapCurrencySortField(sortBy);
  const apiFilters = toApiColumnFilters(columnFilters);
  const listQuery = useMasterListQuery({
    master: "currency",
    page,
    rowsPerPage,
    search: searchValue,
    ...(apiSortBy ? { sortBy: apiSortBy } : {}),
    sortOrder,
    filters: apiFilters,
    fetchPage: fetchCurrenciesPaginated,
    onLoaded: syncCurrencyMasterToStorage,
  });
  const rows = listQuery.rows;
  const totalCount = listQuery.totalCount;
  const isLoading = listQuery.isLoading;
  const errorMessage =
    actionError ||
    (listQuery.error instanceof Error ? listQuery.error.message : "");

  const handleStatusToggle = useCallback(async (row: MasterRecord, checked: boolean) => {
    try {
      await updateCurrencyStatusApi(row.id, checked);
      setActionError("");
      await queryClient.invalidateQueries({ queryKey: queryKeys.masters.all("currency") });
    } catch (error) {
      setActionError(
        error instanceof Error ? error.message : "Unable to update currency status.",
      );
    }
  }, [queryClient]);

  const handleSearchChange = useCallback((value: string) => { setSearchValue(value); setPage(1); }, []);
  const handleRowsPerPageChange = useCallback((nextRowsPerPage: number) => { setRowsPerPage(nextRowsPerPage); setPage(1); }, []);
  const handleSortChange = useCallback((nextSortBy: string, nextSortOrder: "asc" | "desc") => { setSortBy(nextSortBy); setSortOrder(nextSortOrder); setPage(1); }, []);
  const handleColumnFiltersChange = useCallback((nextFilters: Partial<Record<string, ColumnFilterValue>>) => { setColumnFilters(nextFilters); setPage(1); }, []);

  return (
    <MasterListingPage
      definition={currencyMasterDefinition}
      errorMessage={errorMessage}
      loading={isLoading}
      onSearchChange={handleSearchChange}
      onStatusChange={handleStatusToggle}
      pagination={{ page, rowsPerPage, totalCount, onPageChange: setPage, onRowsPerPageChange: handleRowsPerPageChange }}
      sorting={{ sortBy, sortOrder, onSortChange: handleSortChange }}
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

export function AddCurrencyMasterPage() {
  return <CurrencyMasterFormPage mode="add" />;
}

export function EditCurrencyMasterPage() {
  return <CurrencyMasterFormPage mode="edit" />;
}

export function ViewCurrencyMasterPage() {
  return <CurrencyMasterFormPage mode="view" />;
}

function CurrencyMasterFormPage({ mode }: { mode: "add" | "edit" | "view" }) {
  const params = useParams<{ id: string }>();
  const [record, setRecord] = useState<MasterRecord | undefined>();
  const [isLoading, setIsLoading] = useState(mode !== "add");
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    let ignore = false;
    async function loadDetail() {
      setErrorMessage("");
      if (mode === "add") { setRecord(undefined); setIsLoading(false); return; }
      if (!params.id) { setRecord(undefined); setIsLoading(false); setErrorMessage("Currency id is missing."); return; }
      setIsLoading(true);
      try {
        const item = await getCurrencyByIdApi(params.id);
        if (!ignore) setRecord(item ?? undefined);
      } catch (error) {
        if (!ignore) setErrorMessage(error instanceof Error ? error.message : "Unable to load currency.");
      } finally {
        if (!ignore) setIsLoading(false);
      }
    }
    void loadDetail();
    return () => { ignore = true; };
  }, [mode, params.id]);

  return (
    <MasterFormPage
      definition={currencyMasterDefinition}
      errorMessage={errorMessage}
      loading={isLoading}
      mode={mode}
      {...(record ? { record } : {})}
      onSave={async ({ mode: saveMode, row, values }) => {
        const currencyName = String(values.currencyName || values.name || "");
        const remark =
          typeof values.remark === "string"
            ? values.remark
            : typeof values.remarks === "string"
              ? values.remarks
              : null;
        const status =
          typeof values.status === "boolean" || typeof values.status === "string"
            ? values.status
            : undefined;

        if (saveMode === "edit" && row?.id) {
          await updateCurrencyApi(row.id, {
            currencyName,
            remark,
            ...(status !== undefined ? { status } : {}),
          });
          void invalidateMaster("currency");
          return;
        }
        await createCurrencyApi({
          currencyName,
          remark,
          status: status ?? true,
        });
        void invalidateMaster("currency");
      }}
    />
  );
}
