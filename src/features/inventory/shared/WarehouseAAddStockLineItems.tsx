import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from "react";
import type { ReactNode } from "react";
import {
  Autocomplete,
  Box,
  Button,
  IconButton,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Typography,
  useTheme,
} from "@mui/material";
import type { Theme } from "@mui/material/styles";
import { Plus, Trash2 } from "lucide-react";

import type { MasterRecord } from "../../masters/shared";
import { buildLocalMasterDefinition } from "../../masters/shared/localMasterStore";
import {
  getHsnGstPercentage,
  gstMasterOptions,
  hsnMasterOptions,
  itemMasterDefinition,
  unitMasterOptions,
} from "../../masters/shared/masterDefinitions";
import {
  getCachedItemMasterRows,
  refreshItemMasterCache,
} from "../../masters/item-name-master/itemMasterApi";
import {
  getCachedItemSubCategoryMasterRows,
  refreshItemSubCategoryMasterCache,
} from "../../masters/item-sub-category-master/itemSubCategoryMasterApi";
import {
  fetchUnitsApi,
  syncUnitMasterToStorage,
} from "../../masters/unit-master/unitMasterApi";
import { ErpSelectField } from "../../../pages/ComponentLibrary/shared/ErpFieldControls";
import { getCompactFieldSx } from "../../../pages/ComponentLibrary/sections/inputs/components/inputFieldStyles";
import {
  getAutocompleteListboxSx,
  getAutocompletePaperSx,
  getAutocompletePopperSlotProps,
} from "../../shared/dropdownMenuStyles";
import { formatAmount as formatAmountShared } from "../../shared/numberFormat";

export type WarehouseAAddStockSlug =
  | "veneer-blocks"
  | "raw-veneer"
  | "plywood"
  | "mdf"
  | "consumables";

export type WarehouseAGstMode = "intra" | "inter";

export type WarehouseALineItemsTotals = {
  cgst: number;
  igst: number;
  itemAmount: number;
  sgst: number;
  totalAmount: number;
};

export type WarehouseAAddStockFieldType =
  | "text"
  | "select"
  | "item-name"
  | "hsn"
  | "gst"
  | "computed";

export type WarehouseAAddStockFieldConfig = {
  key: string;
  label: string;
  minWidth: number;
  options?: readonly string[];
  placeholder: string;
  required?: boolean;
  type: WarehouseAAddStockFieldType;
};

type DynamicFieldConfig = WarehouseAAddStockFieldConfig;

type DynamicLineItem = {
  id: string;
  values: Record<string, string>;
};

export interface WarehouseAAddStockLineItemsHandle {
  getFilledLineItems: () => Array<{ id: string; values: Record<string, string> }>;
  validate: () => boolean;
  /** Fill N lines with test values; dropdowns only use loaded options. */
  applyTestAutofill: (itemCount?: number) => void;
}

const warehouseAAddStockTableConfigs: Record<
  WarehouseAAddStockSlug,
  readonly DynamicFieldConfig[]
