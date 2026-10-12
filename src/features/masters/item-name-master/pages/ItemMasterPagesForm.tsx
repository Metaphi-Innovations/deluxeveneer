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
