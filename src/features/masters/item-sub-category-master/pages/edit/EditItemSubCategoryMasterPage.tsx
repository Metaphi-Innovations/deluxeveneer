import { useEffect, useMemo, useState } from "react";
import { Button } from "@mui/material";
import { Plus } from "lucide-react";
import { useParams } from "react-router";

import { invalidateMaster } from "../../../../../query/queryClient";
import { QuickAddCategoryModal } from "../../../item-category-master/QuickAddCategoryModal";
import { fetchItemCategoriesApi } from "../../../item-category-master/api/itemCategoryMasterApi";
import { MasterFormPage } from "../../../shared";
import type { MasterDefinition, MasterRecord } from "../../../shared/types";
import {
  fetchItemSubCategoriesApi,
  getItemSubCategoryByIdApi,
  syncItemSubCategoryMasterToStorage,
  updateItemSubCategoryApi,
} from "../../api/itemSubCategoryMasterApi";
import { itemSubCategoryMasterDefinition } from "../../itemSubCategoryMasterDefinition";

export function EditItemSubCategoryMasterPage() {
  const params = useParams<{ id: string }>();
  const [record, setRecord] = useState<MasterRecord | undefined>();
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [categoryOptions, setCategoryOptions] = useState<string[]>([]);
  const [quickAddCategoryOpen, setQuickAddCategoryOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>("");

  useEffect(() => {
    fetchItemCategoriesApi({ status: true, limit: 1000 })
      .then((records) => {
        const names = records
          .filter((entry) => String(entry.status ?? "Active").toLowerCase() !== "inactive")
          .map((entry) => String(entry.categoryName || entry.name || "").trim())
          .filter((name) => Boolean(name) && isNaN(Number(name)));
        setCategoryOptions([...new Set(names)]);
      })
      .catch(() => {});
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
      } catch (error) {
        if (!ignore) {
          setErrorMessage(
            error instanceof Error ? error.message : "Failed to load item sub-category.",
          );
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
    return {
      ...itemSubCategoryMasterDefinition,
      fields: itemSubCategoryMasterDefinition.fields.map((field) => {
        if (field.key !== "category") {
          return field;
        }

        return {
          ...field,
          options: categoryOptions,
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
    const id = context.row?.id || params.id;
    if (!id) {
      return;
    }

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
      if (allRecords.length > 0) {
        syncItemSubCategoryMasterToStorage(allRecords);
      }
    }
    void invalidateMaster("itemSubCategory");
  };

  return (
    <>
      <MasterFormPage
        additionalValues={selectedCategory ? { category: selectedCategory } : undefined}
        definition={definitionWithDynamicOptions}
        errorMessage={errorMessage}
        loading={isLoading}
        mode="edit"
        {...(record ? { record } : {})}
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
        }}
      />
      <QuickAddCategoryModal
        open={quickAddCategoryOpen}
        onClose={() => setQuickAddCategoryOpen(false)}
        onSuccess={(newCategory) => {
          setCategoryOptions((current) => [...new Set([newCategory, ...current])]);
          setSelectedCategory(newCategory);
        }}
      />
    </>
  );
}
