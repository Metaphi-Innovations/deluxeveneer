import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type Dispatch,
  type SetStateAction,
} from "react";
import type { Theme } from "@mui/material/styles";
import {
  Box,
  Button,
  IconButton,
  InputAdornment,
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
import { Eye, Pencil, Plus, Save, Trash2, Upload, X } from "lucide-react";
import { useLocation, useNavigate } from "react-router";

import { getCompactFieldSx } from "../../../pages/ComponentLibrary/sections/inputs/components/inputFieldStyles";
import { ErpSelectField } from "../../../pages/ComponentLibrary/shared/ErpFieldControls";
import {
  MasterFormFields,
  hasRequiredFieldErrors,
  type MasterFieldDefinition,
  type MasterFieldValue,
} from "../../masters/shared";
import { recordFormActionButtonSx } from "../../shared/buttonStyles";
import {
  formInlineActionButtonSx,
  formSectionCardSx,
  FormSectionHeader,
} from "../../shared/formSectionStyles";
import {
  transactionTableBodyCellSx,
  transactionTableHeaderCellSx,
} from "../../shared/listingTableStyles";
import { FactoryPageShell } from "./FactoryPageShell";
import { FactorySourceOverviewPanel } from "./FactorySourceOverviewPanel";
import {
  appendFactoryProcessRun,
  useFactoryProcessRunTotals,
} from "./factoryProcessRunStore";
import { completeFactoryIssuedWork } from "./factoryIssuedWorkStore";
import {
  buildFactorySourceAllocationKey,
  computeProcessEntryBalance,
  getFactoryQuantityAllocationConfig,
  getProcessQuantityOverflowError,
  resolveLineItemProcessedQuantity,
  resolveOriginalQuantity,
  sumProcessedLineItemQuantity,
} from "./factoryQuantityAllocation";
import {
  markSampleProcessDone,
  useSampleSheetRecords,
  type SampleSheetRecord,
} from "./sampleSheetIdentityStore";
import {
  createEmptyRejectAvailableValues,
  getNextRejectAvailableValues,
  getRejectAvailableValidationErrors,
  getVisibleRejectAvailableValidationIssues,
  hasRejectAvailableValidationErrors,
  RejectAvailableDetailsTable,
  resolveRejectAvailableAreaLimits,
} from "./RejectAvailableDetailsTable";
import {
  allocateNextGroupNo,
  getExistingGroupNo,
  peekNextGroupNo,
} from "./groupNoStore";
import { buildFactoryInitialValues, flattenFactorySections, getFactoryPaths } from "./factoryUtils";
import {
  applyFactoryLineItemValueChange,
  buildFactoryItemPrefillValues,
  commonFactoryItemFieldAliases,
  mergeCommonFactoryItemFields,
} from "./factoryCommonItemFields";
import type { FactoryDefinition, FactoryRecord } from "./types";
import {
  getOrderLineItems,
  useOrderRecords,
  type OrderRecord,
} from "../../orders/shared/ordersStore";

type SourceRow = FactoryRecord;

type FactoryCreateLocationState = {
  groupedStockIssueId?: string;
  issueDate?: Date | string | null;
  issueSheets?: number | string;
  sampleNo?: string;
  issuedFromSample?: boolean;
  workItemId?: string;
  sourceRow?: SourceRow;
  sourceRows?: SourceRow[];
};

type SourceColumnDefinition = {
  key: string;
  keys: readonly string[];
  label: string;
  minWidth: number;
};

type LineItemColumnDefinition = {
  key: string;
  label: string;
  minWidth: number;
  options?: readonly string[];
  placeholder: string;
  readOnly?: boolean;
  type: "file" | "text" | "select";
};

type LineItemRecord = {
  id: string;
  values: Record<string, string>;
};

type MarquetryOrderDetailsValue = {
  orderItemNo: string;
  orderNo: string;
  purpose: "" | "Order" | "Sample Sheets";
  sampleNo: string;
};

const groupPhotoPreviewUrls = new Map<string, string>();

function isSupportedGroupPhoto(file: File) {
  const extension = file.name.split(".").pop()?.toLowerCase();
  return (
    ["png", "jpg", "jpeg"].includes(extension ?? "") &&
    ["image/png", "image/jpeg"].includes(file.type)
  );
}

const groupingHiddenSourceKeys = new Set([
  "orderNo",
  "orderItemNo",
  "supplierName",
  "orderDate",
]);

const sourceColumnDefinitions: readonly SourceColumnDefinition[] = [
  { key: "issuedFrom", keys: ["issuedFrom", "issuedFor", "process"], label: "Issued From", minWidth: 180 },
  { key: "orderNo", keys: ["orderNo"], label: "Order No", minWidth: 140 },
  { key: "orderItemNo", keys: ["orderItemNo"], label: "Order Item No", minWidth: 140 },
  { key: "issuedDate", keys: ["issuedDate", "issueDate", "processDate", "sampleDate"], label: "Date", minWidth: 130 },
  { key: "supplierName", keys: ["supplierName", "customerName"], label: "Source Name", minWidth: 180 },
  { key: "itemName", keys: ["itemName", "productName"], label: "Item Name", minWidth: 170 },
  { key: "groupNo", keys: ["groupNo"], label: "Group No.", minWidth: 160 },
  { key: "bundleNumber", keys: ["bundleNumber", "noOfBundle"], label: "Bundle No", minWidth: 140 },
  { key: "palletNo", keys: ["palletNo"], label: "Pallet No", minWidth: 140 },
  { key: "itemSubCategory", keys: ["itemSubCategory", "subCategory"], label: "Item Sub Category", minWidth: 170 },
  { key: "color", keys: ["color", "colour", "processColour"], label: "Color", minWidth: 140 },
  { key: "logNo", keys: ["logNo", "logCode"], label: "Log No.", minWidth: 130 },
  { key: "grade", keys: ["grade"], label: "Grade", minWidth: 110 },
  { key: "length", keys: ["length"], label: "Length", minWidth: 120 },
  { key: "width", keys: ["width"], label: "Width", minWidth: 120 },
  { key: "height", keys: ["height", "thickness", "thickess"], label: "Thickness", minWidth: 120 },
  { key: "noOfSheets", keys: ["noOfSheets", "sampleSheets", "finishedSheets", "issuedLeaves", "noOfLeaves", "noOfLeavesSheets"], label: "Original Quantity", minWidth: 140 },
  { key: "sqm", keys: ["sqm", "totalSqm", "availableSqm", "avSqm", "issuedSqm", "outputSqm", "consumedSqm", "consumeSqm", "finishedSqm"], label: "SQM", minWidth: 120 },
  { key: "sqf", keys: ["sqf", "totalSqf", "availableSqf", "avSqf", "issuedSqf", "outputSqf", "consumedSqf", "consumeSqf", "finishedSqf"], label: "SQF", minWidth: 120 },
  { key: "amount", keys: ["amount"], label: "Amount", minWidth: 130 },
  { key: "remark", keys: ["remark"], label: "Remark", minWidth: 200 },
] as const;

/** Kept out of Process Details line-item entry (including retired header fields). */
const metadataKeys = new Set([
  "issueDate",
  "issuedDate",
  "processDate",
  "sampleDate",
  "slicingDate",
  "dryingDate",
  "groupingDate",
  "splicingDate",
  "pressingDate",
  "cncDate",
  "embossingDate",
  "finishingDate",
  "marquetryDate",
  "sampleSrNo",
  "supplierName",
  "customerName",
  "issuedFor",
  "issuedFrom",
  "process",
  "processColour",
  "shift",
  "workers",
  "noOfWorkers",
  "workingHours",
  "noOfWorkingHours",
  "noOfTotalHours",
  "palletNo",
  "orderNo",
  "orderItemNo",
  "productName",
  "groupNo",
  "purpose",
  "finishType",
  "remark",
  "issueRemark",
]);

type ProcessDateConfig = {
  /** Preferred persistence key (reuse existing field when present). */
  key: string;
  label: string;
  /** Alternate keys already used by definitions / mock data. */
  aliases?: readonly string[];
};

const processDateBySlug: Record<string, ProcessDateConfig> = {
  slicing: { key: "slicingDate", label: "Slicing Date" },
  drying: { key: "dryingDate", label: "Drying Date" },
  grouping: { key: "groupingDate", label: "Grouping Date" },
  "sample-sheets": {
    key: "groupingDate",
    label: "Sample Sheet Date",
    aliases: ["sampleDate"],
  },
  splicing: { key: "splicingDate", label: "Splicing Date" },
  pressing: { key: "pressingDate", label: "Pressing Date" },
  "cnc-fluting": { key: "cncDate", label: "Fluting Date" },
  embossing: {
    key: "cncDate",
    label: "Embossing Date",
    aliases: ["embossingDate"],
  },
  finishing: { key: "finishingDate", label: "Finishing Date" },
  "export-oem": { key: "finishingDate", label: "Process Date" },
  marquetry: {
    key: "groupingDate",
    label: "Marquetry Date",
    aliases: ["marquetryDate"],
  },
};

const fieldValueAliases: Record<string, readonly string[]> = {
  color: ["color", "colour", "processColour"],
  colour: ["colour", "color", "processColour"],
  itemName: ["itemName", "productName"],
  itemSubCategory: ["itemSubCategory", "subCategory"],
  noOfSheets: ["noOfSheets", "sampleSheets", "finishedSheets", "issuedLeaves", "noOfLeaves"],
  thickness: ["thickness", "thickess"],
  cbm: ["cbm", "totalCbm", "volumeCbm"],
  cbf: ["cbf", "totalCbf", "volumeCbf"],
  ...commonFactoryItemFieldAliases,
};

const factoryCreateLineItemPresets: Partial<
  Record<string, readonly MasterFieldDefinition[]>
> = {
  drying: [
    { key: "itemName", label: "Item Name", type: "text" },
    { key: "itemSubCategory", label: "Sub Category", type: "text" },
    { key: "color", label: "Color", type: "text" },
    { key: "logNo", label: "Log No.", type: "text" },
    { key: "palletNo", label: "Pallet No", type: "text" },
    { key: "noOfBundle", label: "No of Bundle", type: "text" },
    { key: "length", label: "Length", type: "text" },
    { key: "width", label: "Width", type: "text" },
    { key: "height", label: "Thickness", type: "text" },
    { key: "remark", label: "Remark", type: "text" },
  ],
};

export function FactoryProcessCreatePage<Row extends FactoryRecord>({
  definition,
}: {
  definition: FactoryDefinition<Row>;
}) {
  const theme = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const paths = getFactoryPaths(definition.slug);
  const nextRowId = useRef(1);
  const locationState = location.state as FactoryCreateLocationState | null;
  const orderRecords = useOrderRecords();
  const sampleSheetRecords = useSampleSheetRecords();
  const sourceRow =
    (locationState?.sourceRow as Row | undefined) ??
    (locationState?.sourceRows?.[0] as Row | undefined) ??
    (definition.rows[0] as Row | undefined);
  const allFields = useMemo(
    () => flattenFactorySections(definition.formSections),
    [definition.formSections],
  );
  const metadataFields = useMemo(
    () => resolveProcessHeaderDateFields(definition.slug, allFields, sourceRow),
    [allFields, definition.slug, sourceRow],
  );
  const resolvedGroupNo = useMemo(() => {
    const existing = getExistingGroupNo(
      sourceRow as Record<string, unknown> | undefined,
    );
    if (existing) {
      return existing;
    }
    // Preview only — actual allocation happens on Grouping save.
    return definition.slug === "grouping" ? peekNextGroupNo() : "";
  }, [definition.slug, sourceRow]);
  const lineItemFields = useMemo(
    () => buildLineItemFields(definition.slug, allFields, sourceRow),
    [allFields, definition.slug, sourceRow],
  );
  const sourceColumns = useMemo(
    () => buildSourceColumns(sourceRow, definition.slug),
    [definition.slug, sourceRow],
  );
  const sourceOverviewItems = useMemo(
    () => buildSourceOverviewItems(sourceRow, sourceColumns),
    [sourceColumns, sourceRow],
  );
  const lineItemColumns = useMemo(
    () => lineItemFields.map((field) => mapFieldToColumn(field)),
    [lineItemFields],
  );
  const lineItemsTableWidth = useMemo(
    () => lineItemColumns.reduce((total, column) => total + column.minWidth, 0),
    [lineItemColumns],
  );
  const [formValues, setFormValues] = useState<Record<string, MasterFieldValue>>(
    () => {
      const initial = withDefaultProcessDates(
        buildFactoryInitialValues(
          [{ title: "Create", fields: metadataFields }],
          sourceRow,
        ),
        metadataFields,
      );

      if (resolvedGroupNo) {
        initial.groupNo = resolvedGroupNo;
      }

      return initial;
    },
  );

  useEffect(() => {
    if (!resolvedGroupNo) {
      return;
    }

    setFormValues((current) => {
      if (current.groupNo === resolvedGroupNo) {
        return current;
      }
      return { ...current, groupNo: resolvedGroupNo };
    });
  }, [resolvedGroupNo]);

  const [draftValues, setDraftValues] = useState<Record<string, string>>(() =>
    buildDefaultLineItemValues(lineItemFields, sourceRow),
  );
  const [lineItems, setLineItems] = useState<LineItemRecord[]>([]);
  const [draftSubmitAttempted, setDraftSubmitAttempted] = useState(false);
  const [editingRowId, setEditingRowId] = useState<string | null>(null);
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [marquetryOrderDetails, setMarquetryOrderDetails] =
    useState<MarquetryOrderDetailsValue>(() => ({
      orderItemNo:
        typeof locationState?.sourceRow?.orderItemNo === "string"
          ? locationState.sourceRow.orderItemNo
          : "",
      orderNo:
        typeof locationState?.sourceRow?.orderNo === "string"
          ? locationState.sourceRow.orderNo
          : "",
      purpose:
        locationState?.sourceRow?.for === "Sample" ||
        typeof locationState?.sourceRow?.sampleNo === "string"
          ? "Sample Sheets"
          : typeof locationState?.sourceRow?.orderNo === "string" &&
              locationState.sourceRow.orderNo
            ? "Order"
            : "",
      sampleNo:
        typeof locationState?.sourceRow?.sampleNo === "string"
          ? locationState.sourceRow.sampleNo
          : "",
    }));
  const [editingValues, setEditingValues] = useState<Record<string, string>>(() =>
    createEmptyLineItemValues(lineItemFields),
  );
  const [editingSubmitAttempted, setEditingSubmitAttempted] = useState(false);
  const [rejectAvailableValues, setRejectAvailableValues] = useState(() =>
    createEmptyRejectAvailableValues(),
  );
  const [rejectAvailableSubmitAttempted, setRejectAvailableSubmitAttempted] =
    useState(false);

  const quantityConfig = useMemo(
    () => getFactoryQuantityAllocationConfig(definition.slug),
    [definition.slug],
  );
  const sourceAllocationKey = useMemo(
    () =>
      buildFactorySourceAllocationKey(
        definition.slug,
        sourceRow as Record<string, unknown> | undefined,
      ),
    [definition.slug, sourceRow],
  );
  const runTotals = useFactoryProcessRunTotals(sourceAllocationKey);
  const originalQuantity = useMemo(() => {
    const issuedSheets = Number(locationState?.issueSheets);
    if (
      definition.slug === "sample-sheets" &&
      Number.isFinite(issuedSheets) &&
      issuedSheets > 0
    ) {
      return issuedSheets;
    }

    return quantityConfig
      ? resolveOriginalQuantity(
          sourceRow as Record<string, unknown> | undefined,
          quantityConfig,
        )
      : 0;
  }, [definition.slug, locationState?.issueSheets, quantityConfig, sourceRow]);
  const currentProcessedQuantity = useMemo(
    () => sumProcessedLineItemQuantity(lineItems, definition.slug),
    [definition.slug, lineItems],
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
      ),
    [sourceRow],
  );
  const rejectAvailableValidationErrors = getRejectAvailableValidationErrors(
    rejectAvailableValues,
    rejectAvailableAreaLimits,
  );
  const draftProjectedOverflow = useMemo(() => {
    if (!quantityConfig || originalQuantity <= 0 || allValuesEmpty(draftValues)) {
      return "";
    }

    return getProcessQuantityOverflowError({
      originalQuantity,
      previouslyProcessed: runTotals.processed,
      currentProcessed:
        currentProcessedQuantity +
        resolveLineItemProcessedQuantity(draftValues, definition.slug),
    });
  }, [
    currentProcessedQuantity,
    definition.slug,
    draftValues,
    originalQuantity,
    quantityConfig,
    runTotals.processed,
  ]);

  const handleAddLineItem = () => {
    if (allValuesEmpty(draftValues)) {
      setDraftSubmitAttempted(true);
      return;
    }

    const validationErrors = getLineItemValidationErrors(
      lineItemColumns,
      draftValues,
    );

    if (hasValidationErrors(validationErrors)) {
      setDraftSubmitAttempted(true);
      return;
    }

    const draftProcessedQty = resolveLineItemProcessedQuantity(
      draftValues,
      definition.slug,
    );
    const projectedProcessed = currentProcessedQuantity + draftProcessedQty;
    const overflow = getProcessQuantityOverflowError({
      originalQuantity,
      previouslyProcessed: runTotals.processed,
      currentProcessed: projectedProcessed,
    });

    if (overflow) {
      setDraftSubmitAttempted(true);
      return;
    }

    const nextId = `${definition.slug}-line-item-${nextRowId.current}`;
    nextRowId.current += 1;

    setLineItems((current) => [
      ...current,
      {
        id: nextId,
        values: { ...draftValues },
      },
    ]);
    setDraftValues(buildDefaultLineItemValues(lineItemFields, sourceRow));
    setDraftSubmitAttempted(false);
  };

  const handleDeleteLineItem = (rowId: string) => {
    setLineItems((current) => current.filter((row) => row.id !== rowId));

    if (editingRowId === rowId) {
      setEditingRowId(null);
      setEditingValues(createEmptyLineItemValues(lineItemFields));
      setEditingSubmitAttempted(false);
    }
  };

  const handleStartEdit = (row: LineItemRecord) => {
    setEditingRowId(row.id);
    setEditingValues({ ...row.values });
    setEditingSubmitAttempted(false);
  };

  const handleSaveEdit = (rowId: string) => {
    const validationErrors = getLineItemValidationErrors(
      lineItemColumns,
      editingValues,
    );

    if (hasValidationErrors(validationErrors)) {
      setEditingSubmitAttempted(true);
      return;
    }

    const otherItemsProcessed = sumProcessedLineItemQuantity(
      lineItems.filter((row) => row.id !== rowId),
      definition.slug,
    );
    const editedQty = resolveLineItemProcessedQuantity(
      editingValues,
      definition.slug,
    );
    const overflow = getProcessQuantityOverflowError({
      originalQuantity,
      previouslyProcessed: runTotals.processed,
      currentProcessed: otherItemsProcessed + editedQty,
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
    setEditingValues(createEmptyLineItemValues(lineItemFields));
    setEditingSubmitAttempted(false);
  };

  return (
    <FactoryPageShell
      breadcrumbs={[
        { label: "Factory", to: "/factory" },
        { label: definition.title, to: paths.list },
        { label: `Create ${definition.title}` },
      ]}
      title={`Create ${definition.title}`}
    >
      <Stack
        sx={(currentTheme) => ({
          gap: currentTheme.spacing(2),
        })}
      >
        <FactorySourceOverviewPanel items={sourceOverviewItems} />

        {definition.slug === "marquetry" ? (
          <MarquetryOrderDetails
            hasSubmitted={hasSubmitted}
            onChange={setMarquetryOrderDetails}
            orderRecords={orderRecords}
            sampleSheetRecords={sampleSheetRecords}
            value={marquetryOrderDetails}
          />
        ) : null}

        <Box
          sx={(currentTheme) => ({
            width: {
              xs: "100%",
              sm: currentTheme.spacing(28),
            },
            maxWidth: "100%",
          })}
        >
          <MasterFormFields
            compact
            definition={{
              fields: metadataFields,
              gridColumns: 3,
            }}
            onChange={(key, value) =>
              setFormValues((current) => ({
                ...current,
                [key]: value,
              }))
            }
            showRequiredErrors={hasSubmitted}
            values={formValues}
          />
        </Box>

        <Stack
          sx={(currentTheme) => ({
            ...formSectionCardSx(currentTheme),
            gap: currentTheme.spacing(1.5),
          })}
        >
          <FactoryCreateSectionTitle title="Process Details" />
          <Box
            sx={{
              border: `1px solid ${theme.customTokens.borders.default}`,
              borderRadius: "8px",
              backgroundColor: theme.customTokens.surfaces.surface,
              overflow: "hidden",
            }}
          >
            <Box sx={getScrollableTableSx(theme)}>
              <Table
                size="medium"
                sx={{ minWidth: Math.max(lineItemsTableWidth, 720), tableLayout: "auto" }}
              >
                <TableHead>
                  <TableRow>
                    {lineItemColumns.map((column) => (
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
                    {lineItemColumns.map((column) => (
                      <TableCell key={column.key} sx={getBodyCellSx(theme)}>
                        {renderEditableField({
                          column,
                          onChange: (value) =>
                            setDraftValues((current) =>
                              applySawingVolumeCalculation(
                                definition.slug,
                                applyFactoryLineItemValueChange(
                                  current,
                                  column.key,
                                  value,
                                ),
                              ),
                            ),
                          theme,
                          value: draftValues[column.key] ?? "",
                          errorText: draftSubmitAttempted
                            ? getFieldValidationError(column, draftValues)
                            : "",
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
                  fontSize: "0.8125rem",
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
              startIcon={<Plus size={15} strokeWidth={2} />}
              sx={(currentTheme) => formInlineActionButtonSx(currentTheme)}
              variant="contained"
            >
              Add Item
            </Button>
          </Box>
        </Stack>

          {lineItems.length > 0 ? (
            <Stack
              sx={(currentTheme) => ({
                ...formSectionCardSx(currentTheme),
                gap: currentTheme.spacing(1.5),
              })}
            >
              <FactoryCreateSectionTitle title="Processed Items" />
            <Box
              sx={{
                border: `1px solid ${theme.customTokens.borders.default}`,
                borderRadius: "8px",
                backgroundColor: theme.customTokens.surfaces.surface,
                overflow: "hidden",
              }}
            >
              <Box sx={getScrollableTableSx(theme)}>
                <Table
                  size="small"
                  sx={{ minWidth: Math.max(lineItemsTableWidth + 120, 760), tableLayout: "auto" }}
                >
                  <TableHead>
                    <TableRow>
                      {lineItemColumns.map((column) => (
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
                          {lineItemColumns.map((column) => (
                            <TableCell key={column.key} sx={getBodyCellSx(theme)}>
                              {isEditing
                                ? renderEditableField({
                                    column,
                                    onChange: (value) =>
                                        setEditingValues((current) =>
                                        applySawingVolumeCalculation(
                                          definition.slug,
                                          applyFactoryLineItemValueChange(
                                            current,
                                            column.key,
                                            value,
                                          ),
                                        ),
                                      ),
                                    theme,
                                    value: editingValues[column.key] ?? "",
                                    errorText: editingSubmitAttempted
                                      ? getFieldValidationError(
                                          column,
                                          editingValues,
                                        )
                                      : "",
                                  })
                                : renderReadOnlyCell(row.values[column.key] ?? "", theme)}
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

        {definition.slug !== "cnc-fluting" && definition.slug !== "embossing" ? (
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
        ) : null}

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
              const draftHasValues = !allValuesEmpty(draftValues);
              const draftErrors = getLineItemValidationErrors(
                lineItemColumns,
                draftValues,
              );
              const editingErrors = getLineItemValidationErrors(
                lineItemColumns,
                editingValues,
              );
              const lineItemsInvalid =
                lineItems.length === 0 ||
                (draftHasValues && hasValidationErrors(draftErrors)) ||
                Boolean(editingRowId && hasValidationErrors(editingErrors));
              const quantityInvalid = Boolean(quantityOverflowError);
              const rejectAvailableInvalid = hasRejectAvailableValidationErrors(
                rejectAvailableValidationErrors,
              );
              const marquetryOrderDetailsInvalid =
                definition.slug === "marquetry" &&
                (marquetryOrderDetails.purpose === "" ||
                  (marquetryOrderDetails.purpose === "Order" &&
                    (!marquetryOrderDetails.orderNo ||
                      !marquetryOrderDetails.orderItemNo)) ||
                  (marquetryOrderDetails.purpose === "Sample Sheets" &&
                    !marquetryOrderDetails.sampleNo));

              if (lineItemsInvalid) {
                setDraftSubmitAttempted(lineItems.length === 0 || draftHasValues);
                setEditingSubmitAttempted(Boolean(editingRowId));
              }

              if (rejectAvailableInvalid) {
                setRejectAvailableSubmitAttempted(true);
              }

              if (
                hasRequiredFieldErrors(metadataFields, formValues) ||
                lineItemsInvalid ||
                quantityInvalid ||
                rejectAvailableInvalid ||
                marquetryOrderDetailsInvalid
              ) {
                return;
              }

              if (quantityConfig && originalQuantity > 0) {
                appendFactoryProcessRun({
                  stageSlug: definition.slug,
                  sourceKey: sourceAllocationKey,
                  processedNow: currentProcessedQuantity,
                  wastageNow: 0,
                  pendingBalance: Math.max(0, balanceSummary.balanceQuantity),
                  remark: "",
                });
              }

              const workItemId =
                locationState?.workItemId ||
                (typeof sourceRow?.workItemId === "string"
                  ? sourceRow.workItemId
                  : undefined);

              if (workItemId) {
                const primaryLineItem = lineItems[0];
                const resultSnapshot: Record<string, unknown> = {
                  ...(sourceRow ?? {}),
                  ...formValues,
                  ...(definition.slug === "marquetry"
                    ? marquetryOrderDetails
                    : {}),
                  ...(primaryLineItem
                    ? Object.fromEntries(
                        Object.entries(primaryLineItem).filter(
                          ([key]) => key !== "id",
                        ),
                      )
                    : {}),
                };

                if (definition.slug === "grouping") {
                  resultSnapshot.groupNo =
                    getExistingGroupNo(
                      sourceRow as Record<string, unknown> | undefined,
                    ) || allocateNextGroupNo();
                  // Grouping is stock/process — do not carry order/customer onto the batch.
                  delete resultSnapshot.orderNo;
                  delete resultSnapshot.orderDate;
                  delete resultSnapshot.orderItemNo;
                  delete resultSnapshot.customerName;
                  delete resultSnapshot.productName;
                } else {
                  const carriedGroupNo = getExistingGroupNo(
                    sourceRow as Record<string, unknown> | undefined,
                  );
                  if (carriedGroupNo) {
                    resultSnapshot.groupNo = carriedGroupNo;
                  }
                }

                completeFactoryIssuedWork(workItemId, resultSnapshot);
              }

              const sampleNo =
                locationState?.sampleNo ||
                (typeof sourceRow?.sampleNo === "string"
                  ? sourceRow.sampleNo
                  : undefined);

              if (sampleNo) {
                markSampleProcessDone(sampleNo, definition.slug);
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

function withDefaultProcessDates(
  values: Record<string, MasterFieldValue>,
  fields: readonly MasterFieldDefinition[],
) {
  const nextValues = { ...values };
  const today = new Date();

  // Create flow always starts on today; operator may change the date.
  fields.forEach((field) => {
    if (field.type === "date") {
      nextValues[field.key] = today;
    }
  });

  return nextValues;
}

function resolveProcessHeaderDateFields(
  slug: string,
  fields: readonly MasterFieldDefinition[],
  sourceRow?: SourceRow,
): MasterFieldDefinition[] {
  const config =
    processDateBySlug[slug] ?? {
      key: "processDate",
      label: "Process Date",
    };
  const candidateKeys = [config.key, ...(config.aliases ?? [])];
  const existing = fields.find((field) => candidateKeys.includes(field.key));

  const headerFields: MasterFieldDefinition[] = [
    {
      key: existing?.key ?? config.key,
      label: config.label,
      type: "date",
    },
  ];

  // Group No. is assigned only in Grouping; later processes show it read-only when present.
  if (slug === "grouping") {
    headerFields.unshift({
      key: "groupNo",
      label: "Group No.",
      type: "text",
      readOnly: true,
    });
  } else if (
    slug !== "marquetry" &&
    getExistingGroupNo(sourceRow as Record<string, unknown> | undefined)
  ) {
    headerFields.unshift({
      key: "groupNo",
      label: "Group No.",
      type: "text",
      readOnly: true,
    });
  }

  return headerFields;
}

function buildSourceColumns(sourceRow?: SourceRow, slug?: string) {
  const visibleColumns = sourceColumnDefinitions.filter((column) => {
    if (slug === "drying" && column.key === "remark") {
      return false;
    }

    if (slug === "grouping" && groupingHiddenSourceKeys.has(column.key)) {
      return false;
    }

    if (slug === "marquetry" && column.key === "groupNo") {
      return false;
    }

    const value = getSourceValue(sourceRow, column.keys);
    return value !== null && typeof value !== "undefined" && String(value).trim().length > 0;
  });

  return visibleColumns.length > 0
    ? visibleColumns
    : sourceColumnDefinitions.slice(0, 6);
}

const sourceOverviewLabelOverrides: Partial<Record<string, string>> = {
  supplierName: "Source / Customer",
  itemName: "Item Name",
  itemSubCategory: "Sub Category",
  issuedFrom: "Issued From",
  bundleNumber: "Bundle No",
  groupNo: "Group No.",
  palletNo: "Pallet No",
  noOfSheets: "Original Quantity",
};

function FactoryCreateSectionTitle({ title }: { title: string }) {
  return <FormSectionHeader title={title} />;
}

function buildSourceOverviewItems(
  sourceRow: SourceRow | undefined,
  columns: readonly SourceColumnDefinition[],
) {
  const items: Array<{ label: string; value: string }> = [];

  columns.forEach((column) => {
    const value = formatSourceValue(getSourceValue(sourceRow, column.keys));
    if (!value) {
      return;
    }

    items.push({
      label: sourceOverviewLabelOverrides[column.key] ?? column.label,
      value,
    });
  });

  return items;
}

function MarquetryOrderDetails({
  hasSubmitted,
  onChange,
  orderRecords,
  sampleSheetRecords,
  value,
}: {
  hasSubmitted: boolean;
  onChange: Dispatch<SetStateAction<MarquetryOrderDetailsValue>>;
  orderRecords: readonly OrderRecord[];
  sampleSheetRecords: readonly SampleSheetRecord[];
  value: MarquetryOrderDetailsValue;
}) {
  const selectedOrder = orderRecords.find((order) => order.orderNo === value.orderNo);
  const orderItemOptions = selectedOrder
    ? getOrderLineItems(selectedOrder.id).map((_, index) => String(index + 1))
    : [];
  const purposeError = hasSubmitted && !value.purpose;
  const orderNoError =
    hasSubmitted && value.purpose === "Order" && !value.orderNo;
  const orderItemError =
    hasSubmitted && value.purpose === "Order" && !value.orderItemNo;
  const sampleNoError =
    hasSubmitted && value.purpose === "Sample Sheets" && !value.sampleNo;

  const update = (key: keyof MarquetryOrderDetailsValue, nextValue: string) => {
    onChange((current) => ({
      ...current,
      [key]: nextValue,
      ...(key === "purpose"
        ? {
            orderNo: nextValue === "Order" ? current.orderNo : "",
            orderItemNo: nextValue === "Order" ? current.orderItemNo : "",
            sampleNo: nextValue === "Sample Sheets" ? current.sampleNo : "",
          }
        : {}),
      ...(key === "orderNo" ? { orderItemNo: "" } : {}),
    }));
  };

  return (
    <Stack
      sx={(theme) => ({
        ...formSectionCardSx(theme),
        gap: theme.spacing(1.5),
      })}
    >
      <FormSectionHeader title="Order Details" />
      <Box
        sx={(theme) => ({
          display: "grid",
          gap: theme.spacing(1.5),
          gridTemplateColumns: {
            xs: "1fr",
            sm: "repeat(2, minmax(0, 1fr))",
            lg: "repeat(3, minmax(0, 1fr))",
          },
        })}
      >
        <MarquetrySelectField
          error={purposeError}
          label="For"
          onChange={(nextValue) => update("purpose", nextValue)}
          options={["Order", "Sample Sheets"]}
          value={value.purpose}
        />

        {value.purpose === "Order" ? (
          <>
            <MarquetrySelectField
              error={orderNoError}
              label="Order No"
              onChange={(nextValue) => update("orderNo", nextValue)}
              options={orderRecords.map((order) => order.orderNo)}
              value={value.orderNo}
            />
            <MarquetrySelectField
              error={orderItemError}
              label="Order Item No"
              onChange={(nextValue) => update("orderItemNo", nextValue)}
              options={orderItemOptions}
              value={value.orderItemNo}
            />
          </>
        ) : null}

        {value.purpose === "Sample Sheets" ? (
          <MarquetrySelectField
            error={sampleNoError}
            label="Sample Sheet No"
            onChange={(nextValue) => update("sampleNo", nextValue)}
            options={sampleSheetRecords.map((sample) => sample.sampleNo)}
            value={value.sampleNo}
          />
        ) : null}
      </Box>
    </Stack>
  );
}

function MarquetrySelectField({
  error,
  label,
  onChange,
  options,
  value,
}: {
  error: boolean;
  label: string;
  onChange: (value: string) => void;
  options: readonly string[];
  value: string;
}) {
  return (
    <Stack spacing={0.5}>
      <Typography
        component="label"
        sx={(theme) => ({
          color: theme.customTokens.text.primary,
          fontSize: theme.typography.caption.fontSize,
          fontWeight: 700,
        })}
      >
        {label} *
      </Typography>
      <ErpSelectField
        helperText={error ? `${label} is required.` : " "}
        onChange={onChange}
        options={options}
        searchable={options.length > 6}
        size="regular"
        state={error ? "error" : "default"}
        value={value}
      />
    </Stack>
  );
}

function buildLineItemFields(
  slug: string,
  fields: readonly MasterFieldDefinition[],
  sourceRow?: SourceRow,
) {
  if (slug === "sawing") {
    return dedupeFields(fields.filter((field) => !metadataKeys.has(field.key)));
  }

  const presetFields = factoryCreateLineItemPresets[slug];

  if (presetFields) {
    return mergeCommonFactoryItemFields(
      appendPresentOptionalLineItemFields(presetFields, sourceRow),
    );
  }

  const relevantFields = appendPresentOptionalLineItemFields(
    dedupeFields(
      fields.filter((field) => {
        if (field.key === "remark") {
          return true;
        }

        return !metadataKeys.has(field.key);
      }),
    ).map((field) =>
      field.type === "textarea"
        ? {
            ...field,
            type: "text" as const,
          }
        : field,
    ),
    sourceRow,
  );

  if (relevantFields.length > 0) {
    return orderProcessSpecificFields(
      slug,
      mergeCommonFactoryItemFields(relevantFields),
    );
  }

  const fallbackFields: MasterFieldDefinition[] = [
    { key: "itemName", label: "Item Name", type: "text" },
    { key: "itemSubCategory", label: "Sub Category", type: "text" },
    { key: "color", label: "Color", type: "text" },
    { key: "logNo", label: "Log No.", type: "text" },
    { key: "length", label: "Length", type: "text" },
    { key: "width", label: "Width", type: "text" },
    { key: "height", label: "Thickness", type: "text" },
    { key: "remark", label: "Remark", type: "text" },
  ];

  const withSourceFallback = fallbackFields.filter((field) => {
    const value = getPreferredFieldValue(sourceRow, field.key);
    return typeof value === "string" && value.trim().length > 0;
  });

  return orderProcessSpecificFields(
    slug,
    mergeCommonFactoryItemFields(
      appendPresentOptionalLineItemFields(
        withSourceFallback.length > 0 ? withSourceFallback : fallbackFields,
        sourceRow,
      ),
    ),
  );
}

function orderProcessSpecificFields(
  slug: string,
  fields: readonly MasterFieldDefinition[],
) {
  const specialFieldKey =
    slug === "cnc-fluting"
      ? "fluteCode"
      : slug === "embossing"
        ? "structureCode"
        : slug === "grouping"
          ? "groupPhoto"
        : "";

  if (!specialFieldKey) {
    return [...fields];
  }

  const specialField = fields.find((field) => field.key === specialFieldKey);
  if (!specialField) {
    return [...fields];
  }

  const withoutSpecialField = fields.filter(
    (field) => field.key !== specialFieldKey,
  );
  const insertionIndex =
    specialFieldKey === "groupPhoto"
      ? withoutSpecialField.findIndex((field) => field.key === "remark")
      : withoutSpecialField.findIndex(
          (field) => field.key === "itemSubCategory",
        ) + 1;

  withoutSpecialField.splice(
    insertionIndex >= 0 ? insertionIndex : withoutSpecialField.length,
    0,
    specialField,
  );

  return withoutSpecialField;
}

function appendPresentOptionalLineItemFields(
  fields: readonly MasterFieldDefinition[],
  sourceRow?: SourceRow,
) {
  const nextFields = [...fields];
  const hasField = (keys: readonly string[]) =>
    nextFields.some((field) => keys.includes(field.key));

  if (
    !hasField(["bundleNumber", "noOfBundle"]) &&
    getPreferredFieldValue(sourceRow, "bundleNumber")
  ) {
    nextFields.push({ key: "bundleNumber", label: "Bundle No", type: "text" });
  }

  if (
    !hasField(["palletNo", "palletNumber"]) &&
    getPreferredFieldValue(sourceRow, "palletNo")
  ) {
    nextFields.push({ key: "palletNo", label: "Pallet No", type: "text" });
  }

  return nextFields;
}

function dedupeFields(fields: readonly MasterFieldDefinition[]) {
  const seen = new Set<string>();
  return fields.filter((field) => {
    if (seen.has(field.key)) {
      return false;
    }

    seen.add(field.key);
    return true;
  });
}

function buildDefaultLineItemValues(
  fields: readonly MasterFieldDefinition[],
  sourceRow?: SourceRow,
) {
  return calculateSawingVolumeValues(
    buildFactoryItemPrefillValues(fields, sourceRow, (key) => {
      const value = getPreferredFieldValue(sourceRow, key);
      return typeof value === "string" ? value : "";
    }),
  );
}

function applySawingVolumeCalculation(
  slug: string,
  values: Record<string, string>,
) {
  return slug === "sawing" ? calculateSawingVolumeValues(values) : values;
}

function calculateSawingVolumeValues(values: Record<string, string>) {
  if (!("cbm" in values) || !("cbf" in values)) {
    return values;
  }

  const length = Number.parseFloat(values.length ?? "");
  const width = Number.parseFloat(values.width ?? "");
  const thickness = Number.parseFloat(values.thickness ?? values.height ?? "");

  if (![length, width, thickness].every(Number.isFinite)) {
    return { ...values, cbm: "", cbf: "" };
  }

  const cbm = length * width * thickness;
  return {
    ...values,
    cbm: cbm.toFixed(3),
    cbf: (cbm * 35.315).toFixed(3),
  };
}

function createEmptyLineItemValues(fields: readonly MasterFieldDefinition[]) {
  return fields.reduce<Record<string, string>>((accumulator, field) => {
    accumulator[field.key] = "";
    return accumulator;
  }, {});
}

function allValuesEmpty(values: Record<string, string>) {
  return Object.values(values).every((value) => value.trim().length === 0);
}

function getLineItemValidationErrors(
  columns: readonly LineItemColumnDefinition[],
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
  column: LineItemColumnDefinition,
  values: Record<string, string>,
) {
  if (
    isLineItemColumnRequired(column) &&
    (values[column.key] ?? "").trim().length === 0
  ) {
    return `${column.label} is required.`;
  }

  return "";
}

function isLineItemColumnRequired(_column: LineItemColumnDefinition) {
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

function getPreferredFieldValue(sourceRow: SourceRow | undefined, key: string) {
  const candidateKeys = fieldValueAliases[key] ?? [key];

  for (const candidateKey of candidateKeys) {
    const value = sourceRow?.[candidateKey];

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

    if (typeof value === "number" && Number.isFinite(value)) {
      return String(value);
    }
  }

  return "";
}

function getSourceValue(sourceRow: SourceRow | undefined, keys: readonly string[]) {
  for (const key of keys) {
    const value = sourceRow?.[key];

    if (value instanceof Date) {
      return value;
    }

    if (typeof value === "string" && value.trim().length > 0) {
      return value;
    }
  }

  return "";
}

function formatSourceValue(value: unknown) {
  if (value instanceof Date) {
    return new Intl.DateTimeFormat("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }).format(value);
  }

  return typeof value === "string" ? value : "";
}

function mapFieldToColumn(field: MasterFieldDefinition): LineItemColumnDefinition {
  return {
    key: field.key,
    label: field.label,
    minWidth:
      field.key === "groupPhoto"
        ? 260
        : Math.max(120, Math.min(220, field.label.length * 10 + 48)),
    placeholder: field.placeholder ?? getDefaultPlaceholder(field),
    type:
      field.type === "select"
        ? "select"
        : field.type === "file"
          ? "file"
          : "text",
    readOnly: Boolean(field.readOnly),
    ...(field.options ? { options: field.options } : {}),
  };
}

function getDefaultPlaceholder(field: MasterFieldDefinition) {
  return field.type === "select" ? `Select ${field.label}` : `Enter ${field.label}`;
}

function renderEditableField({
  column,
  errorText,
  onChange,
  theme,
  value,
}: {
  column: LineItemColumnDefinition;
  errorText?: string;
  onChange: (value: string) => void;
  theme: Theme;
  value: string;
}) {
  if (column.readOnly) {
    return renderReadOnlyCell(value, theme);
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

  if (column.type === "file") {
    return (
      <TextField
        error={Boolean(errorText)}
        fullWidth
        helperText={errorText}
        placeholder={column.placeholder}
        slotProps={{
          input: {
            readOnly: true,
            endAdornment: (
              <InputAdornment position="end">
                <IconButton
                  aria-label={`Upload ${column.label.toLowerCase()}`}
                  component="label"
                  size="small"
                >
                  <Upload size={14} />
                  <input
                    accept=".png,.jpg,.jpeg,image/png,image/jpeg"
                    hidden
                    type="file"
                    onChange={(event) => {
                      const file = event.target.files?.[0];
                      if (file && isSupportedGroupPhoto(file)) {
                        const previousPreviewUrl = groupPhotoPreviewUrls.get(
                          file.name,
                        );
                        if (previousPreviewUrl) {
                          URL.revokeObjectURL(previousPreviewUrl);
                        }
                        groupPhotoPreviewUrls.set(
                          file.name,
                          URL.createObjectURL(file),
                        );
                        onChange(file.name);
                      }
                      event.currentTarget.value = "";
                    }}
                  />
                </IconButton>
                <IconButton
                  aria-label={`Preview ${column.label.toLowerCase()}`}
                  disabled={!groupPhotoPreviewUrls.has(value)}
                  onClick={() => {
                    const previewUrl = groupPhotoPreviewUrls.get(value);
                    if (previewUrl) {
                      window.open(previewUrl, "_blank", "noopener,noreferrer");
                    }
                  }}
                  size="small"
                >
                  <Eye size={14} />
                </IconButton>
                {value ? (
                  <IconButton
                    aria-label={`Remove ${column.label.toLowerCase()}`}
                    onClick={() => {
                      const previewUrl = groupPhotoPreviewUrls.get(value);
                      if (previewUrl) {
                        URL.revokeObjectURL(previewUrl);
                        groupPhotoPreviewUrls.delete(value);
                      }
                      onChange("");
                    }}
                    size="small"
                  >
                    <X size={14} />
                  </IconButton>
                ) : null}
              </InputAdornment>
            ),
          },
        }}
        value={value}
        sx={getCompactFieldSx(theme, errorText ? "error" : "default")}
      />
    );
  }

  return (
    <TextField
      error={Boolean(errorText)}
      fullWidth
      helperText={errorText}
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
  return (
    key === "length" ||
    key === "width" ||
    key === "height" ||
    key === "thickness"
  );
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

function renderReadOnlyCell(value: string, theme: Theme) {
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
      {value || "-"}
    </Typography>
  );
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
