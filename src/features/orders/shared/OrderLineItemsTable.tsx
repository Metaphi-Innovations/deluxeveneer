import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  Box,
  Button,
  Dialog,
  DialogContent,
  DialogTitle,
  IconButton,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from "@mui/material";
import type { Theme } from "@mui/material/styles";
import { Info, Pencil, Plus, Save, Trash2 } from "lucide-react";

import { ErpSelectField } from "../../../pages/ComponentLibrary/shared/ErpFieldControls";
import { getCompactFieldSx } from "../../../pages/ComponentLibrary/sections/inputs/components/inputFieldStyles";
import type { MasterRecord } from "../../masters/shared";
import { formatAmount, formatSQM, SQM_TO_SQF } from "../../shared/numberFormat";
import { buildLocalMasterDefinition } from "../../masters/shared/localMasterStore";
import {
  itemMasterDefinition,
} from "../../masters/shared/masterDefinitions";
import { formatMasterValue } from "../../masters/shared";
import { recordFormActionButtonSx } from "../../shared/buttonStyles";
import {
  formFieldLabelSx,
  formInlineActionButtonSx,
  formSectionCardSx,
  FormSectionHeader,
} from "../../shared/formSectionStyles";
import {
  transactionTableBodyCellSx,
  transactionTableHeaderCellSx,
} from "../../shared/listingTableStyles";
import {
  gradeOptions,
  productCategoryOptions,
  seriesOptions,
  type OrderCreateVariant,
  type OrderLineItem,
} from "./ordersStore";

type OrderLineItemColumn = {
  controlWidth: number;
  dropdownWidth?: number;
  key: keyof Omit<OrderLineItem, "id">;
  label: string;
  minWidth: number;
  numeric?: boolean;
  options?: readonly string[];
  readOnly?: boolean;
  showItemDetails?: boolean;
  type: "select" | "text";
};

type EntryRowConfig = {
  keys: readonly (keyof Omit<OrderLineItem, "id">)[];
  template: {
    xs: string;
    sm?: string;
    md: string;
  };
};

const sqmToSqf = SQM_TO_SQF;

const finishedTypeOptions = [
  "Marquetry",
  "Fluted",
  "Embossed",
  "Decorative",
] as const;

const baseTypeOptions = ["Plywood", "MDF"] as const;

const unifiedOrderLineItemColumns: readonly OrderLineItemColumn[] = [
  { key: "productCategory", label: "Product Type", controlWidth: 170, minWidth: 170, options: [...productCategoryOptions], type: "select" },
  { key: "salesItemName", label: "Sales Item Name", controlWidth: 240, minWidth: 200, type: "text" },
  { key: "itemName", label: "Item Name", controlWidth: 260, dropdownWidth: 340, minWidth: 240, showItemDetails: true, type: "select" },
  { key: "length", label: "Length", controlWidth: 130, minWidth: 110, numeric: true, type: "text" },
  { key: "width", label: "Width", controlWidth: 130, minWidth: 110, numeric: true, type: "text" },
  { key: "thickness", label: "Thickness", controlWidth: 120, minWidth: 110, numeric: true, type: "text" },
  { key: "quantitySheets", label: "No. of Sheets", controlWidth: 130, minWidth: 120, numeric: true, type: "text" },
  { key: "sqm", label: "SQM", controlWidth: 130, minWidth: 120, numeric: true, readOnly: true, type: "text" },
  { key: "totalSqm", label: "SQF", controlWidth: 130, minWidth: 120, numeric: true, readOnly: true, type: "text" },
  { key: "ratePerSqf", label: "Rate / SQF", controlWidth: 140, minWidth: 130, numeric: true, type: "text" },
  { key: "amount", label: "Amount", controlWidth: 150, minWidth: 120, numeric: true, readOnly: true, type: "text" },
  { key: "baseType", label: "Base Type", controlWidth: 160, minWidth: 140, options: baseTypeOptions, type: "select" },
  { key: "baseName", label: "Base Name", controlWidth: 220, dropdownWidth: 300, minWidth: 200, type: "select" },
  { key: "baseLength", label: "Base Length", controlWidth: 130, minWidth: 110, numeric: true, type: "text" },
  { key: "baseWidth", label: "Base Width", controlWidth: 130, minWidth: 110, numeric: true, type: "text" },
  { key: "baseThickness", label: "Base Thickness", controlWidth: 130, minWidth: 120, numeric: true, type: "text" },
  { key: "remark", label: "Remark", controlWidth: 300, minWidth: 220, type: "text" },
];

const unifiedEntryRows: readonly EntryRowConfig[] = [
  { keys: ["productCategory", "salesItemName", "itemName"], template: { xs: "1fr", sm: "1fr 1fr", md: "minmax(150px, 1.1fr) minmax(200px, 1.5fr) minmax(220px, 1.8fr)" } },
  { keys: ["length", "width", "thickness", "quantitySheets", "sqm", "totalSqm", "ratePerSqf", "amount"], template: { xs: "1fr 1fr", sm: "repeat(4, minmax(120px, 1fr))", md: "repeat(8, minmax(105px, 1fr))" } },
  { keys: ["baseType", "baseName", "baseLength", "baseWidth", "baseThickness", "remark"], template: { xs: "1fr", sm: "1fr 1fr", md: "minmax(130px, 1fr) minmax(180px, 1.5fr) repeat(3, minmax(110px, 0.8fr)) minmax(200px, 1.5fr)" } },
];

const rawOrderLineItemColumns: readonly OrderLineItemColumn[] = [
  {
    key: "productCategory",
    label: "Product Type",
    controlWidth: 170,
    minWidth: 170,
    options: productCategoryOptions,
    type: "select",
  },
  {
    key: "itemName",
    label: "Item Name",
    controlWidth: 280,
    dropdownWidth: 360,
    minWidth: 250,
    type: "select",
  },
  {
    key: "subCategory",
    label: "Sub Category",
    controlWidth: 200,
    minWidth: 200,
    type: "select",
  },
  {
    key: "series",
    label: "Series",
    controlWidth: 160,
    minWidth: 160,
    options: seriesOptions,
    type: "select",
  },
  {
    key: "grade",
    label: "Grade",
    controlWidth: 120,
    minWidth: 120,
    options: gradeOptions,
    type: "select",
  },
  {
    key: "length",
    label: "Length",
    controlWidth: 140,
    minWidth: 120,
    numeric: true,
    type: "text",
  },
  {
    key: "width",
    label: "Width",
    controlWidth: 140,
    minWidth: 120,
    numeric: true,
    type: "text",
  },
  {
    key: "thickness",
    label: "Thickness",
    controlWidth: 120,
    minWidth: 110,
    numeric: true,
    type: "text",
  },
  {
    key: "quantitySheets",
    label: "No. of Sheets",
    controlWidth: 130,
    minWidth: 120,
    numeric: true,
    type: "text",
  },
  {
    key: "sqm",
    label: "SQM",
    controlWidth: 130,
    minWidth: 120,
    numeric: true,
    type: "text",
  },
  {
    key: "totalSqm",
    label: "SQF",
    controlWidth: 130,
    minWidth: 120,
    numeric: true,
    type: "text",
  },
  {
    key: "ratePerSqf",
    label: "Rate / SQF",
    controlWidth: 140,
    minWidth: 130,
    numeric: true,
    type: "text",
  },
  {
    key: "amount",
    label: "Amount",
    controlWidth: 160,
    minWidth: 120,
    numeric: true,
    readOnly: true,
    type: "text",
  },
  {
    key: "remark",
    label: "Remark",
    controlWidth: 350,
    minWidth: 240,
    type: "text",
  },
];

