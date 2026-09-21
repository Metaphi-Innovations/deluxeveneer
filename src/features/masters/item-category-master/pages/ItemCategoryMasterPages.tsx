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
import { fetchHsnsApi } from "../../hsn-master/hsnMasterApi";

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
    return () => { isMounted = false; };
  }, []);

  const definitionWithApiRows = useMemo<MasterDefinition>(() => {
    if (apiRows.length === 0) return itemCategoryMasterDefinition;
    return { ...itemCategoryMasterDefinition, rows: apiRows };
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

function useHsnOptions() {
  const [hsnOptions, setHsnOptions] = useState<string[]>([]);
  const [hsnRows, setHsnRows] = useState<MasterRecord[]>([]);

  useEffect(() => {
    fetchHsnsApi({ status: true, limit: 1000 }).then((records) => {
      const activeRecords = records.filter(
        (r) => String(r.status ?? "Active").toLowerCase() !== "inactive",
      );
      const codes = activeRecords
        .map((r) => String(r.hsnCode || r.code || "").trim())
        .filter(Boolean);
      setHsnOptions([...new Set(codes)]);
      setHsnRows(activeRecords);
    }).catch(() => {});
  }, []);

  return { hsnOptions, hsnRows };
}

function buildCategoryDefinitionWithHsn(
  baseDefinition: MasterDefinition,
  hsnOptions: string[],
  hsnRows: MasterRecord[],
): MasterDefinition {
  if (!hsnOptions.length) return baseDefinition;
  return {
    ...baseDefinition,
    fields: baseDefinition.fields.map((field) => {
      if (field.key === "hsn") {
        return { ...field, options: hsnOptions };
      }
      if (field.key === "gst") {
        return {
          ...field,
          readOnly: true,
          autoFillFrom: {
            rows: hsnRows,
            sourceSlug: "hsn-master",
            sourceKey: "hsn",
            sourceMatchKey: "hsnCode",
            sourceValueKey: "gstPercentage",
          },
        };
      }
      return field;
    }),
  };
}

export function AddItemCategoryMasterPage() {
  const { hsnOptions, hsnRows } = useHsnOptions();

  const definitionWithDynamicOptions = useMemo<MasterDefinition>(
    () => buildCategoryDefinitionWithHsn(itemCategoryMasterDefinition, hsnOptions, hsnRows),
    [hsnOptions, hsnRows],
  );

  const handleSave = async (context: {
    definition: MasterDefinition;
    mode: "add" | "edit";
    row?: MasterRecord;
    values: Record<string, any>;
  }) => {
    try {
      const created = await createItemCategoryApi({
        categoryName: String(context.values.categoryName || context.values.name || ""),
        hsn: context.values.hsn || context.values.hsnCode || "",
        gst: context.values.gst || context.values.gstNo || "",
        remark: context.values.remark || context.values.remarks || null,
        status: context.values.status ?? true,
      });
      if (created) {
        const allRecords = await fetchItemCategoriesApi();
        if (allRecords.length > 0) syncItemCategoryMasterToStorage(allRecords);
      }
    } catch (error) {
      console.warn("Failed to create item category via API, fallback will persist locally:", error);
    }
  };

  return (
    <MasterFormPage
      definition={definitionWithDynamicOptions}
      mode="add"
      onSave={handleSave}
    />
  );
}

export function EditItemCategoryMasterPage() {
  const { hsnOptions, hsnRows } = useHsnOptions();

  const definitionWithDynamicOptions = useMemo<MasterDefinition>(
    () => buildCategoryDefinitionWithHsn(itemCategoryMasterDefinition, hsnOptions, hsnRows),
    [hsnOptions, hsnRows],
  );

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
          if (allRecords.length > 0) syncItemCategoryMasterToStorage(allRecords);
        }
      } catch (error) {
        console.warn("Failed to update item category via API, fallback will persist locally:", error);
      }
    }
  };

  return (
    <MasterFormPage
      definition={definitionWithDynamicOptions}
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
