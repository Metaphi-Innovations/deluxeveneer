import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useParams } from "react-router";

import {
  MasterFormPage,
  MasterListingPage,
  type MasterFieldValue,
  type MasterRecord,
} from "../../shared";
import type { ColumnFilterValue } from "../../../shared/columnFilters";
import { isActiveColumnFilter } from "../../../shared/columnFilters";
import { supplierMasterDefinition } from "../supplierMasterDefinition";
import {
  createSupplierMasterRecord,
  fetchSupplierMasterDetail,
  fetchSupplierMasterDropdowns,
  fetchSupplierMasterPaginated,
  refreshSupplierMasterCache,
  updateSupplierMasterRecord,
  updateSupplierMasterStatus,
  type SupplierContactPersonInput,
  type SupplierMasterDetail,
} from "../api/supplierMasterApi";
import {
  SupplierContactPersonTable,
  type SupplierContactPersonTableHandle,
} from "./SupplierContactPersonTable";

const SUPPLIER_SORT_FIELD_MAP: Record<string, string> = {
  supplierName: "name",
  name: "name",
  gstNo: "gstNo",
  msmeType: "msmeType",
  country: "country",
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

function mapSupplierSortField(columnKey: string | null): string | undefined {
  if (!columnKey) {
    return undefined;
  }

  return SUPPLIER_SORT_FIELD_MAP[columnKey];
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

function parseContacts(value: unknown): SupplierContactPersonInput[] {
  if (typeof value !== "string" || !value.trim()) {
    return [];
  }

  try {
    const parsed = JSON.parse(value) as unknown;
    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed.map((entry) => ({
      contactPersonName: String(
        (entry as { contactPersonName?: string }).contactPersonName ?? "",
      ),
      designation: String((entry as { designation?: string }).designation ?? ""),
      email: String((entry as { email?: string }).email ?? ""),
      phoneNumber: String((entry as { phoneNumber?: string }).phoneNumber ?? ""),
    }));
  } catch {
    return [];
  }
}

export function SupplierMasterListPage() {
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
  const [countryOptions, setCountryOptions] = useState<string[]>([]);
  const [msmeTypeOptions, setMsmeTypeOptions] = useState<string[]>([]);

  const definition = useMemo(
    () => ({
      ...supplierMasterDefinition,
      filters: supplierMasterDefinition.filters.map((filter) => {
        if (filter.key === "country") {
          return { ...filter, options: countryOptions };
        }
        if (filter.key === "msmeType") {
          return { ...filter, options: msmeTypeOptions };
        }
        return filter;
      }),
    }),
    [countryOptions, msmeTypeOptions],
  );

  useEffect(() => {
    void fetchSupplierMasterDropdowns().then((dropdowns) => {
      setCountryOptions(dropdowns.countries.map((entry) => entry.label));
      setMsmeTypeOptions(dropdowns.msmeTypes.map((entry) => entry.label));
      setFilterOptionsByColumn(dropdowns.columnFilters ?? {});
    });
  }, [reloadKey]);

  useEffect(() => {
    let ignore = false;

    const timer = window.setTimeout(async () => {
      setIsLoading(true);
      setErrorMessage("");

      try {
        const apiSortBy = mapSupplierSortField(sortBy);
        const apiFilters = toApiColumnFilters(columnFilters);
        const result = await fetchSupplierMasterPaginated({
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
          void refreshSupplierMasterCache(result.items);
        }
      } catch (error) {
        if (!ignore) {
          setErrorMessage(
            error instanceof Error
              ? error.message
              : "Unable to load suppliers.",
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
        await updateSupplierMasterStatus(row.id, checked);
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
            : "Unable to update supplier status.",
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

export function AddSupplierMasterPage() {
  return <SupplierMasterFormPage mode="add" />;
}

export function EditSupplierMasterPage() {
  return <SupplierMasterFormPage mode="edit" />;
}

export function ViewSupplierMasterPage() {
  return <SupplierMasterFormPage mode="view" />;
}

function SupplierMasterFormPage({ mode }: { mode: "add" | "edit" | "view" }) {
  const params = useParams<{ id: string }>();
  const contactTableRef = useRef<SupplierContactPersonTableHandle>(null);
  const [record, setRecord] = useState<SupplierMasterDetail | undefined>();
  const [isLoading, setIsLoading] = useState(mode !== "add");
  const [errorMessage, setErrorMessage] = useState("");
  const [contacts, setContacts] = useState<SupplierContactPersonInput[]>([]);
  const [msmeTypeOptions, setMsmeTypeOptions] = useState<string[]>([]);

  const firstContactValues = useMemo<Record<string, MasterFieldValue>>(() => {
    const firstContact = contacts[0];

    if (!firstContact) {
      return {};
    }

    return {
      contactPersonName: firstContact.contactPersonName,
      designation: firstContact.designation,
      emailAddress: firstContact.email,
      mobileNumber: firstContact.phoneNumber,
    };
  }, [contacts]);

  const definition = useMemo(
    () => ({
      ...supplierMasterDefinition,
      fields: supplierMasterDefinition.fields.map((field) =>
        field.key === "msmeType" && msmeTypeOptions.length > 0
          ? { ...field, type: "select" as const, options: msmeTypeOptions }
          : field,
      ),
      rows: [],
    }),
    [msmeTypeOptions],
  );

  useEffect(() => {
    void fetchSupplierMasterDropdowns().then((dropdowns) => {
      setMsmeTypeOptions(dropdowns.msmeTypes.map((entry) => entry.label));
    });
  }, []);

  useEffect(() => {
    let ignore = false;

    async function loadDetail() {
      setErrorMessage("");

      if (mode === "add") {
        setRecord(undefined);
        setContacts([]);
        setIsLoading(false);
        return;
      }

      if (!params.id) {
        setRecord(undefined);
        setIsLoading(false);
        setErrorMessage("Supplier id is missing.");
        return;
      }

      setIsLoading(true);

      try {
        const nextRecord = await fetchSupplierMasterDetail(params.id);
        if (!ignore) {
          setRecord(nextRecord);
          setContacts(parseContacts(nextRecord.contactPersonsJson));
        }
      } catch (error) {
        if (!ignore) {
          setRecord(undefined);
          setErrorMessage(
            error instanceof Error
              ? error.message
              : "Unable to load supplier.",
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
      additionalValues={{
        ...firstContactValues,
        contactPersonsJson: JSON.stringify(contacts),
      }}
      afterFields={
        <SupplierContactPersonTable
          ref={contactTableRef}
          contacts={contacts}
          onChange={setContacts}
          readOnly={mode === "view"}
        />
      }
      beforeSave={() => contactTableRef.current?.validate() ?? true}
      definition={definition}
      errorMessage={errorMessage}
      loading={isLoading}
      mode={mode}
      {...(record ? { record } : {})}
      onSave={async ({ mode: saveMode, row, values }) => {
        if (saveMode === "edit" && row?.id) {
          await updateSupplierMasterRecord(row.id, values, contacts);
          return;
        }

        await createSupplierMasterRecord(values, contacts);
      }}
    />
  );
}
