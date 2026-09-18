import { useCallback, useEffect, useMemo, useState } from "react";
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
  fetchTransporterMasterDetail,
  fetchTransporterMasterDropdowns,
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
  const [rows, setRows] = useState<MasterRecord[]>([]);
  const [searchValue, setSearchValue] = useState("");
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalCount, setTotalCount] = useState(0);
  const [sortBy, setSortBy] = useState<string | null>(null);
  const [sortOrder, setSortOrder] = useState<"asc" | "desc" | null>(null);
  const [columnFilters, setColumnFilters] = useState<
    Partial<Record<string, ColumnFilterValue>>
  >({});
  const [filterOptionsByColumn, setFilterOptionsByColumn] = useState<
    Record<string, Array<{ value: string; label: string }>>
  >({});
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [reloadKey, setReloadKey] = useState(0);
  const [typeOptions, setTypeOptions] = useState<string[]>([
    "Road",
    "Air",
    "Rail",
  ]);
  const [areaOptions, setAreaOptions] = useState<string[]>([]);

  const definition = useMemo(
    () => ({
      ...transporterMasterDefinition,
      filters: transporterMasterDefinition.filters.map((filter) => {
        if (filter.key === "type") {
          return { ...filter, options: typeOptions };
        }
        if (filter.key === "areaOfOperation") {
          return { ...filter, options: areaOptions };
        }
        return filter;
      }),
    }),
    [areaOptions, typeOptions],
  );

  useEffect(() => {
    void fetchTransporterMasterDropdowns().then((dropdowns) => {
      if (dropdowns.types.length > 0) {
        setTypeOptions(dropdowns.types.map((entry) => entry.label));
      }
      setAreaOptions(dropdowns.areaOfOperations.map((entry) => entry.label));
      setFilterOptionsByColumn(dropdowns.columnFilters ?? {});
    });
  }, [reloadKey]);

  useEffect(() => {
    let ignore = false;

    const timer = window.setTimeout(async () => {
      setIsLoading(true);
      setErrorMessage("");

      try {
        const apiSortBy = mapTransporterSortField(sortBy);
        const apiFilters = toApiColumnFilters(columnFilters);
        const result = await fetchTransporterMasterPaginated({
          page,
          limit: rowsPerPage,
          search: searchValue,
          ...(apiSortBy ? { sortBy: apiSortBy } : {}),
          ...(sortOrder ? { sortOrder } : {}),
          ...(Object.keys(apiFilters).length > 0
            ? { filters: apiFilters }
            : {}),
        });

        if (!ignore) {
          setRows(result.items);
          setTotalCount(result.pagination.total);
          void refreshTransporterMasterCache(result.items);
        }
      } catch (error) {
        if (!ignore) {
          setErrorMessage(
            error instanceof Error
              ? error.message
              : "Unable to load transporters.",
          );
        }
      } finally {
        if (!ignore) {
          setIsLoading(false);
        }
      }
    }, 300);

    return () => {
      ignore = true;
      window.clearTimeout(timer);
    };
  }, [
    reloadKey,
    searchValue,
    page,
    rowsPerPage,
    sortBy,
    sortOrder,
    columnFilters,
  ]);

  const handleStatusChange = useCallback(
    async (row: MasterRecord, checked: boolean) => {
      try {
        await updateTransporterMasterStatus(row.id, checked);
        setRows((current) =>
          current.map((entry) =>
            entry.id === row.id
              ? { ...entry, status: checked ? "Active" : "Inactive" }
              : entry,
          ),
        );
      } catch (error) {
        setErrorMessage(
          error instanceof Error
            ? error.message
            : "Unable to update transporter status.",
        );
        setReloadKey((value) => value + 1);
      }
    },
    [],
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
  const [typeOptions, setTypeOptions] = useState<string[]>([
    "Road",
    "Air",
    "Rail",
  ]);
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
    void fetchTransporterMasterDropdowns().then((dropdowns) => {
      if (dropdowns.types.length > 0) {
        setTypeOptions(dropdowns.types.map((entry) => entry.label));
      }
      setAreaOptions(dropdowns.areaOfOperations.map((entry) => entry.label));
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
          return;
        }

        await createTransporterMasterRecord(values);
      }}
    />
  );
}
