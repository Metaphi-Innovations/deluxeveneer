import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router";

import { invalidateMaster } from "../../../../../query/queryClient";
import { QuickAddCategoryModal } from "../../../item-category-master/QuickAddCategoryModal";
import { QuickAddSubCategoryModal } from "../../../item-sub-category-master/QuickAddSubCategoryModal";
import { MasterFormPage } from "../../../shared";
import { updateLocalMasterRecord } from "../../../shared/localMasterStore";
import type { MasterDefinition, MasterRecord } from "../../../shared/types";
import {
  fetchItemsApi,
  getItemByIdApi,
  getStoredItemMasterRows,
  syncItemMasterToStorage,
  updateItemApi,
} from "../../api/itemMasterApi";
import { itemMasterDefinition } from "../../itemMasterDefinition";
import { buildItemDefinition, useItemFormOptions } from "../ItemMasterPagesForm";

export function EditItemMasterPage() {
  const { id } = useParams<{ id: string }>();
  const [record, setRecord] = useState<MasterRecord | undefined>();
  const [isLoading, setIsLoading] = useState(true);
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

  useEffect(() => {
    if (!id) {
      return;
    }

    setIsLoading(true);
    getItemByIdApi(id)
      .then((nextRecord) => {
        if (nextRecord) {
          setRecord(nextRecord);
          if (nextRecord.category) {
            setSelectedCategory(String(nextRecord.category));
          }
        }
      })
      .catch((error) => {
        console.warn("Failed to fetch item for edit:", error);
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [id]);

  const handleSave = async (context: {
    definition: MasterDefinition;
    mode: "add" | "edit";
    row?: MasterRecord;
    values: Record<string, any>;
  }) => {
    const editId = context.row?.id || id;
    if (!editId) {
      return;
    }

    const itemName = String(context.values.itemName || context.values.name || "").trim();
    const itemCode = String(context.values.factoryItemCode || context.values.itemCode || "").trim();
    const category = context.values.category;
    const subCategory = context.values.subCategory;
    const color = context.values.color;
    const unitName = String(context.values.unitName || context.values.unit || "").trim();
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
        syncItemMasterToStorage(existing.map((row) => (row.id === editId ? updated : row)));
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
      const message = error?.message || "";
      if (
        message.includes("already exists") ||
        message.includes("Validation") ||
        message.includes("required") ||
        message.includes("cannot be empty")
      ) {
        throw error;
      }
      updateLocalMasterRecord(context.definition, context.row ?? { id: editId }, context.values);
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
