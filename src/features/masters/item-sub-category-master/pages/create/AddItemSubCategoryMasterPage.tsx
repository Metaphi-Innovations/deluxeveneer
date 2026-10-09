import { useCallback, useEffect, useMemo, useState } from "react";
import { Button } from "@mui/material";
import { Plus } from "lucide-react";

import { invalidateMaster } from "../../../../../query/queryClient";
import { QuickAddCategoryModal } from "../../../item-category-master/QuickAddCategoryModal";
import { fetchItemCategoriesApi } from "../../../item-category-master/api/itemCategoryMasterApi";
import { MasterFormPage } from "../../../shared";
import type { MasterDefinition, MasterRecord } from "../../../shared/types";
import {
  createItemSubCategoryApi,
  fetchItemSubCategoriesApi,
  syncItemSubCategoryMasterToStorage,
} from "../../api/itemSubCategoryMasterApi";
import { itemSubCategoryMasterDefinition } from "../../itemSubCategoryMasterDefinition";

export function AddItemSubCategoryMasterPage() {
  const [categoryOptions, setCategoryOptions] = useState<string[]>([]);
  const [quickAddCategoryOpen, setQuickAddCategoryOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>("");

  const loadCategories = useCallback(() => {
    fetchItemCategoriesApi({ status: true, limit: 1000 })
      .then((records) => {
        const names = records
          .filter((record) => String(record.status ?? "Active").toLowerCase() !== "inactive")
          .map((record) => String(record.categoryName || record.name || "").trim())
          .filter((name) => Boolean(name) && isNaN(Number(name)));
        setCategoryOptions([...new Set(names)]);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    loadCategories();
  }, [loadCategories]);

  const definitionWithDynamicOptions = useMemo<MasterDefinition>(() => {
    return {
      ...itemSubCategoryMasterDefinition,
      fields: itemSubCategoryMasterDefinition.fields.map((field) => {
        if (field.key !== "category") {
          return field;
        }

        return {
          ...field,
          options: categoryOptions,
          renderDropdownAction: ({ close }) => (
            <Button
              fullWidth
              size="small"
              startIcon={<Plus size={14} />}
              onClick={() => {
                close();
                setQuickAddCategoryOpen(true);
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
        };
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
        if (allRecords.length > 0) {
          syncItemSubCategoryMasterToStorage(allRecords);
        }
      }
      void invalidateMaster("itemSubCategory");
    } catch (error) {
      console.warn("Failed to create item sub-category via API:", error);
    }
  };

  return (
    <>
      <MasterFormPage
        additionalValues={selectedCategory ? { category: selectedCategory } : undefined}
        definition={definitionWithDynamicOptions}
        mode="add"
        onSave={handleSave}
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
    </>
  );
}
