import { useMemo, useRef, useState } from "react";
import type { ReactNode } from "react";
import type { Theme } from "@mui/material/styles";
import {
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
import { Pencil, Plus, Save, Trash2 } from "lucide-react";
import { useLocation, useNavigate } from "react-router";

import { getCompactFieldSx } from "../../../../pages/ComponentLibrary/sections/inputs/components/inputFieldStyles";
import {
  ErpDatePickerField,
  ErpSelectField,
} from "../../../../pages/ComponentLibrary/shared/ErpFieldControls";
import { itemMasterOptions } from "../../../masters/shared/masterDefinitions";
import {
  appendFactoryProcessRun,
  buildFactorySourceAllocationKey,
  computeProcessEntryBalance,
  FactoryPageShell,
  FactorySourceOverviewPanel,
  getFactoryPaths,
  getFactoryQuantityAllocationConfig,
  getProcessQuantityOverflowError,
  resolveLineItemProcessedQuantity,
  resolveOriginalQuantity,
  slicingDefinition,
  sumProcessedLineItemQuantity,
  useFactoryProcessRunTotals,
} from "../../shared";
import { listingToolbarButtonSx, recordFormActionButtonSx } from "../../../shared/buttonStyles";
import { formatSQM, formatSqfFromSqm } from "../../../shared/numberFormat";
import {
  transactionTableBodyCellSx,
  transactionTableHeaderCellSx,
} from "../../../shared/listingTableStyles";
import {
  createEmptyRejectAvailableValues,
  getNextRejectAvailableValues,
  getRejectAvailableValidationErrors,
  getVisibleRejectAvailableValidationIssues,
  hasRejectAvailableValidationErrors,
  RejectAvailableDetailsTable,
  resolveRejectAvailableAreaLimits,
} from "../../shared/RejectAvailableDetailsTable";
import {
  formatSlicingDimensionMetres,
  formatSlicingLineItemDisplay,
  normalizeSlicingLineItemInput,
  resolveSlicingDimensionMetres,
} from "../../shared/slicingAreaCalculation";
import { commonFactoryItemFieldAliases, applyFactoryItemMasterDefaults, applyFactoryLineItemValueChange } from "../../shared/factoryCommonItemFields";

type SourceRow = {
  id: string;
  [key: string]: unknown;
};

type SlicingLocationState = {
  sourceRow?: SourceRow;
  sourceRows?: SourceRow[];
};

type LineItemColumn = {
  key: keyof SlicingLineItemValues;
  label: string;
  minWidth: number;
  options?: readonly string[];
  placeholder: string;
  readOnly?: boolean;
  type: "select" | "text";
};

type SlicingSourceSummary = {
  amount: string;
  bundleNumber: string;
  cmt: string;
  color: string;
  height: string;
  itemName: string;
  itemSubCategory: string;
  length: string;
  logNo: string;
  palletNo: string;
  ratePerSqf: string;
  remark: string;
  sqf: string;
  sqm: string;
  srNo: string;
  width: string;
};

type SlicingFormValues = {
  noOfTotalHours: string;
  noOfWorkers: string;
  noOfWorkingHours: string;
  shift: string;
  slicingDate: Date | null;
};

type SlicingLineItemValues = {
  amount: string;
  bundleNumber: string;
  color: string;
  grade: string;
  height: string;
  itemName: string;
  itemSubCategory: string;
  length: string;
  logNo: string;
  noOfLeaves: string;
  palletNo: string;
  ratePerSqf: string;
  remark: string;
  sqf: string;
  sqm: string;
  width: string;
};

type SlicingLineItem = {
  id: string;
  values: SlicingLineItemValues;
};

const lineItemColumns: readonly LineItemColumn[] = [
  {
    key: "itemName",
    label: "Item Name",
    minWidth: 150,
    options: itemMasterOptions,
    placeholder: "Select Item Name",
    type: "select",
  },
  {
    key: "itemSubCategory",
    label: "Item Sub-Category",
    minWidth: 160,
    placeholder: "Enter Item Sub-Category",
    type: "text",
  },
  {
    key: "logNo",
    label: "Log No.",
    minWidth: 130,
    placeholder: "Enter Log No.",
    type: "text",
  },
  {
    key: "bundleNumber",
    label: "Bundle No",
    minWidth: 130,
    placeholder: "Enter Bundle No",
    type: "text",
  },
  {
    key: "palletNo",
    label: "Pallet No",
    minWidth: 130,
    placeholder: "Enter Pallet No",
    type: "text",
  },
  {
    key: "length",
    label: "Length (m)",
    minWidth: 120,
    placeholder: "Enter Length (m)",
    type: "text",
  },
  {
    key: "width",
    label: "Width (m)",
    minWidth: 120,
    placeholder: "Enter Width (m)",
    type: "text",
  },
  {
    key: "height",
    label: "Thickness (m)",
    minWidth: 120,
    placeholder: "Enter Thickness (m)",
    type: "text",
  },
  {
    key: "color",
    label: "Color",
    minWidth: 130,
    placeholder: "Enter Color",
    type: "text",
  },
  {
    key: "grade",
    label: "Grade",
    minWidth: 120,
    options: ["A", "B", "C", "Premium", "Select", "Commercial", "Export"],
    placeholder: "Select Grade",
    type: "select",
  },
  {
    key: "noOfLeaves",
    label: "No. of Leaves",
    minWidth: 130,
    placeholder: "Enter No. of Leaves",
    type: "text",
  },
  {
    key: "sqm",
    label: "SQM",
    minWidth: 110,
    placeholder: "From inventory",
    readOnly: true,
    type: "text",
  },
  {
    key: "sqf",
    label: "SQF",
    minWidth: 110,
    placeholder: "From inventory",
    readOnly: true,
    type: "text",
  },
  {
    key: "ratePerSqf",
    label: "Rate per SQF",
    minWidth: 130,
    placeholder: "Enter Rate per SQF",
    type: "text",
  },
  {
    key: "amount",
    label: "Amount",
    minWidth: 130,
    placeholder: "Enter Amount",
    type: "text",
  },
  {
    key: "remark",
    label: "Remark",
    minWidth: 160,
    placeholder: "Enter Remark",
    type: "text",
  },
] as const;

export function SlicingCreatePage() {
  const theme = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const paths = getFactoryPaths("slicing");
  const nextRowId = useRef(1);
  const locationState = location.state as SlicingLocationState | null;
  const defaultSourceRow = slicingDefinition.rows[0] as SourceRow | undefined;
  const sourceRow =
    locationState?.sourceRow ??
    locationState?.sourceRows?.[0] ??
    defaultSourceRow;
  const sourceSummary = useMemo(
    () => buildSourceSummary(sourceRow),
    [sourceRow],
  );
  const [formValues, setFormValues] = useState<SlicingFormValues>({
    slicingDate: new Date(),
    shift: "Day",
    noOfWorkers: "",
    noOfWorkingHours: "",
    noOfTotalHours: "",
  });
  const [draftValues, setDraftValues] = useState<SlicingLineItemValues>(() =>
    createDefaultLineItemValues(sourceSummary, sourceRow),
  );
  const [lineItems, setLineItems] = useState<SlicingLineItem[]>([]);
  const [editingRowId, setEditingRowId] = useState<string | null>(null);
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [draftSubmitAttempted, setDraftSubmitAttempted] = useState(false);
  const [editingSubmitAttempted, setEditingSubmitAttempted] = useState(false);
  const [editingValues, setEditingValues] = useState<SlicingLineItemValues>(() =>
    createEmptyLineItemValues(),
  );
  const [rejectAvailableValues, setRejectAvailableValues] = useState(() =>
    createEmptyRejectAvailableValues(),
  );
  const [rejectAvailableSubmitAttempted, setRejectAvailableSubmitAttempted] =
    useState(false);

  const sourceOverviewItems = useMemo(
    () => buildSlicingSourceOverviewItems(sourceSummary, sourceRow),
    [sourceRow, sourceSummary],
  );
  const quantityConfig = useMemo(
    () => getFactoryQuantityAllocationConfig("slicing"),
    [],
  );
  const sourceAllocationKey = useMemo(
    () =>
      buildFactorySourceAllocationKey(
        "slicing",
        sourceRow as Record<string, unknown> | undefined,
      ),
    [sourceRow],
  );
  const runTotals = useFactoryProcessRunTotals(sourceAllocationKey);
  const originalQuantity = useMemo(
    () =>
      quantityConfig
        ? resolveOriginalQuantity(
            sourceRow as Record<string, unknown> | undefined,
            quantityConfig,
          )
        : 0,
    [quantityConfig, sourceRow],
  );
  const currentProcessedQuantity = useMemo(
    () =>
      sumProcessedLineItemQuantity(
        lineItems.map((item) => ({ values: item.values as unknown as Record<string, string> })),
        "slicing",
      ),
    [lineItems],
  );
  const balanceSummary = useMemo(
    () =>
      computeProcessEntryBalance({
        originalQuantity,
        previouslyProcessed: runTotals.processed,
        currentProcessed: currentProcessedQuantity,
      }),
    [currentProcessedQuantity, originalQuantity, runTotals.processed],
  );
  const quantityOverflowError = getProcessQuantityOverflowError({
    originalQuantity,
    previouslyProcessed: runTotals.processed,
    currentProcessed: currentProcessedQuantity,
  });
  const rejectAvailableAreaLimits = useMemo(
    () =>
      resolveRejectAvailableAreaLimits(
        sourceRow as Record<string, unknown> | undefined,
        sourceSummary.sqm,
        sourceSummary.sqf,
        sourceSummary.length,
        sourceSummary.width,
        sourceSummary.height,
      ),
    [
      sourceRow,
      sourceSummary.height,
      sourceSummary.length,
      sourceSummary.sqf,
      sourceSummary.sqm,
      sourceSummary.width,
    ],
  );
  const rejectAvailableValidationErrors = getRejectAvailableValidationErrors(
    rejectAvailableValues,
    rejectAvailableAreaLimits,
  );
  const draftProjectedOverflow = useMemo(() => {
    if (!quantityConfig || originalQuantity <= 0 || allLineItemValuesEmpty(draftValues)) {
      return "";
    }

    return getProcessQuantityOverflowError({
      originalQuantity,
      previouslyProcessed: runTotals.processed,
      currentProcessed:
        currentProcessedQuantity +
        resolveLineItemProcessedQuantity(
          draftValues as unknown as Record<string, string>,
          "slicing",
        ),
    });
  }, [
    currentProcessedQuantity,
    draftValues,
    originalQuantity,
    quantityConfig,
    runTotals.processed,
  ]);
  const visibleLineItemColumns = useMemo(
    () =>
      lineItemColumns.filter((column) =>
        shouldShowLineItemColumn(column, sourceSummary, draftValues, editingValues, lineItems),
      ),
    [draftValues, editingValues, lineItems, sourceSummary],
  );
  const lineItemsTableWidth = useMemo(
    () =>
      visibleLineItemColumns.reduce((total, column) => total + column.minWidth, 84),
    [visibleLineItemColumns],
  );

  const handleAddLineItem = () => {
    if (allLineItemValuesEmpty(draftValues)) {
      setDraftSubmitAttempted(true);
      return;
    }

    const validationErrors = getLineItemValidationErrors(draftValues);

    if (hasValidationErrors(validationErrors)) {
      setDraftSubmitAttempted(true);
      return;
    }

    const draftQty = resolveLineItemProcessedQuantity(
      draftValues as unknown as Record<string, string>,
      "slicing",
    );
    const overflow = getProcessQuantityOverflowError({
      originalQuantity,
      previouslyProcessed: runTotals.processed,
      currentProcessed: currentProcessedQuantity + draftQty,
    });

    if (overflow) {
      setDraftSubmitAttempted(true);
      return;
    }

    const nextId = `slicing-line-item-${nextRowId.current}`;
    nextRowId.current += 1;

    setLineItems((current) => [
      ...current,
      {
        id: nextId,
        values: { ...draftValues },
      },
    ]);
    setDraftValues(createDefaultLineItemValues(sourceSummary, sourceRow));
    setDraftSubmitAttempted(false);
  };

  const handleDeleteLineItem = (rowId: string) => {
    setLineItems((current) => current.filter((row) => row.id !== rowId));

    if (editingRowId === rowId) {
      setEditingRowId(null);
      setEditingValues(createEmptyLineItemValues());
    }
  };

  const handleStartEdit = (row: SlicingLineItem) => {
    setEditingRowId(row.id);
    setEditingValues({ ...row.values });
    setEditingSubmitAttempted(false);
  };

  const handleSaveEdit = (rowId: string) => {
    const validationErrors = getLineItemValidationErrors(editingValues);

    if (hasValidationErrors(validationErrors)) {
      setEditingSubmitAttempted(true);
      return;
    }

    const otherProcessed = sumProcessedLineItemQuantity(
      lineItems
        .filter((row) => row.id !== rowId)
        .map((item) => ({
          values: item.values as unknown as Record<string, string>,
        })),
      "slicing",
    );
    const editedQty = resolveLineItemProcessedQuantity(
      editingValues as unknown as Record<string, string>,
      "slicing",
    );
    const overflow = getProcessQuantityOverflowError({
      originalQuantity,
      previouslyProcessed: runTotals.processed,
      currentProcessed: otherProcessed + editedQty,
    });

    if (overflow) {
      setEditingSubmitAttempted(true);
      return;
    }

    setLineItems((current) =>
      current.map((row) =>
        row.id === rowId
          ? {
              ...row,
              values: { ...editingValues },
            }
          : row,
      ),
    );
    setEditingRowId(null);
    setEditingValues(createEmptyLineItemValues());
    setEditingSubmitAttempted(false);
  };

  return (
    <FactoryPageShell
      breadcrumbs={[
        { label: "Factory", to: "/factory" },
        { label: "Slicing", to: paths.list },
        { label: "Create Slicing" },
      ]}
      title="Create Slicing"
    >
      <Stack
        sx={(currentTheme) => ({
          gap: currentTheme.spacing(2),
        })}
      >
        <FactorySourceOverviewPanel items={sourceOverviewItems} />

        <Box
          sx={(currentTheme) => ({
            width: {
              xs: "100%",
              sm: currentTheme.spacing(28),
            },
            maxWidth: "100%",
          })}
        >
          <FieldWrapper label="Slicing Date">
            <ErpDatePickerField
              helperText={hasSubmitted ? getSlicingFormError("slicingDate", formValues) : ""}
              onChange={(value) =>
                setFormValues((current) => ({
                  ...current,
                  slicingDate: value,
                }))
              }
              size="dense"
              state={
                hasSubmitted && getSlicingFormError("slicingDate", formValues)
                  ? "error"
                  : "default"
              }
              value={formValues.slicingDate}
            />
          </FieldWrapper>
        </Box>

        <Stack sx={{ gap: theme.spacing(1.5) }}>
          <Typography
            sx={(currentTheme) => ({
              color: currentTheme.customTokens.text.secondary,
              fontSize: "0.75rem",
              fontWeight: 600,
              letterSpacing: "0.04em",
              textTransform: "uppercase",
            })}
          >
            Process Details
          </Typography>
          <Box
            sx={{
              border: `1px solid ${theme.customTokens.borders.default}`,
              borderRadius: `${theme.customTokens.radius.md}px`,
              backgroundColor: theme.customTokens.surfaces.surface,
              overflow: "hidden",
            }}
          >
            <Box sx={getScrollableTableSx(theme)}>
              <Table size="small" sx={{ minWidth: lineItemsTableWidth, tableLayout: "auto" }}>
                <TableHead>
                  <TableRow>
                    {visibleLineItemColumns.map((column) => (
                      <TableCell
                        key={column.key}
                        sx={getHeaderCellSx(theme, column.minWidth)}
                      >
                        <ColumnLabel
                          label={column.label}
                          required={isLineItemColumnRequired(column)}
                        />
                      </TableCell>
                    ))}
                  </TableRow>
                </TableHead>

                <TableBody>
                  <TableRow>
                    {visibleLineItemColumns.map((column) => (
                      <TableCell key={column.key} sx={getBodyCellSx(theme)}>
                        {renderEditableField({
                          column,
                          errorText: draftSubmitAttempted
                            ? getFieldValidationError(column, draftValues)
                            : "",
                          onChange: (value) =>
                            setDraftValues((current) =>
                              updateSlicingLineItemValues(current, column.key, value),
                            ),
                          theme,
                          value: draftValues[column.key],
                        })}
                      </TableCell>
                    ))}
                  </TableRow>
                </TableBody>
              </Table>
            </Box>
          </Box>

          <Box
            sx={{
              display: "flex",
              justifyContent: "flex-end",
              alignItems: "center",
              gap: theme.spacing(1.5),
              flexWrap: "wrap",
            }}
          >
            {draftSubmitAttempted && draftProjectedOverflow ? (
              <Typography
                sx={(currentTheme) => ({
                  color: currentTheme.palette.error.main,
                  fontSize: "0.75rem",
                  fontWeight: 500,
                  mr: "auto",
                })}
              >
                {draftProjectedOverflow}
              </Typography>
            ) : null}
            <Button
              disableElevation
              onClick={handleAddLineItem}
              startIcon={<Plus size={14} />}
              sx={listingToolbarButtonSx}
              variant="contained"
            >
              Add Item
            </Button>
          </Box>

          {lineItems.length > 0 ? (
            <Stack spacing={1}>
              <Typography
                sx={(currentTheme) => ({
                  color: currentTheme.customTokens.text.secondary,
                  fontSize: "0.75rem",
                  fontWeight: 600,
                  letterSpacing: "0.04em",
                  textTransform: "uppercase",
                })}
              >
                Processed Items
              </Typography>
            <Box
              sx={{
                border: `1px solid ${theme.customTokens.borders.default}`,
                borderRadius: `${theme.customTokens.radius.md}px`,
                backgroundColor: theme.customTokens.surfaces.surface,
                overflow: "hidden",
              }}
            >
              <Box sx={getScrollableTableSx(theme)}>
                <Table
                  size="small"
                  sx={{ minWidth: lineItemsTableWidth + 120, tableLayout: "auto" }}
                >
                  <TableHead>
                    <TableRow>
                      {visibleLineItemColumns.map((column) => (
                        <TableCell
                          key={column.key}
                          sx={getHeaderCellSx(theme, column.minWidth)}
                        >
                          <ColumnLabel
                            label={column.label}
                            required={isLineItemColumnRequired(column)}
                          />
                        </TableCell>
                      ))}
                      <TableCell sx={getActionHeaderCellSx(theme, 120)}>
                        Action
                      </TableCell>
                    </TableRow>
                  </TableHead>

                  <TableBody>
                    {lineItems.map((row, rowIndex) => {
                      const isEditing = editingRowId === row.id;

                      return (
                        <TableRow
                          key={row.id}
                          sx={{
                            "&:nth-of-type(even)": {
                              backgroundColor: theme.customTokens.surfaces.alt,
                            },
                          }}
                        >
                          {visibleLineItemColumns.map((column) => (
                            <TableCell key={column.key} sx={getBodyCellSx(theme)}>
                              {isEditing
                                ? renderEditableField({
                                    column,
                                    errorText: editingSubmitAttempted
                                      ? getFieldValidationError(column, editingValues)
                                      : "",
                                    onChange: (value) =>
                                      setEditingValues((current) =>
                                        updateSlicingLineItemValues(
                                          current,
                                          column.key,
                                          value,
                                        ),
                                      ),
                                    theme,
                                    value: editingValues[column.key],
                                  })
                                : renderReadOnlyCell(
                                    column.key,
                                    row.values[column.key],
                                    theme,
                                  )}
                            </TableCell>
                          ))}

                          <TableCell
                            align="center"
                            sx={getActionBodyCellSx(theme, 120, rowIndex)}
                          >
                            <Stack
                              direction="row"
                              justifyContent="center"
                              spacing={0.5}
                            >
                              <IconButton
                                aria-label={isEditing ? "Save item" : "Edit item"}
                                onClick={() =>
                                  isEditing
                                    ? handleSaveEdit(row.id)
                                    : handleStartEdit(row)
                                }
                                sx={getActionButtonSx(theme)}
                              >
                                {isEditing ? <Save size={16} /> : <Pencil size={16} />}
                              </IconButton>

                              <IconButton
                                aria-label="Delete item"
                                onClick={() => handleDeleteLineItem(row.id)}
                                sx={getActionButtonSx(theme)}
                              >
                                <Trash2 size={16} />
                              </IconButton>
                            </Stack>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </Box>
            </Box>
            </Stack>
          ) : null}

          <RejectAvailableDetailsTable
            fieldIssues={getVisibleRejectAvailableValidationIssues(
              rejectAvailableValidationErrors,
              rejectAvailableSubmitAttempted,
            )}
            onChange={(key, value) =>
              setRejectAvailableValues((current) =>
                getNextRejectAvailableValues(current, key, value),
              )
            }
            values={rejectAvailableValues}
          />
        </Stack>

        <Box
          sx={{
            display: "flex",
            justifyContent: "flex-end",
            gap: theme.spacing(1),
            flexWrap: "wrap",
          }}
        >
          <Button
            type="button"
            variant="outlined"
            onClick={() => navigate(paths.list)}
            sx={recordFormActionButtonSx}
          >
            Cancel
          </Button>

          <Button
            type="button"
            variant="contained"
            disableElevation
            sx={recordFormActionButtonSx}
            onClick={() => {
              setHasSubmitted(true);
              const draftHasValues = !allLineItemValuesEmpty(draftValues);
              const draftErrors = getLineItemValidationErrors(draftValues);
              const editingErrors = getLineItemValidationErrors(editingValues);
              const lineItemsInvalid =
                lineItems.length === 0 ||
                (draftHasValues && hasValidationErrors(draftErrors)) ||
                Boolean(editingRowId && hasValidationErrors(editingErrors));
              const quantityInvalid = Boolean(quantityOverflowError);
              const rejectAvailableInvalid = hasRejectAvailableValidationErrors(
                rejectAvailableValidationErrors,
              );

              if (lineItemsInvalid) {
                setDraftSubmitAttempted(true);
                setEditingSubmitAttempted(Boolean(editingRowId));
              }

              if (rejectAvailableInvalid) {
                setRejectAvailableSubmitAttempted(true);
              }

              if (
                hasSlicingFormErrors(formValues) ||
                lineItemsInvalid ||
                quantityInvalid ||
                rejectAvailableInvalid
              ) {
                return;
              }

              if (quantityConfig && originalQuantity > 0) {
                appendFactoryProcessRun({
                  stageSlug: "slicing",
                  sourceKey: sourceAllocationKey,
                  processedNow: currentProcessedQuantity,
                  wastageNow: 0,
                  pendingBalance: Math.max(0, balanceSummary.balanceQuantity),
                  remark: "",
                });
              }

              navigate(paths.list);
            }}
          >
            Save Process
          </Button>
        </Box>
      </Stack>
    </FactoryPageShell>
  );
}

function FieldWrapper({
  children,
  label,
  required = false,
}: {
  children: ReactNode;
  label: string;
  required?: boolean;
}) {
  return (
    <Stack sx={{ gap: 0.75 }}>
      <Typography
        variant="subtitle2"
        color="text.primary"
        sx={{ display: "flex", gap: 0.25 }}
      >
        <span>{label}</span>
      </Typography>
      {children}
    </Stack>
  );
}

function buildSourceSummary(sourceRow?: SourceRow): SlicingSourceSummary {
  const length =
    formatSlicingDimensionMetres(getStringValue(sourceRow, ["length"])) ||
    "2.44 m";
  const width =
    formatSlicingDimensionMetres(getStringValue(sourceRow, ["width"])) ||
    "1.22 m";
  const height =
    formatSlicingDimensionMetres(
      getStringValue(sourceRow, ["height", "thickness"]),
    ) || "0.005 m";

  const sqm =
    getStringValue(sourceRow, ["issuedSqm", "totalSqm", "availableSqm", "sqm"]) ||
    calculateCmt(length, width, height);
  const sqf =
    getStringValue(sourceRow, ["issuedSqf", "totalSqf", "availableSqf", "sqf"]) ||
    formatSqfFromSqm(sqm);

  return {
    srNo:
      getStringValue(sourceRow, ["srNo", "issueSrNo", "itemSrNo"]) || "1",
    itemSubCategory:
      getStringValue(sourceRow, ["subCategory", "itemSubCategory"]) || "Natural",
    itemName: getStringValue(sourceRow, ["itemName"]) || "Oak Veneer",
    color:
      getStringValue(sourceRow, ["color", "timberColor", "colour"]) || "Natural",
    logNo: getStringValue(sourceRow, ["logNo", "logCode"]) || "",
    bundleNumber: getStringValue(sourceRow, ["bundleNumber", "noOfBundle"]),
    palletNo: getStringValue(sourceRow, ["palletNo", "palletNumber"]),
    length,
    width,
    height,
    cmt: sqm,
    amount: getStringValue(sourceRow, ["amount"]) || "0.00",
    ratePerSqf: getStringValue(sourceRow, ["ratePerSqf", "rate"]),
    remark: getStringValue(sourceRow, ["remark"]) || "",
    sqf,
    sqm,
  };
}

function buildSlicingSourceOverviewItems(
  sourceSummary: SlicingSourceSummary,
  sourceRow?: SourceRow,
) {
  const sourceProcess =
    getStringValue(sourceRow, ["issuedFrom", "issuedFor", "process", "warehouseName"]) ||
    "Warehouse B";
  const orderNo = getStringValue(sourceRow, ["orderNo"]);
  const orderItemNo = getStringValue(sourceRow, ["orderItemNo"]);
  const bundleNumber = sourceSummary.bundleNumber;
  const palletNo = sourceSummary.palletNo;
  const originalLeaves =
    getStringValue(sourceRow, [
      "noOfLeaves",
      "issuedLeaves",
      "noOfLeavesSheets",
      "availableUnits",
      "totalUnits",
    ]) || sourceSummary.cmt;

  return [
    { label: "Issued From", value: sourceProcess },
    ...(orderNo ? [{ label: "Order No", value: orderNo }] : []),
    ...(orderItemNo ? [{ label: "Order Item No", value: orderItemNo }] : []),
    { label: "Item Name", value: sourceSummary.itemName },
    { label: "Sub Category", value: sourceSummary.itemSubCategory },
    { label: "Color", value: sourceSummary.color },
    ...(sourceSummary.logNo
      ? [{ label: "Log No.", value: sourceSummary.logNo }]
      : []),
    { label: "Length", value: sourceSummary.length },
    { label: "Width", value: sourceSummary.width },
    { label: "Thickness", value: sourceSummary.height },
    ...(bundleNumber ? [{ label: "Bundle No", value: bundleNumber }] : []),
    ...(palletNo ? [{ label: "Pallet No", value: palletNo }] : []),
    { label: "Original Quantity", value: originalLeaves },
    { label: "SQM", value: sourceSummary.sqm },
    { label: "SQF", value: sourceSummary.sqf },
    { label: "Amount", value: sourceSummary.amount },
    { label: "Remark", value: sourceSummary.remark },
  ];
}

function createDefaultLineItemValues(
  sourceSummary: SlicingSourceSummary,
  sourceRow?: SourceRow,
): SlicingLineItemValues {
  const values: SlicingLineItemValues = {
    itemName: sourceSummary.itemName,
    itemSubCategory: sourceSummary.itemSubCategory,
    logNo:
      sourceSummary.logNo ||
      getStringValue(sourceRow, ["logNo", "logCode"]),
    bundleNumber: sourceSummary.bundleNumber,
    palletNo: sourceSummary.palletNo,
    length: sourceSummary.length,
    width: sourceSummary.width,
    height: sourceSummary.height,
    color: sourceSummary.color,
    grade: getPreferredSourceValue(sourceRow, "grade"),
    noOfLeaves: getPreferredSourceValue(sourceRow, "noOfLeaves"),
    sqm:
      getPreferredSourceValue(sourceRow, "sqm") ||
      getStringValue(sourceRow, ["issuedSqm", "totalSqm", "availableSqm"]) ||
      sourceSummary.sqm,
    sqf: getPreferredSourceValue(sourceRow, "sqf") || sourceSummary.sqf,
    ratePerSqf: sourceSummary.ratePerSqf,
    amount: sourceSummary.amount,
    remark: getPreferredSourceValue(sourceRow, "remark"),
  };

  return applyFactoryItemMasterDefaults(values, values.itemName) as SlicingLineItemValues;
}

function createEmptyLineItemValues(): SlicingLineItemValues {
  return {
    itemName: "",
    itemSubCategory: "",
    logNo: "",
    bundleNumber: "",
    palletNo: "",
    length: "",
    width: "",
    height: "",
    color: "",
    grade: "",
    noOfLeaves: "",
    sqm: "",
    sqf: "",
    ratePerSqf: "",
    amount: "",
    remark: "",
  };
}

function shouldShowLineItemColumn(
  column: LineItemColumn,
  sourceSummary: SlicingSourceSummary,
  draftValues: SlicingLineItemValues,
  editingValues: SlicingLineItemValues,
  lineItems: readonly SlicingLineItem[],
) {
  if (column.key !== "bundleNumber" && column.key !== "palletNo") {
    return true;
  }

  return [
    sourceSummary[column.key],
    draftValues[column.key],
    editingValues[column.key],
    ...lineItems.map((lineItem) => lineItem.values[column.key]),
  ].some((value) => value.trim().length > 0);
}

function updateSlicingLineItemValues(
  current: SlicingLineItemValues,
  key: keyof SlicingLineItemValues,
  value: string,
): SlicingLineItemValues {
  const normalized = normalizeSlicingLineItemInput(key, value);
  return applyFactoryLineItemValueChange(
    current,
    key,
    normalized,
  ) as SlicingLineItemValues;
}

function getPreferredSourceValue(sourceRow: SourceRow | undefined, key: string) {
  const aliases = commonFactoryItemFieldAliases[key] ?? [key];
  return getStringValue(sourceRow, aliases);
}

function allLineItemValuesEmpty(values: SlicingLineItemValues) {
  return Object.values(values).every((value) => value.trim().length === 0);
}

function hasSlicingFormErrors(values: SlicingFormValues) {
  return (Object.keys(slicingFormFieldLabels) as (keyof SlicingFormValues)[]).some(
    (key) => Boolean(getSlicingFormError(key, values)),
  );
}

const slicingFormFieldLabels: Record<keyof SlicingFormValues, string> = {
  noOfTotalHours: "No. of Total Hours",
  noOfWorkers: "No. of Workers",
  noOfWorkingHours: "No. of Working Hours",
  shift: "Shift",
  slicingDate: "Slicing Date",
};

function getSlicingFormError(
  _key: keyof SlicingFormValues,
  _values: SlicingFormValues,
) {
  return "";
}

function getLineItemValidationErrors(values: SlicingLineItemValues) {
  return lineItemColumns.reduce<Record<string, string>>((errors, column) => {
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
  column: LineItemColumn,
  values: SlicingLineItemValues,
) {
  if (
    isLineItemColumnRequired(column) &&
    (values[column.key] ?? "").trim().length === 0
  ) {
    return `${column.label} is required.`;
  }

  return "";
}

function isLineItemColumnRequired(_column: LineItemColumn) {
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
    <Stack component="span" direction="row" spacing={0.25}>
      <span>{label}</span>
    </Stack>
  );
}

function getStringValue(sourceRow: SourceRow | undefined, keys: readonly string[]) {
  if (!sourceRow) {
    return "";
  }

  for (const key of keys) {
    const value = sourceRow[key];

    if (value instanceof Date) {
      return new Intl.DateTimeFormat("en-GB", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      }).format(value);
    }

    if (typeof value === "string" && value.trim().length > 0) {
      return value;
    }

    if (typeof value === "number") {
      return String(value);
    }
  }

  return "";
}

function calculateCmt(length: string, width: string, height: string) {
  const lengthM = resolveSlicingDimensionMetres(length);
  const widthM = resolveSlicingDimensionMetres(width);
  const heightM = resolveSlicingDimensionMetres(height);

  if (!lengthM || !widthM || !heightM) {
    return formatSQM(0);
  }

  // Volume in m³ when L/W/H are metres (display-formatted like SQM).
  return formatSQM(lengthM * widthM * heightM);
}

function getHeaderCellSx(theme: Theme, minWidth: number) {
  return {
    ...transactionTableHeaderCellSx(theme, minWidth),
    borderRight: `1px solid ${theme.customTokens.borders.divider}`,
  } as const;
}

function getBodyCellSx(theme: Theme) {
  return {
    ...transactionTableBodyCellSx(theme),
    borderRight: `1px solid ${theme.customTokens.borders.divider}`,
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
    backgroundColor:
      rowIndex % 2 === 0
        ? theme.customTokens.surfaces.surface
        : theme.customTokens.surfaces.alt,
    boxShadow: `-1px 0 0 ${theme.customTokens.borders.default}`,
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


function renderEditableField({
  column,
  errorText,
  onChange,
  theme,
  value,
}: {
  column: LineItemColumn;
  errorText?: string;
  onChange: (value: string) => void;
  theme: Theme;
  value: string;
}) {
  if (column.readOnly) {
    return renderReadOnlyCell(column.key, value, theme);
  }

  if (column.type === "select") {
    return (
      <ErpSelectField
        helperText={errorText}
        onChange={onChange}
        options={column.options ?? []}
        state={errorText ? "error" : "default"}
        value={value}
      />
    );
  }

  return (
    <TextField
      error={Boolean(errorText)}
      fullWidth
      helperText={errorText}
      placeholder={column.placeholder}
      size="small"
      value={value}
      onChange={(event) => onChange(event.target.value)}
      onWheel={(event) => {
        if (!isWheelAdjustableMeasurementField(column.key)) {
          return;
        }

        event.preventDefault();
        onChange(getNextMeasurementValue(value, event.deltaY));
      }}
      sx={getCompactFieldSx(theme, errorText ? "error" : "default")}
    />
  );
}

function isWheelAdjustableMeasurementField(key: string) {
  return key === "length" || key === "width" || key === "height";
}

function getNextMeasurementValue(value: string, deltaY: number) {
  const numericValue = Number.parseFloat(value);
  const currentValue = Number.isFinite(numericValue) ? numericValue : 0;
  const decimalPlaces = getDecimalPlaces(value);
  const step = decimalPlaces > 0 ? 1 / 10 ** decimalPlaces : 1;
  const nextValue = Math.max(
    0,
    currentValue + (deltaY < 0 ? step : -step),
  );

  if (decimalPlaces > 0) {
    return nextValue.toFixed(decimalPlaces);
  }

  return String(Math.round(nextValue));
}

function getDecimalPlaces(value: string) {
  const decimalPart = value.split(".")[1];
  return decimalPart ? decimalPart.length : 0;
}

function renderReadOnlyCell(
  key: keyof SlicingLineItemValues | string,
  value: string,
  theme: Theme,
) {
  return (
    <Typography
      variant="body2"
      color="text.primary"
      sx={{
        minHeight: theme.spacing(4.5),
        display: "flex",
        alignItems: "center",
      }}
    >
      {formatSlicingLineItemDisplay(key, value)}
    </Typography>
  );
}
