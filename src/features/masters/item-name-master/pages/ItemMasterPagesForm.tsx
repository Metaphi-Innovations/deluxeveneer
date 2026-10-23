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
} from "../api/itemMasterApi";
import { fetchItemCategoriesApi } from "../../item-category-master/api/itemCategoryMasterApi";
import { fetchItemSubCategoriesApi } from "../../item-sub-category-master/api/itemSubCategoryMasterApi";
import { fetchHsnsApi } from "../../hsn-master/api/hsnMasterApi";
import { fetchColorsApi } from "../../color-master/api/colorMasterApi";
import { fetchUnitsApi } from "../../unit-master/api/unitMasterApi";
import { QuickAddCategoryModal } from "../../item-category-master/QuickAddCategoryModal";
import { QuickAddSubCategoryModal } from "../../item-sub-category-master/QuickAddSubCategoryModal";
import { Plus } from "lucide-react";
import { Button } from "@mui/material";

function isActiveMasterRecord(record: MasterRecord) {
  return String(record.status ?? "Active").toLowerCase() !== "inactive";
}

function getRecordName(...values: unknown[]) {
  for (const value of values) {
    const name = String(value ?? "").trim();
    if (name) {
      return name;
    }
  }
  return "";
}

function recordsMatchCategory(record: MasterRecord, selectedCategory: string, selectedCategoryId = "") {
  const selectedName = selectedCategory.trim().toLowerCase();
  if (!selectedName && !selectedCategoryId) {
    return false;
  }

  const recordId = String(record.id ?? "").trim();
  const recordCategoryId = String(record.categoryId ?? "").trim();
  if (selectedCategoryId && (recordId === selectedCategoryId || recordCategoryId === selectedCategoryId)) {
    return true;
  }

  return [record.categoryName, record.category].some(
    (value) => String(value ?? "").trim().toLowerCase() === selectedName,
  );
}

function normalizeCategoryRows(records: MasterRecord[]) {
  return records.filter(isActiveMasterRecord).map((record) => {
    const name = getRecordName(record.categoryName, record.name, record.category);
    const hsn = getRecordName(record.hsnCode, record.hsn);
    const gst = getRecordName(record.gst, record.gstNo, record.gstPercentage);
    return {
      ...record,
      categoryName: name,
      name,
      category: name,
      hsnCode: hsn,
      hsn,
      gst,
      gstNo: gst,
      gstPercentage: gst,
    };
  });
}

function uniqueNames(values: string[]) {
  return [...new Set(values.filter(Boolean))];
}

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

export function useItemFormOptions(selectedCategory?: string) {
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
        const normalizedCategoryRows = normalizeCategoryRows(records);
        setCategoryOptions(
          uniqueNames(normalizedCategoryRows.map((row) => String(row.categoryName ?? ""))),
        );
        setCategoryRows(normalizedCategoryRows);
      })
      .catch(() => {});

    fetchItemSubCategoriesApi({ status: true, limit: 1000 })
      .then((records) => {
        setAllSubCategoryRows(records.filter(isActiveMasterRecord));
      })
      .catch(() => {});

    fetchHsnsApi({ status: true, limit: 1000 })
      .then((records) => {
        const active = records.filter(isActiveMasterRecord);
        const codes = uniqueNames(
          active.map((r) => getRecordName(r.hsnCode, r.code)),
        );
        setHsnOptions(codes);
        const normalizedHsnRows = active.map((r) => {
          const code = getRecordName(r.hsnCode, r.code);
          const gst = getRecordName(r.gstPercentage, r.gst);
          return {
            ...r,
            hsnCode: code,
            code,
            gstPercentage: gst,
            gst,
          };
        });
        setHsnRows(normalizedHsnRows);
      })
      .catch(() => {});

    fetchColorsApi({ status: true, limit: 1000 })
      .then((records) => {
        setColorOptions(
          uniqueNames(
            records.filter(isActiveMasterRecord).map((r) => getRecordName(r.colorName, r.name)),
          ),
        );
      })
      .catch(() => {});

    fetchUnitsApi({ status: true, limit: 1000 })
      .then((records) => {
        setUnitOptions(
          uniqueNames(
            records.filter(isActiveMasterRecord).map((r) => getRecordName(r.unitName, r.name)),
          ),
        );
      })
      .catch(() => {});
  }, []);

  const loadCategories = useCallback(() => {
    fetchItemCategoriesApi({ status: true, limit: 1000 })
      .then((records) => {
        const normalizedCategoryRows = normalizeCategoryRows(records);
        setCategoryOptions(
          uniqueNames(normalizedCategoryRows.map((row) => String(row.categoryName ?? ""))),
        );
        setCategoryRows(normalizedCategoryRows);
      })
      .catch(() => {});
  }, []);

  const loadSubCategories = useCallback(() => {
    fetchItemSubCategoriesApi({ status: true, limit: 1000 })
      .then((records) => {
        setAllSubCategoryRows(records.filter(isActiveMasterRecord));
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    const selectedName = selectedCategory?.trim() ?? "";
    if (!selectedName) {
      setSubCategoryOptions([]);
      return;
    }

    const selectedCategoryRow = categoryRows.find((row) =>
      recordsMatchCategory(row, selectedName),
    );
    const selectedCategoryId = selectedCategoryRow ? String(selectedCategoryRow.id ?? "") : "";

    const namesFromRows = (rows: MasterRecord[]) =>
      uniqueNames(rows.map((row) => getRecordName(row.itemSubCategory, row.name)));

    const applyFallback = () => {
      const filtered = allSubCategoryRows.filter((row) =>
        recordsMatchCategory(row, selectedName, selectedCategoryId),
      );
      setSubCategoryOptions(namesFromRows(filtered));
    };

    let cancelled = false;
    fetchItemSubCategoriesApi({
      status: true,
      limit: 1000,
      category: selectedName,
      ...(selectedCategoryId ? { categoryId: selectedCategoryId } : {}),
    })
      .then((records) => {
        if (cancelled) {
          return;
        }
        const names = namesFromRows(records.filter(isActiveMasterRecord));
        if (names.length > 0) {
          setSubCategoryOptions(names);
          return;
        }
        applyFallback();
      })
      .catch(() => {
        if (!cancelled) {
          applyFallback();
        }
      });

    return () => {
      cancelled = true;
    };
  }, [selectedCategory, allSubCategoryRows, categoryRows]);

  const loadColors = useCallback(() => {
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
  }, []);

  const loadUnits = useCallback(() => {
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
    loadColors,
    loadUnits,
    setCategoryOptions,
    setSubCategoryOptions,
    setColorOptions,
    setUnitOptions,
  };
}

export function buildItemDefinition(
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
        };
      }
      if (field.key === "subCategory") {
        return {
          ...field,
          options: subCategoryOptions,
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
        const gstOptions = uniqueNames([
          ...categoryRows.map((row) => getRecordName(row.gst, row.gstPercentage, row.gstNo)),
          ...hsnRows.map((row) => getRecordName(row.gstPercentage, row.gst)),
        ]);
        const nextGst: MasterFieldDefinition = {
          ...field,
          readOnly: true,
        };
        if (gstOptions.length) {
          nextGst.options = gstOptions;
        }
        if (categoryRows.length) {
          nextGst.autoFillFrom = {
            rows: categoryRows,
            sourceKey: "category",
            sourceMatchKey: "categoryName",
            sourceValueKey: "gst",
          };
        } else if (hsnRows.length) {
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
