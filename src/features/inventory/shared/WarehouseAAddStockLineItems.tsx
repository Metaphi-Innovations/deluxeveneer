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
}

const warehouseAAddStockTableConfigs: Record<
  WarehouseAAddStockSlug,
  readonly DynamicFieldConfig[]
> = {
  "veneer-blocks": [
    { key: "itemName", label: "Item Name", minWidth: 260, placeholder: "Search or enter item", type: "item-name", required: true },
    { key: "itemSubCategory", label: "Item Sub Category", minWidth: 200, options: getLiveItemSubCategoryOptions(), placeholder: "Sub Category", type: "select", required: true },
    { key: "hsn", label: "HSN Code", minWidth: 140, options: hsnMasterOptions, placeholder: "HSN", type: "hsn", required: true },
    { key: "logCode", label: "Batch No", minWidth: 110, placeholder: "Batch No", type: "text" },
    { key: "length", label: "Length", minWidth: 90, placeholder: "Length", type: "text", required: true },
    { key: "width", label: "Width", minWidth: 90, placeholder: "Width", type: "text", required: true },
    { key: "thickness", label: "Thickness", minWidth: 90, placeholder: "Thickness", type: "text", required: true },
    { key: "cbm", label: "CBM", minWidth: 100, placeholder: "CBM", type: "text", required: true },
    { key: "productAmount", label: "Amount", minWidth: 120, placeholder: "0.00", type: "text", required: true },
    { key: "gstPercentage", label: "GST %", minWidth: 140, options: gstMasterOptions, placeholder: "GST %", type: "gst", required: true },
    { key: "cgst", label: "CGST", minWidth: 100, placeholder: "0.00", type: "computed" },
    { key: "sgst", label: "SGST", minWidth: 100, placeholder: "0.00", type: "computed" },
    { key: "igst", label: "IGST", minWidth: 100, placeholder: "0.00", type: "computed" },
    { key: "totalAmount", label: "Total Amount", minWidth: 120, placeholder: "0.00", type: "computed" },
    { key: "remark", label: "Remark", minWidth: 160, placeholder: "Remark", type: "text" },
  ],
  "raw-veneer": [
    { key: "itemName", label: "Item Name", minWidth: 260, placeholder: "Search or enter item", type: "item-name", required: true },
    { key: "itemSubCategory", label: "Item Sub Category", minWidth: 200, options: getLiveItemSubCategoryOptions(), placeholder: "Sub Category", type: "select", required: true },
    { key: "hsn", label: "HSN Code", minWidth: 140, options: hsnMasterOptions, placeholder: "HSN", type: "hsn", required: true },
    { key: "logCode", label: "Log Code", minWidth: 110, placeholder: "Log Code", type: "text" },
    { key: "bundleNumber", label: "Bundle Number", minWidth: 110, placeholder: "Bundle No.", type: "text" },
    { key: "palletNo", label: "Pallet No", minWidth: 110, placeholder: "Pallet No", type: "text" },
    { key: "length", label: "Length", minWidth: 90, placeholder: "Length", type: "text", required: true },
    { key: "width", label: "Width", minWidth: 90, placeholder: "Width", type: "text", required: true },
    { key: "thickness", label: "Thickness", minWidth: 90, placeholder: "Thickness", type: "text", required: true },
    { key: "noOfLeaves", label: "No of Leaves", minWidth: 110, placeholder: "Leaves", type: "text", required: true },
    { key: "totalSqMeter", label: "Total Sq Meter", minWidth: 100, placeholder: "SQM", type: "text", required: true },
    { key: "productAmount", label: "Amount", minWidth: 120, placeholder: "0.00", type: "text", required: true },
    { key: "gstPercentage", label: "GST %", minWidth: 140, options: gstMasterOptions, placeholder: "GST %", type: "gst", required: true },
    { key: "cgst", label: "CGST", minWidth: 100, placeholder: "0.00", type: "computed" },
    { key: "sgst", label: "SGST", minWidth: 100, placeholder: "0.00", type: "computed" },
    { key: "igst", label: "IGST", minWidth: 100, placeholder: "0.00", type: "computed" },
    { key: "totalAmount", label: "Total Amount", minWidth: 120, placeholder: "0.00", type: "computed" },
    { key: "remark", label: "Remark", minWidth: 160, placeholder: "Remark", type: "text" },
  ],
  plywood: [
    { key: "itemName", label: "Item Name", minWidth: 260, placeholder: "Search or enter item", type: "item-name", required: true },
    { key: "itemSubCategory", label: "Item Sub Category", minWidth: 200, options: getLiveItemSubCategoryOptions(), placeholder: "Sub Category", type: "select", required: true },
    { key: "hsn", label: "HSN Code", minWidth: 140, options: hsnMasterOptions, placeholder: "HSN", type: "hsn", required: true },
    { key: "logCode", label: "Batch No", minWidth: 110, placeholder: "Batch No", type: "text" },
    { key: "color", label: "Color", minWidth: 160, options: ["Natural Oak", "Walnut Brown", "Teak Gold", "Ash Grey"], placeholder: "Color", type: "select" },
    { key: "palletNo", label: "Pallet No", minWidth: 110, placeholder: "Pallet No", type: "text" },
    { key: "length", label: "Length", minWidth: 90, placeholder: "Length", type: "text", required: true },
    { key: "width", label: "Width", minWidth: 90, placeholder: "Width", type: "text", required: true },
    { key: "thickness", label: "Thickness", minWidth: 90, placeholder: "Thickness", type: "text", required: true },
    { key: "sheets", label: "Sheets", minWidth: 90, placeholder: "Qty", type: "text", required: true },
    { key: "totalSqMeter", label: "Total Sq Meter", minWidth: 100, placeholder: "SQM", type: "text", required: true },
    { key: "productAmount", label: "Amount", minWidth: 120, placeholder: "0.00", type: "text", required: true },
    { key: "gstPercentage", label: "GST %", minWidth: 140, options: gstMasterOptions, placeholder: "GST %", type: "gst", required: true },
    { key: "cgst", label: "CGST", minWidth: 100, placeholder: "0.00", type: "computed" },
    { key: "sgst", label: "SGST", minWidth: 100, placeholder: "0.00", type: "computed" },
    { key: "igst", label: "IGST", minWidth: 100, placeholder: "0.00", type: "computed" },
    { key: "totalAmount", label: "Total Amount", minWidth: 120, placeholder: "0.00", type: "computed" },
    { key: "remarks", label: "Remark", minWidth: 160, placeholder: "Remark", type: "text" },
  ],
  mdf: [
    { key: "itemName", label: "Item Name", minWidth: 260, placeholder: "Search or enter item", type: "item-name", required: true },
    { key: "itemSubCategory", label: "Item Sub Category", minWidth: 200, options: getLiveItemSubCategoryOptions(), placeholder: "Sub Category", type: "select", required: true },
    { key: "hsn", label: "HSN Code", minWidth: 140, options: hsnMasterOptions, placeholder: "HSN", type: "hsn", required: true },
    { key: "logCode", label: "Batch No", minWidth: 110, placeholder: "Batch No", type: "text" },
    { key: "palletNo", label: "Pallet No", minWidth: 110, placeholder: "Pallet No", type: "text" },
    { key: "length", label: "Length", minWidth: 90, placeholder: "Length", type: "text", required: true },
    { key: "width", label: "Width", minWidth: 90, placeholder: "Width", type: "text", required: true },
    { key: "thickness", label: "Thickness", minWidth: 90, placeholder: "Thickness", type: "text", required: true },
    { key: "noOfSheets", label: "No of Sheets", minWidth: 90, placeholder: "Qty", type: "text", required: true },
    { key: "totalSqm", label: "Total SQM", minWidth: 100, placeholder: "SQM", type: "text", required: true },
    { key: "productAmount", label: "Amount", minWidth: 120, placeholder: "0.00", type: "text", required: true },
    { key: "gstPercentage", label: "GST %", minWidth: 140, options: gstMasterOptions, placeholder: "GST %", type: "gst", required: true },
    { key: "cgst", label: "CGST", minWidth: 100, placeholder: "0.00", type: "computed" },
    { key: "sgst", label: "SGST", minWidth: 100, placeholder: "0.00", type: "computed" },
    { key: "igst", label: "IGST", minWidth: 100, placeholder: "0.00", type: "computed" },
    { key: "totalAmount", label: "Total Amount", minWidth: 120, placeholder: "0.00", type: "computed" },
    { key: "remark", label: "Remark", minWidth: 160, placeholder: "Remark", type: "text" },
  ],
  consumables: [
    { key: "supplierItemName", label: "Supplier Item Name", minWidth: 220, placeholder: "Supplier Item", type: "text", required: true },
    { key: "subCategory", label: "Sub Category", minWidth: 200, placeholder: "Sub Category", type: "text", required: true },
    { key: "itemName", label: "Item Name", minWidth: 220, placeholder: "Item Name", type: "text", required: true },
    { key: "unitName", label: "Unit Name", minWidth: 160, options: unitMasterOptions, placeholder: "Unit", type: "select", required: true },
    { key: "quantity", label: "Qty", minWidth: 90, placeholder: "Qty", type: "text", required: true },
    { key: "consumables", label: "Consumables", minWidth: 140, placeholder: "Enter consumables", type: "text" },
    { key: "productAmount", label: "Product Amount", minWidth: 120, placeholder: "0.00", type: "text", required: true },
    { key: "gstPercentage", label: "GST %", minWidth: 140, options: gstMasterOptions, placeholder: "GST %", type: "gst", required: true },
    { key: "cgst", label: "CGST", minWidth: 100, placeholder: "0.00", type: "computed" },
    { key: "sgst", label: "SGST", minWidth: 100, placeholder: "0.00", type: "computed" },
    { key: "igst", label: "IGST", minWidth: 100, placeholder: "0.00", type: "computed" },
    { key: "totalAmount", label: "Total Amount", minWidth: 120, placeholder: "0.00", type: "computed" },
    { key: "remark", label: "Remark", minWidth: 160, placeholder: "Remark", type: "text" },
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
  const nextRowId = useRef(1);
  const tableScrollRef = useRef<HTMLDivElement>(null);
  const [lineItems, setLineItems] = useState<DynamicLineItem[]>(() => [
    createEmptyRow(slug, nextRowId, columnConfig),
  ]);
  const [submitAttempted, setSubmitAttempted] = useState(false);
  const [rowErrors, setRowErrors] = useState<
    Record<string, Record<string, string>>
  >({});
  const [pendingFocusRowId, setPendingFocusRowId] = useState<string | null>(
    null,
  );

  useEffect(() => {
    nextRowId.current = 1;
    setLineItems([createEmptyRow(slug, nextRowId, columnConfig)]);
    setSubmitAttempted(false);
    setRowErrors({});
  }, [columnConfig, slug]);

  useEffect(() => {
    setLineItems((current) =>
      current.map((row) => ({
        ...row,
        values: applyTaxCalculations(row.values, gstMode),
      })),
    );
  }, [gstMode]);

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
    () => getWarehouseAAddStockTableMinWidth(columnConfig),
    [columnConfig],
  );

  const handleFieldChange = (rowId: string, key: string, value: string) => {
    setLineItems((current) =>
      current.map((row) => {
        if (row.id !== rowId) {
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

        nextValues = applyTaxCalculations(nextValues, gstMode);

        return {
          ...row,
          values: nextValues,
        };
      }),
    );

    if (submitAttempted) {
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

        nextValues = applyTaxCalculations(nextValues, gstMode);
        const errors = getLineItemValidationErrors(columnConfig, nextValues);

        if (hasValidationErrors(errors)) {
          next[rowId] = errors;
        } else {
          delete next[rowId];
        }

        return next;
      });
    }
  };

  const handleAddLineItem = () => {
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
    [columnConfig, lineItems],
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
                {columnConfig.map((column) => (
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
                    {columnConfig.map((column) => (
                      <TableCell key={column.key} sx={getBodyCellSx(theme)}>
                        {renderEditableField({
                          column,
                          onChange: (value) =>
                            handleFieldChange(row.id, column.key, value),
                          theme,
                          value: row.values[column.key] ?? "",
                          errorText: errors[column.key] ?? "",
                        })}
                      </TableCell>
                    ))}

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

      {submitAttempted && Object.keys(rowErrors).length > 0 ? (
        <Typography variant="caption" color="error">
          Complete required item fields before saving.
        </Typography>
      ) : null}
    </Stack>
  );
});

function applyItemMasterDefaults(
  values: Record<string, string>,
  itemName: string,
) {
  const item = getLiveItemMasterRecord(itemName);

  if (!item) {
    return values;
  }

  const nextValues = { ...values };
  const subCategory = String(item.subCategory ?? "");
  const hsn = String(item.hsn ?? "");
  const gst = String(item.gst ?? "");

  if (subCategory) {
    nextValues.itemSubCategory = subCategory;
  }

  if (hsn) {
    nextValues.hsn = hsn;
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
  return buildLocalMasterDefinition(itemMasterDefinition).rows;
}

function getLiveItemMasterOptions() {
  return Array.from(
    new Set(
      getLiveItemMasterRows()
        .filter(isActiveMasterRecord)
        .map((row) => String(row.itemName ?? "").trim())
        .filter(Boolean),
    ),
  );
}

function getLiveItemSubCategoryOptions() {
  return Array.from(
    new Set(
      getLiveItemMasterRows()
        .filter(isActiveMasterRecord)
        .map((row) => String(row.subCategory ?? "").trim())
        .filter(Boolean),
    ),
  );
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
        String(row.itemName ?? "").trim().toLowerCase() === normalizedName,
    ) ?? null
  );
}

