import { useEffect, useMemo, useState } from "react";
import { MasterFormPage, MasterListingPage } from "../../shared";
import type { MasterDefinition, MasterRecord } from "../../shared/types";
import { itemCategoryMasterDefinition } from "../mock/itemCategoryMasterData";
import {
  createItemCategoryApi,
  fetchItemCategoriesApi,
  syncItemCategoryMasterToStorage,
  updateItemCategoryApi,
  updateItemCategoryStatusApi,
} from "../itemCategoryMasterApi";

export function ItemCategoryMasterListPage() {
  const [apiRows, setApiRows] = useState<MasterRecord[]>([]);

  useEffect(() => {
    let isMounted = true;
    fetchItemCategoriesApi().then((records) => {
      if (isMounted && records.length > 0) {
        setApiRows(records);
        syncItemCategoryMasterToStorage(records);
      }
    });
    return () => {
      isMounted = false;
    };
  }, []);

  const definitionWithApiRows = useMemo<MasterDefinition>(() => {
    if (apiRows.length === 0) {
      return itemCategoryMasterDefinition;
    }
    return {
      ...itemCategoryMasterDefinition,
      rows: apiRows,
    };
  }, [apiRows]);

  const handleStatusToggle = async (row: MasterRecord, checked: boolean) => {
    try {
      await updateItemCategoryStatusApi(row.id, checked);
      const allRecords = await fetchItemCategoriesApi();
      if (allRecords.length > 0) {
        setApiRows(allRecords);
        syncItemCategoryMasterToStorage(allRecords);
      }
    } catch (error) {
      console.warn("Failed to toggle item category status via backend API:", error);
    }
  };

  return (
    <MasterListingPage
      definition={definitionWithApiRows}
      onStatusChange={handleStatusToggle}
    />
  );
}

export function AddItemCategoryMasterPage() {
  const handleSave = async (context: {
    definition: MasterDefinition;
    mode: "add" | "edit";
    row?: MasterRecord;
    values: Record<string, any>;
  }) => {
    try {
      const created = await createItemCategoryApi({
        categoryName: String(context.values.categoryName || context.values.name || ""),
        hsn: context.values.hsn || context.values.hsnCode || "4412",
        gst: context.values.gst || context.values.gstNo || "18%",
        remark: context.values.remark || context.values.remarks || null,
        status: context.values.status ?? true,
      });
      if (created) {
        const allRecords = await fetchItemCategoriesApi();
        if (allRecords.length > 0) {
          syncItemCategoryMasterToStorage(allRecords);
        }
      }
    } catch (error) {
      console.warn("Failed to create item category via API, fallback will persist locally:", error);
    }
  };

  return (
    <MasterFormPage
      definition={itemCategoryMasterDefinition}
      mode="add"
      onSave={handleSave}
    />
  );
}

export function EditItemCategoryMasterPage() {
  const handleSave = async (context: {
    definition: MasterDefinition;
    mode: "add" | "edit";
    row?: MasterRecord;
    values: Record<string, any>;
  }) => {
    if (context.row?.id) {
      try {
        const updated = await updateItemCategoryApi(context.row.id, {
          categoryName: String(context.values.categoryName || context.values.name || ""),
          hsn: context.values.hsn || context.values.hsnCode,
          gst: context.values.gst || context.values.gstNo,
          remark: context.values.remark || context.values.remarks || null,
          status: context.values.status,
        });
        if (updated) {
          const allRecords = await fetchItemCategoriesApi();
          if (allRecords.length > 0) {
            syncItemCategoryMasterToStorage(allRecords);
          }
        }
      } catch (error) {
        console.warn("Failed to update item category via API, fallback will persist locally:", error);
      }
    }
  };

  return (
    <MasterFormPage
      definition={itemCategoryMasterDefinition}
      mode="edit"
      onSave={handleSave}
    />
  );
}

export function ViewItemCategoryMasterPage() {
  return (
    <MasterFormPage definition={itemCategoryMasterDefinition} mode="view" />
  );
}
