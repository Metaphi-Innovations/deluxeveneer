import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { invalidateMaster } from "../../../../query/queryClient";
import { queryKeys } from "../../../../query/queryKeys";
import { useColumnDropdownQuery } from "../../../../query/useColumnDropdownQuery";
import { useMasterListQuery } from "../../../../query/useMasterListQuery";
import { useParams } from "react-router";
import { MasterFormPage, MasterListingPage } from "../../shared";
import { createLocalMasterRecord, updateLocalMasterRecord } from "../../shared/localMasterStore";
import type { MasterDefinition, MasterFieldDefinition, MasterRecord } from "../../shared/types";
import type { ColumnFilterValue } from "../../../shared/columnFilters";
import { isActiveColumnFilter } from "../../../shared/columnFilters";
import { itemMasterDefinition } from "../mock/itemMasterData";
import {
  createItemApi,
  fetchItemsApi,
  fetchItemsPaginated,
  fetchItemColumnDropdown,
  getItemByIdApi,
  getStoredItemMasterRows,
  syncItemMasterToStorage,
  updateItemApi,
  updateItemStatusApi,
} from "../itemMasterApi";
import { fetchItemCategoriesApi } from "../../item-category-master/itemCategoryMasterApi";
import { fetchItemSubCategoriesApi } from "../../item-sub-category-master/itemSubCategoryMasterApi";
import { fetchHsnsApi } from "../../hsn-master/hsnMasterApi";
import { fetchColorsApi } from "../../color-master/colorMasterApi";
import { fetchUnitsApi } from "../../unit-master/unitMasterApi";
import { QuickAddCategoryModal } from "../../item-category-master/QuickAddCategoryModal";
import { QuickAddSubCategoryModal } from "../../item-sub-category-master/QuickAddSubCategoryModal";
import { Plus } from "lucide-react";
import { Button } from "@mui/material";

