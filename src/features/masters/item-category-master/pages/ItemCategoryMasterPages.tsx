import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useParams } from "react-router";
import { MasterFormPage, MasterListingPage } from "../../shared";
import type { MasterDefinition, MasterRecord } from "../../shared/types";
import type { ColumnFilterValue } from "../../../shared/columnFilters";
import { isActiveColumnFilter } from "../../../shared/columnFilters";
import { itemCategoryMasterDefinition } from "../mock/itemCategoryMasterData";
import {
  createItemCategoryApi,
  fetchItemCategoriesApi,
  fetchItemCategoriesPaginated,
  fetchItemCategoryColumnDropdown,
  getItemCategoryByIdApi,
  syncItemCategoryMasterToStorage,
  updateItemCategoryApi,
  updateItemCategoryStatusApi,
} from "../itemCategoryMasterApi";
import {
  createLocalMasterRecord,
  updateLocalMasterRecord,
} from "../../shared/localMasterStore";
import { fetchHsnsApi } from "../../hsn-master/hsnMasterApi";

const ITEM_CATEGORY_SORT_FIELD_MAP: Record<string, string> = {
  categoryName: "name",
  name: "name",
  hsn: "hsn",
  hsnCode: "hsn",
  gst: "gst",
  gstNo: "gst",
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

function mapItemCategorySortField(columnKey: string | null): string | undefined {
  if (!columnKey) return undefined;
  return ITEM_CATEGORY_SORT_FIELD_MAP[columnKey];
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

export function ItemCategoryMasterListPage() {
  const [rows, setRows] = useState<MasterRecord[]>([]);
  const [searchValue, setSearchValue] = useState("");
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalCount, setTotalCount] = useState(0);
  const [sortBy, setSortBy] = useState<string | null>(null);
  const [sortOrder, setSortOrder] = useState<"asc" | "desc" | null>(null);
  const [columnFilters, setColumnFilters] = useState<Partial<Record<string, ColumnFilterValue>>>({});
  const [filterOptionsByColumn, setFilterOptionsByColumn] = useState<Record<string, Array<{ value: string; label: string }>>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [reloadKey, setReloadKey] = useState(0);
  const hasLoadedRowsRef = useRef(false);
  const columnDropdownRequestIdRef = useRef(0);

  const loadColumnDropdown = useCallback(async (columnKey: string) => {
    const requestId = ++columnDropdownRequestIdRef.current;
    setFilterOptionsByColumn({});
    try {
      const result = await fetchItemCategoryColumnDropdown(columnKey);
      if (requestId !== columnDropdownRequestIdRef.current) return;
      setFilterOptionsByColumn({ [result.column]: result.options });
    } catch {
      // keep page usable
    }
  }, []);

  useEffect(() => {
    let ignore = false;

    const timer = window.setTimeout(async () => {
      if (!hasLoadedRowsRef.current) {
        setIsLoading(true);
      }
      setErrorMessage("");

      try {
        const apiSortBy = mapItemCategorySortField(sortBy);
        const apiFilters = toApiColumnFilters(columnFilters);
        const result = await fetchItemCategoriesPaginated({
          page,
          limit: rowsPerPage,
          search: searchValue,
          ...(apiSortBy ? { sortBy: apiSortBy } : {}),
          ...(sortOrder ? { sortOrder } : {}),
          ...(Object.keys(apiFilters).length > 0 ? { filters: apiFilters } : {}),
        });

        if (!ignore) {
          setRows(result.items);
          setTotalCount(result.pagination.total);
          hasLoadedRowsRef.current = true;
          syncItemCategoryMasterToStorage(result.items);
        }
      } catch (error) {
        if (!ignore) {
          setErrorMessage(
            error instanceof Error ? error.message : "Unable to load item categories.",
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
  }, [reloadKey, searchValue, page, rowsPerPage, sortBy, sortOrder, columnFilters]);

  const handleStatusToggle = useCallback(async (row: MasterRecord, checked: boolean) => {
    try {
      await updateItemCategoryStatusApi(row.id, checked);
      setRows((current) =>
        current.map((entry) =>
          entry.id === row.id
            ? { ...entry, status: checked ? "Active" : "Inactive" }
            : entry,
        ),
      );
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Unable to update item category status.",
      );
      setReloadKey((v) => v + 1);
    }
  }, []);

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
      definition={itemCategoryMasterDefinition}
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

function useHsnOptions() {
  const [hsnOptions, setHsnOptions] = useState<string[]>([]);
  const [hsnRows, setHsnRows] = useState<MasterRecord[]>([]);

  useEffect(() => {
    fetchHsnsApi({ status: true, limit: 1000 }).then((records) => {
      const activeRecords = records.filter(
        (r) => String(r.status ?? "Active").toLowerCase() !== "inactive",
      );
      const codes = activeRecords
        .map((r) => String(r.hsnCode || r.code || "").trim())
        .filter(Boolean);
      setHsnOptions([...new Set(codes)]);
      setHsnRows(activeRecords);
    }).catch(() => { });
  }, []);

  return { hsnOptions, hsnRows };
}

function buildCategoryDefinitionWithHsn(
  baseDefinition: MasterDefinition,
  hsnOptions: string[],
  hsnRows: MasterRecord[],
): MasterDefinition {
  if (!hsnOptions.length) return baseDefinition;
  return {
    ...baseDefinition,
    fields: baseDefinition.fields.map((field) => {
      if (field.key === "hsn") {
        return { ...field, options: hsnOptions };
      }
      if (field.key === "gst") {
        return {
          ...field,
          readOnly: true,
          autoFillFrom: {
            rows: hsnRows,
            sourceSlug: "hsn-master",
            sourceKey: "hsn",
            sourceMatchKey: "hsnCode",
            sourceValueKey: "gstPercentage",
          },
        };
      }
      return field;
    }),
  };
}

export function AddItemCategoryMasterPage() {
  const { hsnOptions, hsnRows } = useHsnOptions();

  const definitionWithDynamicOptions = useMemo<MasterDefinition>(
    () => buildCategoryDefinitionWithHsn(itemCategoryMasterDefinition, hsnOptions, hsnRows),
    [hsnOptions, hsnRows],
  );

  const handleSave = async (context: {
    definition: MasterDefinition;
    mode: "add" | "edit";
    row?: MasterRecord;
    values: Record<string, any>;
  }) => {
    try {
      const created = await createItemCategoryApi({
        categoryName: String(context.values.categoryName || context.values.name || ""),
        hsn: context.values.hsn || context.values.hsnCode || "",
        gst: context.values.gst || context.values.gstNo || "",
        remark: context.values.remark || context.values.remarks || null,
        status: context.values.status ?? true,
      });
      if (created) {
        const allRecords = await fetchItemCategoriesApi();
        if (allRecords.length > 0) {
          syncItemCategoryMasterToStorage(allRecords);
        } else {
          createLocalMasterRecord(context.definition, context.values);
        }
      } else {
        createLocalMasterRecord(context.definition, context.values);
      }
    } catch (error) {
      console.warn("Failed to create item category via API, persisting locally:", error);
      createLocalMasterRecord(context.definition, context.values);
    }
  };

  return (
    <MasterFormPage
      definition={definitionWithDynamicOptions}
      mode="add"
      onSave={handleSave}
    />
  );
}

export function EditItemCategoryMasterPage() {
  const params = useParams<{ id: string }>();
  const [record, setRecord] = useState<MasterRecord | undefined>();
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const { hsnOptions, hsnRows } = useHsnOptions();

  useEffect(() => {
    let ignore = false;
    async function loadRecord() {
      if (!params.id) {
        setIsLoading(false);
        return;
      }
      setIsLoading(true);
      try {
        const item = await getItemCategoryByIdApi(params.id);
        if (!ignore) {
          setRecord(item || undefined);
        }
      } catch (err) {
        if (!ignore) {
          setErrorMessage(err instanceof Error ? err.message : "Failed to load category.");
        }
      } finally {
        if (!ignore) {
          setIsLoading(false);
        }
      }
    }
    void loadRecord();
    return () => {
      ignore = true;
    };
  }, [params.id]);

  const definitionWithDynamicOptions = useMemo<MasterDefinition>(
    () => buildCategoryDefinitionWithHsn(itemCategoryMasterDefinition, hsnOptions, hsnRows),
    [hsnOptions, hsnRows],
  );

  const handleSave = async (context: {
    definition: MasterDefinition;
    mode: "add" | "edit";
    row?: MasterRecord;
    values: Record<string, any>;
  }) => {
    const id = context.row?.id || params.id;
    if (id) {
      try {
        const updated = await updateItemCategoryApi(id, {
          categoryName: String(context.values.categoryName || context.values.name || ""),
          hsn: context.values.hsn || context.values.hsnCode,
          gst: context.values.gst || context.values.gstNo,
          remark: context.values.remark || context.values.remarks || null,
          status: context.values.status,
        });
        if (updated) {
          const allRecords = await fetchItemCategoriesApi();
          if (allRecords.length > 0) {
            syncItemCategoryMasterToStorage(allRecords);
          }
        } else if (context.row) {
          updateLocalMasterRecord(context.definition, context.row, context.values);
        }
      } catch (error) {
        console.warn("Failed to update item category via API, persisting locally:", error);
        if (context.row) {
          updateLocalMasterRecord(context.definition, context.row, context.values);
        }
      }
    }
  };

  return (
    <MasterFormPage
      definition={definitionWithDynamicOptions}
      errorMessage={errorMessage}
      loading={isLoading}
      mode="edit"
      {...(record ? { record } : {})}
      onSave={handleSave}
    />
  );
}

export function ViewItemCategoryMasterPage() {
  const params = useParams<{ id: string }>();
  const [record, setRecord] = useState<MasterRecord | undefined>();
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    let ignore = false;
    async function loadRecord() {
      if (!params.id) {
        setIsLoading(false);
        return;
      }
      setIsLoading(true);
      try {
        const item = await getItemCategoryByIdApi(params.id);
        if (!ignore) {
          setRecord(item || undefined);
        }
      } catch (err) {
        if (!ignore) {
          setErrorMessage(err instanceof Error ? err.message : "Failed to load category.");
        }
      } finally {
        if (!ignore) {
          setIsLoading(false);
        }
      }
    }
    void loadRecord();
    return () => {
      ignore = true;
    };
  }, [params.id]);

  return (
    <MasterFormPage
      definition={itemCategoryMasterDefinition}
      errorMessage={errorMessage}
      loading={isLoading}
      mode="view"
      {...(record ? { record } : {})}
    />
  );
}
