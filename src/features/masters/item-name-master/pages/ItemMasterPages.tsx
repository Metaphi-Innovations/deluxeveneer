import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router";
import { MasterFormPage, MasterListingPage } from "../../shared";
import { createLocalMasterRecord, updateLocalMasterRecord } from "../../shared/localMasterStore";
import type { MasterDefinition, MasterFieldDefinition, MasterRecord } from "../../shared/types";
import { itemMasterDefinition } from "../mock/itemMasterData";
import {
  createItemApi,
  fetchItemsApi,
  getItemByIdApi,
  getStoredItemMasterRows,
  syncItemMasterToStorage,
  updateItemApi,
  updateItemStatusApi,
} from "../itemMasterApi";
import { fetchItemCategoriesApi } from "../../item-category-master/itemCategoryMasterApi";
import { fetchItemSubCategoriesApi } from "../../item-sub-category-master/itemSubCategoryMasterApi";
import { fetchHsnsApi } from "../../hsn-master/hsnMasterApi";
import { fetchColorsApi } from "../../color-master/colorMasterApi";

export function ItemMasterListPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [apiRows, setApiRows] = useState<MasterRecord[]>(() => {
    return getStoredItemMasterRows();
  });

  const loadItems = async () => {
    try {
      const records = await fetchItemsApi({ limit: 1000 });
      if (records && records.length > 0) {
        setApiRows(records);
        syncItemMasterToStorage(records);
      } else {
        const stored = getStoredItemMasterRows();
        if (stored.length > 0) {
          setApiRows(stored);
        } else {
          setApiRows([]);
        }
      }
    } catch (err) {
      console.warn("Failed to fetch items:", err);
      const stored = getStoredItemMasterRows();
      if (stored.length > 0) {
        setApiRows(stored);
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadItems();
  }, []);

  const definitionWithApiRows = useMemo<MasterDefinition>(() => {
    return { ...itemMasterDefinition, rows: apiRows };
  }, [apiRows]);

  const handleStatusToggle = async (row: MasterRecord, checked: boolean) => {
    // Optimistically update status
    setApiRows((prev) =>
      prev.map((r) =>
        r.id === row.id
          ? {
              ...r,
              status: checked ? "Active" : "Inactive",
              statusLabel: checked ? "Active" : "Inactive",
            }
          : r,
      ),
    );

    try {
      await updateItemStatusApi(row.id, checked);
      const allRecords = await fetchItemsApi({ limit: 1000 });
      if (allRecords.length > 0) {
        setApiRows(allRecords);
        syncItemMasterToStorage(allRecords);
      }
    } catch (error) {
      console.warn("Failed to toggle item status via backend API:", error);
      // Revert optimistic update
      setApiRows((prev) =>
        prev.map((r) =>
          r.id === row.id
            ? { ...r, status: row.status, statusLabel: row.statusLabel }
            : r,
        ),
      );
    }
  };

  return (
    <MasterListingPage
      definition={definitionWithApiRows}
      rows={apiRows}
      loading={isLoading && apiRows.length === 0}
      onStatusChange={handleStatusToggle}
    />
  );
}

/**
 * Hook: loads categories, HSN codes, colors, and sub-categories from API.
 */
function useItemFormOptions(selectedCategory?: string) {
  const [categoryOptions, setCategoryOptions] = useState<string[]>([]);
  const [categoryRows, setCategoryRows] = useState<MasterRecord[]>([]);
  const [subCategoryOptions, setSubCategoryOptions] = useState<string[]>([]);
  const [allSubCategoryRows, setAllSubCategoryRows] = useState<MasterRecord[]>([]);
  const [hsnOptions, setHsnOptions] = useState<string[]>([]);
  const [hsnRows, setHsnRows] = useState<MasterRecord[]>([]);
  const [colorOptions, setColorOptions] = useState<string[]>([]);

  // Load categories, HSN codes, colors, and sub-categories on mount
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
  }, []);

  // Update sub-category options when selectedCategory or allSubCategoryRows changes
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

  return { categoryOptions, categoryRows, subCategoryOptions, hsnOptions, hsnRows, colorOptions };
}

