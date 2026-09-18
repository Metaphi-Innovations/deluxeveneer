import { useEffect, useMemo, useState } from "react";
import { MasterFormPage, MasterListingPage } from "../../shared";
import type { MasterDefinition, MasterRecord } from "../../shared/types";
import { itemMasterDefinition } from "../mock/itemMasterData";
import {
  createItemApi,
  fetchItemsApi,
  syncItemMasterToStorage,
  updateItemApi,
  updateItemStatusApi,
} from "../itemMasterApi";

export function ItemMasterListPage() {
  const [apiRows, setApiRows] = useState<MasterRecord[]>([]);

  useEffect(() => {
    let isMounted = true;
    fetchItemsApi().then((records) => {
      if (isMounted && records.length > 0) {
        setApiRows(records);
        syncItemMasterToStorage(records);
      }
    });
    return () => {
      isMounted = false;
    };
  }, []);

  const definitionWithApiRows = useMemo<MasterDefinition>(() => {
    if (apiRows.length === 0) {
      return itemMasterDefinition;
    }
    return {
      ...itemMasterDefinition,
      rows: apiRows,
    };
  }, [apiRows]);

  const handleStatusToggle = async (row: MasterRecord, checked: boolean) => {
    try {
      await updateItemStatusApi(row.id, checked);
      const allRecords = await fetchItemsApi();
      if (allRecords.length > 0) {
        setApiRows(allRecords);
        syncItemMasterToStorage(allRecords);
      }
    } catch (error) {
      console.warn("Failed to toggle item status via backend API:", error);
    }
  };

  return (
    <MasterListingPage
      definition={definitionWithApiRows}
      onStatusChange={handleStatusToggle}
    />
  );
}

export function AddItemMasterPage() {
  const handleSave = async (context: {
    definition: MasterDefinition;
    mode: "add" | "edit";
    row?: MasterRecord;
    values: Record<string, any>;
  }) => {
    try {
      const created = await createItemApi({
        itemName: String(context.values.itemName || context.values.name || ""),
        name: String(context.values.itemName || context.values.name || ""),
        factoryItemCode: String(context.values.factoryItemCode || context.values.itemCode || ""),
        itemCode: String(context.values.factoryItemCode || context.values.itemCode || ""),
        category: context.values.category || "Decorative Veneer",
        subCategory: context.values.subCategory || "Natural Veneer",
        color: context.values.color || "Natural Oak",
        hsn: context.values.hsn || context.values.hsnCode || "4408",
        gst: context.values.gst || context.values.gstNo || "12%",
        remark: context.values.remark || context.values.remarks || null,
        remarks: context.values.remark || context.values.remarks || null,
        status: context.values.status ?? true,
      });
      if (created) {
        const allRecords = await fetchItemsApi();
        if (allRecords.length > 0) {
          syncItemMasterToStorage(allRecords);
        }
      }
    } catch (error) {
      console.warn("Failed to create item via API, fallback will persist locally:", error);
    }
  };

  return (
    <MasterFormPage
      definition={itemMasterDefinition}
      mode="add"
      onSave={handleSave}
    />
  );
}

export function EditItemMasterPage() {
  const handleSave = async (context: {
    definition: MasterDefinition;
    mode: "add" | "edit";
    row?: MasterRecord;
    values: Record<string, any>;
  }) => {
    if (context.row?.id) {
      try {
        const updated = await updateItemApi(context.row.id, {
          itemName: String(context.values.itemName || context.values.name || ""),
          name: String(context.values.itemName || context.values.name || ""),
          factoryItemCode: String(context.values.factoryItemCode || context.values.itemCode || ""),
          itemCode: String(context.values.factoryItemCode || context.values.itemCode || ""),
          category: context.values.category,
          subCategory: context.values.subCategory,
          color: context.values.color,
          hsn: context.values.hsn || context.values.hsnCode,
          gst: context.values.gst || context.values.gstNo,
          remark: context.values.remark || context.values.remarks || null,
          remarks: context.values.remark || context.values.remarks || null,
          status: context.values.status,
        });
        if (updated) {
          const allRecords = await fetchItemsApi();
          if (allRecords.length > 0) {
            syncItemMasterToStorage(allRecords);
          }
        }
      } catch (error) {
        console.warn("Failed to update item via API, fallback will persist locally:", error);
      }
    }
  };

  return (
    <MasterFormPage
      definition={itemMasterDefinition}
      mode="edit"
      onSave={handleSave}
    />
  );
}

export function ViewItemMasterPage() {
  return <MasterFormPage definition={itemMasterDefinition} mode="view" />;
}

