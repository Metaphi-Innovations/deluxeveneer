import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { invalidateMaster } from "../../../../query/queryClient";
import { queryKeys } from "../../../../query/queryKeys";
import { useColumnDropdownQuery } from "../../../../query/useColumnDropdownQuery";
import { useMasterListQuery } from "../../../../query/useMasterListQuery";
import { useParams } from "react-router";

import {
  MasterFormPage,
  MasterListingPage,
  type MasterRecord,
} from "../../shared";
import type { ColumnFilterValue } from "../../../shared/columnFilters";
import { isActiveColumnFilter } from "../../../shared/columnFilters";
import { transporterMasterDefinition } from "../transporterMasterDefinition";
import {
  createTransporterMasterRecord,
  fetchTransporterMasterColumnDropdown,
  fetchTransporterMasterDetail,
  fetchTransporterMasterMeta,
  fetchTransporterMasterPaginated,
  refreshTransporterMasterCache,
  updateTransporterMasterRecord,
  updateTransporterMasterStatus,
  type TransporterMasterDetail,
} from "../api/transporterMasterApi";

const TRANSPORTER_SORT_FIELD_MAP: Record<string, string> = {
  transporterName: "name",
  name: "name",
  branchName: "branchName",
  transporterId: "transporterCode",
  transporterCode: "transporterCode",
  type: "type",
  areaOfOperation: "areaOfOperation",
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

const STATIC_TRANSPORTER_TYPE_OPTIONS = ["Road", "Air", "Rail"];

function mapTransporterSortField(columnKey: string | null): string | undefined {
  if (!columnKey) {
    return undefined;
  }

  return TRANSPORTER_SORT_FIELD_MAP[columnKey];
}

function toApiColumnFilters(
  columnFilters: Partial<Record<string, ColumnFilterValue>>,
): Record<string, string[]> {
  const filters: Record<string, string[]> = {};

  for (const [key, filter] of Object.entries(columnFilters)) {
    if (!isActiveColumnFilter(filter)) {
      continue;
    }

    filters[key] = filter.values;
  }

  return filters;
}

export function TransporterMasterListPage() {
  const queryClient = useQueryClient();
  const [searchValue, setSearchValue] = useState("");
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [sortBy, setSortBy] = useState<string | null>(null);
  const [sortOrder, setSortOrder] = useState<"asc" | "desc" | null>(null);
  const [columnFilters, setColumnFilters] = useState<
    Partial<Record<string, ColumnFilterValue>>
  >({});
  const [actionError, setActionError] = useState("");
  const { filterOptionsByColumn, loadColumnDropdown } = useColumnDropdownQuery(
    queryKeys.masters.columnDropdowns("transporter"),
    fetchTransporterMasterColumnDropdown,
  );

  const definition = useMemo(
    () => ({
      ...transporterMasterDefinition,
      filters: transporterMasterDefinition.filters.map((filter) => {
        if (filter.key === "type") {
          return { ...filter, options: STATIC_TRANSPORTER_TYPE_OPTIONS };
        }
        if (filter.key === "areaOfOperation") {
          return {
            ...filter,
            options: (filterOptionsByColumn.areaOfOperation ?? []).map(
              (entry) => entry.label,
            ),
          };
        }
        return filter;
      }),
    }),
    [filterOptionsByColumn],
  );

  const apiSortBy = mapTransporterSortField(sortBy);
  const apiFilters = toApiColumnFilters(columnFilters);
  const listQuery = useMasterListQuery({
    master: "transporter",
    page,
    rowsPerPage,
    search: searchValue,
    ...(apiSortBy ? { sortBy: apiSortBy } : {}),
    sortOrder,
    filters: apiFilters,
    fetchPage: fetchTransporterMasterPaginated,
    onLoaded: (items) => {
      void refreshTransporterMasterCache(items);
    },
  });
  const rows = listQuery.rows;
  const totalCount = listQuery.totalCount;
  const isLoading = listQuery.isLoading;
  const errorMessage =
    actionError ||
    (listQuery.error instanceof Error ? listQuery.error.message : "");

  const handleStatusChange = useCallback(
    async (row: MasterRecord, checked: boolean) => {
      try {
        await updateTransporterMasterStatus(row.id, checked);
        setActionError("");
        await queryClient.invalidateQueries({
          queryKey: queryKeys.masters.all("transporter"),
        });
      } catch (error) {
        setActionError(
          error instanceof Error
            ? error.message
            : "Unable to update transporter status.",
        );
      }
    },
    [queryClient],
  );

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
      definition={definition}
      errorMessage={errorMessage}
      loading={isLoading}
      onSearchChange={handleSearchChange}
      onStatusChange={handleStatusChange}
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
      onColumnFilterOpen={(columnKey) => {
        void loadColumnDropdown(columnKey);
      }}
      onColumnFiltersChange={handleColumnFiltersChange}
      filterOptionsByColumn={filterOptionsByColumn}
      rows={rows}
      searchValue={searchValue}
      serverSearch
    />
  );
}

