import { useMemo, useState } from "react";

import { invalidateMaster } from "../../../../../query/queryClient";
import { QuickAddCategoryModal } from "../../../item-category-master/QuickAddCategoryModal";
import { QuickAddSubCategoryModal } from "../../../item-sub-category-master/QuickAddSubCategoryModal";
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
    return Object.keys(values).length > 0 ? values : undefined;
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
    </>
  );
}
