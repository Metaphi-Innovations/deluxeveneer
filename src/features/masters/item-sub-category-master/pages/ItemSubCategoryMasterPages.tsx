import { useEffect, useMemo, useState } from "react";
import { MasterFormPage, MasterListingPage } from "../../shared";
import type { MasterDefinition, MasterRecord } from "../../shared/types";
import { itemSubCategoryMasterDefinition } from "../mock/itemSubCategoryMasterData";
import {
  createItemSubCategoryApi,
  fetchItemSubCategoriesApi,
  syncItemSubCategoryMasterToStorage,
  updateItemSubCategoryApi,
  updateItemSubCategoryStatusApi,
} from "../itemSubCategoryMasterApi";

export function ItemSubCategoryMasterListPage() {
  const [apiRows, setApiRows] = useState<MasterRecord[]>([]);

  useEffect(() => {
    let isMounted = true;
    fetchItemSubCategoriesApi().then((records) => {
      if (isMounted && records.length > 0) {
        setApiRows(records);
        syncItemSubCategoryMasterToStorage(records);
      }
    });
    return () => {
      isMounted = false;
    };
  }, []);

  const definitionWithApiRows = useMemo<MasterDefinition>(() => {
    if (apiRows.length === 0) {
      return itemSubCategoryMasterDefinition;
    }
    return {
      ...itemSubCategoryMasterDefinition,
      rows: apiRows,
    };
  }, [apiRows]);

  const handleStatusToggle = async (row: MasterRecord, checked: boolean) => {
    try {
      await updateItemSubCategoryStatusApi(row.id, checked);
      const allRecords = await fetchItemSubCategoriesApi();
      if (allRecords.length > 0) {
        setApiRows(allRecords);
        syncItemSubCategoryMasterToStorage(allRecords);
      }
    } catch (error) {
      console.warn("Failed to toggle item sub category status via backend API:", error);
    }
  };

  return (
    <MasterListingPage
      definition={definitionWithApiRows}
      onStatusChange={handleStatusToggle}
    />
  );
}

export function AddItemSubCategoryMasterPage() {
  const handleSave = async (context: {
    definition: MasterDefinition;
    mode: "add" | "edit";
    row?: MasterRecord;
    values: Record<string, any>;
  }) => {
    try {
      const created = await createItemSubCategoryApi({
        itemSubCategory: String(context.values.itemSubCategory || context.values.name || ""),
        name: String(context.values.itemSubCategory || context.values.name || ""),
        category: context.values.category || "Decorative Veneer",
        categoryName: context.values.category || "Decorative Veneer",
        remark: context.values.remark || context.values.remarks || null,
        remarks: context.values.remark || context.values.remarks || null,
        status: context.values.status ?? true,
      });
      if (created) {
        const allRecords = await fetchItemSubCategoriesApi();
        if (allRecords.length > 0) {
          syncItemSubCategoryMasterToStorage(allRecords);
        }
      }
    } catch (error) {
      console.warn("Failed to create item sub category via API, fallback will persist locally:", error);
    }
  };

  return (
    <MasterFormPage
      definition={itemSubCategoryMasterDefinition}
      mode="add"
      onSave={handleSave}
    />
  );
}

export function EditItemSubCategoryMasterPage() {
  const handleSave = async (context: {
    definition: MasterDefinition;
    mode: "add" | "edit";
    row?: MasterRecord;
    values: Record<string, any>;
  }) => {
    if (context.row?.id) {
      try {
        const updated = await updateItemSubCategoryApi(context.row.id, {
          itemSubCategory: String(context.values.itemSubCategory || context.values.name || ""),
          name: String(context.values.itemSubCategory || context.values.name || ""),
          category: context.values.category,
          categoryName: context.values.category,
          remark: context.values.remark || context.values.remarks || null,
          remarks: context.values.remark || context.values.remarks || null,
          status: context.values.status,
        });
        if (updated) {
          const allRecords = await fetchItemSubCategoriesApi();
          if (allRecords.length > 0) {
            syncItemSubCategoryMasterToStorage(allRecords);
          }
        }
      } catch (error) {
        console.warn("Failed to update item sub category via API, fallback will persist locally:", error);
      }
    }
  };

  return (
    <MasterFormPage
      definition={itemSubCategoryMasterDefinition}
      mode="edit"
      onSave={handleSave}
    />
  );
}

export function ViewItemSubCategoryMasterPage() {
  return (
    <MasterFormPage definition={itemSubCategoryMasterDefinition} mode="view" />
  );
}