> = {
  "veneer-blocks": [
    { key: "inwardItemCode", label: "Inward Item Code", minWidth: 160, placeholder: "Enter code", type: "text", required: true },
    { key: "itemName", label: "Item Name", minWidth: 260, placeholder: "Search or enter item", type: "item-name", required: true },
    { key: "factoryCode", label: "Factory Code", minWidth: 160, placeholder: "Enter code", type: "text", required: true },
    { key: "hsn", label: "HSN Code", minWidth: 140, options: hsnMasterOptions, placeholder: "Auto from item", type: "hsn", required: true },
    { key: "logCode", label: "Batch No", minWidth: 110, placeholder: "Enter batch no", type: "text" },
    { key: "length", label: "Length (m)", minWidth: 100, placeholder: "Enter length", type: "text", required: true },
    { key: "width", label: "Width (m)", minWidth: 100, placeholder: "Enter width", type: "text", required: true },
    { key: "thickness", label: "Height (m)", minWidth: 100, placeholder: "Enter height", type: "text", required: true },
    { key: "cbm", label: "CBM", minWidth: 100, placeholder: "Enter CBM", type: "text", required: true },
    { key: "rate", label: "Rate", minWidth: 100, placeholder: "Enter rate", type: "text", required: true },
    { key: "productAmount", label: "Amount", minWidth: 120, placeholder: "0.00", type: "computed" },
    { key: "gstPercentage", label: "GST %", minWidth: 140, options: gstMasterOptions, placeholder: "Auto from item", type: "gst", required: true },
    { key: "cgst", label: "CGST", minWidth: 100, placeholder: "0.00", type: "computed" },
    { key: "sgst", label: "SGST", minWidth: 100, placeholder: "0.00", type: "computed" },
    { key: "igst", label: "IGST", minWidth: 100, placeholder: "0.00", type: "computed" },
    { key: "totalAmount", label: "Total Amount", minWidth: 120, placeholder: "0.00", type: "computed" },
    { key: "remark", label: "Remark", minWidth: 160, placeholder: "Enter remark", type: "text" },
  ],
  "raw-veneer": [
    { key: "inwardItemCode", label: "Inward Item Code", minWidth: 160, placeholder: "Enter code", type: "text", required: true },
    { key: "itemName", label: "Item Name", minWidth: 260, placeholder: "Search or enter item", type: "item-name", required: true },
    { key: "factoryCode", label: "Factory Code", minWidth: 160, placeholder: "Enter code", type: "text", required: true },
    { key: "hsn", label: "HSN Code", minWidth: 140, options: hsnMasterOptions, placeholder: "Auto from item", type: "hsn", required: true },
    { key: "logCode", label: "Log Code", minWidth: 110, placeholder: "Enter log code", type: "text" },
    { key: "bundleNumber", label: "Bundle Number", minWidth: 110, placeholder: "Enter bundle no", type: "text" },
    { key: "palletNo", label: "Pallet No", minWidth: 110, placeholder: "Enter pallet no", type: "text" },
    { key: "length", label: "Length (m)", minWidth: 100, placeholder: "Enter length", type: "text", required: true },
    { key: "width", label: "Width (m)", minWidth: 100, placeholder: "Enter width", type: "text", required: true },
    { key: "thickness", label: "Thickness (m)", minWidth: 110, placeholder: "Enter thickness", type: "text", required: true },
    { key: "noOfLeaves", label: "No of Leaves", minWidth: 110, placeholder: "Enter leaves", type: "text", required: true },
    { key: "totalSqMeter", label: "Total Sq Meter", minWidth: 100, placeholder: "Enter SQM", type: "text", required: true },
    { key: "rate", label: "Rate", minWidth: 100, placeholder: "Enter rate", type: "text", required: true },
    { key: "productAmount", label: "Amount", minWidth: 120, placeholder: "0.00", type: "computed" },
    { key: "gstPercentage", label: "GST %", minWidth: 140, options: gstMasterOptions, placeholder: "Auto from item", type: "gst", required: true },
    { key: "cgst", label: "CGST", minWidth: 100, placeholder: "0.00", type: "computed" },
    { key: "sgst", label: "SGST", minWidth: 100, placeholder: "0.00", type: "computed" },
    { key: "igst", label: "IGST", minWidth: 100, placeholder: "0.00", type: "computed" },
    { key: "totalAmount", label: "Total Amount", minWidth: 120, placeholder: "0.00", type: "computed" },
    { key: "remark", label: "Remark", minWidth: 160, placeholder: "Enter remark", type: "text" },
  ],
  plywood: [
    { key: "inwardItemCode", label: "Inward Item Code", minWidth: 160, placeholder: "Enter code", type: "text", required: true },
    { key: "itemName", label: "Item Name", minWidth: 260, placeholder: "Search or enter item", type: "item-name", required: true },
    { key: "factoryCode", label: "Factory Code", minWidth: 160, placeholder: "Enter code", type: "text", required: true },
    { key: "hsn", label: "HSN Code", minWidth: 140, options: hsnMasterOptions, placeholder: "Auto from item", type: "hsn", required: true },
    { key: "palletNo", label: "Pallet No", minWidth: 110, placeholder: "Enter pallet no", type: "text" },
    { key: "length", label: "Length (m)", minWidth: 100, placeholder: "Enter length", type: "text", required: true },
    { key: "width", label: "Width (m)", minWidth: 100, placeholder: "Enter width", type: "text", required: true },
    { key: "thickness", label: "Thickness (m)", minWidth: 110, placeholder: "Enter thickness", type: "text", required: true },
    { key: "sheets", label: "Sheets", minWidth: 90, placeholder: "Enter qty", type: "text", required: true },
    { key: "totalSqMeter", label: "Total Sq Meter", minWidth: 100, placeholder: "Enter SQM", type: "text", required: true },
    { key: "rate", label: "Rate", minWidth: 100, placeholder: "Enter rate", type: "text", required: true },
    { key: "productAmount", label: "Amount", minWidth: 120, placeholder: "0.00", type: "text", required: true },
    { key: "gstPercentage", label: "GST %", minWidth: 140, options: gstMasterOptions, placeholder: "Auto from item", type: "gst", required: true },
    { key: "cgst", label: "CGST", minWidth: 100, placeholder: "0.00", type: "computed" },
    { key: "sgst", label: "SGST", minWidth: 100, placeholder: "0.00", type: "computed" },
    { key: "igst", label: "IGST", minWidth: 100, placeholder: "0.00", type: "computed" },
    { key: "totalAmount", label: "Total Amount", minWidth: 120, placeholder: "0.00", type: "computed" },
    { key: "remarks", label: "Remark", minWidth: 160, placeholder: "Enter remark", type: "text" },
  ],
  mdf: [
    { key: "inwardItemCode", label: "Inward Item Code", minWidth: 160, placeholder: "Enter code", type: "text", required: true },
    { key: "itemName", label: "Item Name", minWidth: 260, placeholder: "Search or enter item", type: "item-name", required: true },
    { key: "factoryCode", label: "Factory Code", minWidth: 160, placeholder: "Enter code", type: "text", required: true },
    { key: "hsn", label: "HSN Code", minWidth: 140, options: hsnMasterOptions, placeholder: "Auto from item", type: "hsn", required: true },
    { key: "palletNo", label: "Pallet No", minWidth: 110, placeholder: "Enter pallet no", type: "text" },
    { key: "length", label: "Length (m)", minWidth: 100, placeholder: "Enter length", type: "text", required: true },
    { key: "width", label: "Width (m)", minWidth: 100, placeholder: "Enter width", type: "text", required: true },
    { key: "thickness", label: "Thickness (m)", minWidth: 110, placeholder: "Enter thickness", type: "text", required: true },
    { key: "sheets", label: "Sheets", minWidth: 90, placeholder: "Enter qty", type: "text", required: true },
    { key: "totalSqMeter", label: "Total Sq Meter", minWidth: 100, placeholder: "Enter SQM", type: "text", required: true },
    { key: "rate", label: "Rate", minWidth: 100, placeholder: "Enter rate", type: "text", required: true },
    { key: "productAmount", label: "Amount", minWidth: 120, placeholder: "0.00", type: "text", required: true },
    { key: "gstPercentage", label: "GST %", minWidth: 140, options: gstMasterOptions, placeholder: "Auto from item", type: "gst", required: true },
    { key: "cgst", label: "CGST", minWidth: 100, placeholder: "0.00", type: "computed" },
    { key: "sgst", label: "SGST", minWidth: 100, placeholder: "0.00", type: "computed" },
    { key: "igst", label: "IGST", minWidth: 100, placeholder: "0.00", type: "computed" },
    { key: "totalAmount", label: "Total Amount", minWidth: 120, placeholder: "0.00", type: "computed" },
    { key: "remarks", label: "Remark", minWidth: 160, placeholder: "Enter remark", type: "text" },
  ],
  consumables: [
    { key: "inwardItemCode", label: "Inward Item Code", minWidth: 160, placeholder: "Enter code", type: "text", required: true },
    { key: "itemName", label: "Item Name", minWidth: 260, placeholder: "Search or enter item", type: "item-name", required: true },
    { key: "factoryCode", label: "Factory Code", minWidth: 160, placeholder: "Enter code", type: "text", required: true },
    { key: "hsn", label: "HSN Code", minWidth: 140, options: hsnMasterOptions, placeholder: "Auto from item", type: "hsn", required: true },
    { key: "unitName", label: "Unit Name", minWidth: 160, options: unitMasterOptions, placeholder: "Auto from item", type: "select", required: true },
    { key: "quantity", label: "Qty", minWidth: 90, placeholder: "Enter qty", type: "text", required: true },
    { key: "rate", label: "Rate", minWidth: 100, placeholder: "Enter rate", type: "text", required: true },
    { key: "productAmount", label: "Amount", minWidth: 120, placeholder: "0.00", type: "computed" },
    { key: "gstPercentage", label: "GST %", minWidth: 140, options: gstMasterOptions, placeholder: "Auto from item", type: "gst", required: true },
    { key: "cgst", label: "CGST", minWidth: 100, placeholder: "0.00", type: "computed" },
    { key: "sgst", label: "SGST", minWidth: 100, placeholder: "0.00", type: "computed" },
    { key: "igst", label: "IGST", minWidth: 100, placeholder: "0.00", type: "computed" },
    { key: "totalAmount", label: "Total Amount", minWidth: 120, placeholder: "0.00", type: "computed" },
    { key: "remark", label: "Remark", minWidth: 160, placeholder: "Enter remark", type: "text" },
  ],
};