const finishedOrderLineItemColumns: readonly OrderLineItemColumn[] = [
  {
    key: "finishedType",
    label: "Finished Type",
    controlWidth: 180,
    minWidth: 170,
    options: finishedTypeOptions,
    type: "select",
  },
  {
    key: "salesItemName",
    label: "Sales Item Name",
    controlWidth: 280,
    minWidth: 220,
    type: "text",
  },
  {
    key: "itemName",
    label: "Item Name",
    controlWidth: 280,
    dropdownWidth: 360,
    minWidth: 260,
    showItemDetails: true,
    type: "select",
  },
  {
    key: "length",
    label: "Length",
    controlWidth: 140,
    minWidth: 120,
    numeric: true,
    type: "text",
  },
  {
    key: "width",
    label: "Width",
    controlWidth: 140,
    minWidth: 120,
    numeric: true,
    type: "text",
  },
  {
    key: "thickness",
    label: "Thickness",
    controlWidth: 120,
    minWidth: 110,
    numeric: true,
    type: "text",
  },
  {
    key: "quantitySheets",
    label: "No. of Sheets",
    controlWidth: 130,
    minWidth: 120,
    numeric: true,
    type: "text",
  },
  {
    key: "sqm",
    label: "SQM",
    controlWidth: 130,
    minWidth: 120,
    numeric: true,
    readOnly: true,
    type: "text",
  },
  {
    key: "totalSqm",
    label: "SQF",
    controlWidth: 130,
    minWidth: 120,
    numeric: true,
    readOnly: true,
    type: "text",
  },
  {
    key: "ratePerSqf",
    label: "Rate / SQF",
    controlWidth: 140,
    minWidth: 130,
    numeric: true,
    type: "text",
  },
  {
    key: "amount",
    label: "Amount",
    controlWidth: 160,
    minWidth: 120,
    numeric: true,
    readOnly: true,
    type: "text",
  },
  {
    key: "baseType",
    label: "Base Type",
    controlWidth: 180,
    minWidth: 150,
    options: baseTypeOptions,
    type: "select",
  },
  {
    key: "baseName",
    label: "Base Name",
    controlWidth: 260,
    dropdownWidth: 340,
    minWidth: 220,
    type: "select",
  },
  {
    key: "baseLength",
    label: "Base Length",
    controlWidth: 140,
    minWidth: 120,
    numeric: true,
    type: "text",
  },
  {
    key: "baseWidth",
    label: "Base Width",
    controlWidth: 140,
    minWidth: 120,
    numeric: true,
    type: "text",
  },
  {
    key: "baseThickness",
    label: "Base Thickness",
    controlWidth: 140,
    minWidth: 130,
    numeric: true,
    type: "text",
  },
  {
    key: "remark",
    label: "Remark",
    controlWidth: 350,
    minWidth: 240,
    type: "text",
  },
];

const finishedEntryRows: readonly EntryRowConfig[] = [
  {
    keys: ["finishedType", "salesItemName", "itemName"],
    template: {
      xs: "1fr",
      sm: "1fr 1fr",
      md: "minmax(160px, 1.1fr) minmax(220px, 1.8fr) minmax(240px, 2.2fr)",
    },
  },
  {
    keys: [
      "length",
      "width",
      "thickness",
      "quantitySheets",
      "sqm",
      "totalSqm",
      "ratePerSqf",
      "amount",
    ],
    template: {
      xs: "1fr 1fr",
      sm: "repeat(4, minmax(120px, 1fr))",
      md: "repeat(8, minmax(110px, 1fr))",
    },
  },
  {
    keys: [
      "baseType",
      "baseName",
      "baseLength",
      "baseWidth",
      "baseThickness",
      "remark",
    ],
    template: {
      xs: "1fr",
      sm: "1fr 1fr",
      md: "minmax(130px, 1.1fr) minmax(200px, 1.8fr) minmax(120px, 0.95fr) minmax(120px, 0.95fr) minmax(120px, 0.95fr) minmax(200px, 1.5fr)",
    },
  },
];

const rawEntryRows: readonly EntryRowConfig[] = [
  {
    keys: ["productCategory", "itemName", "subCategory", "series", "grade"],
    template: {
      xs: "1fr",
      sm: "1fr 1fr",
      md: "minmax(150px, 1.15fr) minmax(220px, 1.9fr) minmax(160px, 1.35fr) minmax(130px, 1.05fr) minmax(120px, 0.95fr)",
    },
  },
  {
    keys: [
      "length",
      "width",
      "thickness",
      "quantitySheets",
      "sqm",
      "totalSqm",
      "ratePerSqf",
      "amount",
    ],
    template: {
      xs: "1fr 1fr",
      sm: "repeat(4, minmax(120px, 1fr))",
      md: "repeat(8, minmax(110px, 1fr))",
    },
  },
  {
    keys: ["remark"],
    template: {
      xs: "1fr",
      md: "minmax(300px, 1fr)",
    },
  },
];

const itemDetailColumns = [
  { key: "itemName", label: "Item Name", minWidth: 180 },
  { key: "itemCode", label: "Item Code", minWidth: 130 },
  { key: "category", label: "Category", minWidth: 150 },
  { key: "subCategory", label: "Sub Category", minWidth: 160 },
  { key: "color", label: "Color", minWidth: 130 },
  { key: "hsn", label: "HSN Code", minWidth: 130 },
  { key: "gst", label: "GST No", minWidth: 120 },
  { key: "remark", label: "Remark", minWidth: 220 },
] as const;

