import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useParams } from "react-router";
import { MasterFormPage, MasterListingPage } from "../../shared";
import type { MasterDefinition, MasterRecord } from "../../shared/types";
import type { ColumnFilterValue } from "../../../shared/columnFilters";
import { isActiveColumnFilter } from "../../../shared/columnFilters";
import { itemSubCategoryMasterDefinition } from "../mock/itemSubCategoryMasterData";
import {
  createItemSubCategoryApi,
  fetchItemSubCategoriesApi,
  fetchItemSubCategoriesPaginated,
  fetchItemSubCategoryColumnDropdown,
  getItemSubCategoryByIdApi,
  syncItemSubCategoryMasterToStorage,
  updateItemSubCategoryApi,
  updateItemSubCategoryStatusApi,
} from "../itemSubCategoryMasterApi";
import { fetchItemCategoriesApi } from "../../item-category-master/itemCategoryMasterApi";

const ITEM_SUB_CATEGORY_SORT_FIELD_MAP: Record<string, string> = {
  itemSubCategory: "name",
  name: "name",
  category: "category",
  categoryName: "category",
  status: "status",
  createdDate: "createdAt",
  createdAt: "createdAt",
  createdBy: "createdAt",
  updatedDate: "updatedAt",
  updatedAt: "updatedAt",
  editedBy: "updatedAt",
  updatedBy: "updatedAt",
};

function mapItemSubCategorySortField(columnKey: string | null): string | undefined {
  if (!columnKey) return undefined;
  return ITEM_SUB_CATEGORY_SORT_FIELD_MAP[columnKey];
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

export function ItemSubCategoryMasterListPage() {
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
      const result = await fetchItemSubCategoryColumnDropdown(columnKey);
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
        const apiSortBy = mapItemSubCategorySortField(sortBy);
        const apiFilters = toApiColumnFilters(columnFilters);
        const result = await fetchItemSubCategoriesPaginated({
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
          syncItemSubCategoryMasterToStorage(result.items);
        }
      } catch (error) {
        if (!ignore) {
          setErrorMessage(
            error instanceof Error ? error.message : "Unable to load item sub-categories.",
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
      await updateItemSubCategoryStatusApi(row.id, checked);
      setRows((current) =>
        current.map((entry) =>
          entry.id === row.id
            ? { ...entry, status: checked ? "Active" : "Inactive" }
            : entry,
        ),
      );
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Unable to update item sub-category status.",
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
      definition={itemSubCategoryMasterDefinition}
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

export function AddItemSubCategoryMasterPage() {
  const [categoryOptions, setCategoryOptions] = useState<string[]>([]);

  useEffect(() => {
    fetchItemCategoriesApi({ status: true, limit: 1000 }).then((records) => {
      const names = records
        .filter((r) => String(r.status ?? "Active").toLowerCase() !== "inactive")
        .map((r) => String(r.categoryName || r.name || "").trim())
        .filter((n) => Boolean(n) && isNaN(Number(n)));
      setCategoryOptions([...new Set(names)]);
    }).catch(() => {});
  }, []);

  const definitionWithDynamicOptions = useMemo<MasterDefinition>(() => {
    if (!categoryOptions.length) return itemSubCategoryMasterDefinition;
    return {
      ...itemSubCategoryMasterDefinition,
      fields: itemSubCategoryMasterDefinition.fields.map((field) => {
        if (field.key === "category") {
          return { ...field, options: categoryOptions };
        }
        return field;
      }),
    };
  }, [categoryOptions]);

  const handleSave = async (context: {
    definition: MasterDefinition;
    mode: "add" | "edit";
    row?: MasterRecord;
    values: Record<string, any>;
  }) => {
    try {
      const created = await createItemSubCategoryApi({
        name: String(context.values.itemSubCategory || context.values.name || ""),
        itemSubCategory: String(context.values.itemSubCategory || context.values.name || ""),
        category: context.values.category || "",
        categoryName: context.values.category || "",
        remark: context.values.remark || context.values.remarks || null,
        status: context.values.status ?? true,
      });
      if (created) {
        const allRecords = await fetchItemSubCategoriesApi();
        if (allRecords.length > 0) syncItemSubCategoryMasterToStorage(allRecords);
      }
    } catch (error) {
      console.warn("Failed to create item sub-category via API:", error);
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

export function EditItemSubCategoryMasterPage() {
  const params = useParams<{ id: string }>();
  const [record, setRecord] = useState<MasterRecord | undefined>();
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [categoryOptions, setCategoryOptions] = useState<string[]>([]);

  useEffect(() => {
    fetchItemCategoriesApi({ status: true, limit: 1000 }).then((records) => {
      const names = records
        .filter((r) => String(r.status ?? "Active").toLowerCase() !== "inactive")
        .map((r) => String(r.categoryName || r.name || "").trim())
        .filter((n) => Boolean(n) && isNaN(Number(n)));
      setCategoryOptions([...new Set(names)]);
    }).catch(() => {});
  }, []);

  useEffect(() => {
    let ignore = false;
    async function loadRecord() {
      if (!params.id) {
        setIsLoading(false);
        return;
      }
      setIsLoading(true);
      try {
        const item = await getItemSubCategoryByIdApi(params.id);
        if (!ignore) {
          setRecord(item || undefined);
        }
      } catch (err) {
        if (!ignore) {
          setErrorMessage(err instanceof Error ? err.message : "Failed to load item sub-category.");
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

  const definitionWithDynamicOptions = useMemo<MasterDefinition>(() => {
    if (!categoryOptions.length) return itemSubCategoryMasterDefinition;
    return {
      ...itemSubCategoryMasterDefinition,
      fields: itemSubCategoryMasterDefinition.fields.map((field) => {
        if (field.key === "category") {
          return { ...field, options: categoryOptions };
        }
        return field;
      }),
    };
  }, [categoryOptions]);

  const handleSave = async (context: {
    definition: MasterDefinition;
    mode: "add" | "edit";
    row?: MasterRecord;
    values: Record<string, any>;
  }) => {
    const id = context.row?.id || params.id;
    if (id) {
      const updated = await updateItemSubCategoryApi(id, {
        name: String(context.values.itemSubCategory || context.values.name || ""),
        itemSubCategory: String(context.values.itemSubCategory || context.values.name || ""),
        category: context.values.category,
        categoryName: context.values.category,
        remark: context.values.remark || context.values.remarks || null,
        status: context.values.status,
      });
      if (updated) {
        const allRecords = await fetchItemSubCategoriesApi();
        if (allRecords.length > 0) syncItemSubCategoryMasterToStorage(allRecords);
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

export function ViewItemSubCategoryMasterPage() {
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
        const item = await getItemSubCategoryByIdApi(params.id);
        if (!ignore) {
          setRecord(item || undefined);
        }
      } catch (err) {
        if (!ignore) {
          setErrorMessage(err instanceof Error ? err.message : "Failed to load item sub-category.");
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
      definition={itemSubCategoryMasterDefinition}
      errorMessage={errorMessage}
      loading={isLoading}
      mode="view"
      {...(record ? { record } : {})}
    />
  );
}