export function isWarehouseAAddStockSlug(
  value: string,
): value is WarehouseAAddStockSlug {
  return value in warehouseAAddStockTableConfigs;
}

export function getWarehouseAAddStockTableConfig(
  slug: WarehouseAAddStockSlug,
) {
  return warehouseAAddStockTableConfigs[slug];
}

export function getWarehouseAVisibleColumns(
  columns: readonly WarehouseAAddStockFieldConfig[],
  gstMode: WarehouseAGstMode,
  _slug?: WarehouseAAddStockSlug,
) {
  return columns.filter((column) => {
    if (gstMode === "inter") {
      return column.key !== "cgst" && column.key !== "sgst";
    }
    return column.key !== "igst";
  });
}

export function getWarehouseAAddStockTableMinWidth(
  columns: readonly WarehouseAAddStockFieldConfig[],
  includeActions = true,
) {
  return (
    columns.reduce((total, column) => total + column.minWidth, 0) +
    (includeActions ? 72 : 0)
  );
}

export const WarehouseAAddStockLineItems = forwardRef<
  WarehouseAAddStockLineItemsHandle,
  {
    gstMode?: WarehouseAGstMode;
    onTotalsChange?: (totals: WarehouseALineItemsTotals) => void;
    slug: WarehouseAAddStockSlug;
  }
