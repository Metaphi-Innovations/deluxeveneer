import { useMemo, useState } from "react";
import { Button } from "@mui/material";

import { invalidateMaster } from "../../../../../query/queryClient";
import { QuickAddCategoryModal } from "../../../item-category-master/QuickAddCategoryModal";
import { QuickAddSubCategoryModal } from "../../../item-sub-category-master/QuickAddSubCategoryModal";
import { QuickAddColorModal } from "../../../color-master/QuickAddColorModal";
import { QuickAddUnitModal } from "../../../unit-master/QuickAddUnitModal";
import { MasterFormPage } from "../../../shared";
import { createLocalMasterRecord } from "../../../shared/localMasterStore";
import type { MasterDefinition, MasterRecord } from "../../../shared/types";
import {
  createItemApi,
  fetchItemsApi,
  getStoredItemMasterRows,
  syncItemMasterToStorage,
} from "../../api/itemMasterApi";
import { itemMasterDefinition } from "../../itemMasterDefinition";
import { buildItemDefinition, useItemFormOptions } from "../ItemMasterPagesForm";

export function AddItemMasterPage() {
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [selectedSubCategory, setSelectedSubCategory] = useState<string>("");
  const [selectedColor, setSelectedColor] = useState<string>("");
  const [selectedUnit, setSelectedUnit] = useState<string>("");
  const [quickAddCategoryOpen, setQuickAddCategoryOpen] = useState(false);
  const [quickAddSubCategoryOpen, setQuickAddSubCategoryOpen] = useState(false);
  const [quickAddColorOpen, setQuickAddColorOpen] = useState(false);
  const [quickAddUnitOpen, setQuickAddUnitOpen] = useState(false);
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
    loadColors,
    loadUnits,
    setCategoryOptions,
    setSubCategoryOptions,
    setColorOptions,
    setUnitOptions,
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
    const unitName = String(context.values.unitName || context.values.unit || "").trim();
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
        syncItemMasterToStorage([created, ...existing.filter((row) => row.id !== created.id)]);

        const allRecords = await fetchItemsApi({ limit: 1000 });
        if (allRecords.length > 0) {
          syncItemMasterToStorage(allRecords);
        }
      } else {
        const localRecord = createLocalMasterRecord(context.definition, context.values);
        const existing = getStoredItemMasterRows();
        syncItemMasterToStorage([
          localRecord,
          ...existing.filter((row) => row.id !== localRecord.id),
        ]);
      }
      void invalidateMaster("item");
    } catch (error: any) {
      console.warn("Failed to create item via API:", error);
      const message = error?.message || "";
      if (
        message.includes("already exists") ||
        message.includes("Validation") ||
        message.includes("required") ||
        message.includes("cannot be empty")
      ) {
        throw error;
      }
      const localRecord = createLocalMasterRecord(context.definition, context.values);
      const existing = getStoredItemMasterRows();
      syncItemMasterToStorage([
        localRecord,
        ...existing.filter((row) => row.id !== localRecord.id),
      ]);
    }
  };

  const additionalValues = useMemo(() => {
    const values: Record<string, string> = {};
    if (selectedCategory) values.category = selectedCategory;
    if (selectedSubCategory) values.subCategory = selectedSubCategory;
    if (selectedColor) values.color = selectedColor;
    if (selectedUnit) values.unitName = selectedUnit;
    return Object.keys(values).length > 0 ? values : undefined;
  }, [selectedCategory, selectedSubCategory, selectedColor, selectedUnit]);

  return (
    <>
      <MasterFormPage
        additionalValues={additionalValues}
        definition={definition}
        mode="add"
        onSave={handleSave}
        fieldActions={{
          category: (
            <Button
              size="small"
              onClick={() => setQuickAddCategoryOpen(true)}
              sx={(theme) => ({
                p: 0,
                minWidth: "auto",
                fontSize: "11px",
                lineHeight: 1.3,
                fontWeight: 600,
                textTransform: "none",
                color: theme.customTokens.brand.primary,
                "&:hover": {
                  backgroundColor: "transparent",
                  textDecoration: "underline",
                },
              })}
            >
              + Add Category
            </Button>
          ),
          subCategory: (
            <Button
              size="small"
              onClick={() => setQuickAddSubCategoryOpen(true)}
              sx={(theme) => ({
                p: 0,
                minWidth: "auto",
                fontSize: "11px",
                lineHeight: 1.3,
                fontWeight: 600,
                textTransform: "none",
                color: theme.customTokens.brand.primary,
                "&:hover": {
                  backgroundColor: "transparent",
                  textDecoration: "underline",
                },
              })}
            >
              + Add Sub Category
            </Button>
          ),
          color: (
            <Button
              size="small"
              onClick={() => setQuickAddColorOpen(true)}
              sx={(theme) => ({
                p: 0,
                minWidth: "auto",
                fontSize: "11px",
                lineHeight: 1.3,
                fontWeight: 600,
                textTransform: "none",
                color: theme.customTokens.brand.primary,
                "&:hover": {
                  backgroundColor: "transparent",
                  textDecoration: "underline",
                },
              })}
            >
              + Add Color
            </Button>
          ),
          unitName: (
            <Button
              size="small"
              onClick={() => setQuickAddUnitOpen(true)}
              sx={(theme) => ({
                p: 0,
                minWidth: "auto",
                fontSize: "11px",
                lineHeight: 1.3,
                fontWeight: 600,
                textTransform: "none",
                color: theme.customTokens.brand.primary,
                "&:hover": {
                  backgroundColor: "transparent",
                  textDecoration: "underline",
                },
              })}
            >
              + Add Unit
            </Button>
          ),
        }}
        onFieldChange={(key, value) => {
          if (key === "category" && typeof value === "string") {
            setSelectedCategory(value);
          }
          if (key === "color" && typeof value === "string") {
            setSelectedColor(value);
          }
          if (key === "unitName" && typeof value === "string") {
            setSelectedUnit(value);
          }
        }}
      />
      <QuickAddCategoryModal
        open={quickAddCategoryOpen}
        onClose={() => setQuickAddCategoryOpen(false)}
        onSuccess={(newCategory) => {
          setCategoryOptions((current) => [...new Set([newCategory, ...current])]);
          setSelectedCategory(newCategory);
          loadCategories();
        }}
      />
      <QuickAddSubCategoryModal
        open={quickAddSubCategoryOpen}
        defaultCategory={selectedCategory}
        onClose={() => setQuickAddSubCategoryOpen(false)}
        onSuccess={(newSubCategory) => {
          setSubCategoryOptions((current) => [...new Set([newSubCategory, ...current])]);
          setSelectedSubCategory(newSubCategory);
          loadSubCategories();
        }}
      />
      <QuickAddColorModal
        open={quickAddColorOpen}
        onClose={() => setQuickAddColorOpen(false)}
        onSuccess={(newColor) => {
          setColorOptions((current) => [...new Set([newColor, ...current])]);
          setSelectedColor(newColor);
          loadColors();
        }}
      />
      <QuickAddUnitModal
        open={quickAddUnitOpen}
        onClose={() => setQuickAddUnitOpen(false)}
        onSuccess={(newUnit) => {
          setUnitOptions((current) => [...new Set([newUnit, ...current])]);
          setSelectedUnit(newUnit);
          loadUnits();
        }}
      />
    </>
  );
}