export function AddTransporterMasterPage() {
  return <TransporterMasterFormPage mode="add" />;
}

export function EditTransporterMasterPage() {
  return <TransporterMasterFormPage mode="edit" />;
}

export function ViewTransporterMasterPage() {
  return <TransporterMasterFormPage mode="view" />;
}

function TransporterMasterFormPage({
  mode,
}: {
  mode: "add" | "edit" | "view";
}) {
  const params = useParams<{ id: string }>();
  const [record, setRecord] = useState<TransporterMasterDetail | undefined>();
  const [isLoading, setIsLoading] = useState(mode !== "add");
  const [errorMessage, setErrorMessage] = useState("");
  const [typeOptions, setTypeOptions] = useState<string[]>(
    STATIC_TRANSPORTER_TYPE_OPTIONS,
  );
  const [areaOptions, setAreaOptions] = useState<string[]>([]);

  const definition = useMemo(
    () => ({
      ...transporterMasterDefinition,
      fields: transporterMasterDefinition.fields.map((field) => {
        if (field.key === "type") {
          return { ...field, options: typeOptions };
        }
        if (field.key === "areaOfOperation" && areaOptions.length > 0) {
          return {
            ...field,
            type: "select" as const,
            options: areaOptions,
          };
        }
        return field;
      }),
      rows: [],
    }),
    [areaOptions, typeOptions],
  );

  useEffect(() => {
    void fetchTransporterMasterMeta().then((meta) => {
      if (meta.types.length > 0) {
        setTypeOptions(meta.types.map((entry) => entry.label));
      }
      setAreaOptions(meta.areaOfOperations.map((entry) => entry.label));
    });
  }, []);

  useEffect(() => {
    let ignore = false;

    async function loadDetail() {
      setErrorMessage("");

      if (mode === "add") {
        setRecord(undefined);
        setIsLoading(false);
        return;
      }

      if (!params.id) {
        setRecord(undefined);
        setIsLoading(false);
        setErrorMessage("Transporter id is missing.");
        return;
      }

      setIsLoading(true);

      try {
        const nextRecord = await fetchTransporterMasterDetail(params.id);
        if (!ignore) {
          setRecord(nextRecord);
        }
      } catch (error) {
        if (!ignore) {
          setRecord(undefined);
          setErrorMessage(
            error instanceof Error
              ? error.message
              : "Unable to load transporter.",
          );
        }
      } finally {
        if (!ignore) {
          setIsLoading(false);
        }
      }
    }

    void loadDetail();

    return () => {
      ignore = true;
    };
  }, [mode, params.id]);

  return (
    <MasterFormPage
      definition={definition}
      errorMessage={errorMessage}
      loading={isLoading}
      mode={mode}
      {...(record ? { record } : {})}
      onSave={async ({ mode: saveMode, row, values }) => {
        if (saveMode === "edit" && row?.id) {
          await updateTransporterMasterRecord(row.id, values);
        } else {
          await createTransporterMasterRecord(values);
        }
        void invalidateMaster("transporter");
      }}
    />
  );
}