>(function WarehouseAAddStockLineItems({
  gstMode = "intra",
  onTotalsChange,
  slug,
}, ref) {
  const theme = useTheme();
  const columnConfig = warehouseAAddStockTableConfigs[slug];
  const visibleColumns = useMemo(
    () => getWarehouseAVisibleColumns(columnConfig, gstMode, slug),
    [columnConfig, gstMode, slug],
  );
  const nextRowId = useRef(1);
  const tableScrollRef = useRef<HTMLDivElement>(null);
  const [lineItems, setLineItems] = useState<DynamicLineItem[]>(() => [
    createEmptyRow(slug, nextRowId, columnConfig),
  ]);
  const [submitAttempted, setSubmitAttempted] = useState(false);
  const [addItemMessage, setAddItemMessage] = useState("");
  const [rowErrors, setRowErrors] = useState<
    Record<string, Record<string, string>>
  >({});
  const [pendingFocusRowId, setPendingFocusRowId] = useState<string | null>(
    null,
  );
  const [masterOptionsRevision, setMasterOptionsRevision] = useState(0);
  const itemSubCategoryOptions = useMemo(
    () => getLiveItemSubCategoryOptions(),
    [masterOptionsRevision],
  );
  const itemNameOptions = useMemo(
    () => getLiveItemMasterOptions(),
    [masterOptionsRevision],
  );
  const unitNameOptions = useMemo(
    () => getLiveUnitOptions(),
    [masterOptionsRevision],
  );

  useEffect(() => {
    let ignore = false;
    void Promise.all([
      refreshItemSubCategoryMasterCache(),
      refreshItemMasterCache(),
      fetchUnitsApi({ status: true, limit: 1000 }).then((rows) => {
        if (rows.length > 0) {
          syncUnitMasterToStorage(rows);
        }
      }),
    ])
      .then(() => {
        if (!ignore) {
          setMasterOptionsRevision((current) => current + 1);
        }
      })
      .catch(() => undefined);
    return () => {
      ignore = true;
    };
  }, []);

  useEffect(() => {
    nextRowId.current = 1;
    setLineItems([createEmptyRow(slug, nextRowId, columnConfig)]);
    setSubmitAttempted(false);
    setAddItemMessage("");
    setRowErrors({});
  }, [columnConfig, slug]);

  useEffect(() => {
    setLineItems((current) =>
      current.map((row) => ({
        ...row,
        values: applyTaxCalculations(row.values, gstMode, slug),
      })),
    );
  }, [gstMode, slug]);

  useEffect(() => {
    onTotalsChange?.(summarizeLineItemTotals(lineItems));
  }, [lineItems, onTotalsChange]);

  useEffect(() => {
    if (!pendingFocusRowId) {
      return;
    }

    const scrollEl = tableScrollRef.current;
    if (!scrollEl) {
      setPendingFocusRowId(null);
      return;
    }

    scrollEl.scrollTo({ left: 0, behavior: "smooth" });

    const rowEl = scrollEl.querySelector(
      `[data-line-item-id="${pendingFocusRowId}"]`,
    );
    const firstInput = rowEl?.querySelector<HTMLElement>(
      "input:not([disabled]):not([readonly]), textarea:not([disabled]):not([readonly])",
    );

    firstInput?.focus();
    setPendingFocusRowId(null);
  }, [lineItems, pendingFocusRowId]);

  const tableMinWidth = useMemo(
    () => getWarehouseAAddStockTableMinWidth(visibleColumns),
    [visibleColumns],
  );

  const handleFieldChange = (rowId: string, key: string, value: string) => {
    setLineItems((current) =>
      current.map((row) => {
        if (row.id !== rowId) {
          return row;
        }

        // Item-master driven fields are locked once filled from item selection.
        if (
          key !== "itemName" &&
          isItemMasterDrivenField(key) &&
          getItemMasterLockedFieldKeys(row.values.itemName ?? "").has(key)
        ) {
          return row;
        }

        let nextValues = {
          ...row.values,
          [key]: value,
        };

        if (key === "itemName") {
          nextValues = applyItemMasterDefaults(nextValues, value);
        }

        if (key === "hsn" && !nextValues.gstPercentage) {
          const gstFromHsn = getHsnGstPercentage(value);
          if (gstFromHsn) {
            nextValues.gstPercentage = gstFromHsn;
          }
        }

        // Veneer Blocks: L/W/H in meters → CBM = L × W × H
        if (
          slug === "veneer-blocks" &&
          ["length", "width", "thickness", "height"].includes(key)
        ) {
          const l = parseAmountValue(nextValues.length ?? "");
          const w = parseAmountValue(nextValues.width ?? "");
          const h = parseAmountValue(
            nextValues.thickness ?? nextValues.height ?? "",
          );
          if (l > 0 && w > 0 && h > 0) {
            nextValues.cbm = formatMeasureValue(l * w * h, 6);
          } else {
            nextValues.cbm = "";
          }
        }

        // Raw Veneer / Plywood / MDF: L/W in meters → SQM = L × W × qty
        if (
          ["raw-veneer", "plywood", "mdf"].includes(slug) &&
          ["length", "width", "noOfLeaves", "sheets", "noOfSheets"].includes(key)
        ) {
          const l = parseAmountValue(nextValues.length ?? "");
          const w = parseAmountValue(nextValues.width ?? "");
          const count = parseAmountValue(
            nextValues.noOfLeaves ??
              nextValues.sheets ??
              nextValues.noOfSheets ??
              "",
          );
          if (l > 0 && w > 0 && count > 0) {
            const sqm = formatMeasureValue(l * w * count, 3);
            nextValues.totalSqMeter = sqm;
            if ("totalSqm" in nextValues) {
              nextValues.totalSqm = sqm;
            }
          } else {
            nextValues.totalSqMeter = "";
            if ("totalSqm" in nextValues) {
              nextValues.totalSqm = "";
            }
          }
        }

        nextValues = applyTaxCalculations(nextValues, gstMode, slug);

        return {
          ...row,
          values: nextValues,
        };
      }),
    );

    if (submitAttempted || addItemMessage) {
      setRowErrors((current) => {
        const next = { ...current };
        const row = lineItems.find((item) => item.id === rowId);
        let nextValues = {
          ...(row?.values ?? {}),
          [key]: value,
        };

        if (key === "itemName") {
          nextValues = applyItemMasterDefaults(nextValues, value);
        }

        nextValues = applyTaxCalculations(nextValues, gstMode, slug);
        const errors = getLineItemValidationErrors(columnConfig, nextValues);

        if (hasValidationErrors(errors)) {
          next[rowId] = errors;
        } else {
          delete next[rowId];
          if (Object.keys(next).length === 0) {
            setAddItemMessage("");
          }
        }

        return next;
      });
    }
  };

  const handleAddLineItem = () => {
    const nextErrors: Record<string, Record<string, string>> = {};
    let canAdd = true;

    lineItems.forEach((row) => {
      const errors = getLineItemValidationErrors(columnConfig, row.values);
      if (hasValidationErrors(errors)) {
        nextErrors[row.id] = errors;
        canAdd = false;
      }
    });

    if (!canAdd) {
      setRowErrors(nextErrors);
      setAddItemMessage("Fill the current item before adding another.");
      return;
    }

    setAddItemMessage("");
    const newRow = createEmptyRow(slug, nextRowId, columnConfig);
    setLineItems((current) => [...current, newRow]);
    setPendingFocusRowId(newRow.id);
  };

  const handleDeleteLineItem = (rowId: string) => {
    setLineItems((current) => {
      if (current.length <= 1) {
        const firstRow = current[0] ?? createEmptyRow(slug, nextRowId, columnConfig);

        return [
          {
            ...firstRow,
            values: createEmptyValues(columnConfig),
          },
        ];
      }

      return current.filter((row) => row.id !== rowId);
    });

    setRowErrors((current) => {
      const next = { ...current };
      delete next[rowId];
      return next;
    });
  };

  useImperativeHandle(
    ref,
    () => ({
      getFilledLineItems: () =>
        lineItems
          .filter((row) => !allValuesEmpty(row.values))
          .map((row) => ({
            id: row.id,
            values: {
              ...row.values,
              amount: row.values.productAmount ?? row.values.amount ?? "",
            },
          })),
      applyTestAutofill: (itemCount = 1) => {
        const safeCount = Math.min(
          50,
          Math.max(1, Math.floor(Number(itemCount) || 1)),
        );

        const buildAutofillRowValues = (
          index: number,
          nextItemNames: readonly string[],
          nextUnits: readonly string[],
        ): Record<string, string> => {
          const itemName =
            nextItemNames.length > 0
              ? nextItemNames[index % nextItemNames.length]!
              : "";

          // Manual fields only — HSN / GST / unit / sub-category come from item selection.
          let values: Record<string, string> = {
            ...createEmptyValues(columnConfig),
            ...buildLineItemAutofillTextValues(slug, index),
          };

          if (itemName) {
            values.itemName = itemName;
            values = applyItemMasterDefaults(values, itemName);
          }

          // Keep autofetched selects only when they match loaded options (never invent).
          values.unitName = coerceSelectValue(values.unitName, nextUnits);
          values.itemSubCategory = coerceSelectValue(
            values.itemSubCategory,
            getLiveItemSubCategoryOptions(),
          );
          values.gstPercentage = coerceSelectValue(
            values.gstPercentage,
            gstMasterOptions,
          );

          values = applyAutofillDerivedMeasures(values, slug);
          return applyTaxCalculations(values, gstMode, slug);
        };

        const applyWithOptions = (
          nextItemNames: readonly string[],
          nextUnits: readonly string[],
        ) => {
          nextRowId.current = 1;
          const rows: DynamicLineItem[] = Array.from(
            { length: safeCount },
            (_, index) => ({
              id: `${slug}-${nextRowId.current++}`,
              values: buildAutofillRowValues(index, nextItemNames, nextUnits),
            }),
          );

          setLineItems(rows);
          setSubmitAttempted(false);
          setAddItemMessage("");
          setRowErrors({});
        };

        // Refresh masters first so item-selection defaults resolve correctly.
        void Promise.all([
          refreshItemMasterCache(),
          refreshItemSubCategoryMasterCache(),
          fetchUnitsApi({ status: true, limit: 1000 }).then((rows) => {
            if (rows.length > 0) {
              syncUnitMasterToStorage(rows);
            }
          }),
        ])
          .then(() => {
            setMasterOptionsRevision((current) => current + 1);
            applyWithOptions(
              getLiveItemMasterOptions(),
              getLiveUnitOptions(),
            );
          })
          .catch(() => {
            applyWithOptions(itemNameOptions, unitNameOptions);
          });
      },
      validate: () => {
        setSubmitAttempted(true);

        const nextErrors: Record<string, Record<string, string>> = {};
        const filledRows = lineItems.filter(
          (row) => !allValuesEmpty(row.values),
        );

        if (filledRows.length === 0) {
          const firstRow = lineItems[0];

          if (firstRow) {
            nextErrors[firstRow.id] = getLineItemValidationErrors(
              columnConfig,
              firstRow.values,
            );
          }

          setRowErrors(nextErrors);
          return false;
        }

        let isValid = true;

        filledRows.forEach((row) => {
          const errors = getLineItemValidationErrors(columnConfig, row.values);

          if (hasValidationErrors(errors)) {
            nextErrors[row.id] = errors;
            isValid = false;
          }
        });

        setRowErrors(nextErrors);
        return isValid;
      },
    }),
    [
      columnConfig,
      gstMode,
      itemNameOptions,
      lineItems,
      slug,
      unitNameOptions,
    ],
  );

  return (
    <Stack sx={{ gap: theme.spacing(1.5) }}>
      <Box
        sx={{
          border: `1px solid ${theme.customTokens.borders.default}`,
          borderRadius: `${theme.customTokens.radius.md}px`,
          backgroundColor: theme.customTokens.surfaces.surface,
          overflow: "hidden",
        }}
      >
        <Box ref={tableScrollRef} sx={getScrollableTableSx(theme)}>
          <Table
            size="small"
            sx={{ minWidth: tableMinWidth, tableLayout: "fixed" }}
          >
            <TableHead>
              <TableRow>
                {visibleColumns.map((column) => (
                  <TableCell
                    key={column.key}
                    sx={getHeaderCellSx(theme, column.minWidth)}
                  >
                    <ColumnLabel
                      label={column.label}
                      required={isDynamicColumnRequired(column)}
                    />
                  </TableCell>
                ))}
                <TableCell sx={getActionHeaderCellSx(theme, 64)}>
                  Actions
                </TableCell>
              </TableRow>
            </TableHead>

            <TableBody>
              {lineItems.map((row, index) => {
                const errors = rowErrors[row.id] ?? {};

                return (
                  <TableRow
                    key={row.id}
                    data-line-item-id={row.id}
                    sx={{
                      "&:nth-of-type(even)": {
                        backgroundColor: theme.customTokens.surfaces.alt,
                      },
                    }}
                  >
                    {visibleColumns.map((column) => {
                      const lockedKeys = getItemMasterLockedFieldKeys(
                        row.values.itemName ?? "",
                      );
                      return (
                      <TableCell key={column.key} sx={getBodyCellSx(theme)}>
                        {renderEditableField({
                          column,
                          onChange: (value) =>
                            handleFieldChange(row.id, column.key, value),
                          fieldReadOnly: lockedKeys.has(column.key),
                          theme,
                          value: row.values[column.key] ?? "",
                          errorText: errors[column.key] ?? "",
                          itemSubCategoryOptions,
                          itemNameOptions,
                          unitNameOptions,
                        })}
                      </TableCell>
                      );
                    })}

                    <TableCell
                      align="center"
                      sx={getActionBodyCellSx(theme, 64, index)}
                    >
                      <IconButton
                        aria-label="Remove item"
                        disabled={
                          lineItems.length <= 1 && allValuesEmpty(row.values)
                        }
                        onClick={() => handleDeleteLineItem(row.id)}
                        size="small"
                        sx={getActionButtonSx(theme)}
                      >
                        <Trash2 size={15} />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </Box>
      </Box>

      <Box sx={{ display: "flex", justifyContent: "flex-start" }}>
        <Button
          disableElevation
          onClick={handleAddLineItem}
          startIcon={<Plus size={14} />}
          sx={getAddItemButtonSx(theme)}
          variant="outlined"
        >
          Add Item
        </Button>
      </Box>

      {addItemMessage ? (
        <Typography variant="caption" color="error">
          {addItemMessage}
        </Typography>
      ) : submitAttempted && Object.keys(rowErrors).length > 0 ? (
        <Typography variant="caption" color="error">
          Complete required item fields before saving.
        </Typography>
      ) : null}
    </Stack>
  );
});

const ITEM_MASTER_DRIVEN_FIELDS = [
  "itemSubCategory",
  "hsn",
  "unitName",
  "gstPercentage",
] as const;

function isItemMasterDrivenField(key: string): boolean {
  return (ITEM_MASTER_DRIVEN_FIELDS as readonly string[]).includes(key);
}

/** Fields populated from the selected item master — locked for edit. */
function getItemMasterLockedFieldKeys(itemName: string): Set<string> {
  const locked = new Set<string>();
  const item = getLiveItemMasterRecord(itemName);
  if (!item) return locked;

  if (String(item.subCategory ?? item.subCategoryName ?? "").trim()) {
    locked.add("itemSubCategory");
  }
  const hsn = String(item.hsn ?? item.hsnCode ?? "").trim();
  if (hsn) {
    locked.add("hsn");
  }
  if (String(item.unitName ?? item.unit ?? "").trim()) {
    locked.add("unitName");
  }
  const gst = String(
    item.gstPercentage ?? item.gst ?? item.gstNo ?? "",
  ).trim();
  if (gst || (hsn && getHsnGstPercentage(hsn))) {
    locked.add("gstPercentage");
  }

  return locked;
}

function applyItemMasterDefaults(
  values: Record<string, string>,
  itemName: string,
) {
  const item = getLiveItemMasterRecord(itemName);

  if (!item) {
    return values;
  }

  const nextValues = { ...values };
  const subCategory = String(
    item.subCategory ?? item.subCategoryName ?? "",
  ).trim();
  const hsn = String(item.hsn ?? item.hsnCode ?? "").trim();
  const gst = String(
    item.gstPercentage ?? item.gst ?? item.gstNo ?? "",
  ).trim();

  const unitName = String(item.unitName ?? item.unit ?? "").trim();

  if (subCategory) {
    nextValues.itemSubCategory = subCategory;
  }

  if (hsn) {
    nextValues.hsn = hsn;
  }

  if (unitName) {
    nextValues.unitName = unitName;
  }

  if (gst) {
    nextValues.gstPercentage = gst;
  } else if (hsn) {
    const gstFromHsn = getHsnGstPercentage(hsn);
    if (gstFromHsn) {
      nextValues.gstPercentage = gstFromHsn;
    }
  }

  return nextValues;
}

function getLiveItemMasterRows() {
  const cached = getCachedItemMasterRows();
  if (cached.length > 0) {
    return cached;
  }
  return buildLocalMasterDefinition(itemMasterDefinition).rows;
}

function getLiveItemMasterOptions() {
  return Array.from(
    new Set(
      getLiveItemMasterRows()
        .filter(isActiveMasterRecord)
        .map((row) => String(row.itemName ?? row.name ?? "").trim())
        .filter(Boolean),
    ),
  );
}

function getLiveItemSubCategoryOptions() {
  return Array.from(
    new Set(
      getCachedItemSubCategoryMasterRows()
        .filter(isActiveMasterRecord)
        .map((row) =>
          String(row.itemSubCategory ?? row.name ?? "").trim(),
        )
        .filter(Boolean),
    ),
  );
}

function getLiveUnitOptions() {
  if (typeof window !== "undefined") {
    try {
      const raw = window.localStorage.getItem(
        "deluxe-veneers-local-master-records",
      );
      const parsed = raw ? JSON.parse(raw) : {};
      const rows = Array.isArray(parsed["unit-master"])
        ? (parsed["unit-master"] as MasterRecord[])
        : [];
      const names = rows
        .filter(isActiveMasterRecord)
        .map((row) => String(row.unitName ?? row.name ?? "").trim())
        .filter(Boolean);
      if (names.length > 0) {
        return Array.from(new Set(names));
      }
    } catch {
      // fall through to mock options
    }
  }
  return [...unitMasterOptions];
}

function getLiveItemMasterRecord(itemName: string) {
  const normalizedName = itemName.trim().toLowerCase();

  if (!normalizedName) {
    return null;
  }

  return (
    getLiveItemMasterRows().find(
      (row) =>
        isActiveMasterRecord(row) &&
        (String(row.itemName ?? "").trim().toLowerCase() === normalizedName ||
          String(row.name ?? "").trim().toLowerCase() === normalizedName),
    ) ?? null
  );
}

function isActiveMasterRecord(row: MasterRecord) {
  return String(row.status ?? "Active").toLowerCase() !== "inactive";
}

function applyTaxCalculations(
  values: Record<string, string>,
  gstMode: WarehouseAGstMode,
  slug?: WarehouseAAddStockSlug,
) {
  const nextValues = { ...values };
  const rate = parseAmountValue(nextValues.rate ?? "");
  const hasCbm = Object.prototype.hasOwnProperty.call(nextValues, "cbm");
  const hasSqMeter = Object.prototype.hasOwnProperty.call(
    nextValues,
    "totalSqMeter",
  );

  const hasQuantity = Object.prototype.hasOwnProperty.call(
    nextValues,
    "quantity",
  );

  // Veneer blocks: Amount = CBM × Rate
  // Raw veneer (and sheet goods): Amount = Total Sq Meter × Rate
  // Consumables: Amount = Qty × Rate
  if (rate > 0) {
    if (hasCbm) {
      const cbm = parseAmountValue(nextValues.cbm ?? "");
      if (cbm > 0) {
        const calculatedAmount = Math.round(cbm * rate * 100) / 100;
        nextValues.productAmount = calculatedAmount.toFixed(2);
        nextValues.amount = calculatedAmount.toFixed(2);
      }
    } else if (hasSqMeter) {
      const area = parseAmountValue(nextValues.totalSqMeter ?? "");
      if (area > 0) {
        const calculatedAmount = Math.round(area * rate * 100) / 100;
        nextValues.productAmount = calculatedAmount.toFixed(2);
        nextValues.amount = calculatedAmount.toFixed(2);
      }
    } else if (hasQuantity) {
      const quantity = parseAmountValue(nextValues.quantity ?? "");
      if (quantity > 0) {
        const calculatedAmount = Math.round(quantity * rate * 100) / 100;
        nextValues.productAmount = calculatedAmount.toFixed(2);
        nextValues.amount = calculatedAmount.toFixed(2);
      }
    }
  }

  const productAmount = parseAmountValue(
    nextValues.productAmount ?? nextValues.amount ?? "",
  );
  const gstPercentage = parseAmountValue(
    (nextValues.gstPercentage ?? "").replace(/%/g, ""),
  );
  const gstAmount = productAmount * (gstPercentage / 100);

  let cgst = 0;
  let sgst = 0;
  let igst = 0;

  if (gstMode === "inter") {
    igst = gstAmount;
  } else {
    cgst = gstAmount / 2;
    sgst = gstAmount / 2;
  }

  const totalAmount = productAmount + cgst + sgst + igst;

  return {
    ...nextValues,
    cgst: formatAmount(cgst),
    sgst: formatAmount(sgst),
    igst: formatAmount(igst),
    totalAmount: formatAmount(totalAmount),
  };
}

function summarizeLineItemTotals(
  lineItems: readonly DynamicLineItem[],
): WarehouseALineItemsTotals {
  return lineItems.reduce<WarehouseALineItemsTotals>(
    (totals, row) => {
      if (allValuesEmpty(row.values)) {
        return totals;
      }

      return {
        itemAmount:
          totals.itemAmount + parseAmountValue(row.values.productAmount ?? ""),
        cgst: totals.cgst + parseAmountValue(row.values.cgst ?? ""),
        sgst: totals.sgst + parseAmountValue(row.values.sgst ?? ""),
        igst: totals.igst + parseAmountValue(row.values.igst ?? ""),
        totalAmount:
          totals.totalAmount + parseAmountValue(row.values.totalAmount ?? ""),
      };
    },
    {
      itemAmount: 0,
      cgst: 0,
      sgst: 0,
      igst: 0,
      totalAmount: 0,
    },
  );
}

function coerceSelectValue(
  value: string | null | undefined,
  options: readonly string[] | null | undefined,
): string {
  const trimmed = String(value ?? "").trim();
  if (!trimmed || !options?.length) return "";
  return options.includes(trimmed) ? trimmed : "";
}

function buildLineItemAutofillTextValues(
  slug: WarehouseAAddStockSlug,
  index = 0,
): Record<string, string> {
  const stamp = `${Date.now().toString().slice(-4)}${index + 1}`;
  // Manual entry fields only — never HSN / GST / unit / amount (those follow selection / calc).
  const base = {
    inwardItemCode: `TEST-${stamp}`,
    factoryCode: `FC-${stamp}`,
    rate: "100",
    remark: "Autofill test line",
    remarks: "Autofill test line",
  };

  switch (slug) {
    case "veneer-blocks":
      return {
        ...base,
        length: "2.5",
        width: "1.2",
        thickness: "0.8",
        logCode: `BATCH-${stamp}`,
      };
    case "raw-veneer":
      return {
        ...base,
        length: "2.5",
        width: "1.2",
        thickness: "0.001",
        noOfLeaves: "10",
        logCode: `LOG-${stamp}`,
        bundleNumber: `B-${stamp}`,
        palletNo: `P-${stamp}`,
      };
    case "plywood":
    case "mdf":
      return {
        ...base,
        length: "2.44",
        width: "1.22",
        thickness: "0.018",
        sheets: "5",
        palletNo: `P-${stamp}`,
      };
    case "consumables":
      return {
        ...base,
        quantity: "10",
      };
    default:
      return base;
  }
}

/** Derive CBM / SQM after autofill dimensions are set. */
function applyAutofillDerivedMeasures(
  values: Record<string, string>,
  slug: WarehouseAAddStockSlug,
): Record<string, string> {
  const next = { ...values };

  if (slug === "veneer-blocks") {
    const l = parseAmountValue(next.length ?? "");
    const w = parseAmountValue(next.width ?? "");
    const h = parseAmountValue(next.thickness ?? next.height ?? "");
    if (l > 0 && w > 0 && h > 0) {
      next.cbm = formatMeasureValue(l * w * h, 6);
    }
  }

  if (slug === "raw-veneer" || slug === "plywood" || slug === "mdf") {
    const l = parseAmountValue(next.length ?? "");
    const w = parseAmountValue(next.width ?? "");
    const count = parseAmountValue(
      next.noOfLeaves ?? next.sheets ?? next.noOfSheets ?? "",
    );
    if (l > 0 && w > 0 && count > 0) {
      const sqm = formatMeasureValue(l * w * count, 3);
      next.totalSqMeter = sqm;
      if ("totalSqm" in next) {
        next.totalSqm = sqm;
      }
    }
  }

  return next;
}

function createEmptyRow(
  slug: WarehouseAAddStockSlug,
  nextRowId: { current: number },
  columns: readonly DynamicFieldConfig[],
): DynamicLineItem {
  const id = `${slug}-${nextRowId.current}`;
  nextRowId.current += 1;

  return {
    id,
    values: createEmptyValues(columns),
  };
}

function createEmptyValues(columns: readonly DynamicFieldConfig[]) {
  return columns.reduce<Record<string, string>>((accumulator, column) => {
    accumulator[column.key] = "";
    return accumulator;
  }, {});
}

function allValuesEmpty(values: Record<string, string>) {
  return Object.entries(values).every(([key, value]) => {
    if (
      ["cgst", "sgst", "igst", "totalAmount", "productAmount", "amount"].includes(
        key,
      )
    ) {
      return true;
    }

    return value.trim().length === 0;
  });
}

function getLineItemValidationErrors(
  columns: readonly DynamicFieldConfig[],
  values: Record<string, string>,
) {
  return columns.reduce<Record<string, string>>((errors, column) => {
    const error = getFieldValidationError(column, values);

    if (error) {
      errors[column.key] = error;
    }

    return errors;
  }, {});
}

function hasValidationErrors(errors: Record<string, string>) {
  return Object.keys(errors).length > 0;
}

function getFieldValidationError(
  column: DynamicFieldConfig,
  values: Record<string, string>,
) {
  if (
    isDynamicColumnRequired(column) &&
    (values[column.key] ?? "").trim().length === 0
  ) {
    return `${column.label} is required.`;
  }

  return "";
}

function isDynamicColumnRequired(column: DynamicFieldConfig) {
  return Boolean(column.required);
}

function ColumnLabel({
  label,
  required: _required,
}: {
  label: string;
  required: boolean;
}) {
  return (
    <Stack component="span" direction="row" spacing={0.25} alignItems="center">
      <span>{label}</span>
    </Stack>
  );
}

function parseAmountValue(value: string) {
  const numericValue = Number(value.replace(/,/g, "").trim());
  return Number.isFinite(numericValue) ? numericValue : 0;
}

/** Format measured calc (CBM/SQM) with up to `decimals`, trim trailing zeros. */
function formatMeasureValue(value: number, decimals: number) {
  if (!Number.isFinite(value) || value <= 0) return "";
  return value.toFixed(decimals).replace(/\.?0+$/, "");
}

function formatAmount(value: number) {
  return formatAmountShared(value);
}

export function getWarehouseAAddStockHeaderCellSx(
  theme: Theme,
  minWidth: number,
) {
  return getHeaderCellSx(theme, minWidth);
}

function getHeaderCellSx(theme: Theme, minWidth: number) {
  return {
    minWidth,
    width: minWidth,
    backgroundColor: theme.customTokens.surfaces.alt,
    borderBottom: `1px solid ${theme.customTokens.borders.default}`,
    color: theme.customTokens.text.secondary,
    fontSize: "0.75rem",
    fontWeight: 600,
    letterSpacing: "0.01em",
    px: theme.spacing(1),
    py: theme.spacing(1),
    whiteSpace: "nowrap",
  } as const;
}

export function getWarehouseAAddStockBodyCellSx(theme: Theme) {
  return getBodyCellSx(theme);
}

function getBodyCellSx(theme: Theme) {
  return {
    borderBottom: `1px solid ${theme.customTokens.borders.divider}`,
    px: theme.spacing(0.75),
    py: theme.spacing(0.75),
    verticalAlign: "top",
  } as const;
}

function getActionHeaderCellSx(theme: Theme, minWidth: number) {
  return {
    ...getHeaderCellSx(theme, minWidth),
    position: "sticky" as const,
    right: 0,
    zIndex: 3,
    boxShadow: `-1px 0 0 ${theme.customTokens.borders.default}`,
  } as const;
}

function getActionBodyCellSx(
  theme: Theme,
  minWidth: number,
  rowIndex: number,
) {
  return {
    ...getBodyCellSx(theme),
    position: "sticky" as const,
    right: 0,
    zIndex: 1,
    minWidth,
    width: minWidth,
    backgroundColor:
      rowIndex % 2 === 0
        ? theme.customTokens.surfaces.surface
        : theme.customTokens.surfaces.alt,
    boxShadow: `-1px 0 0 ${theme.customTokens.borders.divider}`,
  } as const;
}

export function getWarehouseAAddStockScrollableTableSx(theme: Theme) {
  return getScrollableTableSx(theme);
}

function getScrollableTableSx(theme: Theme) {
  return {
    overflowX: "auto",
    overflowY: "hidden",
    scrollbarWidth: "thin",
    scrollbarColor: `${theme.customTokens.borders.default} ${theme.customTokens.surfaces.alt}`,
    "&::-webkit-scrollbar": {
      height: 6,
    },
    "&::-webkit-scrollbar-track": {
      backgroundColor: theme.customTokens.surfaces.alt,
    },
    "&::-webkit-scrollbar-thumb": {
      borderRadius: 999,
      backgroundColor: theme.customTokens.borders.default,
    },
  } as const;
}

function getActionButtonSx(theme: Theme) {
  return {
    color: theme.customTokens.text.secondary,
    "&:hover": {
      backgroundColor: theme.customTokens.navigation.hoverBackground,
      color: theme.palette.error.main,
    },
    "&.Mui-disabled": {
      opacity: 0.35,
    },
  } as const;
}

function getAddItemButtonSx(theme: Theme) {
  return {
    minHeight: 34,
    px: theme.spacing(1.75),
    borderRadius: `${theme.customTokens.radius.md}px`,
    borderColor: theme.customTokens.borders.default,
    color: theme.customTokens.brand.primary,
    fontSize: "0.8125rem",
    fontWeight: 600,
    lineHeight: 1,
    textTransform: "none",
    boxShadow: "none",
    "& .MuiButton-startIcon": {
      mr: theme.spacing(0.75),
    },
    "&:hover": {
      borderColor: theme.customTokens.brand.primary,
      backgroundColor: theme.customTokens.navigation.hoverBackground,
      boxShadow: "none",
    },
  } as const;
}

export function renderWarehouseAAddStockEditableField({
  column,
  errorText,
  onChange,
  theme,
  value,
}: {
  column: WarehouseAAddStockFieldConfig;
  errorText?: string;
  onChange: (value: string) => void;
  theme: Theme;
  value: string;
}): ReactNode {
  const input = {
    column,
    onChange,
    theme,
    value,
  };

  return renderEditableField(
    errorText
      ? {
          ...input,
          errorText,
        }
      : input,
  );
}

function renderEditableField({
  column,
  errorText,
  onChange,
  fieldReadOnly = false,
  theme,
  value,
  itemSubCategoryOptions,
  itemNameOptions,
  unitNameOptions,
}: {
  column: DynamicFieldConfig;
  errorText?: string;
  onChange: (value: string) => void;
  fieldReadOnly?: boolean;
  theme: Theme;
  value: string;
  itemSubCategoryOptions?: readonly string[];
  itemNameOptions?: readonly string[];
  unitNameOptions?: readonly string[];
}): ReactNode {
  if (column.type === "computed" || fieldReadOnly) {
    const isEmpty = !String(value ?? "").trim();
    return (
      <TextField
        fullWidth
        size="small"
        value={value}
        placeholder={
          fieldReadOnly && isEmpty
            ? column.placeholder || "Auto from item"
            : undefined
        }
        sx={{
          ...getCompactFieldSx(theme, "readOnly", { dense: true }),
          cursor: "not-allowed",
          "& .MuiInputBase-root": { cursor: "not-allowed" },
          "& .MuiInputBase-input": { cursor: "not-allowed" },
        }}
        slotProps={{
          input: {
            readOnly: true,
          },
        }}
      />
    );
  }

  if (column.type === "item-name") {
    return (
      <Autocomplete
        freeSolo
        options={[...(itemNameOptions ?? getLiveItemMasterOptions())]}
        value={value}
        onChange={(_, nextValue) =>
          onChange(typeof nextValue === "string" ? nextValue : nextValue ?? "")
        }
        onInputChange={(_, nextValue, reason) => {
          if (reason === "input" || reason === "clear") {
            onChange(nextValue);
          }
        }}
        sx={{
          cursor: "text",
          "& .MuiInputBase-root": { cursor: "text" },
          "& .MuiInputBase-input": { cursor: "text" },
        }}
        slotProps={{
          popper: getAutocompletePopperSlotProps(theme, 420),
          paper: {
            sx: getAutocompletePaperSx(theme),
          },
          listbox: {
            sx: getAutocompleteListboxSx(theme),
          },
        }}
        renderOption={(props, option) => (
          <li {...props} title={option}>
            {option}
          </li>
        )}
        renderInput={(params) => (
          <TextField
            {...params}
            error={Boolean(errorText)}
            helperText={errorText || undefined}
            placeholder={column.placeholder}
            size="small"
            title={value.trim() ? value : undefined}
            sx={{
              ...getCompactFieldSx(theme, errorText ? "error" : "default", {
                dense: true,
              }),
              "& .MuiInputBase-input": {
                cursor: "text",
                fontSize: theme.typography.caption.fontSize,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              },
              "& .MuiFormHelperText-root": {
                mx: 0,
                mt: 0.25,
                fontSize: "0.65rem",
                lineHeight: 1.2,
              },
            }}
          />
        )}
      />
    );
  }

  if (column.type === "hsn") {
    return (
      <Autocomplete
        freeSolo
        options={column.options ? [...column.options] : [...hsnMasterOptions]}
        value={value}
        onChange={(_, nextValue) =>
          onChange(typeof nextValue === "string" ? nextValue : nextValue ?? "")
        }
        onInputChange={(_, nextValue, reason) => {
          if (reason === "input" || reason === "clear") {
            onChange(nextValue);
          }
        }}
        sx={{
          cursor: "text",
          "& .MuiInputBase-root": { cursor: "text" },
          "& .MuiInputBase-input": { cursor: "text" },
        }}
        slotProps={{
          popper: getAutocompletePopperSlotProps(theme, 360),
          paper: {
            sx: getAutocompletePaperSx(theme),
          },
          listbox: {
            sx: getAutocompleteListboxSx(theme, true),
          },
        }}
        renderOption={(props, option) => (
          <li {...props} title={option}>
            {option}
          </li>
        )}
        renderInput={(params) => (
          <TextField
            {...params}
            error={Boolean(errorText)}
            helperText={errorText || undefined}
            placeholder={column.placeholder}
            size="small"
            title={value.trim() ? value : undefined}
            sx={{
              ...getCompactFieldSx(theme, errorText ? "error" : "default", {
                dense: true,
              }),
              "& .MuiInputBase-input": {
                cursor: "text",
                fontSize: theme.typography.caption.fontSize,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              },
              "& .MuiFormHelperText-root": {
                mx: 0,
                mt: 0.25,
                fontSize: "0.65rem",
                lineHeight: 1.2,
              },
            }}
          />
        )}
      />
    );
  }

  if (column.type === "gst" || column.type === "select") {
    const selectOptions =
      column.key === "itemSubCategory"
        ? [...(itemSubCategoryOptions ?? getLiveItemSubCategoryOptions())]
        : column.key === "unitName"
          ? [...(unitNameOptions ?? getLiveUnitOptions())]
          : column.options ?? [];

    return (
      <ErpSelectField
        helperText={errorText || undefined}
        onChange={onChange}
        options={selectOptions}
        placeholder={column.placeholder}
        size="dense"
        state={errorText ? "error" : "default"}
        value={value}
      />
    );
  }

  return (
    <TextField
      error={Boolean(errorText)}
      fullWidth
      helperText={errorText || undefined}
      placeholder={column.placeholder}
      size="small"
      value={value}
      onChange={(event) => onChange(event.target.value)}
      sx={{
        ...getCompactFieldSx(theme, errorText ? "error" : "default", {
          dense: true,
        }),
        "& .MuiInputBase-input": {
          fontSize: theme.typography.caption.fontSize,
        },
        "& .MuiFormHelperText-root": {
          mx: 0,
          mt: 0.25,
          fontSize: "0.65rem",
          lineHeight: 1.2,
          whiteSpace: "normal",
        },
      }}
    />
  );
}
