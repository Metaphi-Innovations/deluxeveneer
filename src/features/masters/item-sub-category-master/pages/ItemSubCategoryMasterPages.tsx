import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { invalidateMaster } from "../../../../query/queryClient";
import { queryKeys } from "../../../../query/queryKeys";
import { useColumnDropdownQuery } from "../../../../query/useColumnDropdownQuery";
import { useMasterListQuery } from "../../../../query/useMasterListQuery";
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
  const queryClient = useQueryClient();
  const [searchValue, setSearchValue] = useState("");
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [sortBy, setSortBy] = useState<string | null>(null);
  const [sortOrder, setSortOrder] = useState<"asc" | "desc" | null>(null);
  const [columnFilters, setColumnFilters] = useState<Partial<Record<string, ColumnFilterValue>>>({});
  const [actionError, setActionError] = useState("");
  const { filterOptionsByColumn, loadColumnDropdown } = useColumnDropdownQuery(
    queryKeys.masters.columnDropdowns("itemSubCategory"),
    fetchItemSubCategoryColumnDropdown,
  );
  const apiSortBy = mapItemSubCategorySortField(sortBy);
  const apiFilters = toApiColumnFilters(columnFilters);
  const listQuery = useMasterListQuery({
    master: "itemSubCategory",
    page,
    rowsPerPage,
    search: searchValue,
    ...(apiSortBy ? { sortBy: apiSortBy } : {}),
    sortOrder,
    filters: apiFilters,
    fetchPage: fetchItemSubCategoriesPaginated,
    onLoaded: syncItemSubCategoryMasterToStorage,
  });
  const rows = listQuery.rows;
  const totalCount = listQuery.totalCount;
  const isLoading = listQuery.isLoading;
  const errorMessage =
    actionError ||
    (listQuery.error instanceof Error ? listQuery.error.message : "");

  const handleStatusToggle = useCallback(async (row: MasterRecord, checked: boolean) => {
    try {
      await updateItemSubCategoryStatusApi(row.id, checked);
      setActionError("");
      await queryClient.invalidateQueries({ queryKey: queryKeys.masters.all("itemSubCategory") });
    } catch (error) {
      setActionError(
        error instanceof Error ? error.message : "Unable to update item sub-category status.",
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
      void invalidateMaster("itemSubCategory");
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
      void invalidateMaster("itemSubCategory");
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