function isActiveMasterRecord(row: MasterRecord) {
  return String(row.status ?? "Active").toLowerCase() !== "inactive";
}

function applyTaxCalculations(
  values: Record<string, string>,
  gstMode: WarehouseAGstMode,
) {
  const productAmount = parseAmountValue(values.productAmount ?? "");
  const gstPercentage = parseAmountValue(
    (values.gstPercentage ?? "").replace(/%/g, ""),
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
    ...values,
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
    if (["cgst", "sgst", "igst", "totalAmount"].includes(key)) {
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

function isDynamicColumnRequired(_column: DynamicFieldConfig) {
  return false;
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
  theme,
  value,
}: {
  column: DynamicFieldConfig;
  errorText?: string;
  onChange: (value: string) => void;
  theme: Theme;
  value: string;
}): ReactNode {
  if (column.type === "computed") {
    return (
      <TextField
        fullWidth
        size="small"
        value={value}
        sx={getCompactFieldSx(theme, "readOnly", { dense: true })}
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
        options={getLiveItemMasterOptions()}
        value={value}
        onChange={(_, nextValue) =>
          onChange(typeof nextValue === "string" ? nextValue : nextValue ?? "")
        }
        onInputChange={(_, nextValue, reason) => {
          if (reason === "input" || reason === "clear") {
            onChange(nextValue);
          }
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
        ? getLiveItemSubCategoryOptions()
        : column.options ?? [];

    return (
      <ErpSelectField
        helperText={errorText || undefined}
        onChange={onChange}
        options={selectOptions}
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
