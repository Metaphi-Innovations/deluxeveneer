import { useCallback, useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { MasterFormPage, MasterListingPage } from "../../shared";
import type { MasterDefinition, MasterRecord } from "../../shared/types";
import type { ColumnFilterValue } from "../../../shared/columnFilters";
import { isActiveColumnFilter } from "../../../shared/columnFilters";
import { hsnMasterDefinition } from "../mock/hsnMasterData";
import {
  createHsnApi,
  fetchHsnsApi,
  fetchHsnsPaginated,
  fetchHsnColumnDropdown,
  syncHsnMasterToStorage,
  updateHsnApi,
  updateHsnStatusApi,
} from "../hsnMasterApi";
import {
  fetchGstsApi,
  syncGstMasterToStorage,
} from "../../gst-master/gstMasterApi";
import { invalidateMaster } from "../../../../query/queryClient";
import { queryKeys } from "../../../../query/queryKeys";
import { useColumnDropdownQuery } from "../../../../query/useColumnDropdownQuery";
import { useMasterListQuery } from "../../../../query/useMasterListQuery";

const HSN_SORT_FIELD_MAP: Record<string, string> = {
  hsnCode: "code",
  code: "code",
  hsnCodeDescription: "description",
  description: "description",
  status: "status",
  createdDate: "createdAt",
  createdAt: "createdAt",
  createdBy: "createdAt",
  updatedDate: "updatedAt",
  updatedAt: "updatedAt",
  editedBy: "updatedAt",
  updatedBy: "updatedAt",
};

function mapHsnSortField(columnKey: string | null): string | undefined {
  if (!columnKey) return undefined;
  return HSN_SORT_FIELD_MAP[columnKey];
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

export function HSNMasterListPage() {
  const queryClient = useQueryClient();
  const [searchValue, setSearchValue] = useState("");
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [sortBy, setSortBy] = useState<string | null>(null);
  const [sortOrder, setSortOrder] = useState<"asc" | "desc" | null>(null);
  const [columnFilters, setColumnFilters] = useState<Partial<Record<string, ColumnFilterValue>>>({});
  const [actionError, setActionError] = useState("");
  const { filterOptionsByColumn, loadColumnDropdown } = useColumnDropdownQuery(
    queryKeys.masters.columnDropdowns("hsn"),
    fetchHsnColumnDropdown,
  );
  const apiSortBy = mapHsnSortField(sortBy);
  const apiFilters = toApiColumnFilters(columnFilters);
  const listQuery = useMasterListQuery({
    master: "hsn",
    page,
    rowsPerPage,
    search: searchValue,
    ...(apiSortBy ? { sortBy: apiSortBy } : {}),
    sortOrder,
    filters: apiFilters,
    fetchPage: fetchHsnsPaginated,
    onLoaded: syncHsnMasterToStorage,
  });
  const rows = listQuery.rows;
  const totalCount = listQuery.totalCount;
  const isLoading = listQuery.isLoading;
  const errorMessage =
    actionError ||
    (listQuery.error instanceof Error ? listQuery.error.message : "");

  const handleStatusToggle = useCallback(async (row: MasterRecord, checked: boolean) => {
    try {
      await updateHsnStatusApi(row.id, checked);
      setActionError("");
      await queryClient.invalidateQueries({ queryKey: queryKeys.masters.all("hsn") });
    } catch (error) {
      setActionError(
        error instanceof Error ? error.message : "Unable to update HSN status.",
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
    (nextSortBy: string | null, nextSortOrder: "asc" | "desc" | null) => {
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
      definition={hsnMasterDefinition}
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

export function AddHSNMasterPage() {
  const [definition, setDefinition] = useState<MasterDefinition>(hsnMasterDefinition);

  useEffect(() => {
    fetchGstsApi().then((gstRecords) => {
      if (gstRecords && gstRecords.length > 0) {
        syncGstMasterToStorage(gstRecords);
        const options: string[] = Array.from(
          new Set(
            gstRecords
              .filter((r: MasterRecord) => String(r.status ?? "Active").toLowerCase() !== "inactive")
              .map((r: MasterRecord) => {
                const val = r.gstPercentage || r.percentage;
                return String(val).endsWith("%") ? String(val) : `${val}%`;
              })
              .filter((val): val is string => Boolean(val)),
          ),
        );

        if (options.length > 0) {
          setDefinition((prev) => ({
            ...prev,
            fields: prev.fields.map((field) =>
              field.key === "gstPercentage" || field.key === "gst"
                ? { ...field, options }
                : field,
            ),
          }));
        }
      }
    }).catch(() => {});
  }, []);

  const handleSave = async (context: {
    definition: MasterDefinition;
    mode: "add" | "edit";
    row?: MasterRecord;
    values: Record<string, any>;
  }) => {
    try {
      const created = await createHsnApi({
        hsnCode: String(context.values.hsnCode || context.values.code || ""),
        hsnCodeDescription: String(context.values.hsnCodeDescription || context.values.description || ""),
        gstPercentage: context.values.gstPercentage || context.values.gst || "18%",
        remark: context.values.remark || context.values.remarks || null,
        status: context.values.status ?? true,
      });
      if (created) {
        const allRecords = await fetchHsnsApi();
        if (allRecords.length > 0) {
          syncHsnMasterToStorage(allRecords);
        }
      }
      void invalidateMaster("hsn");
    } catch (error) {
      console.warn("Failed to create HSN record via API, fallback will persist locally:", error);
    }
  };

  return (
    <MasterFormPage
      definition={definition}
      mode="add"
      onSave={handleSave}
    />
  );
}

export function EditHSNMasterPage() {
  const [definition, setDefinition] = useState<MasterDefinition>(hsnMasterDefinition);

  useEffect(() => {
    fetchGstsApi().then((gstRecords: MasterRecord[]) => {
      if (gstRecords && gstRecords.length > 0) {
        syncGstMasterToStorage(gstRecords);
        const options: string[] = Array.from(
          new Set(
            gstRecords
              .filter((r: MasterRecord) => String(r.status ?? "Active").toLowerCase() !== "inactive")
              .map((r: MasterRecord) => {
                const val = r.gstPercentage || r.percentage;
                return String(val).endsWith("%") ? String(val) : `${val}%`;
              })
              .filter((val): val is string => Boolean(val)),
          ),
        );

        if (options.length > 0) {
          setDefinition((prev) => ({
            ...prev,
            fields: prev.fields.map((field) =>
              field.key === "gstPercentage" || field.key === "gst"
                ? { ...field, options }
                : field,
            ),
          }));
        }
      }
    }).catch(() => {});
  }, []);

  const handleSave = async (context: {
    definition: MasterDefinition;
    mode: "add" | "edit";
    row?: MasterRecord;
    values: Record<string, any>;
  }) => {
    if (context.row?.id) {
      try {
        const updated = await updateHsnApi(context.row.id, {
          hsnCode: String(context.values.hsnCode || context.values.code || ""),
          hsnCodeDescription: String(context.values.hsnCodeDescription || context.values.description || ""),
          gstPercentage: context.values.gstPercentage || context.values.gst,
          remark: context.values.remark || context.values.remarks || null,
          status: context.values.status,
        });
        if (updated) {
          const allRecords = await fetchHsnsApi();
          if (allRecords.length > 0) {
            syncHsnMasterToStorage(allRecords);
          }
        }
        void invalidateMaster("hsn");
      } catch (error) {
        console.warn("Failed to update HSN record via API, fallback will persist locally:", error);
      }
    }
  };

  return (
    <MasterFormPage
      definition={definition}
      mode="edit"
      onSave={handleSave}
    />
  );
}

export function ViewHSNMasterPage() {
  return <MasterFormPage definition={hsnMasterDefinition} mode="view" />;
}