const ITEM_SORT_FIELD_MAP: Record<string, string> = {
  itemName: "name",
  name: "name",
  itemCode: "factoryItemCode",
  factoryItemCode: "factoryItemCode",
  category: "category",
  categoryName: "category",
  subCategory: "subCategory",
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

function mapItemSortField(columnKey: string | null): string | undefined {
  if (!columnKey) return undefined;
  return ITEM_SORT_FIELD_MAP[columnKey];
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

export function ItemMasterListPage() {
  const queryClient = useQueryClient();
  const [searchValue, setSearchValue] = useState("");
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [sortBy, setSortBy] = useState<string | null>(null);
  const [sortOrder, setSortOrder] = useState<"asc" | "desc" | null>(null);
  const [columnFilters, setColumnFilters] = useState<Partial<Record<string, ColumnFilterValue>>>({});
  const [actionError, setActionError] = useState("");
  const { filterOptionsByColumn, loadColumnDropdown } = useColumnDropdownQuery(
    queryKeys.masters.columnDropdowns("item"),
    fetchItemColumnDropdown,
  );
  const apiSortBy = mapItemSortField(sortBy);
  const apiFilters = toApiColumnFilters(columnFilters);
  const listQuery = useMasterListQuery({
    master: "item",
    page,
    rowsPerPage,
    search: searchValue,
    ...(apiSortBy ? { sortBy: apiSortBy } : {}),
    sortOrder,
    filters: apiFilters,
    fetchPage: fetchItemsPaginated,
    onLoaded: syncItemMasterToStorage,
  });
  const rows = listQuery.rows;
  const totalCount = listQuery.totalCount;
  const isLoading = listQuery.isLoading;
  const errorMessage =
    actionError ||
    (listQuery.error instanceof Error ? listQuery.error.message : "");

  const handleStatusToggle = useCallback(async (row: MasterRecord, checked: boolean) => {
    try {
      await updateItemStatusApi(row.id, checked);
      setActionError("");
      await queryClient.invalidateQueries({ queryKey: queryKeys.masters.all("item") });
    } catch (error) {
      setActionError(
        error instanceof Error ? error.message : "Unable to update item status.",
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
      definition={itemMasterDefinition}
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

/**
 * Hook: loads categories, HSN codes, colors, and sub-categories from API.
 */
function useItemFormOptions(selectedCategory?: string) {
  const [categoryOptions, setCategoryOptions] = useState<string[]>([]);
  const [categoryRows, setCategoryRows] = useState<MasterRecord[]>([]);
  const [subCategoryOptions, setSubCategoryOptions] = useState<string[]>([]);
  const [allSubCategoryRows, setAllSubCategoryRows] = useState<MasterRecord[]>([]);
  const [hsnOptions, setHsnOptions] = useState<string[]>([]);
  const [hsnRows, setHsnRows] = useState<MasterRecord[]>([]);
  const [colorOptions, setColorOptions] = useState<string[]>([]);
  const [unitOptions, setUnitOptions] = useState<string[]>([]);

  // Load categories, HSN codes, colors, units, and sub-categories on mount
  useEffect(() => {
    fetchItemCategoriesApi({ status: true, limit: 1000 })
      .then((records) => {
        const active = records.filter(
          (r) => String(r.status ?? "Active").toLowerCase() !== "inactive",
        );
        const names = active
          .map((r) => String(r.categoryName || r.name || "").trim())
          .filter((n) => Boolean(n) && isNaN(Number(n)));
        setCategoryOptions([...new Set(names)]);
        const normalizedCategoryRows = active.map((r) => ({
          ...r,
          categoryName: r.categoryName || r.name || "",
          name: r.name || r.categoryName || "",
          hsnCode: r.hsnCode || r.hsn || "",
          hsn: r.hsn || r.hsnCode || "",
        }));
        setCategoryRows(normalizedCategoryRows);
      })
      .catch(() => {});

    fetchItemSubCategoriesApi({ status: true, limit: 1000 })
      .then((records) => {
        const active = records.filter(
          (r) => String(r.status ?? "Active").toLowerCase() !== "inactive",
        );
        setAllSubCategoryRows(active);
      })
      .catch(() => {});

    fetchHsnsApi({ status: true, limit: 1000 })
      .then((records) => {
        const active = records.filter(
          (r) => String(r.status ?? "Active").toLowerCase() !== "inactive",
        );
        const codes = active
          .map((r) => String(r.hsnCode || r.code || "").trim())
          .filter((n) => Boolean(n) && (isNaN(Number(n)) === false || Boolean(n)));
        setHsnOptions([...new Set(codes)]);
        const normalizedHsnRows = active.map((r) => ({
          ...r,
          hsnCode: r.hsnCode || r.code || "",
          code: r.code || r.hsnCode || "",
          gstPercentage: r.gstPercentage || r.gst || "",
          gst: r.gst || r.gstPercentage || "",
        }));
        setHsnRows(normalizedHsnRows);
      })
      .catch(() => {});

    fetchColorsApi({ status: true, limit: 1000 })
      .then((records) => {
        const active = records.filter(
          (r) => String(r.status ?? "Active").toLowerCase() !== "inactive",
        );
        const names = active
          .map((r) => String(r.colorName || r.name || "").trim())
          .filter((n) => Boolean(n) && isNaN(Number(n)));
        setColorOptions([...new Set(names)]);
      })
      .catch(() => {});

    fetchUnitsApi({ status: true, limit: 1000 })
      .then((records) => {
        const active = records.filter(
          (r) => String(r.status ?? "Active").toLowerCase() !== "inactive",
        );
        const names = active
          .map((r) => String(r.unitName || r.name || "").trim())
          .filter((n) => Boolean(n) && isNaN(Number(n)));
        setUnitOptions([...new Set(names)]);
      })
      .catch(() => {});
  }, []);

  const loadCategories = useCallback(() => {
    fetchItemCategoriesApi({ status: true, limit: 1000 })
      .then((records) => {
        const active = records.filter(
          (r) => String(r.status ?? "Active").toLowerCase() !== "inactive",
        );
        const names = active
          .map((r) => String(r.categoryName || r.name || "").trim())
          .filter((n) => Boolean(n) && isNaN(Number(n)));
        setCategoryOptions([...new Set(names)]);
        const normalizedCategoryRows = active.map((r) => ({
          ...r,
          categoryName: r.categoryName || r.name || "",
          name: r.name || r.categoryName || "",
          hsnCode: r.hsnCode || r.hsn || "",
          hsn: r.hsn || r.hsnCode || "",
        }));
        setCategoryRows(normalizedCategoryRows);
      })
      .catch(() => {});
  }, []);

  const loadSubCategories = useCallback(() => {
    fetchItemSubCategoriesApi({ status: true, limit: 1000 })
      .then((records) => {
        const active = records.filter(
          (r) => String(r.status ?? "Active").toLowerCase() !== "inactive",
        );
        setAllSubCategoryRows(active);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    const filtered = selectedCategory
      ? allSubCategoryRows.filter((r) => {
          const catName = String(r.category || r.categoryName || "").trim().toLowerCase();
          return catName === selectedCategory.trim().toLowerCase();
        })
      : allSubCategoryRows;

    const names = filtered
      .map((r) => String(r.itemSubCategory || r.name || "").trim())
      .filter((n) => Boolean(n) && isNaN(Number(n)));

    setSubCategoryOptions([...new Set(names)]);
  }, [selectedCategory, allSubCategoryRows]);

  return {
    categoryOptions,
    categoryRows,
    subCategoryOptions,
    hsnOptions,
    hsnRows,
    colorOptions,
    unitOptions,
    loadCategories,
    loadSubCategories,
    setCategoryOptions,
    setSubCategoryOptions,
  };
}

function buildItemDefinition(
  base: MasterDefinition,
  categoryOptions: string[],
  categoryRows: MasterRecord[],
  subCategoryOptions: string[],
  hsnOptions: string[],
  hsnRows: MasterRecord[],
  colorOptions: string[],
  unitOptions: string[],
  callbacks?: {
    onQuickAddCategory?: () => void;
    onQuickAddSubCategory?: () => void;
  },
): MasterDefinition {
  return {
    ...base,
    fields: base.fields.map((field) => {
      if (field.key === "category") {
        return {
          ...field,
          options: categoryOptions,
          ...(callbacks?.onQuickAddCategory
            ? {
                renderDropdownAction: ({ close }) => (
                  <Button
                    fullWidth
                    size="small"
                    startIcon={<Plus size={14} />}
                    onClick={() => {
                      close();
                      callbacks.onQuickAddCategory?.();
                    }}
                    sx={(theme) => ({
                      justifyContent: "flex-start",
                      fontSize: "0.8125rem",
                      fontWeight: 600,
                      color: theme.customTokens.brand.primary,
                      py: 0.5,
                      px: 1,
                      "&:hover": {
                        backgroundColor: theme.customTokens.navigation.hoverBackground,
                      },
                    })}
                  >
                    + Quick Add Category
                  </Button>
                ),
              }
            : {}),
        };
      }
      if (field.key === "subCategory") {
        return {
          ...field,
          options: subCategoryOptions,
          ...(callbacks?.onQuickAddSubCategory
            ? {
                renderDropdownAction: ({ close }) => (
                  <Button
                    fullWidth
                    size="small"
                    startIcon={<Plus size={14} />}
                    onClick={() => {
                      close();
                      callbacks.onQuickAddSubCategory?.();
                    }}
                    sx={(theme) => ({
                      justifyContent: "flex-start",
                      fontSize: "0.8125rem",
                      fontWeight: 600,
                      color: theme.customTokens.brand.primary,
                      py: 0.5,
                      px: 1,
                      "&:hover": {
                        backgroundColor: theme.customTokens.navigation.hoverBackground,
                      },
                    })}
                  >
                    + Quick Add Sub-Category
                  </Button>
                ),
              }
            : {}),
        };
      }
      if (field.key === "color" && colorOptions.length) {
        return { ...field, options: colorOptions };
      }
      if (field.key === "unitName" && unitOptions.length) {
        return { ...field, options: unitOptions };
      }
      if (field.key === "hsn") {
        const nextHsn: MasterFieldDefinition = {
          ...field,
          readOnly: true,
        };
        if (hsnOptions.length) {
          nextHsn.options = hsnOptions;
        }
        if (categoryRows.length) {
          nextHsn.autoFillFrom = {
            rows: categoryRows,
            sourceKey: "category",
            sourceMatchKey: "categoryName",
            sourceValueKey: "hsnCode",
          };
        }
        return nextHsn;
      }
      if (field.key === "gst") {
        const nextGst: MasterFieldDefinition = {
          ...field,
          readOnly: true,
        };
        if (hsnRows.length) {
          nextGst.autoFillFrom = {
            rows: hsnRows,
            sourceSlug: "hsn-master",
            sourceKey: "hsn",
            sourceMatchKey: "hsnCode",
            sourceValueKey: "gstPercentage",
          };
        }
        return nextGst;
      }
      return field;
    }),
  };
}

export function AddItemMasterPage() {
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [selectedSubCategory, setSelectedSubCategory] = useState<string>("");
  const [quickAddCategoryOpen, setQuickAddCategoryOpen] = useState(false);
  const [quickAddSubCategoryOpen, setQuickAddSubCategoryOpen] = useState(false);

  const {
    categoryOptions,
    categoryRows,
    subCategoryOptions,
    hsnOptions,
    hsnRows,
    colorOptions,
    unitOptions,
    loadCategories,
    loadSubCategories,
    setCategoryOptions,
    setSubCategoryOptions,
  } = useItemFormOptions(selectedCategory);

  const definition = useMemo(
    () =>
      buildItemDefinition(
        itemMasterDefinition,
        categoryOptions,
        categoryRows,
        subCategoryOptions,
        hsnOptions,
        hsnRows,
        colorOptions,
        unitOptions,
        {
          onQuickAddCategory: () => setQuickAddCategoryOpen(true),
          onQuickAddSubCategory: () => setQuickAddSubCategoryOpen(true),
        },
      ),
    [
      categoryOptions,
      categoryRows,
      subCategoryOptions,
      hsnOptions,
      hsnRows,
      colorOptions,
      unitOptions,
    ],
  );

  const handleSave = async (context: {
    definition: MasterDefinition;
    mode: "add" | "edit";
    row?: MasterRecord;
    values: Record<string, any>;
  }) => {
    const itemName = String(context.values.itemName || context.values.name || "").trim();
    const itemCode = String(context.values.factoryItemCode || context.values.itemCode || "").trim();
    const category = String(context.values.category || "").trim();
    const subCategory = String(context.values.subCategory || "").trim();
    const color = String(context.values.color || "").trim();
    const unitName = String(
      context.values.unitName || context.values.unit || "",
    ).trim();
    const hsn = String(context.values.hsn || context.values.hsnCode || "").trim();
    const gst = String(context.values.gst || context.values.gstNo || "").trim();
    const remark = context.values.remark || context.values.remarks || null;
    const status = context.values.status ?? true;

    try {
      const payload: Parameters<typeof createItemApi>[0] = {
        itemName,
        name: itemName,
        status,
      };
      if (itemCode) {
        payload.factoryItemCode = itemCode;
        payload.itemCode = itemCode;
      }
      if (category) payload.category = category;
      if (subCategory) payload.subCategory = subCategory;
      if (color) payload.color = color;
      if (unitName) {
        payload.unit = unitName;
        payload.unitName = unitName;
      }
      if (hsn) {
        payload.hsn = hsn;
        payload.hsnCode = hsn;
      }
      if (gst) {
        payload.gst = gst;
        payload.gstNo = gst;
      }
      if (remark) {
        payload.remark = String(remark);
        payload.remarks = String(remark);
      }

      const created = await createItemApi(payload);

      if (created) {
        const existing = getStoredItemMasterRows();
        syncItemMasterToStorage([created, ...existing.filter((r) => r.id !== created.id)]);

        const allRecords = await fetchItemsApi({ limit: 1000 });
        if (allRecords.length > 0) {
          syncItemMasterToStorage(allRecords);
        }
      } else {
        const localRec = createLocalMasterRecord(context.definition, context.values);
        const existing = getStoredItemMasterRows();
        syncItemMasterToStorage([localRec, ...existing.filter((r) => r.id !== localRec.id)]);
      }
      void invalidateMaster("item");
    } catch (error: any) {
      console.warn("Failed to create item via API:", error);
      const msg = error?.message || "";
      if (
        msg.includes("already exists") ||
        msg.includes("Validation") ||
        msg.includes("required") ||
        msg.includes("cannot be empty")
      ) {
        throw error;
      }
      const localRec = createLocalMasterRecord(context.definition, context.values);
      const existing = getStoredItemMasterRows();
      syncItemMasterToStorage([localRec, ...existing.filter((r) => r.id !== localRec.id)]);
    }
  };

  const additionalValues = useMemo(() => {
    const vals: Record<string, string> = {};
    if (selectedCategory) vals.category = selectedCategory;
    if (selectedSubCategory) vals.subCategory = selectedSubCategory;
    return Object.keys(vals).length > 0 ? vals : undefined;
  }, [selectedCategory, selectedSubCategory]);

  return (
    <>
      <MasterFormPage
        additionalValues={additionalValues}
        definition={definition}
        mode="add"
        onSave={handleSave}
        onFieldChange={(key, value) => {
          if (key === "category" && typeof value === "string") {
            setSelectedCategory(value);
          }
        }}
      />
      <QuickAddCategoryModal
        open={quickAddCategoryOpen}
        onClose={() => setQuickAddCategoryOpen(false)}
        onSuccess={(newCat) => {
          setCategoryOptions((prev) => [...new Set([newCat, ...prev])]);
          setSelectedCategory(newCat);
          loadCategories();
        }}
      />
      <QuickAddSubCategoryModal
        open={quickAddSubCategoryOpen}
        defaultCategory={selectedCategory}
        onClose={() => setQuickAddSubCategoryOpen(false)}
        onSuccess={(newSubCat) => {
          setSubCategoryOptions((prev) => [...new Set([newSubCat, ...prev])]);
          setSelectedSubCategory(newSubCat);
          loadSubCategories();
        }}
      />
    </>
  );
}

export function EditItemMasterPage() {
  const { id } = useParams<{ id: string }>();
  const [record, setRecord] = useState<MasterRecord | undefined>();
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>("");

  useEffect(() => {
    if (id) {
      setIsLoading(true);
      getItemByIdApi(id)
        .then((rec) => {
          if (rec) {
            setRecord(rec);
            if (rec.category) {
              setSelectedCategory(String(rec.category));
            }
          }
        })
        .catch((err) => {
          console.warn("Failed to fetch item for edit:", err);
        })
        .finally(() => {
          setIsLoading(false);
        });
    }
  }, [id]);

  const [selectedSubCategory, setSelectedSubCategory] = useState<string>("");
  const [quickAddCategoryOpen, setQuickAddCategoryOpen] = useState(false);
  const [quickAddSubCategoryOpen, setQuickAddSubCategoryOpen] = useState(false);

  const {
    categoryOptions,
    categoryRows,
    subCategoryOptions,
    hsnOptions,
    hsnRows,
    colorOptions,
    unitOptions,
    loadCategories,
    loadSubCategories,
    setCategoryOptions,
    setSubCategoryOptions,
  } = useItemFormOptions(selectedCategory);

  const definition = useMemo(
    () =>
      buildItemDefinition(
        itemMasterDefinition,
        categoryOptions,
        categoryRows,
        subCategoryOptions,
        hsnOptions,
        hsnRows,
        colorOptions,
        unitOptions,
        {
          onQuickAddCategory: () => setQuickAddCategoryOpen(true),
          onQuickAddSubCategory: () => setQuickAddSubCategoryOpen(true),
        },
      ),
    [
      categoryOptions,
      categoryRows,
      subCategoryOptions,
      hsnOptions,
      hsnRows,
      colorOptions,
      unitOptions,
    ],
  );

  const handleSave = async (context: {
    definition: MasterDefinition;
    mode: "add" | "edit";
    row?: MasterRecord;
    values: Record<string, any>;
  }) => {
    const editId = context.row?.id || id;
    if (!editId) return;

    const itemName = String(context.values.itemName || context.values.name || "").trim();
    const itemCode = String(context.values.factoryItemCode || context.values.itemCode || "").trim();
    const category = context.values.category;
    const subCategory = context.values.subCategory;
    const color = context.values.color;
    const unitName = String(
      context.values.unitName || context.values.unit || "",
    ).trim();
    const hsn = context.values.hsn || context.values.hsnCode;
    const gst = context.values.gst || context.values.gstNo;
    const remark = context.values.remark || context.values.remarks || null;
    const status = context.values.status;

    try {
      const payload: Parameters<typeof updateItemApi>[1] = {
        itemName,
        name: itemName,
        status,
      };
      if (itemCode) {
        payload.factoryItemCode = itemCode;
        payload.itemCode = itemCode;
      }
      if (category) payload.category = String(category);
      if (subCategory) payload.subCategory = String(subCategory);
      if (color) payload.color = String(color);
      if (unitName) {
        payload.unit = unitName;
        payload.unitName = unitName;
      }
      if (hsn) {
        payload.hsn = String(hsn);
        payload.hsnCode = String(hsn);
      }
      if (gst) {
        payload.gst = String(gst);
        payload.gstNo = String(gst);
      }
      if (remark) {
        payload.remark = String(remark);
        payload.remarks = String(remark);
      }

      const updated = await updateItemApi(editId, payload);

      if (updated) {
        const existing = getStoredItemMasterRows();
        syncItemMasterToStorage(existing.map((r) => (r.id === editId ? updated : r)));
        const allRecords = await fetchItemsApi({ limit: 1000 });
        if (allRecords.length > 0) {
          syncItemMasterToStorage(allRecords);
        }
      } else {
        updateLocalMasterRecord(context.definition, context.row ?? { id: editId }, context.values);
      }
      void invalidateMaster("item");
    } catch (error: any) {
      console.warn("Failed to update item via API:", error);
      const msg = error?.message || "";
      if (
        msg.includes("already exists") ||
        msg.includes("Validation") ||
        msg.includes("required") ||
        msg.includes("cannot be empty")
      ) {
        throw error;
      }
      updateLocalMasterRecord(context.definition, context.row ?? { id: editId }, context.values);
    }
  };

  const additionalValues = useMemo(() => {
    const vals: Record<string, string> = {};
    if (selectedCategory) vals.category = selectedCategory;
    if (selectedSubCategory) vals.subCategory = selectedSubCategory;
    return Object.keys(vals).length > 0 ? vals : undefined;
  }, [selectedCategory, selectedSubCategory]);

  return (
    <>
      <MasterFormPage
        additionalValues={additionalValues}
        definition={definition}
        mode="edit"
        {...(record ? { record } : {})}
        loading={isLoading}
        onSave={handleSave}
        onFieldChange={(key, value) => {
          if (key === "category" && typeof value === "string") {
            setSelectedCategory(value);
          }
        }}
      />
      <QuickAddCategoryModal
        open={quickAddCategoryOpen}
        onClose={() => setQuickAddCategoryOpen(false)}
        onSuccess={(newCat) => {
          setCategoryOptions((prev) => [...new Set([newCat, ...prev])]);
          setSelectedCategory(newCat);
          loadCategories();
        }}
      />
      <QuickAddSubCategoryModal
        open={quickAddSubCategoryOpen}
        defaultCategory={selectedCategory}
        onClose={() => setQuickAddSubCategoryOpen(false)}
        onSuccess={(newSubCat) => {
          setSubCategoryOptions((prev) => [...new Set([newSubCat, ...prev])]);
          setSelectedSubCategory(newSubCat);
          loadSubCategories();
        }}
      />
    </>
  );
}

export function ViewItemMasterPage() {
  const { id } = useParams<{ id: string }>();
  const [record, setRecord] = useState<MasterRecord | undefined>();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (id) {
      setIsLoading(true);
      getItemByIdApi(id)
        .then((rec) => {
          if (rec) setRecord(rec);
        })
        .catch((err) => {
          console.warn("Failed to fetch item for view:", err);
        })
        .finally(() => {
          setIsLoading(false);
        });
    }
  }, [id]);

  return (
    <MasterFormPage
      definition={itemMasterDefinition}
      mode="view"
      {...(record ? { record } : {})}
      loading={isLoading}
    />
  );
}

