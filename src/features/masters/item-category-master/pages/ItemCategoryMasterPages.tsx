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
  const queryClient = useQueryClient();
  const [searchValue, setSearchValue] = useState("");
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [sortBy, setSortBy] = useState<string | null>(null);
  const [sortOrder, setSortOrder] = useState<"asc" | "desc" | null>(null);
  const [columnFilters, setColumnFilters] = useState<Partial<Record<string, ColumnFilterValue>>>({});
  const [actionError, setActionError] = useState("");
  const { filterOptionsByColumn, loadColumnDropdown } = useColumnDropdownQuery(
    queryKeys.masters.columnDropdowns("itemCategory"),
    fetchItemCategoryColumnDropdown,
  );
  const apiSortBy = mapItemCategorySortField(sortBy);
  const apiFilters = toApiColumnFilters(columnFilters);
  const listQuery = useMasterListQuery({
    master: "itemCategory",
    page,
    rowsPerPage,
    search: searchValue,
    ...(apiSortBy ? { sortBy: apiSortBy } : {}),
    sortOrder,
    filters: apiFilters,
    fetchPage: fetchItemCategoriesPaginated,
    onLoaded: syncItemCategoryMasterToStorage,
  });
  const rows = listQuery.rows;
  const totalCount = listQuery.totalCount;
  const isLoading = listQuery.isLoading;
  const errorMessage =
    actionError ||
    (listQuery.error instanceof Error ? listQuery.error.message : "");

  const handleStatusToggle = useCallback(async (row: MasterRecord, checked: boolean) => {
    try {
      await updateItemCategoryStatusApi(row.id, checked);
      setActionError("");
      await queryClient.invalidateQueries({ queryKey: queryKeys.masters.all("itemCategory") });
    } catch (error) {
      setActionError(
        error instanceof Error ? error.message : "Unable to update item category status.",
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
        if (allRecords.length > 0) syncItemCategoryMasterToStorage(allRecords);
      }
      void invalidateMaster("itemCategory");
    } catch (error) {
      console.warn("Failed to create item category via API, fallback will persist locally:", error);
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
      const updated = await updateItemCategoryApi(id, {
        categoryName: String(context.values.categoryName || context.values.name || ""),
        hsn: context.values.hsn || context.values.hsnCode,
        gst: context.values.gst || context.values.gstNo,
        remark: context.values.remark || context.values.remarks || null,
        status: context.values.status,
      });
      if (updated) {
        const allRecords = await fetchItemCategoriesApi();
        if (allRecords.length > 0) syncItemCategoryMasterToStorage(allRecords);
      }
      void invalidateMaster("itemCategory");
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
