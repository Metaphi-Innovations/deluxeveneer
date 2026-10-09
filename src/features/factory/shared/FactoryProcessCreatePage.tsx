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
import {
  highlightedRecordFormPrimaryButtonSx,
  recordFormActionButtonSx,
} from "../../shared/buttonStyles";
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
import { addSawingDoneItems, getSawingAvailableCbm, updateSawingIssuedAvailability } from "../sawing/sawingFrontendStore";
import { addSlicingDoneItems, updateSlicingIssuedAvailability } from "../slicing/slicingFrontendStore";
import {
  calculateSlicingRemainder,
  formatSlicingDecimal,
  measureSlicingSlice,
  slicingStockCbm,
} from "./slicingAreaCalculation";
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
  type RejectAvailableValues,
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
  { key: "storageSrNo", keys: ["storageSrNo", "storageSerialNumber"], label: "Storage Sr No.", minWidth: 160 },
  { key: "issuedDate", keys: ["issuedDate", "issueDate", "processDate", "date", "sampleDate"], label: "Date", minWidth: 130 },
  { key: "itemName", keys: ["itemName", "productName"], label: "Item Name", minWidth: 170 },
  { key: "itemSubCategory", keys: ["itemSubCategory", "subCategory", "itemSubCategoryName"], label: "Sub Category", minWidth: 170 },
  { key: "batchNo", keys: ["batchNo", "logNo", "logCode"], label: "Batch No", minWidth: 140 },
  { key: "length", keys: ["length"], label: "Length", minWidth: 120 },
  { key: "width", keys: ["width"], label: "Width", minWidth: 120 },
  { key: "height", keys: ["height", "thickness", "thickess"], label: "Height", minWidth: 120 },
  { key: "cbm", keys: ["cbm", "totalCbm", "volumeCbm"], label: "CBM", minWidth: 120 },
  { key: "receivedCbm", keys: ["receivedCbm", "cbm", "sourceCbm"], label: "Received CBM", minWidth: 130 },
  { key: "availableCbm", keys: ["availableCbm", "cbm"], label: "Available CBM", minWidth: 130 },
  { key: "cbf", keys: ["cbf", "totalCbf", "volumeCbf"], label: "CBF", minWidth: 120 },
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
  sawing: { key: "processDate", label: "Sawing Date", aliases: ["issueDate", "issuedDate"] },
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
  const [rejectAvailableValues, setRejectAvailableValues] = useState(() => {
    const initial = createEmptyRejectAvailableValues();
    if (definition.slug === "sawing" || definition.slug === "slicing") {
      initial.type = "Available";
    }
    return initial;
  });
  const [rejectAvailableSubmitAttempted, setRejectAvailableSubmitAttempted] =
    useState(false);

  useEffect(() => {
    if (definition.slug !== "sawing" && definition.slug !== "slicing") return;
    const source = sourceRow as Record<string, unknown> | undefined;
    setRejectAvailableValues((current) => ({
      ...(definition.slug === "slicing"
        ? buildSlicingAvailableValues(source, lineItems)
        : buildSawingAvailableValues(source, lineItems)),
      remark: current.remark,
    }));
  }, [definition.slug, lineItems, sourceRow]);

  useEffect(() => {
    if (definition.slug !== "sawing") return;
    setDraftValues((current) => {
      const next = calculateSawingVolumeValues(current);
      if (next.cbm === current.cbm && next.cbf === current.cbf) return current;
      return next;
    });
    setEditingValues((current) => {
      const next = calculateSawingVolumeValues(current);
      if (next.cbm === current.cbm && next.cbf === current.cbf) return current;
      return next;
    });
  }, [definition.slug, draftValues, editingValues]);

  useEffect(() => {
    if (definition.slug !== "sawing") return;
    setLineItems((current) => {
      let changed = false;
      const next = current.map((item) => {
        const values = calculateSawingVolumeValues(item.values);
        if (values.cbm === item.values.cbm && values.cbf === item.values.cbf) {
          return item;
        }
        changed = true;
        return { ...item, values };
      });
      return changed ? next : current;
    });
  }, [definition.slug, lineItems]);

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

    if (definition.slug === "slicing" && !slicingSliceFitsStock(draftValues, sourceRow, lineItems)) {
      setDraftSubmitAttempted(true);
      return;
    }

    if (definition.slug === "sawing") {
      const draftCbm = Number.parseFloat(draftValues.cbm || "0") || 0;
      const initialRecCbm = Number.parseFloat(draftValues.receivedCbm || String(sourceRow?.cbm || 0)) || 0;
      const currentlyUsedCbm = lineItems.reduce((acc, it) => acc + (Number.parseFloat(it.values.cbm || "0") || 0), 0);
      const remainingCbm = Math.max(0, initialRecCbm - currentlyUsedCbm);

      if (initialRecCbm > 0 && draftCbm > remainingCbm + 0.00001) {
        alert(`Process CBM (${draftCbm.toFixed(4)}) cannot exceed available received CBM (${remainingCbm.toFixed(4)} CBM).`);
        setDraftSubmitAttempted(true);
        return;
      }
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

    const nextLineItems = [
      ...lineItems,
      {
        id: nextId,
        values: { ...draftValues },
      },
    ];
    setLineItems(nextLineItems);

    if (definition.slug === "sawing") {
      const initialRecCbm = Number.parseFloat(draftValues.receivedCbm || String(sourceRow?.cbm || 0)) || 0;
      const newTotalUsedCbm = nextLineItems.reduce((acc, it) => acc + (Number.parseFloat(it.values.cbm || "0") || 0), 0);
      const newRemainingCbm = Math.max(0, initialRecCbm - newTotalUsedCbm);

      const clearedValues = createEmptyLineItemValues(lineItemFields);
      clearedValues.logNo = draftValues.logNo || "";
      clearedValues.receivedCbm = initialRecCbm ? initialRecCbm.toFixed(4).replace(/\.?0+$/u, "") : "";
      clearedValues.availableCbm = newRemainingCbm.toFixed(4).replace(/\.?0+$/u, "");
      setDraftValues(clearedValues);
    } else {
      setDraftValues(buildDefaultLineItemValues(lineItemFields, sourceRow));
    }
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

    if (
      definition.slug === "slicing" &&
      !slicingSliceFitsStock(
        editingValues,
        sourceRow,
        lineItems.filter((row) => row.id !== rowId),
      )
    ) {
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
                                  definition.slug,
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
                                          definition.slug,
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
            disabledType={definition.slug === "sawing" || definition.slug === "slicing"}
            title={
              definition.slug === "sawing" || definition.slug === "slicing"
                ? "Available Details"
                : undefined
            }
            volumeMode={definition.slug === "sawing" || definition.slug === "slicing"}
            useHeight={definition.slug === "sawing"}
            editableDerived={definition.slug === "sawing"}
            hideAmount={definition.slug === "sawing" || definition.slug === "slicing"}
            fieldIssues={getVisibleRejectAvailableValidationIssues(
              rejectAvailableValidationErrors,
              rejectAvailableSubmitAttempted,
            )}
            onChange={(key, value) =>
              setRejectAvailableValues((current) =>
                getNextRejectAvailableValues(
                  current,
                  key,
                  value,
                  definition.slug === "sawing" || definition.slug === "slicing",
                  definition.slug === "sawing",
                ),
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
            sx={{
              ...highlightedRecordFormPrimaryButtonSx,
              backgroundColor: (t) => t.palette.primary.main,
              color: "#FFFFFF",
              fontWeight: 700,
              px: 2.5,
              "&:hover": {
                backgroundColor: (t) => t.customTokens.brand.primaryScale[800],
              },
            }}
            onClick={async () => {
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

              if (definition.slug !== "sawing" && definition.slug !== "slicing") {
                completeFactoryIssuedWork(workItemId, resultSnapshot);
              }
              }

              const sampleNo =
                locationState?.sampleNo ||
                (typeof sourceRow?.sampleNo === "string"
                  ? sourceRow.sampleNo
                  : undefined);

              if (sampleNo) {
                markSampleProcessDone(sampleNo, definition.slug);
              }

              if (definition.slug === "sawing") {
                const sawingSource = sourceRow as Record<string, any> | undefined;
                const locState = locationState as Record<string, any> | null;
                const issueItemId = locState?.issueItemId || sawingSource?.id;
                const issueId = locState?.issueId || sawingSource?.issueId;
                const storageWarehouseId = locState?.storageWarehouseId || sawingSource?.storageWarehouseId;

                const processedItemsPayload = lineItems.map((item) => {
                  const vals = item.values;
                  const l = Number.parseFloat(vals.length || "0") || 0;
                  const w = Number.parseFloat(vals.width || "0") || 0;
                  const t = Number.parseFloat(vals.height || vals.thickness || "0") || 0;
                  const cbmVal = Number.parseFloat(vals.cbm || "0") || 0;
                  const cbfVal = Number.parseFloat(vals.cbf || "0") || 0;
                  const rateVal = Number.parseFloat(vals.ratePerSqf || vals.ratePerCbf || "0");
                  const amtVal = Number.parseFloat(vals.amount || "0");
                  return {
                    batchNo: vals.logNo || vals.batchNo || "",
                    length: l,
                    width: w,
                    thickness: t,
                    cbm: cbmVal,
                    cbf: cbfVal,
                    ...(Number.isFinite(rateVal) && rateVal > 0 ? { ratePerCbf: rateVal } : {}),
                    ...(Number.isFinite(amtVal) && amtVal > 0 ? { amount: amtVal } : {}),
                    ...(vals.remark ? { remark: vals.remark } : {}),
                  };
                });

                const processDateVal = formValues.processDate
                  ? (formValues.processDate instanceof Date ? formValues.processDate.toISOString() : String(formValues.processDate))
                  : undefined;

                // Calculate total processed CBM
                const totalSawedCbm = processedItemsPayload.reduce(
                  (sum, item) => sum + (item.cbm || 0),
                  0,
                );

                const itemKey = String(issueItemId || sawingSource?.storageSrNo || "");
                const fallbackBaseCbm = Number(sawingSource?.availableCbm ?? sawingSource?.receivedCbm ?? sawingSource?.cbm ?? 0);
                const previousAvailableCbm = itemKey
                  ? getSawingAvailableCbm(itemKey, fallbackBaseCbm)
                  : fallbackBaseCbm;

                const enteredAvailableCbm = numericField(rejectAvailableValues.cbm);
                const remainingCbm = Math.max(
                  0,
                  Number(
                    (
                      (enteredAvailableCbm > 0
                        ? enteredAvailableCbm
                        : (previousAvailableCbm ?? 0) - totalSawedCbm)
                    ).toFixed(4),
                  ),
                );
                const availableLength = numericField(rejectAvailableValues.length);
                const availableWidth = numericField(rejectAvailableValues.width);
                const availableHeight = heightFromAvailableVolume(
                  availableLength,
                  availableWidth,
                  remainingCbm,
                );
                updateSawingIssuedAvailability(
                  [itemKey, sawingSource?.id, sawingSource?.storageSrNo],
                  {
                    length: formatSawingNumber(availableLength, 3),
                    width: formatSawingNumber(availableWidth, 3),
                    height: formatSawingNumber(availableHeight, 3),
                    availableCbm: remainingCbm,
                    availableCbf: formatSawingNumber(remainingCbm * 35.3147, 4),
                  },
                );

                // If workItemId exists, only complete it when remainingCbm reaches 0
                if (workItemId) {
                  if (remainingCbm <= 0) {
                    completeFactoryIssuedWork(workItemId);
                  }
                }

                const sawingDate = processDateVal
                  ? processDateVal.slice(0, 10)
                  : new Date().toISOString().slice(0, 10);
                const issuedDate = sawingSource?.issueDate || sawingSource?.issuedDate || sawingDate;
                const subCategory =
                  sawingSource?.subCategory || sawingSource?.itemSubCategory || "-";
                const newDoneItems = processedItemsPayload.map((p, idx) => ({
                  id: `done-${Date.now()}-${idx}`,
                  doneId: `done-${Date.now()}-${idx}`,
                  sourceIssueId: issueItemId,
                  storageSrNo: sawingSource?.storageSrNo || "-",
                  issueDate: issuedDate,
                  issuedDate,
                  processDate: sawingDate,
                  sawingDate,
                  itemName: sawingSource?.itemName || "Veneer Block",
                  subCategory,
                  itemSubCategory: subCategory,
                  batchNo: sawingSource?.batchNo || "-",
                  batchNoCode: p.batchNo || sawingSource?.batchNo || "-",
                  length: p.length,
                  width: p.width,
                  thickness: p.thickness,
                  height: p.thickness,
                  cbm: p.cbm,
                  cbf: p.cbf,
                  remark: p.remark || sawingSource?.remark || "-",
                  createdBy: sawingSource?.createdBy || "Admin",
                  updatedBy: sawingSource?.updatedBy || "Admin",
                  listingState: "done",
                  storageWarehouseId,
                  issueId,
                }));
                addSawingDoneItems(
                  newDoneItems,
                  itemKey ? { [itemKey]: remainingCbm } : undefined,
                );

                navigate("/factory/sawing?tab=done");
                return;
              }

              if (definition.slug === "slicing") {
                const slicingSource = (sourceRow ?? {}) as Record<string, unknown>;
                const remainingCbm = Math.max(0, numericField(rejectAvailableValues.cbm));
                const remainingHeight =
                  numericField(rejectAvailableValues.height) ||
                  numericField(rejectAvailableValues.thickness);
                const issueKeys = [
                  slicingSource.id,
                  slicingSource.workItemId,
                  slicingSource.storageSrNo,
                  slicingSource.sourceStorageId,
                  workItemId,
                ]
                  .filter(
                    (value) =>
                      value !== undefined &&
                      value !== null &&
                      String(value).trim() !== "",
                  )
                  .map(String);

                updateSlicingIssuedAvailability(issueKeys, {
                  availableCbm: Number(formatSawingNumber(remainingCbm, 6)) || 0,
                  height: formatSawingNumber(remainingHeight, 3),
                  length: String(slicingSource.length ?? ""),
                  width: String(slicingSource.width ?? ""),
                });

                if (remainingCbm <= 0.000001 && workItemId) {
                  completeFactoryIssuedWork(workItemId, {
                    ...slicingSource,
                    ...formValues,
                    availableCbm: 0,
                    height: "0",
                  });
                }

                const slicingDateValue =
                  formValues.slicingDate ?? formValues.processDate ?? formValues.issueDate;
                const slicingDate =
                  slicingDateValue instanceof Date &&
                  !Number.isNaN(slicingDateValue.getTime())
                    ? `${slicingDateValue.getFullYear()}-${String(slicingDateValue.getMonth() + 1).padStart(2, "0")}-${String(slicingDateValue.getDate()).padStart(2, "0")}`
                    : typeof slicingDateValue === "string" && slicingDateValue.trim()
                      ? slicingDateValue
                      : new Date().toISOString().slice(0, 10);

                addSlicingDoneItems(
                  lineItems.map((item, index) => {
                    const vals = item.values;
                    const sqm = vals.sqm || vals.totalSqMeter || "";
                    return {
                      id: `slicing-done-${Date.now()}-${index}`,
                      listingState: "done",
                      storageSrNo: slicingSource.storageSrNo ?? "",
                      issueDate: slicingDate,
                      slicingDate,
                      itemName: slicingSource.itemName ?? "",
                      subCategory:
                        slicingSource.subCategory ?? slicingSource.itemSubCategory ?? "",
                      itemSubCategory:
                        slicingSource.itemSubCategory ?? slicingSource.subCategory ?? "",
                      logCode:
                        slicingSource.logCode ??
                        slicingSource.batchNo ??
                        slicingSource.logNo ??
                        "",
                      batchNo: slicingSource.batchNo ?? slicingSource.logCode ?? "",
                      bundleNumber: vals.bundleNumber || slicingSource.bundleNumber || "",
                      palletNo: vals.palletNo || slicingSource.palletNo || "",
                      length: vals.length || "",
                      width: vals.width || "",
                      thickness: vals.thickness || vals.height || "",
                      noOfLeaves: vals.noOfLeaves || vals.noOfSheets || "",
                      cbm: vals.cbm || "",
                      cbf: vals.cbf || "",
                      sqm,
                      sqf: vals.sqf || "",
                      totalSqMeter: sqm,
                      remark: vals.remark || slicingSource.remark || "",
                      createdBy: slicingSource.createdBy || "Admin",
                      updatedBy: slicingSource.updatedBy || "Admin",
                    };
                  }),
                );

                navigate("/factory/slicing?tab=done");
                return;
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
  if (slug === "slicing") {
    return [
      { key: "storageSrNo", keys: ["storageSrNo", "storageSerialNumber"], label: "Storage Sr No.", minWidth: 160 },
      { key: "issueDate", keys: ["issueDate", "issuedDate", "processDate", "date"], label: "Issue Date", minWidth: 130 },
      { key: "itemName", keys: ["itemName", "productName"], label: "Item Name", minWidth: 170 },
      { key: "subCategory", keys: ["subCategory", "itemSubCategory", "itemSubCategoryName"], label: "Sub Category", minWidth: 170 },
      { key: "logNo", keys: ["logNo", "batchNo", "logCode", "batchNoCode"], label: "Log No.", minWidth: 140 },
      { key: "length", keys: ["length"], label: "Length", minWidth: 120 },
      { key: "width", keys: ["width"], label: "Width", minWidth: 120 },
      { key: "height", keys: ["height", "thickness"], label: "Height", minWidth: 120 },
      { key: "receivedCbm", keys: ["receivedCbm", "cbm"], label: "Received CBM", minWidth: 140 },
      { key: "availableCbm", keys: ["availableCbm", "receivedCbm", "cbm"], label: "Available CBM", minWidth: 140 },
      { key: "availableSqm", keys: ["availableSqm"], label: "Available SQM", minWidth: 140 },
      { key: "remark", keys: ["remark"], label: "Remark", minWidth: 200 },
      { key: "createdBy", keys: ["createdBy"], label: "Created", minWidth: 140 },
      { key: "updatedBy", keys: ["updatedBy"], label: "Updated", minWidth: 140 },
    ];
  }

  if (slug === "drying") {
    return [
      { key: "storageSrNo", keys: ["storageSrNo", "storageSerialNumber"], label: "Storage Sr No.", minWidth: 160 },
      { key: "issueDate", keys: ["issueDate", "issuedDate", "processDate", "date"], label: "Issue Date", minWidth: 130 },
      { key: "itemName", keys: ["itemName", "productName"], label: "Item Name", minWidth: 170 },
      { key: "subCategory", keys: ["subCategory", "itemSubCategory", "itemSubCategoryName"], label: "Sub Category", minWidth: 170 },
      { key: "logCode", keys: ["logCode", "batchNoCode", "batchNo", "logNo"], label: "Log Code", minWidth: 140 },
      { key: "bundleNumber", keys: ["bundleNumber", "bundleNo"], label: "Bundle Number", minWidth: 140 },
      { key: "palletNo", keys: ["palletNo"], label: "Pallet No", minWidth: 140 },
      { key: "length", keys: ["length"], label: "Length", minWidth: 120 },
      { key: "width", keys: ["width"], label: "Width", minWidth: 120 },
      { key: "thickness", keys: ["thickness", "height"], label: "Thickness", minWidth: 120 },
      { key: "noOfLeaves", keys: ["noOfLeaves", "noOfSheets", "leaves"], label: "No of Leaves", minWidth: 130 },
      { key: "totalSqMeter", keys: ["totalSqMeter", "sqm"], label: "Total Sq Meter", minWidth: 140 },
      { key: "remark", keys: ["remark"], label: "Remark", minWidth: 200 },
    ];
  }

  return sourceColumnDefinitions.filter((column) => {
    if (slug === "drying" && column.key === "remark") {
      return false;
    }

    if (slug === "grouping" && groupingHiddenSourceKeys.has(column.key)) {
      return false;
    }

    if (slug === "marquetry" && column.key === "groupNo") {
      return false;
    }

    return true;
  });
}

const sourceOverviewLabelOverrides: Partial<Record<string, string>> = {
  supplierName: "Supplier Name",
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
    const rawValue =
      column.key === "availableSqm"
        ? formatSlicingDecimal(
            calculateSlicingRemainder(sourceRow as Record<string, unknown> | undefined, []).sqm,
            3,
          )
        : getSourceValue(sourceRow, column.keys);
    let value = formatSourceValue(rawValue);

    if (!value || value.trim() === "") {
      value = "-";
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
    const ordered = orderProcessSpecificFields(
      slug,
      mergeCommonFactoryItemFields(relevantFields),
    );

    if (slug === "slicing" || slug === "drying") {
      const processExcludedKeys = new Set([
        "itemName",
        "itemSubCategory",
        "ratePerSqf",
        "amount",
      ]);
      return ordered.filter((field) => !processExcludedKeys.has(field.key));
    }

    return ordered;
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

function numericField(value: unknown) {
  const parsed = Number(String(value ?? "").replace(/[^\d.]/g, ""));
  return Number.isFinite(parsed) ? parsed : 0;
}

function formatSawingNumber(value: number, digits: number) {
  if (!Number.isFinite(value) || value < 0) return "";
  if (value === 0) return "0";
  return value.toFixed(digits).replace(/\.?0+$/u, "");
}

function sawingVolumeDivisor(length: number, width: number, third: number) {
  // Large values are millimetres. Sawing blocks in this flow are metres (0.80 m, 2.40 m).
  if (length > 50 || width > 50 || third > 50) return 1_000_000_000;
  return 1;
}

function volumeFromDimensions(length: number, width: number, height: number) {
  if (length <= 0 || width <= 0 || height <= 0) return 0;
  return (length * width * height) / sawingVolumeDivisor(length, width, height);
}

function buildSawingAvailableValues(
  sourceRow: Record<string, unknown> | undefined,
  lineItems: readonly LineItemRecord[],
): RejectAvailableValues {
  const empty = createEmptyRejectAvailableValues();
  if (lineItems.length === 0) {
    return {
      ...empty,
      type: "Available",
    };
  }

  const sourceLength = numericField(sourceRow?.length);
  const sourceWidth = numericField(sourceRow?.width);
  const sourceHeight = numericField(sourceRow?.height || sourceRow?.thickness);
  const originalCbm =
    numericField(sourceRow?.receivedCbm) ||
    numericField(sourceRow?.cbm) ||
    volumeFromDimensions(sourceLength, sourceWidth, sourceHeight);
  const stockCbm = numericField(sourceRow?.availableCbm) || originalCbm;
  let usedThickness = 0;
  const processedCbm = lineItems.reduce((sum, item) => {
    const length = numericField(item.values.length) || sourceLength;
    const width = numericField(item.values.width) || sourceWidth;
    const thickness = numericField(item.values.thickness || item.values.height);
    usedThickness += thickness;
    return sum + volumeFromDimensions(length, width, thickness);
  }, 0);
  const remainingCbm = Math.max(0, stockCbm - processedCbm);
  const thicknessUsedUp = sourceHeight > 0 && usedThickness >= sourceHeight - 0.000001;
  const nothingLeft = lineItems.length > 0 && (remainingCbm <= 0.000001 || thicknessUsedUp);

  if (nothingLeft) {
    return {
      ...empty,
      type: "Available",
      length: "0",
      width: "0",
      height: "0",
      thickness: "",
      cbm: "0",
      cbf: "0",
    };
  }

  const height =
    heightFromAvailableVolume(sourceLength, sourceWidth, remainingCbm) || sourceHeight;

  return {
    ...empty,
    type: "Available",
    length: formatSawingNumber(sourceLength, 3),
    width: formatSawingNumber(sourceWidth, 3),
    height: formatSawingNumber(height, 3),
    thickness: "",
    cbm: formatSawingNumber(remainingCbm, 6),
    cbf: formatSawingNumber(remainingCbm * 35.3147, 4),
  };
}

function slicingSliceFitsStock(
  values: Record<string, string>,
  sourceRow: Record<string, unknown> | undefined,
  otherItems: readonly LineItemRecord[],
) {
  const measured = measureSlicingSlice(values);
  if (!measured.complete) {
    alert(
      "Enter length, width, thickness, and number of leaves.",
    );
    return false;
  }

  const usedCbm = otherItems.reduce(
    (sum, item) => sum + measureSlicingSlice(item.values).cbm,
    0,
  );
  const remainingCbm = Math.max(0, slicingStockCbm(sourceRow) - usedCbm);
  if (measured.cbm > remainingCbm + 0.000001) {
    alert(
      `This slice is ${measured.cbm.toFixed(4)} CBM. Available stock is ${remainingCbm.toFixed(4)} CBM.`,
    );
    return false;
  }

  return true;
}

function buildSlicingAvailableValues(
  sourceRow: Record<string, unknown> | undefined,
  lineItems: readonly LineItemRecord[],
): RejectAvailableValues {
  const empty = createEmptyRejectAvailableValues();
  if (lineItems.length === 0) {
    return {
      ...empty,
      type: "Available",
    };
  }

  const remainder = calculateSlicingRemainder(
    sourceRow,
    lineItems.map((item) => item.values),
  );
  const cleared = remainder.depleted;

  return {
    ...empty,
    type: "Available",
    length: formatSlicingDecimal(cleared ? 0 : remainder.length, 3),
    width: formatSlicingDecimal(cleared ? 0 : remainder.width, 3),
    height: formatSlicingDecimal(cleared ? 0 : remainder.height, 3),
    thickness: formatSlicingDecimal(cleared ? 0 : remainder.height, 3),
    cbm: formatSlicingDecimal(cleared ? 0 : remainder.cbm, 6),
    cbf: formatSlicingDecimal(cleared ? 0 : remainder.cbf, 4),
    sqm: formatSlicingDecimal(cleared ? 0 : remainder.sqm, 3),
    sqf: formatSlicingDecimal(cleared ? 0 : remainder.sqf, 3),
  };
}

function heightFromAvailableVolume(length: number, width: number, cbm: number) {
  if (length <= 0 || width <= 0 || cbm <= 0) return 0;
  return (cbm * sawingVolumeDivisor(length, width, 0)) / (length * width);
}

function positiveDimension(value: unknown) {
  const parsed = numericField(value);
  return parsed > 0 ? parsed : 0;
}

function calculateSawingVolumeValues(values: Record<string, string>) {
  if (!("cbm" in values) && !("cbf" in values)) {
    return values;
  }

  const length = positiveDimension(values.length);
  const width = positiveDimension(values.width);
  // Create Sawing enters thickness. A prefilled source height must not override it,
  // and a blank height string must not block the thickness the operator typed.
  const third =
    "thickness" in values
      ? positiveDimension(values.thickness)
      : positiveDimension(values.thickness) || positiveDimension(values.height);

  if (length <= 0 || width <= 0 || third <= 0) {
    return { ...values, cbm: "", cbf: "", availableCbm: values.receivedCbm || "" };
  }

  const cbm = (length * width * third) / sawingVolumeDivisor(length, width, third);
  const cbf = cbm * 35.3147;

  const recCbmVal = Number.parseFloat(values.receivedCbm ?? "") || 0;
  const availCbm = recCbmVal > 0 ? Math.max(0, recCbmVal - cbm) : 0;

  const ratePerCbf = Number.parseFloat(values.ratePerSqf ?? values.ratePerCbf ?? "");
  const amount = Number.isFinite(ratePerCbf) && ratePerCbf > 0 ? (cbf * ratePerCbf).toFixed(2) : values.amount ?? "";

  return {
    ...values,
    cbm: cbm.toFixed(6).replace(/\.?0+$/u, "") || "0",
    cbf: cbf.toFixed(4).replace(/\.?0+$/u, "") || "0",
    availableCbm: availCbm ? availCbm.toFixed(6).replace(/\.?0+$/u, "") : (recCbmVal > 0 ? "0" : (values.availableCbm ?? "")),
    ...(amount ? { amount } : {}),
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

    if (typeof value === "number" && Number.isFinite(value)) {
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

  if (typeof value === "number" && Number.isFinite(value)) {
    return String(value);
  }

  if (typeof value === "string") {
    // Strip unit suffixes like m³, ft³, mm, m, etc. from dummy/source values
    return value.replace(/\s*(m³|ft³|mm|mtr|m)\b/gi, "").trim();
  }

  return "";
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