export interface OrderLineItemsTableHandle {
  validate: () => boolean;
}

export const OrderLineItemsTable = forwardRef<
  OrderLineItemsTableHandle,
  {
    items: readonly OrderLineItem[];
    onChange: (items: OrderLineItem[]) => void;
    readOnly?: boolean;
    variant?: OrderCreateVariant | null;
  }
>(function OrderLineItemsTable({
  items,
  onChange,
  readOnly = false,
  variant,
}, ref) {
  const isUnifiedOrder = variant === "order";
  const isFinishedOrder = variant === "finished";
  const itemRows = useMemo(() => getItemMasterRows(), []);
  const itemOptions = useMemo(() => getItemMasterOptions(itemRows), [itemRows]);
  const subCategoryOptions = useMemo(
    () => getItemMasterSubCategoryOptions(itemRows),
    [itemRows],
  );
  const columns = useMemo(
    () =>
      getOrderLineItemColumns(isFinishedOrder, isUnifiedOrder).map((column) =>
        column.key === "itemName" && column.type === "select"
          ? { ...column, options: itemOptions }
          : column.key === "subCategory" && column.type === "select"
            ? { ...column, options: subCategoryOptions }
          : column,
      ),
    [isFinishedOrder, isUnifiedOrder, itemOptions, subCategoryOptions],
  );
  const nextRowId = useRef(1);
  const [draftValues, setDraftValues] = useState<Record<string, string>>(() =>
    createEmptyValues(columns),
  );
  const [draftSubmitAttempted, setDraftSubmitAttempted] = useState(false);
  const [lineItems, setLineItems] = useState<OrderLineItem[]>(() => [...items]);
  const [editingRowId, setEditingRowId] = useState<string | null>(null);
  const [selectedItemDetails, setSelectedItemDetails] =
    useState<MasterRecord | null>(null);

  useEffect(() => {
    setLineItems([...items]);
    const numericIds = items
      .map((item) => Number(String(item.id).split("-").pop()))
      .filter((value) => !Number.isNaN(value));
    nextRowId.current = (numericIds.length > 0 ? Math.max(...numericIds) : 0) + 1;
  }, [items]);

  useEffect(() => {
    setDraftValues(createEmptyValues(columns));
    setEditingRowId(null);
    setDraftSubmitAttempted(false);
  }, [columns]);

  const commitLineItems = (nextItems: OrderLineItem[]) => {
    setLineItems(nextItems);
    onChange(nextItems);
  };

  const resetDraftForm = () => {
    setDraftValues(createEmptyValues(columns));
    setEditingRowId(null);
    setDraftSubmitAttempted(false);
  };

  const handleAddLineItem = () => {
    if (allValuesEmpty(draftValues)) {
      setDraftSubmitAttempted(true);
      return;
    }

    const validationErrors = getLineItemValidationErrors(
      columns,
      draftValues,
      isFinishedOrder,
    );

    if (hasValidationErrors(validationErrors)) {
      setDraftSubmitAttempted(true);
      return;
    }

    if (editingRowId) {
      commitLineItems(
        lineItems.map((row) =>
          row.id === editingRowId
            ? {
                id: row.id,
                ...mapValuesToLineItem(draftValues),
              }
            : row,
        ),
      );
    } else {
      const nextItems = [
        ...lineItems,
        {
          id: `order-line-item-${nextRowId.current}`,
          ...mapValuesToLineItem(draftValues),
        },
      ];
      nextRowId.current += 1;
      commitLineItems(nextItems);
    }

    resetDraftForm();
  };

  const handleDeleteLineItem = (rowId: string) => {
    commitLineItems(lineItems.filter((row) => row.id !== rowId));

    if (editingRowId === rowId) {
      resetDraftForm();
    }
  };

  const handleStartEdit = (row: OrderLineItem) => {
    setEditingRowId(row.id);
    setDraftValues(mapLineItemToValues(row));
    setDraftSubmitAttempted(false);
  };

  const updateDraftValue = (key: keyof Omit<OrderLineItem, "id">, value: string) => {
    setDraftValues((current) =>
      getNextLineItemValues(current, key, value, isFinishedOrder, itemRows),
    );
  };

  const openItemDetails = (itemName: string) => {
    const itemDetails = getItemMasterRecord(itemRows, itemName);

    if (itemDetails) {
      setSelectedItemDetails(itemDetails);
    }
  };

  useImperativeHandle(
    ref,
    () => ({
      validate: () => {
        if (readOnly) {
          return true;
        }

        const draftHasValues = !allValuesEmpty(draftValues);
        const draftErrors = getLineItemValidationErrors(
          columns,
          draftValues,
          isFinishedOrder,
        );

        if (editingRowId) {
          setDraftSubmitAttempted(true);
          return !hasValidationErrors(draftErrors);
        }

        if (lineItems.length === 0 || (draftHasValues && hasValidationErrors(draftErrors))) {
          setDraftSubmitAttempted(true);
          return false;
        }

        return true;
      },
    }),
    [
      columns,
      draftValues,
      editingRowId,
      isFinishedOrder,
      lineItems.length,
      readOnly,
    ],
  );

  const entryRows = isUnifiedOrder
    ? unifiedEntryRows
    : isFinishedOrder
      ? finishedEntryRows
      : rawEntryRows;
  const columnsByKey = useMemo(() => {
    const map = new Map<string, OrderLineItemColumn>();
    columns.forEach((column) => map.set(column.key, column));
    return map;
  }, [columns]);

  return (
    <Stack sx={{ gap: 1.5 }}>
      {!readOnly ? (
        <Box
          sx={(theme) => ({
            ...formSectionCardSx(theme),
          })}
        >
          <Stack sx={{ gap: 1.15 }}>
            <FormSectionHeader
              title={
                `${isFinishedOrder ? "Finished Order Item" : "Raw Order Item"}${
                  editingRowId ? " · Editing" : ""
                }`
              }
            />

            <Stack sx={{ gap: 1.15 }}>
              {entryRows.map((rowConfig, rowIndex) => (
                <Box
                  key={`entry-row-${rowIndex}`}
                  sx={(theme) => ({
                    display: "grid",
                    gap: theme.spacing(1.25),
                    alignItems: "flex-start",
                    gridTemplateColumns: {
                      xs: rowConfig.template.xs,
                      sm: rowConfig.template.sm ?? rowConfig.template.md,
                      md: rowConfig.template.md,
                    },
                  })}
                >
                  {rowConfig.keys.map((key) => {
                    const column = columnsByKey.get(key);

                    if (!column || (isUnifiedOrder && isBaseField(column.key) && !isFinishedProductType(draftValues.productCategory))) {
                      return null;
                    }

                    return (
                      <Stack key={column.key} spacing={0.5} sx={{ minWidth: 0 }}>
                        <FieldLabel>{column.label}</FieldLabel>
                        {renderField({
                          column,
                          currentValues: draftValues,
                          errorText: draftSubmitAttempted
                            ? getFieldValidationError(
                                column,
                                draftValues,
                                isFinishedOrder,
                              )
                            : "",
                          itemRows,
                          onChange: (value) =>
                            updateDraftValue(column.key, value),
                          onOpenItemDetails: openItemDetails,
                          value: draftValues[column.key] ?? "",
                        })}
                      </Stack>
                    );
                  })}
                </Box>
              ))}
            </Stack>

            <Box
              sx={(theme) => ({
                display: "flex",
                justifyContent: "flex-end",
                alignItems: "center",
                gap: theme.spacing(1),
                flexWrap: "wrap",
                pt: 0.25,
              })}
            >
              {editingRowId ? (
                <Button
                  onClick={resetDraftForm}
                  sx={(theme) => ({
                    ...formInlineActionButtonSx(theme),
                    backgroundColor: "transparent",
                    color: theme.customTokens.text.primary,
                    border: `1px solid ${theme.customTokens.borders.default}`,
                    "&:hover": {
                      backgroundColor: theme.customTokens.neutrals[100],
                      boxShadow: "none",
                    },
                  })}
                  variant="outlined"
                >
                  Cancel Edit
                </Button>
              ) : null}
              <Button
                disableElevation
                onClick={handleAddLineItem}
                startIcon={
                  editingRowId ? <Save size={15} /> : <Plus size={15} />
                }
                sx={(theme) => formInlineActionButtonSx(theme)}
                variant="contained"
              >
                {editingRowId ? "Update Item" : "Add Item"}
              </Button>
            </Box>
          </Stack>
        </Box>
      ) : null}

      {lineItems.length > 0 ? (
        <Box
          sx={(theme) => ({
            border: `1px solid ${theme.customTokens.borders.default}`,
            borderRadius: "8px",
            backgroundColor: theme.customTokens.surfaces.surface,
            overflow: "hidden",
            px: 1.75,
            pt: 1.5,
            pb: 0,
          })}
        >
          <FormSectionHeader title="Order Items" />
          <Box sx={(theme) => ({ ...getScrollableTableSx(theme), mx: -1.75, mt: 1.15 })}>
              <Table
                size="medium"
                sx={{ minWidth: isUnifiedOrder ? 1500 : isFinishedOrder ? 1080 : 1020 }}
              >
                <TableHead>
                  <TableRow>
                    {(isUnifiedOrder
                      ? unifiedListingHeaders
                      : isFinishedOrder
                      ? finishedListingHeaders
                      : rawListingHeaders
                    ).map((header) => (
                      <TableCell
                        key={header.label}
                        sx={(theme) =>
                          getHeaderCellSx(theme, header.minWidth, header.align)
                        }
                      >
                        {header.label}
                      </TableCell>
                    ))}
                    {!readOnly ? (
                      <TableCell
                        sx={(theme) => getHeaderCellSx(theme, 96, "center")}
                      >
                        Actions
                      </TableCell>
                    ) : null}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {lineItems.map((row, index) => {
                    const isEditing = editingRowId === row.id;

                    return (
                      <TableRow
                        key={row.id}
                        sx={(theme) => ({
                          backgroundColor: isEditing
                            ? theme.customTokens.navigation.hoverBackground
                            : index % 2 === 0
                              ? theme.customTokens.surfaces.surface
                              : theme.customTokens.surfaces.alt,
                        })}
                      >
                        {(isUnifiedOrder
                          ? getUnifiedListingValues(row, index)
                          : isFinishedOrder
                          ? getFinishedListingValues(row, index)
                          : getRawListingValues(row, index)
                        ).map((cell) => (
                          <TableCell
                            key={cell.label}
                            sx={(theme) => ({
                              ...getBodyCellSx(theme, cell.align),
                              fontSize: "14px",
                              fontWeight: cell.emphasize ? 500 : 400,
                            })}
                          >
                            {cell.value || "—"}
                          </TableCell>
                        ))}
                        {!readOnly ? (
                          <TableCell
                            align="center"
                            sx={(theme) => ({
                              ...getBodyCellSx(theme, "center"),
                            })}
                          >
                            <Stack
                              direction="row"
                              justifyContent="center"
                              spacing={0.5}
                            >
                              <IconButton
                                aria-label="Edit item"
                                disabled={isEditing}
                                onClick={() => handleStartEdit(row)}
                                size="small"
                                sx={(theme) => getActionButtonSx(theme)}
                                title="Edit"
                              >
                                <Pencil size={15} />
                              </IconButton>
                              <IconButton
                                aria-label="Remove item"
                                onClick={() => handleDeleteLineItem(row.id)}
                                size="small"
                                sx={(theme) => getActionButtonSx(theme)}
                                title="Remove"
                              >
                                <Trash2 size={15} />
                              </IconButton>
                            </Stack>
                          </TableCell>
                        ) : null}
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </Box>
          </Box>
      ) : null}

      <ItemDetailsDialog
        item={selectedItemDetails}
        onClose={() => setSelectedItemDetails(null)}
        open={Boolean(selectedItemDetails)}
      />
    </Stack>
  );
});

function getOrderLineItemColumns(isFinishedOrder: boolean, isUnifiedOrder = false) {
  if (isUnifiedOrder) {
    return unifiedOrderLineItemColumns;
  }

  return isFinishedOrder
    ? finishedOrderLineItemColumns
    : rawOrderLineItemColumns;
}

function createEmptyValues(columns: readonly OrderLineItemColumn[]) {
  return columns.reduce<Record<string, string>>((accumulator, column) => {
    accumulator[column.key] = "";
    return accumulator;
  }, {});
}

function allValuesEmpty(values: Record<string, string>) {
  return Object.values(values).every((value) => value.trim().length === 0);
}

function getLineItemValidationErrors(
  columns: readonly OrderLineItemColumn[],
  values: Record<string, string>,
  isFinishedOrder: boolean,
) {
  return columns.reduce<Record<string, string>>((errors, column) => {
    const error = getFieldValidationError(column, values, isFinishedOrder);

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
  column: OrderLineItemColumn,
  values: Record<string, string>,
  _isFinishedOrder: boolean,
) {
  const value = (values[column.key] ?? "").trim();

  if (isLineItemColumnRequired(column) && value.length === 0) {
    return `${column.label} is required`;
  }

  if (column.numeric && value.length > 0 && !isValidDoubleValue(value)) {
    return `${column.label} must be a number`;
  }

  return "";
}

function isLineItemColumnRequired(_column: OrderLineItemColumn) {
  return false;
}

function FieldLabel({ children }: { children: string }) {
  return (
    <Typography
      component="label"
      sx={(theme) => ({
        ...formFieldLabelSx(theme),
      })}
    >
      {children}
    </Typography>
  );
}

const finishedListingHeaders = [
  { label: "#", minWidth: 56, align: "left" as const },
  { label: "Finished Type", minWidth: 130, align: "left" as const },
  { label: "Sales Item", minWidth: 160, align: "left" as const },
  { label: "Item Name", minWidth: 180, align: "left" as const },
  { label: "Length", minWidth: 110, align: "left" as const },
  { label: "Width", minWidth: 110, align: "left" as const },
  { label: "Thickness", minWidth: 110, align: "left" as const },
  { label: "Sheets", minWidth: 80, align: "right" as const },
  { label: "SQM", minWidth: 90, align: "right" as const },
  { label: "SQF", minWidth: 90, align: "right" as const },
  { label: "Rate/SQF", minWidth: 100, align: "right" as const },
  { label: "Amount", minWidth: 110, align: "right" as const },
];

const rawListingHeaders = [
  { label: "#", minWidth: 56, align: "left" as const },
  { label: "Product Type", minWidth: 140, align: "left" as const },
  { label: "Item Name", minWidth: 180, align: "left" as const },
  { label: "Length", minWidth: 110, align: "left" as const },
  { label: "Width", minWidth: 110, align: "left" as const },
  { label: "Thickness", minWidth: 110, align: "left" as const },
  { label: "Sheets", minWidth: 80, align: "right" as const },
  { label: "SQM", minWidth: 90, align: "right" as const },
  { label: "SQF", minWidth: 90, align: "right" as const },
  { label: "Rate/SQF", minWidth: 100, align: "right" as const },
  { label: "Amount", minWidth: 110, align: "right" as const },
];

const unifiedListingHeaders = [
  { label: "#", minWidth: 56, align: "left" as const },
  { label: "Product Type", minWidth: 140, align: "left" as const },
  { label: "Sales Item Name", minWidth: 160, align: "left" as const },
  { label: "Item Name", minWidth: 180, align: "left" as const },
  { label: "Length", minWidth: 100, align: "left" as const },
  { label: "Width", minWidth: 100, align: "left" as const },
  { label: "Thickness", minWidth: 100, align: "left" as const },
  { label: "Sheets", minWidth: 80, align: "right" as const },
  { label: "SQM", minWidth: 90, align: "right" as const },
  { label: "SQF", minWidth: 90, align: "right" as const },
  { label: "Rate/SQF", minWidth: 100, align: "right" as const },
  { label: "Amount", minWidth: 110, align: "right" as const },
  { label: "Base Type", minWidth: 120, align: "left" as const },
  { label: "Base Name", minWidth: 150, align: "left" as const },
  { label: "Base Length", minWidth: 110, align: "left" as const },
  { label: "Base Width", minWidth: 110, align: "left" as const },
  { label: "Base Thickness", minWidth: 120, align: "left" as const },
  { label: "Remark", minWidth: 180, align: "left" as const },
];

function getUnifiedListingValues(row: OrderLineItem, index: number) {
  const values = [
    { label: "#", value: formatOrderItemNo(row.id, index), align: "left" as const, emphasize: true },
    { label: "Product Type", value: getUnifiedProductType(row), align: "left" as const },
    { label: "Sales Item Name", value: row.salesItemName, align: "left" as const },
    { label: "Item Name", value: row.itemName, align: "left" as const },
    { label: "Length", value: row.length, align: "left" as const },
    { label: "Width", value: row.width, align: "left" as const },
    { label: "Thickness", value: row.thickness, align: "left" as const },
    { label: "Sheets", value: row.quantitySheets, align: "right" as const },
    { label: "SQM", value: row.sqm, align: "right" as const },
    { label: "SQF", value: row.totalSqm, align: "right" as const },
    { label: "Rate/SQF", value: row.ratePerSqf, align: "right" as const },
    { label: "Amount", value: row.amount, align: "right" as const, emphasize: true },
  ];

  if (isFinishedProductType(getUnifiedProductType(row))) {
    values.push(
      { label: "Base Type", value: row.baseType, align: "left" as const },
      { label: "Base Name", value: row.baseName, align: "left" as const },
      { label: "Base Length", value: row.baseLength, align: "left" as const },
      { label: "Base Width", value: row.baseWidth, align: "left" as const },
      { label: "Base Thickness", value: row.baseThickness, align: "left" as const },
    );
  }

  values.push({ label: "Remark", value: row.remark, align: "left" as const });
  return values;
}

function getUnifiedProductType(row: OrderLineItem) {
  return row.productCategory === "Finished"
    ? row.finishedType
    : row.productCategory || row.finishedType;
}

function isFinishedProductType(value: string | undefined) {
  return ["Decorative", "Marquetry", "Fluted", "Embossed"].includes(value ?? "");
}

function isBaseField(key: keyof Omit<OrderLineItem, "id">) {
  return ["baseType", "baseName", "baseLength", "baseWidth", "baseThickness"].includes(key);
}

function getFinishedListingValues(row: OrderLineItem, index: number) {
  return [
    {
      label: "#",
      value: formatOrderItemNo(row.id, index),
      align: "left" as const,
      emphasize: true,
    },
    {
      label: "Finished Type",
      value: row.finishedType,
      align: "left" as const,
    },
    {
      label: "Sales Item",
      value: row.salesItemName,
      align: "left" as const,
    },
    {
      label: "Item Name",
      value: row.itemName,
      align: "left" as const,
    },
    { label: "Length", value: row.length, align: "left" as const },
    { label: "Width", value: row.width, align: "left" as const },
    { label: "Thickness", value: row.thickness, align: "left" as const },
    {
      label: "Sheets",
      value: row.quantitySheets,
      align: "right" as const,
    },
    { label: "SQM", value: row.sqm, align: "right" as const },
    { label: "SQF", value: row.totalSqm, align: "right" as const },
    { label: "Rate/SQF", value: row.ratePerSqf, align: "right" as const },
    {
      label: "Amount",
      value: row.amount,
      align: "right" as const,
      emphasize: true,
    },
  ];
}

function getRawListingValues(row: OrderLineItem, index: number) {
  return [
    {
      label: "#",
      value: String(index + 1),
      align: "left" as const,
      emphasize: true,
    },
    {
      label: "Product Type",
      value: row.productCategory,
      align: "left" as const,
    },
    {
      label: "Item Name",
      value: row.itemName,
      align: "left" as const,
    },
    { label: "Length", value: row.length, align: "left" as const },
    { label: "Width", value: row.width, align: "left" as const },
    { label: "Thickness", value: row.thickness, align: "left" as const },
    {
      label: "Sheets",
      value: row.quantitySheets,
      align: "right" as const,
    },
    { label: "SQM", value: row.sqm, align: "right" as const },
    { label: "SQF", value: row.totalSqm, align: "right" as const },
    { label: "Rate/SQF", value: row.ratePerSqf, align: "right" as const },
    {
      label: "Amount",
      value: row.amount,
      align: "right" as const,
      emphasize: true,
    },
  ];
}

function mapValuesToLineItem(values: Record<string, string>): Omit<OrderLineItem, "id"> {
  return {
    productCategory: values.productCategory ?? "",
    finishedType: values.finishedType ?? "",
    salesItemName: values.salesItemName ?? "",
    itemName: values.itemName ?? "",
    subCategory: values.subCategory ?? "",
    series: values.series ?? "",
    grade: values.grade ?? "",
    length: values.length ?? "",
    width: values.width ?? "",
    thickness: values.thickness ?? "",
    quantitySheets: values.quantitySheets ?? "",
    sqm: values.sqm ?? "",
    totalSqm: values.totalSqm ?? "",
    ratePerSqf: values.ratePerSqf ?? "",
    baseType: values.baseType ?? "",
    baseName: values.baseName ?? "",
    baseLength: values.baseLength ?? "",
    baseWidth: values.baseWidth ?? "",
    baseThickness: values.baseThickness ?? "",
    amount: values.amount ?? "",
    remark: values.remark ?? "",
  };
}

function mapLineItemToValues(lineItem: OrderLineItem) {
  return {
    productCategory:
      lineItem.productCategory === "Finished"
        ? lineItem.finishedType
        : lineItem.productCategory || lineItem.finishedType,
    finishedType: lineItem.finishedType,
    salesItemName: lineItem.salesItemName,
    itemName: lineItem.itemName,
    subCategory: lineItem.subCategory,
    series: lineItem.series,
    grade: lineItem.grade,
    length: lineItem.length,
    width: lineItem.width,
    thickness: lineItem.thickness,
    quantitySheets: lineItem.quantitySheets,
    sqm: lineItem.sqm,
    totalSqm: lineItem.totalSqm,
    ratePerSqf: lineItem.ratePerSqf,
    baseType: lineItem.baseType,
    baseName: lineItem.baseName,
    baseLength: lineItem.baseLength,
    baseWidth: lineItem.baseWidth,
    baseThickness: lineItem.baseThickness,
    amount: lineItem.amount,
    remark: lineItem.remark,
  };
}

function getNextLineItemValues(
  currentValues: Record<string, string>,
  key: keyof Omit<OrderLineItem, "id">,
  value: string,
  isFinishedOrder: boolean,
  itemRows: readonly MasterRecord[],
) {
  const nextValue = isNumericLineItemKey(key) ? sanitizeDoubleInput(value) : value;
  let nextValues = {
    ...currentValues,
    [key]: nextValue,
  };

  if (key === "baseType") {
    nextValues.baseName = "";
  }

  if (key === "productCategory" && !isFinishedProductType(nextValue)) {
    nextValues.baseType = "";
    nextValues.baseName = "";
    nextValues.baseLength = "";
    nextValues.baseWidth = "";
    nextValues.baseThickness = "";
  }

  if (key === "itemName") {
    nextValues = applyOrderItemMasterDefaults(
      nextValues,
      nextValue,
      itemRows,
      isFinishedOrder,
    );
  }

  return applyLineItemCalculations(nextValues, isFinishedOrder, key);
}

function applyLineItemCalculations(
  values: Record<string, string>,
  isFinishedOrder: boolean,
  changedKey?: keyof Omit<OrderLineItem, "id">,
) {
  const shouldCalculateFromDimensions =
    isFinishedOrder ||
    changedKey === "itemName" ||
    changedKey === "length" ||
    changedKey === "width" ||
    changedKey === "quantitySheets";
  const areaValues: Record<string, string> = shouldCalculateFromDimensions
    ? applyDimensionAreaCalculations(values, { clearWhenIncomplete: isFinishedOrder })
    : { ...values };
  const sqm = parsePositiveNumber(areaValues.sqm);
  const nextValues: Record<string, string> =
    !isFinishedOrder && changedKey === "sqm" && sqm > 0
      ? { ...areaValues, totalSqm: formatAreaValue(sqm * sqmToSqf) }
      : areaValues;
  const sqf = parsePositiveNumber(nextValues.totalSqm);
  const ratePerSqf = parsePositiveNumber(nextValues.ratePerSqf);

  return {
    ...nextValues,
    amount: sqf > 0 && ratePerSqf > 0 ? formatMoneyValue(sqf * ratePerSqf) : "",
  };
}

function applyDimensionAreaCalculations(
  values: Record<string, string>,
  options: { clearWhenIncomplete: boolean },
): Record<string, string> {
  const length = parseDimensionToMeters(values.length);
  const width = parseDimensionToMeters(values.width);
  const sheets = parsePositiveNumber(values.quantitySheets);

  if (length > 0 && width > 0 && sheets > 0) {
    const sqm = length * width * sheets;

    return {
      ...values,
      sqm: formatAreaValue(sqm),
      totalSqm: formatAreaValue(sqm * sqmToSqf),
    };
  }

  if (!options.clearWhenIncomplete) {
    return values;
  }

  return {
    ...values,
    sqm: "",
    totalSqm: "",
  };
}

function parseDimensionToMeters(value: string | undefined) {
  const numberValue = parsePositiveNumber(value);

  if (numberValue <= 0) {
    return 0;
  }

  return numberValue > 100 ? numberValue / 1000 : numberValue;
}

function parsePositiveNumber(value: string | undefined) {
  if (!value) {
    return 0;
  }

  const numericValue = Number(value.replace(/,/g, ""));

  return Number.isNaN(numericValue) || numericValue < 0 ? 0 : numericValue;
}

function isValidDoubleValue(value: string) {
  return /^\d+(\.\d+)?$/.test(value.replace(/,/g, ""));
}

function sanitizeDoubleInput(value: string) {
  const sanitized = value.replace(/[^0-9.]/g, "");
  const [integerPart = "", ...decimalParts] = sanitized.split(".");

  if (decimalParts.length === 0) {
    return integerPart;
  }

  return `${integerPart}.${decimalParts.join("")}`;
}

function isNumericLineItemKey(key: keyof Omit<OrderLineItem, "id">) {
  return [
    "length",
    "width",
    "thickness",
    "quantitySheets",
    "sqm",
    "totalSqm",
    "ratePerSqf",
    "baseLength",
    "baseWidth",
    "baseThickness",
    "amount",
  ].includes(key);
}

function formatAreaValue(value: number) {
  return formatSQM(value);
}

function formatMoneyValue(value: number) {
  return formatAmount(value);
}

function renderField({
  column,
  currentValues,
  errorText,
  itemRows,
  onChange,
  onOpenItemDetails,
  value,
}: {
  column: OrderLineItemColumn;
  currentValues: Record<string, string>;
  errorText?: string;
  itemRows: readonly MasterRecord[];
  onChange: (value: string) => void;
  onOpenItemDetails: (itemName: string) => void;
  value: string;
}) {
  const selectOptions = getColumnOptions(column, itemRows, currentValues);
  const control =
    column.type === "select" ? (
      <ErpSelectField
        dropdownWidth={column.dropdownWidth ?? Math.max(column.controlWidth, 240)}
        helperText={errorText}
        onChange={onChange}
        options={selectOptions}
        searchable={selectOptions.length > 6}
        size="regular"
        state={errorText ? "error" : column.readOnly ? "readOnly" : "default"}
        value={value}
      />
    ) : (
      <TextField
        error={Boolean(errorText)}
        fullWidth
        helperText={errorText}
        size="small"
        value={value}
        onChange={(event) =>
          onChange(column.numeric ? sanitizeDoubleInput(event.target.value) : event.target.value)
        }
        slotProps={{
          input: {
            inputMode: column.numeric ? "decimal" : undefined,
            readOnly: column.readOnly,
          },
        }}
        sx={(theme) => ({
          ...getCompactFieldSx(
            theme,
            errorText ? "error" : column.readOnly ? "readOnly" : "default",
            { large: true },
          ),
          "& .MuiInputBase-root": {
            minHeight: 40,
          },
          ...(column.readOnly
            ? {
                "& .MuiInputBase-root": {
                  minHeight: 40,
                  backgroundColor: theme.customTokens.surfaces.alt,
                  color: theme.customTokens.text.secondary,
                  cursor: "default",
                },
                "& .MuiInputBase-input": {
                  fontWeight: 600,
                },
              }
            : {}),
        })}
      />
    );

  if (!column.showItemDetails) {
    return control;
  }

  return (
    <Stack direction="row" spacing={0.75} alignItems="center">
      <Box sx={{ minWidth: 0, flex: 1 }}>{control}</Box>
      <IconButton
        aria-label="View item details"
        disabled={!getItemMasterRecord(itemRows, value)}
        onClick={() => onOpenItemDetails(value)}
        size="small"
        sx={(theme) => ({
          color: theme.customTokens.navigation.activeText,
          height: theme.spacing(4),
          width: theme.spacing(4),
          "&.Mui-disabled": {
            color: theme.palette.text.disabled,
          },
          "&:hover": {
            backgroundColor: theme.customTokens.navigation.hoverBackground,
          },
        })}
      >
        <Info size={14} />
      </IconButton>
    </Stack>
  );
}

function ItemDetailsDialog({
  item,
  onClose,
  open,
}: {
  item: MasterRecord | null;
  onClose: () => void;
  open: boolean;
}) {
  return (
    <Dialog
      fullWidth
      maxWidth={false}
      onClose={onClose}
      open={open}
      slotProps={{
        paper: {
          sx: (theme) => ({
            borderRadius: `${theme.customTokens.radius.md}px`,
            boxShadow: theme.customTokens.elevation.md,
            maxHeight: "none",
            overflow: "visible",
            outline: "none",
            width: "min(96vw, 1760px)",
            "&:focus, &:focus-visible": {
              outline: "none",
            },
          }),
        },
      }}
    >
      <DialogTitle
        sx={(theme) => ({
          borderBottom: `1px solid ${theme.customTokens.borders.default}`,
          fontSize: theme.typography.h3.fontSize,
          fontWeight: 700,
          px: theme.spacing(2),
          py: theme.spacing(1.5),
        })}
      >
        Item Details
      </DialogTitle>

      <DialogContent
        sx={(theme) => ({
          px: theme.spacing(2),
          py: theme.spacing(2),
        })}
      >
        <Stack sx={(theme) => ({ gap: theme.spacing(2) })}>
          <Box
            sx={(theme) => ({
              border: `1px solid ${theme.customTokens.borders.default}`,
              borderRadius: `${theme.customTokens.radius.sm}px`,
              overflow: "hidden",
              backgroundColor: theme.customTokens.surfaces.surface,
            })}
          >
            <Box sx={{ overflow: "hidden" }}>
              <Table
                size="small"
                sx={{
                  minWidth: "100%",
                  tableLayout: "fixed",
                  width: "100%",
                }}
              >
                <TableHead>
                  <TableRow>
                    {itemDetailColumns.map((column) => (
                      <TableCell
                        key={column.key}
                        sx={(theme) => ({
                          ...getHeaderCellSx(theme, column.minWidth),
                          overflowWrap: "anywhere",
                          whiteSpace: "normal",
                        })}
                      >
                        {column.label}
                      </TableCell>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  <TableRow>
                    {itemDetailColumns.map((column) => (
                      <TableCell
                        key={column.key}
                        sx={(theme) => ({
                          ...getBodyCellSx(theme),
                          overflowWrap: "anywhere",
                          whiteSpace: "normal",
                        })}
                      >
                        {formatMasterValue(item?.[column.key])}
                      </TableCell>
                    ))}
                  </TableRow>
                </TableBody>
              </Table>
            </Box>
          </Box>

          <Box sx={{ display: "flex", justifyContent: "center" }}>
            <Button
              disableElevation
              onClick={onClose}
              sx={recordFormActionButtonSx}
              variant="contained"
            >
              Close
            </Button>
          </Box>
        </Stack>
      </DialogContent>
    </Dialog>
  );
}

function formatOrderItemNo(itemId: string, index: number) {
  const numericTail = String(itemId).match(/(\d+)$/)?.[1];
  const sequence = numericTail
    ? Number.parseInt(numericTail, 10)
    : index + 1;

  return `OI-${String(Number.isFinite(sequence) ? sequence : index + 1).padStart(3, "0")}`;
}

function getItemMasterRows() {
  return buildLocalMasterDefinition(itemMasterDefinition).rows;
}

function getItemMasterOptions(rows: readonly MasterRecord[]) {
  return Array.from(
    new Set(
      rows
        .filter(
          (row) => String(row.status ?? "Active").toLowerCase() !== "inactive",
        )
        .map((row) => String(row.itemName ?? "").trim())
        .filter(Boolean),
    ),
  );
}

function getItemMasterSubCategoryOptions(rows: readonly MasterRecord[]) {
  return Array.from(
    new Set(
      rows
        .filter(
          (row) => String(row.status ?? "Active").toLowerCase() !== "inactive",
        )
        .map((row) => String(row.subCategory ?? "").trim())
        .filter(Boolean),
    ),
  );
}

function getColumnOptions(
  column: OrderLineItemColumn,
  itemRows: readonly MasterRecord[],
  values: Record<string, string>,
) {
  if (column.key === "baseName") {
    return getBaseNameOptions(itemRows, values.baseType);
  }

  return column.options ?? [];
}

function getBaseNameOptions(rows: readonly MasterRecord[], baseType: string | undefined) {
  const normalizedBaseType = String(baseType ?? "").trim().toLowerCase();

  if (!normalizedBaseType) {
    return [];
  }

  return Array.from(
    new Set(
      rows
        .filter(
          (row) => String(row.status ?? "Active").toLowerCase() !== "inactive",
        )
        .filter((row) =>
          [row.category, row.subCategory, row.itemName].some((fieldValue) =>
            String(fieldValue ?? "").toLowerCase().includes(normalizedBaseType),
          ),
        )
        .map((row) => String(row.itemName ?? "").trim())
        .filter(Boolean),
    ),
  );
}

function getItemMasterRecord(rows: readonly MasterRecord[], itemName: string) {
  const normalizedName = itemName.trim().toLowerCase();

  if (!normalizedName) {
    return undefined;
  }

  return rows.find(
    (row) => String(row.itemName ?? "").trim().toLowerCase() === normalizedName,
  );
}

function applyOrderItemMasterDefaults(
  values: Record<string, string>,
  itemName: string,
  itemRows: readonly MasterRecord[],
  isFinishedOrder: boolean,
) {
  const item = getItemMasterRecord(itemRows, itemName);

  if (!item) {
    return values;
  }

  const nextValues = { ...values };
  const category = masterRecordString(item, "category");
  const subCategory = masterRecordString(item, "subCategory");

  if (isFinishedOrder) {
    if (!nextValues.salesItemName?.trim()) {
      nextValues.salesItemName = itemName;
    }

    applyOrderItemDimensionDefaults(nextValues, item);

    return nextValues;
  }

  const productType = getRawProductTypeFromItem(item);

  if (productType) {
    nextValues.productCategory = productType;
  } else if (category) {
    nextValues.productCategory = category;
  }

  if (subCategory) {
    nextValues.subCategory = subCategory;
  }

  applyOrderItemDimensionDefaults(nextValues, item);

  return nextValues;
}

function applyOrderItemDimensionDefaults(
  values: Record<string, string>,
  item: MasterRecord,
) {
  const dimensionDefaults: Array<[string, keyof Omit<OrderLineItem, "id">]> = [
    [getMasterValueFromKeys(item, ["length", "itemLength", "standardLength"]), "length"],
    [getMasterValueFromKeys(item, ["width", "itemWidth", "standardWidth"]), "width"],
    [
      getMasterValueFromKeys(item, ["thickness", "itemThickness", "standardThickness"]),
      "thickness",
    ],
    [
      getMasterValueFromKeys(item, [
        "quantitySheets",
        "noOfSheets",
        "numberOfSheets",
        "sheets",
      ]),
      "quantitySheets",
    ],
    [getMasterValueFromKeys(item, ["sqm", "totalSqm"]), "sqm"],
    [getMasterValueFromKeys(item, ["sqf", "totalSqf"]), "totalSqm"],
    [getMasterValueFromKeys(item, ["ratePerSqf", "rate", "ratePerSQF"]), "ratePerSqf"],
  ];

  dimensionDefaults.forEach(([value, key]) => {
    if (value) {
      values[key] = value;
    }
  });
}

function getMasterValueFromKeys(record: MasterRecord, keys: readonly string[]) {
  const value = keys
    .map((key) => record[key])
    .find((fieldValue) => String(fieldValue ?? "").trim().length > 0);

  return typeof value === "string" ? value.trim() : "";
}

function getRawProductTypeFromItem(item: MasterRecord) {
  const source = [
    masterRecordString(item, "category"),
    masterRecordString(item, "subCategory"),
    masterRecordString(item, "itemName"),
  ]
    .join(" ")
    .toLowerCase();

  if (source.includes("mdf")) {
    return "MDF";
  }

  if (source.includes("plywood")) {
    return "Plywood";
  }

  if (source.includes("veneer")) {
    return "Veneer";
  }

  return "";
}

function masterRecordString(record: MasterRecord, key: string) {
  const value = record[key];
  return typeof value === "string" ? value.trim() : "";
}

function getHeaderCellSx(
  theme: Theme,
  minWidth: number,
  textAlign: "left" | "center" | "right" = "left",
) {
  return transactionTableHeaderCellSx(theme, minWidth, textAlign);
}

function getBodyCellSx(
  theme: Theme,
  textAlign: "left" | "center" | "right" = "left",
) {
  return {
    ...transactionTableBodyCellSx(theme, textAlign),
    verticalAlign: "middle" as const,
  } as const;
}

function getScrollableTableSx(theme: Theme) {
  return {
    overflowX: "auto",
    overflowY: "hidden",
    scrollbarWidth: "thin",
    scrollbarColor: `${theme.customTokens.brand.primary} ${theme.customTokens.surfaces.alt}`,
    "&::-webkit-scrollbar": {
      height: 8,
    },
    "&::-webkit-scrollbar-track": {
      backgroundColor: theme.customTokens.surfaces.alt,
    },
    "&::-webkit-scrollbar-thumb": {
      borderRadius: 999,
      backgroundColor: theme.customTokens.brand.primary,
    },
  } as const;
}

function getActionButtonSx(theme: Theme) {
  return {
    color: theme.customTokens.navigation.activeText,
    "&:hover": {
      backgroundColor: theme.customTokens.navigation.hoverBackground,
    },
  } as const;
}