function buildItemDefinition(
  base: MasterDefinition,
  categoryOptions: string[],
  categoryRows: MasterRecord[],
  subCategoryOptions: string[],
  hsnOptions: string[],
  hsnRows: MasterRecord[],
  colorOptions: string[],
): MasterDefinition {
  return {
    ...base,
    fields: base.fields.map((field) => {
      if (field.key === "category" && categoryOptions.length) {
        return { ...field, options: categoryOptions };
      }
      if (field.key === "subCategory") {
        return { ...field, options: subCategoryOptions };
      }
      if (field.key === "color" && colorOptions.length) {
        return { ...field, options: colorOptions };
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

export function AddItemMasterPage() {
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const { categoryOptions, categoryRows, subCategoryOptions, hsnOptions, hsnRows, colorOptions } =
    useItemFormOptions(selectedCategory);

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
      ),
    [categoryOptions, categoryRows, subCategoryOptions, hsnOptions, hsnRows, colorOptions],
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
        syncItemMasterToStorage([created, ...existing.filter((r) => r.id !== created.id)]);

        const allRecords = await fetchItemsApi({ limit: 1000 });
        if (allRecords.length > 0) {
          syncItemMasterToStorage(allRecords);
        }
      } else {
        const localRec = createLocalMasterRecord(context.definition, context.values);
        const existing = getStoredItemMasterRows();
        syncItemMasterToStorage([localRec, ...existing.filter((r) => r.id !== localRec.id)]);
      }
    } catch (error: any) {
      console.warn("Failed to create item via API:", error);
      const msg = error?.message || "";
      if (
        msg.includes("already exists") ||
        msg.includes("Validation") ||
        msg.includes("required") ||
        msg.includes("cannot be empty")
      ) {
        throw error;
      }
      const localRec = createLocalMasterRecord(context.definition, context.values);
      const existing = getStoredItemMasterRows();
      syncItemMasterToStorage([localRec, ...existing.filter((r) => r.id !== localRec.id)]);
    }
  };

  return (
    <MasterFormPage
      definition={definition}
      mode="add"
      onSave={handleSave}
      onFieldChange={(key, value) => {
        if (key === "category" && typeof value === "string") {
          setSelectedCategory(value);
        }
      }}
    />
  );
}

export function EditItemMasterPage() {
  const { id } = useParams<{ id: string }>();
  const [record, setRecord] = useState<MasterRecord | undefined>();
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>("");

  useEffect(() => {
    if (id) {
      setIsLoading(true);
      getItemByIdApi(id)
        .then((rec) => {
          if (rec) {
            setRecord(rec);
            if (rec.category) {
              setSelectedCategory(String(rec.category));
            }
          }
        })
        .catch((err) => {
          console.warn("Failed to fetch item for edit:", err);
        })
        .finally(() => {
          setIsLoading(false);
        });
    }
  }, [id]);

  const { categoryOptions, categoryRows, subCategoryOptions, hsnOptions, hsnRows, colorOptions } =
    useItemFormOptions(selectedCategory);

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
      ),
    [categoryOptions, categoryRows, subCategoryOptions, hsnOptions, hsnRows, colorOptions],
  );

  const handleSave = async (context: {
    definition: MasterDefinition;
    mode: "add" | "edit";
    row?: MasterRecord;
    values: Record<string, any>;
  }) => {
    const editId = context.row?.id || id;
    if (!editId) return;

    const itemName = String(context.values.itemName || context.values.name || "").trim();
    const itemCode = String(context.values.factoryItemCode || context.values.itemCode || "").trim();
    const category = context.values.category;
    const subCategory = context.values.subCategory;
    const color = context.values.color;
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
        syncItemMasterToStorage(existing.map((r) => (r.id === editId ? updated : r)));
        const allRecords = await fetchItemsApi({ limit: 1000 });
        if (allRecords.length > 0) {
          syncItemMasterToStorage(allRecords);
        }
      } else {
        updateLocalMasterRecord(context.definition, context.row ?? { id: editId }, context.values);
      }
    } catch (error: any) {
      console.warn("Failed to update item via API:", error);
      const msg = error?.message || "";
      if (
        msg.includes("already exists") ||
        msg.includes("Validation") ||
        msg.includes("required") ||
        msg.includes("cannot be empty")
      ) {
        throw error;
      }
      updateLocalMasterRecord(context.definition, context.row ?? { id: editId }, context.values);
    }
  };

  return (
    <MasterFormPage
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
  );
}

export function ViewItemMasterPage() {
  const { id } = useParams<{ id: string }>();
  const [record, setRecord] = useState<MasterRecord | undefined>();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (id) {
      setIsLoading(true);
      getItemByIdApi(id)
        .then((rec) => {
          if (rec) setRecord(rec);
        })
        .catch((err) => {
          console.warn("Failed to fetch item for view:", err);
        })
        .finally(() => {
          setIsLoading(false);
        });
    }
  }, [id]);

  return (
    <MasterFormPage
      definition={itemMasterDefinition}
      mode="view"
      {...(record ? { record } : {})}
      loading={isLoading}
    />
  );
}

