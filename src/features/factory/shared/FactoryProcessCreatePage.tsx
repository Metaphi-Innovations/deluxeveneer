import { useEffect, useMemo, useRef, useState } from "react";
import type { Theme } from "@mui/material/styles";
import {
  Alert,
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
import { useLocation, useNavigate, useParams } from "react-router";

import type { EnterpriseTableColumn } from "../../../components/data-display/EnterpriseDataTable";
import { ConfirmationDialog } from "../../../components/feedback/ConfirmationDialog";
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
import {
  applyMarquetryProcessResult,
  completeFactoryIssuedWork,
  factoryIssuedWorkToRow,
  getFactoryIssuedWorkById,
  getFactoryIssuedWorkForListing,
  issueFactoryWork,
  reopenMarquetryIssuedWork,
  useFactoryIssuedWorkItems,
} from "./factoryIssuedWorkStore";
import {
  calculateFlutingAvailableDetails,
  calculateFlutingRow,
  calculateTotalFlutedSheets,
  cncFlutingCreateSourceColumns,
  getMaximumFlutingSheets,
  normalizeFlutingSourceDimension,
  orderCncFlutingCreateFields,
  readFlutingReferenceSheets,
  validateFlutingForm,
  validateFlutingRow,
} from "../cnc-fluting/cncFlutingCreateRules";
import { dryingCreateLineItemFields, dryingCreateSourceColumns } from "../drying/dryingCreateRules";
import {
  calculateEmbossingAvailableDetails,
  calculateEmbossingRow,
  calculateTotalEmbossedSheets,
  embossingCreateSourceColumns,
  getMaximumEmbossingSheets,
  normalizeEmbossingSourceDimension,
  orderEmbossingCreateFields,
  readEmbossingReferenceSheets,
  validateEmbossingForm,
  validateEmbossingRow,
} from "../embossing/embossingCreateRules";
import {
  applyGroupingCreateSnapshot,
  calculateGroupingAvailableDetails,
  calculateGroupingRow,
  calculateTotalGroupedLeaves,
  getGroupingLeafLimitMessage,
  getMaximumGroupingLeaves,
  groupingCreateSourceColumns,
  groupingHiddenSourceKeys,
  normalizeGroupingSourceDimension,
  orderGroupingCreateFields,
  prependGroupingGroupNoField,
  readGroupingReferenceLeaves,
  sumGroupingOutputLeaves,
  validateGroupingForm,
  validateGroupingRow,
} from "../grouping/groupingCreateRules";
import {
  isMarquetryOrderDetailsInvalid,
  MarquetryOrderDetails,
  type MarquetryOrderDetailsValue,
} from "../marquetry/MarquetryOrderDetails";
import { marquetryHiddenSourceKeys } from "../marquetry/marquetryCreateRules";
import {
  applySawingVolumeCalculation,
  buildSawingAvailableValues,
  calculateSawingVolumeValues,
  getSawingAvailableCbmIssue,
  getSawingCreateSubmitError,
  getSawingProcessDetailError,
  lockSawingProcessDetailValues,
  readSawingSourceMeasures,
  SAWING_CBM_EPSILON,
  saveSawingCreateProcess,
  sumSawingLineCbm,
} from "../sawing/sawingCreateRules";
import {
  buildSlicingAvailableValues,
  calculateTotalSlicingConsumption,
  getSlicingCreateSubmitError,
  orderSlicingCreateFields,
  saveSlicingCreateProcess,
  saveSlicingEditProcess,
  SLICING_CBM_EPSILON,
  slicingCreateSourceColumns,
  validateSlicingRow,
} from "../slicing/slicingCreateRules";
import {
  getSlicingDoneEditBlockReason,
  getSlicingEditContext,
  listSlicingDoneRows,
} from "../slicing/slicingFrontendStore";
import {
  applySlicingDerivedAreas,
  slicingStockCbm,
} from "./slicingAreaCalculation";
import {
  calculateSplicingAvailableDetails,
  calculateSplicingRow,
  calculateTotalSplicingLeaves,
  getMaximumSplicingLeaves,
  orderSplicingCreateFields,
  readSplicingReferenceLeaves,
  splicingCreateSourceColumns,
  validateSplicingForm,
  validateSplicingRow,
} from "../splicing/splicingCreateRules";
import { processDateBySlug } from "./factoryCreateProcessDates";
import {
  getMappedOutputEditContext,
  isMappedOutputSlug,
  readMappedOutputDate,
  saveMappedOutputProcess,
} from "./mappedOutputProcess";
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
import { marquetryDefinition, pressingDefinition } from "./factoryDefinitions";
import { getIssuedGroupedSheetsTotal } from "./groupedStockIssueStore";
import { allocateNextGroupNo, getExistingGroupNo, peekNextGroupNo } from "./groupNoStore";
import {
  buildFactoryInitialValues,
  flattenFactorySections,
  getFactoryPaths,
  getFactoryRowsForTab,
} from "./factoryUtils";
import {
  mapMarquetryCreateIssuedRow,
  marquetryCreateIssuedColumns,
} from "../marquetry/marquetryCreateIssuedColumns";
import { MarquetryIssuedSelection } from "../marquetry/MarquetryIssuedSelection";
import {
  calculateMarquetryUsedArea,
  getMarquetryLeavesUsedError,
  MarquetrySelectedItems,
  type MarquetrySelectedDraft,
} from "../marquetry/MarquetrySelectedItems";
import { withMarquetryIssuedFrom } from "../marquetry/mapMarquetryListingRow";
import {
  getMarquetryEditContext,
  readMarquetryDrafts,
  readMarquetryOrderDetails,
  readMarquetryWorkItemId,
} from "../marquetry/marquetryEdit";
import { PressingIssuedSelection } from "../pressing/PressingIssuedSelection";
import { pressingCreateIssuedColumns } from "../pressing/pressingCreateIssuedColumns";
import {
  PressingPurposeChoice,
  type PressingPurpose,
} from "../pressing/PressingPurposeChoice";
import {
  buildPressingOrderOverviewItems,
  getPressingOrderLine,
  pressingRowIssuedForOrder,
  pressingRowMatchesOrder,
} from "../pressing/pressingOrderMatch";
import { normalizeFactorySourceColumns } from "./listing/factoryListingParts";
import {
  applyFactoryLineItemValueChange,
  buildFactoryItemPrefillValues,
  commonFactoryItemFieldAliases,
  mergeCommonFactoryItemFields,
} from "./factoryCommonItemFields";
import type { FactoryDefinition, FactoryRecord } from "./types";
import {
  getOrderLineItems,
  getOrderRecordByOrderNo,
  updateOrderRecord,
  useOrderRecords,
  type OrderRecord,
} from "../../orders/shared/ordersStore";

type SourceRow = FactoryRecord;

type FactoryCreateLocationState = {
  groupedStockIssueId?: string;
  issueDate?: Date | string | null;
  issueSheets?: number | string;
  record?: SourceRow;
  sampleNo?: string;
  issuedFromSample?: boolean;
  tab?: string;
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

const groupPhotoPreviewUrls = new Map<string, string>();

function isSupportedGroupPhoto(file: File) {
  const extension = file.name.split(".").pop()?.toLowerCase();
  return (
    ["png", "jpg", "jpeg"].includes(extension ?? "") &&
    ["image/png", "image/jpeg"].includes(file.type)
  );
}

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

function leafValuesForLimit(_slug: string, values: Record<string, string>) {
  return values;
}

function slicingDoneRowToLineValues(
  row: Record<string, unknown>,
  sourceRow: Record<string, unknown>,
) {
  const read = (value: unknown) =>
    value === undefined || value === null ? "" : String(value).trim();

  return applySlicingDerivedAreas({
    issueDate: read(row.issueDate || row.slicingDate || sourceRow.issueDate),
    itemName: read(row.itemName || sourceRow.itemName),
    bundleNumber: read(row.bundleNumber || sourceRow.bundleNumber),
    palletNo: read(row.palletNo || sourceRow.palletNo),
    color: read(row.color || row.colour || sourceRow.color || sourceRow.colour),
    length: read(row.length || sourceRow.length),
    width: read(row.width || sourceRow.width),
    thickness: read(row.thickness || row.height),
    noOfLeaves: read(row.noOfLeaves || row.receivedLeaves || row.noOfSheets),
    sqm: read(row.sqm || row.totalSqMeter),
    sqf: read(row.sqf),
    remark: read(row.remark),
  });
}

function splicingDoneRowToLineValues(
  row: Record<string, unknown>,
  fields: readonly { key: string }[],
) {
  const nested = row.values;
  const output =
    nested && typeof nested === "object" && !Array.isArray(nested)
      ? (nested as Record<string, unknown>)
      : row;

  return fields.reduce<Record<string, string>>((values, field) => {
    const raw = output[field.key] ?? row[field.key];
    values[field.key] =
      raw instanceof Date && !Number.isNaN(raw.getTime())
        ? `${raw.getFullYear()}-${String(raw.getMonth() + 1).padStart(2, "0")}-${String(raw.getDate()).padStart(2, "0")}`
        : raw === undefined || raw === null
          ? ""
          : String(raw).trim();
    return values;
  }, {});
}

function parseProcessDate(value: unknown) {
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return new Date(value.getFullYear(), value.getMonth(), value.getDate());
  }

  const text = String(value ?? "").slice(0, 10);
  const match = /^(\d{4})-(\d{2})-(\d{2})$/u.exec(text);
  if (!match) return null;
  return new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
}

export function FactoryProcessCreatePage<Row extends FactoryRecord>({
  definition,
  mode = "create",
}: {
  definition: FactoryDefinition<Row>;
  mode?: "create" | "edit";
}) {
  const theme = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const params = useParams<{ id: string }>();
  const paths = getFactoryPaths(definition.slug);
  const locationState = location.state as FactoryCreateLocationState | null;
  const isSlicingEdit = mode === "edit" && definition.slug === "slicing";
  const isSplicingEdit = mode === "edit" && definition.slug === "splicing";
  const isGroupingEdit = mode === "edit" && definition.slug === "grouping";
  const isMarquetryEdit = mode === "edit" && definition.slug === "marquetry";
  const isMappedOutputEdit = mode === "edit" && isMappedOutputSlug(definition.slug);
  const isProcessEdit =
    isSlicingEdit || isSplicingEdit || isGroupingEdit || isMarquetryEdit || isMappedOutputEdit;
  const groupingEditRow = useMemo(() => {
    if (!isGroupingEdit) return undefined;
    const passedRecord = locationState?.record;
    if (passedRecord && String(passedRecord.id) === params.id) {
      return passedRecord as Row;
    }
    const workItem = params.id ? getFactoryIssuedWorkById(params.id) : null;
    if (workItem) {
      return factoryIssuedWorkToRow(workItem) as Row;
    }
    return definition.rows.find((row) => String(row.id) === params.id);
  }, [definition.rows, isGroupingEdit, locationState?.record, params.id]);
  const groupingEditBlockReason = useMemo(() => {
    if (!isGroupingEdit || !groupingEditRow) return "";
    const issuedCount = getIssuedGroupedSheetsTotal(String(groupingEditRow.id));
    if (issuedCount > 0) {
      return "Edit is unavailable because sheets from this grouping have already been issued.";
    }
    return "";
  }, [groupingEditRow, isGroupingEdit]);
  const splicingEditRow = useMemo(() => {
    if (!isSplicingEdit) return undefined;
    const passedRecord = locationState?.record;
    if (passedRecord && String(passedRecord.id) === params.id) {
      return passedRecord as Row;
    }
    const workItem = params.id ? getFactoryIssuedWorkById(params.id) : null;
    if (workItem) {
      return factoryIssuedWorkToRow(workItem) as Row;
    }
    return definition.rows.find((row) => String(row.id) === params.id);
  }, [definition.rows, isSplicingEdit, locationState?.record, params.id]);
  const slicingEditContext = useMemo(() => {
    if (!isSlicingEdit) return null;
    const rows = definition.rows as readonly Record<string, any>[];
    const passedRecord = locationState?.record as Record<string, any> | undefined;
    const selected =
      listSlicingDoneRows(rows).find((row) => String(row.id) === params.id) ??
      (passedRecord && String(passedRecord.id) === params.id ? passedRecord : undefined) ??
      rows.find((row) => String(row.id) === params.id);
    if (!selected) return null;
    return {
      blockReason: getSlicingDoneEditBlockReason(selected, rows),
      selected,
      ...getSlicingEditContext(selected, rows),
    };
  }, [definition.rows, isSlicingEdit, locationState?.record, params.id]);
  const pageLabel = isProcessEdit ? `Edit ${definition.title}` : `Create ${definition.title}`;
  const listPath = isProcessEdit
    ? `${paths.list}?tab=${locationState?.tab || "done"}`
    : paths.list;
  const nextRowId = useRef(1);
  const orderRecords = useOrderRecords();
  const factoryIssuedWorkItems = useFactoryIssuedWorkItems();
  const sampleSheetRecords = useSampleSheetRecords();
  const marquetryEditContext = useMemo(() => {
    if (!isMarquetryEdit) return null;
    return getMarquetryEditContext(params.id, definition.rows);
  }, [definition.rows, factoryIssuedWorkItems, isMarquetryEdit, params.id]);
  const mappedOutputEditContext = useMemo(() => {
    if (!isMappedOutputEdit) return null;
    return getMappedOutputEditContext(
      definition.slug,
      params.id,
      definition.rows,
      locationState?.record,
    );
  }, [
    definition.rows,
    definition.slug,
    factoryIssuedWorkItems,
    isMappedOutputEdit,
    locationState?.record,
    params.id,
  ]);
  const usesOrderSelection = definition.slug === "marquetry";
  const sourceRow = isSlicingEdit
    ? (slicingEditContext?.sourceRow as Row | undefined)
    : isSplicingEdit
      ? splicingEditRow
      : isGroupingEdit
        ? groupingEditRow
      : isMappedOutputEdit
        ? (mappedOutputEditContext?.sourceRow as Row | undefined)
    : (locationState?.sourceRow as Row | undefined) ??
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
  const lineItemColumns = useMemo(
    () => lineItemFields.map((field) => mapFieldToColumn(field, definition.slug)),
    [definition.slug, lineItemFields],
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

      if (isSlicingEdit && slicingEditContext) {
        const existingDate = parseProcessDate(
          slicingEditContext.rows[0]?.slicingDate || slicingEditContext.rows[0]?.issueDate,
        );
        if (existingDate) {
          initial.slicingDate = existingDate;
          initial.processDate = existingDate;
        }
      }

      if (isSplicingEdit && splicingEditRow) {
        const existingDate = parseProcessDate(
          splicingEditRow.splicingDate ||
            splicingEditRow.processDate ||
            splicingEditRow.issueDate ||
            splicingEditRow.issuedDate,
        );
        if (existingDate) {
          initial.splicingDate = existingDate;
          initial.processDate = existingDate;
        }
      }

      if (isGroupingEdit && groupingEditRow) {
        const existingDate = parseProcessDate(
          groupingEditRow.groupingDate ||
            groupingEditRow.processDate ||
            groupingEditRow.issueDate ||
            groupingEditRow.issuedDate,
        );
        if (existingDate) {
          initial.groupingDate = existingDate;
          initial.processDate = existingDate;
        }
      }

      if (isMarquetryEdit && marquetryEditContext) {
        const existingDate = parseProcessDate(
          marquetryEditContext.rows[0]?.groupingDate ||
            marquetryEditContext.rows[0]?.marquetryDate ||
            marquetryEditContext.rows[0]?.processDate,
        );
        if (existingDate) {
          initial.groupingDate = existingDate;
          initial.marquetryDate = existingDate;
          initial.processDate = existingDate;
        }
      }

      if (isMappedOutputEdit && mappedOutputEditContext) {
        const existingDate = parseProcessDate(
          readMappedOutputDate(mappedOutputEditContext.rows[0]),
        );
        if (existingDate) {
          const dateKey = processDateBySlug[definition.slug]?.key ?? "processDate";
          initial[dateKey] = existingDate;
          initial.processDate = existingDate;
        }
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
    definition.slug === "sawing"
      ? lockSawingProcessDetailValues(
          {
            ...buildDefaultLineItemValues(lineItemFields, sourceRow),
            thickness: "",
            cbm: "",
            cbf: "",
          },
          sourceRow as Record<string, unknown> | undefined,
        )
      : definition.slug === "slicing"
        ? buildDefaultSlicingLineItemValues(lineItemFields, sourceRow)
      : definition.slug === "grouping"
        ? buildDefaultGroupingLineItemValues(lineItemFields, sourceRow)
      : definition.slug === "splicing"
        ? buildDefaultSplicingLineItemValues(lineItemFields, sourceRow)
      : definition.slug === "cnc-fluting"
        ? buildDefaultFlutingLineItemValues(lineItemFields, sourceRow)
      : definition.slug === "embossing"
        ? buildDefaultEmbossingLineItemValues(lineItemFields, sourceRow)
      : buildDefaultLineItemValues(lineItemFields, sourceRow),
  );
  const [lineItems, setLineItems] = useState<LineItemRecord[]>(() => {
    if (isSlicingEdit && slicingEditContext) {
      return slicingEditContext.rows.map((row) => ({
        id: String(row.id),
        values: slicingDoneRowToLineValues(row, slicingEditContext.sourceRow),
      }));
    }
    if (isSplicingEdit && splicingEditRow) {
      return [
        {
          id: String(splicingEditRow.id),
          values: splicingDoneRowToLineValues(
            splicingEditRow as Record<string, unknown>,
            lineItemFields,
          ),
        },
      ];
    }
    if (isGroupingEdit && groupingEditRow) {
      return [
        {
          id: String(groupingEditRow.id),
          values: splicingDoneRowToLineValues(
            groupingEditRow as Record<string, unknown>,
            lineItemFields,
          ),
        },
      ];
    }
    if (isMappedOutputEdit && mappedOutputEditContext) {
      return mappedOutputEditContext.rows.map((row) => ({
        id: String(row.id),
        values: splicingDoneRowToLineValues(
          row as Record<string, unknown>,
          lineItemFields,
        ),
      }));
    }
    return [];
  });
  const slicingEditHydrated = useRef(!isSlicingEdit || Boolean(slicingEditContext));
  const splicingEditHydrated = useRef(!isSplicingEdit || Boolean(splicingEditRow));
  const groupingEditHydrated = useRef(!isGroupingEdit || Boolean(groupingEditRow));
  const mappedOutputEditHydrated = useRef(
    !isMappedOutputEdit || Boolean(mappedOutputEditContext),
  );

  useEffect(() => {
    if (!isSlicingEdit || !slicingEditContext || slicingEditHydrated.current) {
      return;
    }

    slicingEditHydrated.current = true;
    const existingDate = parseProcessDate(
      slicingEditContext.rows[0]?.slicingDate || slicingEditContext.rows[0]?.issueDate,
    );
    if (existingDate) {
      setFormValues((current) => ({
        ...current,
        processDate: existingDate,
        slicingDate: existingDate,
      }));
    }
    setLineItems(
      slicingEditContext.rows.map((row) => ({
        id: String(row.id),
        values: slicingDoneRowToLineValues(row, slicingEditContext.sourceRow),
      })),
    );
  }, [isSlicingEdit, slicingEditContext]);

  useEffect(() => {
    if (!isSplicingEdit || !splicingEditRow || splicingEditHydrated.current) {
      return;
    }

    splicingEditHydrated.current = true;
    const existingDate = parseProcessDate(
      splicingEditRow.splicingDate ||
        splicingEditRow.processDate ||
        splicingEditRow.issueDate ||
        splicingEditRow.issuedDate,
    );
    if (existingDate) {
      setFormValues((current) => ({
        ...current,
        processDate: existingDate,
        splicingDate: existingDate,
      }));
    }
    setLineItems([
      {
        id: String(splicingEditRow.id),
        values: splicingDoneRowToLineValues(
          splicingEditRow as Record<string, unknown>,
          lineItemFields,
        ),
      },
    ]);
  }, [isSplicingEdit, lineItemFields, splicingEditRow]);

  useEffect(() => {
    if (!isGroupingEdit || !groupingEditRow || groupingEditHydrated.current) {
      return;
    }

    groupingEditHydrated.current = true;
    const existingDate = parseProcessDate(
      groupingEditRow.groupingDate ||
        groupingEditRow.processDate ||
        groupingEditRow.issueDate ||
        groupingEditRow.issuedDate,
    );
    if (existingDate) {
      setFormValues((current) => ({
        ...current,
        processDate: existingDate,
        groupingDate: existingDate,
      }));
    }
    setLineItems([
      {
        id: String(groupingEditRow.id),
        values: splicingDoneRowToLineValues(
          groupingEditRow as Record<string, unknown>,
          lineItemFields,
        ),
      },
    ]);
  }, [groupingEditRow, isGroupingEdit, lineItemFields]);

  useEffect(() => {
    if (!isMappedOutputEdit || !mappedOutputEditContext || mappedOutputEditHydrated.current) {
      return;
    }

    mappedOutputEditHydrated.current = true;
    const existingDate = parseProcessDate(
      readMappedOutputDate(mappedOutputEditContext.rows[0]),
    );
    if (existingDate) {
      const dateKey = processDateBySlug[definition.slug]?.key ?? "processDate";
      setFormValues((current) => ({
        ...current,
        processDate: existingDate,
        [dateKey]: existingDate,
      }));
    }
    setLineItems(
      mappedOutputEditContext.rows.map((row) => ({
        id: String(row.id),
        values: splicingDoneRowToLineValues(
          row as Record<string, unknown>,
          lineItemFields,
        ),
      })),
    );
  }, [definition.slug, isMappedOutputEdit, lineItemFields, mappedOutputEditContext]);

  const [selectedMarquetryIds, setSelectedMarquetryIds] = useState<string[]>(() =>
    marquetryEditContext?.rows.map((row) => String(row.id)) ?? [],
  );
  const [marquetryDrafts, setMarquetryDrafts] = useState<
    Record<string, MarquetrySelectedDraft>
  >(() =>
    marquetryEditContext ? readMarquetryDrafts(marquetryEditContext.rows) : {},
  );
  const marquetryIssuedRows = useMemo(() => {
    if (definition.slug !== "marquetry") {
      return [] as Row[];
    }

    const issuedWorkRows = getFactoryIssuedWorkForListing("marquetry", "issued").map(
      (item) => factoryIssuedWorkToRow(item) as Row,
    );
    const localIssuedRows = getFactoryRowsForTab(
      marquetryDefinition.rows as readonly Row[],
      "issued",
    );
    const groupedRows = (marquetryEditContext?.rows ?? []) as Row[];
    const seen = new Set<string>();

    return [...groupedRows, ...issuedWorkRows, ...localIssuedRows]
      .filter((row) => {
        const id = String(row.id);
        if (seen.has(id)) {
          return false;
        }
        seen.add(id);
        return true;
      })
      .map((row) =>
        mapMarquetryCreateIssuedRow(
          withMarquetryIssuedFrom(normalizeFactorySourceColumns(row, "marquetry")),
        ),
      );
  }, [definition.slug, factoryIssuedWorkItems, marquetryEditContext]);
  const selectedMarquetryRows = useMemo(
    () =>
      selectedMarquetryIds.flatMap((id) => {
        const row = marquetryIssuedRows.find((entry) => String(entry.id) === id);
        return row ? [row] : [];
      }),
    [marquetryIssuedRows, selectedMarquetryIds],
  );
  const handleMarquetrySelectedIdsChange = (ids: string[]) => {
    setSelectedMarquetryIds(ids);
    setMarquetryDrafts((current) => {
      const next: Record<string, MarquetrySelectedDraft> = {};

      ids.forEach((id) => {
        const existing = current[id];
        if (existing) {
          next[id] = existing;
          return;
        }

        const row = marquetryIssuedRows.find((entry) => String(entry.id) === id);
        next[id] = {
          leavesUsed: "",
          remark: typeof row?.remark === "string" ? row.remark : "",
        };
      });

      return next;
    });
  };
  const [selectedPressingIds, setSelectedPressingIds] = useState<string[]>([]);
  const pressingIssuedRows = useMemo(() => {
    if (definition.slug !== "pressing") {
      return [] as Row[];
    }

    const issuedWorkRows = getFactoryIssuedWorkForListing("pressing", "issued").map(
      (item) => normalizeFactorySourceColumns(factoryIssuedWorkToRow(item), "pressing") as Row,
    );
    const localIssuedRows = getFactoryRowsForTab(
      pressingDefinition.rows as readonly Row[],
      "issued",
    ).map((row) => normalizeFactorySourceColumns(row, "pressing"));
    const seen = new Set<string>();

    return [...issuedWorkRows, ...localIssuedRows].filter((row) => {
      const id = String(row.id);
      if (seen.has(id)) {
        return false;
      }
      seen.add(id);
      return true;
    });
  }, [definition.slug, factoryIssuedWorkItems]);
  const selectedPressingRows = useMemo(
    () =>
      selectedPressingIds.flatMap((id) => {
        const row = pressingIssuedRows.find((entry) => String(entry.id) === id);
        return row ? [row] : [];
      }),
    [pressingIssuedRows, selectedPressingIds],
  );
  const pressingSelectionColumns = useMemo(
    () => pressingCreateIssuedColumns as readonly EnterpriseTableColumn<Row>[],
    [],
  );
  const marquetrySelectionColumns = useMemo(
    () => marquetryCreateIssuedColumns as readonly EnterpriseTableColumn<Row>[],
    [],
  );
  const [draftSubmitAttempted, setDraftSubmitAttempted] = useState(false);
  const [editingRowId, setEditingRowId] = useState<string | null>(null);
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [pressingPurpose, setPressingPurpose] = useState<PressingPurpose>("");
  const [pressingOrderNo, setPressingOrderNo] = useState("");
  const [pressingOrderItemNo, setPressingOrderItemNo] = useState("");
  const [pressingSampleNo, setPressingSampleNo] = useState("");
  const visiblePressingIssuedRows = useMemo(() => {
    if (pressingPurpose === "Order") {
      if (!pressingOrderNo || !pressingOrderItemNo) {
        return [] as Row[];
      }

      return pressingIssuedRows.filter((row) =>
        pressingRowIssuedForOrder(row, pressingOrderNo, pressingOrderItemNo),
      );
    }

    if (pressingPurpose === "Sample Sheet") {
      const sampleNo = pressingSampleNo.trim().toLowerCase();
      if (!sampleNo) {
        return [] as Row[];
      }

      return pressingIssuedRows.filter((row) => {
        const rowSampleNo =
          typeof row.sampleNo === "string" ? row.sampleNo.trim().toLowerCase() : "";
        return rowSampleNo === sampleNo;
      });
    }

    return [] as Row[];
  }, [
    pressingIssuedRows,
    pressingOrderItemNo,
    pressingOrderNo,
    pressingPurpose,
    pressingSampleNo,
  ]);
  useEffect(() => {
    setSelectedPressingIds((current) => {
      const next = current.filter((id) =>
        visiblePressingIssuedRows.some((row) => String(row.id) === id),
      );
      return next.length === current.length ? current : next;
    });
  }, [visiblePressingIssuedRows]);
  const [marquetryOrderDetails, setMarquetryOrderDetails] =
    useState<MarquetryOrderDetailsValue>(() => {
      if (marquetryEditContext) {
        return readMarquetryOrderDetails(marquetryEditContext.rows[0]);
      }

      const sourceOrderNo =
        typeof locationState?.sourceRow?.orderNo === "string"
          ? locationState.sourceRow.orderNo
          : "";
      const sourceOrderItemNo =
        typeof locationState?.sourceRow?.orderItemNo === "string"
          ? locationState.sourceRow.orderItemNo
          : "";
      const dummyOrder = usesOrderSelection && !sourceOrderNo ? orderRecords[0] : undefined;

      return {
        orderItemNo: sourceOrderItemNo || (dummyOrder ? "1" : ""),
        orderNo: sourceOrderNo || dummyOrder?.orderNo || "",
        purpose: "Order",
      };
    });
  const sourceOverviewItems = useMemo(
    () => {
      if (definition.slug === "pressing" && pressingPurpose === "Order" && pressingOrderNo) {
        const order = orderRecords.find((entry) => entry.orderNo === pressingOrderNo);
        const line = order ? getPressingOrderLine(order, pressingOrderItemNo) : null;
        if (order && line) {
          const issuedRows = [
            ...getFactoryIssuedWorkForListing("pressing", "issued").map((item) =>
              factoryIssuedWorkToRow(item),
            ),
            ...getFactoryRowsForTab(pressingDefinition.rows, "issued"),
          ];
          const matchedNames = issuedRows
            .filter((row) =>
              pressingRowMatchesOrder(row, order, line, pressingOrderItemNo),
            )
            .map((row) => {
              const name =
                typeof row.itemName === "string" && row.itemName.trim()
                  ? row.itemName.trim()
                  : "";
              return name;
            })
            .filter((name, index, names) => name && names.indexOf(name) === index);
          const overview = buildPressingOrderOverviewItems(
            order,
            line,
            pressingOrderItemNo,
          );

          return matchedNames.length > 0
            ? [...overview, { label: "Identified Items", value: matchedNames.join(", ") }]
            : overview;
        }
      }

      return usesOrderSelection
        ? buildMarquetryOrderOverviewItems(orderRecords, marquetryOrderDetails)
        : buildSourceOverviewItems(
            sourceRow,
            sourceColumns,
            definition.slug === "splicing",
          );
    },
    [
      factoryIssuedWorkItems,
      marquetryOrderDetails,
      orderRecords,
      definition.slug,
      pressingOrderItemNo,
      pressingOrderNo,
      pressingPurpose,
      sourceColumns,
      sourceRow,
      usesOrderSelection,
    ],
  );
  const [editingValues, setEditingValues] = useState<Record<string, string>>(() =>
    createEmptyLineItemValues(lineItemFields),
  );
  const [editingSubmitAttempted, setEditingSubmitAttempted] = useState(false);
  const [rejectAvailableValues, setRejectAvailableValues] = useState(() => {
    const initial = createEmptyRejectAvailableValues();
    if (
      definition.slug === "sawing" ||
      definition.slug === "slicing" ||
      definition.slug === "cnc-fluting" ||
      definition.slug === "embossing"
    ) {
      initial.type = "Available";
    }
    return initial;
  });
  const [rejectAvailableSubmitAttempted, setRejectAvailableSubmitAttempted] =
    useState(false);
  const slicingAvailableLineItems = useMemo(() => {
    if (definition.slug !== "slicing") return lineItems;

    const projected = editingRowId
      ? lineItems.map((item) =>
          item.id === editingRowId
            ? { ...item, values: applySlicingDerivedAreas(editingValues) }
            : item,
        )
      : lineItems;
    const draftHasProcessValues = Boolean(
      draftValues.thickness?.trim() ||
        draftValues.height?.trim() ||
        draftValues.noOfLeaves?.trim() ||
        draftValues.noOfSheets?.trim(),
    );

    return !editingRowId && draftHasProcessValues
      ? [
          ...projected,
          {
            id: "slicing-current-draft",
            values: applySlicingDerivedAreas(draftValues),
          },
        ]
      : projected;
  }, [definition.slug, draftValues, editingRowId, editingValues, lineItems]);

  useEffect(() => {
    if (definition.slug !== "sawing" && definition.slug !== "slicing") return;
    const source = sourceRow as Record<string, unknown> | undefined;
    setRejectAvailableValues((current) => ({
      ...(definition.slug === "slicing"
        ? buildSlicingAvailableValues(source, slicingAvailableLineItems)
        : buildSawingAvailableValues(source, lineItems)),
      remark: current.remark,
    }));
  }, [definition.slug, lineItems, slicingAvailableLineItems, sourceRow]);

  useEffect(() => {
    if (definition.slug !== "sawing") return;
    const source = sourceRow as Record<string, unknown> | undefined;
    setDraftValues((current) => {
      const next = lockSawingProcessDetailValues(current, source);
      if (
        next.length === current.length &&
        next.width === current.width &&
        next.cbm === current.cbm &&
        next.cbf === current.cbf
      ) {
        return current;
      }
      return next;
    });
    setEditingValues((current) => {
      const next = lockSawingProcessDetailValues(current, source);
      if (
        next.length === current.length &&
        next.width === current.width &&
        next.cbm === current.cbm &&
        next.cbf === current.cbf
      ) {
        return current;
      }
      return next;
    });
  }, [definition.slug, draftValues, editingValues, sourceRow]);

  useEffect(() => {
    if (definition.slug !== "sawing") return;
    setLineItems((current) => {
      let changed = false;
      const next = current.map((item) => {
        const values = lockSawingProcessDetailValues(
          item.values,
          sourceRow as Record<string, unknown> | undefined,
        );
        if (
          values.length === item.values.length &&
          values.width === item.values.width &&
          values.cbm === item.values.cbm &&
          values.cbf === item.values.cbf
        ) {
          return item;
        }
        changed = true;
        return { ...item, values };
      });
      return changed ? next : current;
    });
  }, [definition.slug, lineItems]);

  useEffect(() => {
    if (definition.slug !== "grouping") return;
    const sourceLength = normalizeGroupingSourceDimension(sourceRow?.length);
    const sourceWidth = normalizeGroupingSourceDimension(sourceRow?.width);
    const sourceThickness = normalizeGroupingSourceDimension(
      sourceRow?.height ?? sourceRow?.thickness,
    );

    setLineItems((current) => {
      let changed = false;
      const next = current.map((item) => {
        const values: Record<string, string> = {
          ...item.values,
          ...(sourceLength ? { length: sourceLength } : {}),
          ...(sourceWidth ? { width: sourceWidth } : {}),
          ...(sourceThickness ? { height: sourceThickness } : {}),
        };
        const calculated = calculateGroupingRow(values);
        if (
          calculated.length === item.values.length &&
          calculated.width === item.values.width &&
          calculated.height === item.values.height &&
          calculated.sqm === item.values.sqm &&
          calculated.sqf === item.values.sqf
        ) {
          return item;
        }
        changed = true;
        return { ...item, values: calculated };
      });
      return changed ? next : current;
    });
  }, [definition.slug, sourceRow]);

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
  const [sawingSubmitError, setSawingSubmitError] = useState("");
  const [slicingSubmitError, setSlicingSubmitError] = useState("");
  const [groupingSubmitError, setGroupingSubmitError] = useState("");
  const [splicingSubmitError, setSplicingSubmitError] = useState("");
  const [flutingSubmitError, setFlutingSubmitError] = useState("");
  const [embossingSubmitError, setEmbossingSubmitError] = useState("");
  const sawingSource = useMemo(
    () =>
      definition.slug === "sawing"
        ? readSawingSourceMeasures(sourceRow as Record<string, unknown> | undefined)
        : null,
    [definition.slug, sourceRow],
  );
  const sawingProcessedCbm = useMemo(
    () => (sawingSource ? sumSawingLineCbm(lineItems, sawingSource) : 0),
    [lineItems, sawingSource],
  );
  const sawingStockUnavailable = Boolean(
    sawingSource && sawingSource.sourceAvailableCbm <= SAWING_CBM_EPSILON,
  );
  const slicingSource = useMemo(
    () =>
      definition.slug === "slicing"
        ? (sourceRow as Record<string, unknown> | undefined)
        : undefined,
    [definition.slug, sourceRow],
  );
  const slicingConsumedCbm = useMemo(
    () =>
      definition.slug === "slicing"
        ? calculateTotalSlicingConsumption(lineItems)
        : 0,
    [definition.slug, lineItems],
  );
  const slicingStockUnavailable = Boolean(
    definition.slug === "slicing" &&
      slicingStockCbm(slicingSource) <= SLICING_CBM_EPSILON,
  );
  const slicingRemainingCbm =
    definition.slug === "slicing"
      ? Math.max(0, slicingStockCbm(slicingSource) - slicingConsumedCbm)
      : 0;
  const slicingFullyConsumed =
    definition.slug === "slicing" &&
    lineItems.length > 0 &&
    slicingRemainingCbm <= SLICING_CBM_EPSILON;
  const slicingDraftValidation = useMemo(
    () =>
      definition.slug === "slicing"
        ? validateSlicingRow({
            otherConsumedCbm: slicingConsumedCbm,
            sourceRow: slicingSource,
            values: draftValues,
          })
        : { fieldErrors: {}, maximumLeaves: 0, message: "" },
    [definition.slug, draftValues, slicingConsumedCbm, slicingSource],
  );
  const slicingEditValidation = useMemo(
    () =>
      definition.slug === "slicing" && editingRowId
        ? validateSlicingRow({
            otherConsumedCbm: calculateTotalSlicingConsumption(
              lineItems.filter((row) => row.id !== editingRowId),
            ),
            sourceRow: slicingSource,
            values: editingValues,
          })
        : { fieldErrors: {}, maximumLeaves: 0, message: "" },
    [definition.slug, editingRowId, editingValues, lineItems, slicingSource],
  );
  const sawingDraftError = useMemo(() => {
    if (!sawingSource) return "";
    return getSawingProcessDetailError({
      otherProcessedCbm: sawingProcessedCbm,
      source: sawingSource,
      values: draftValues,
    });
  }, [draftValues, sawingProcessedCbm, sawingSource]);
  const sawingEditError = useMemo(() => {
    if (!sawingSource || !editingRowId) return "";
    const otherProcessedCbm = sumSawingLineCbm(
      lineItems.filter((row) => row.id !== editingRowId),
      sawingSource,
    );
    return getSawingProcessDetailError({
      otherProcessedCbm,
      source: sawingSource,
      values: editingValues,
    });
  }, [editingRowId, editingValues, lineItems, sawingSource]);
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
  const rejectAvailableValidationErrors = {
    ...(definition.slug === "slicing"
      ? {}
      : getRejectAvailableValidationErrors(
          rejectAvailableValues,
          rejectAvailableAreaLimits,
        )),
    ...getSawingAvailableCbmIssue(
      definition.slug,
      rejectAvailableValues.cbm,
      sawingSource,
      sawingProcessedCbm,
    ),
  };
  const usesReferenceLeafLimit =
    definition.slug === "grouping" || definition.slug === "splicing";
  const groupingReferenceLeaves = usesReferenceLeafLimit
    ? definition.slug === "splicing"
      ? readSplicingReferenceLeaves(sourceRow as Record<string, unknown> | undefined)
      : readGroupingReferenceLeaves(sourceRow as Record<string, unknown> | undefined)
    : 0;
  const groupingCommittedLeaves = definition.slug === "grouping"
    ? calculateTotalGroupedLeaves(lineItems)
    : 0;
  const groupingMaximumDraftLeaves = definition.slug === "grouping"
    ? getMaximumGroupingLeaves(groupingReferenceLeaves, lineItems)
    : 0;
  const groupingDraftValidation = definition.slug === "grouping"
    ? validateGroupingRow({
        maximumLeaves: groupingMaximumDraftLeaves,
        values: draftValues,
      })
    : { fieldErrors: {}, message: "", values: draftValues };
  const groupingEditValidation = definition.slug === "grouping" && editingRowId
    ? validateGroupingRow({
        maximumLeaves: getMaximumGroupingLeaves(
          groupingReferenceLeaves,
          lineItems,
          editingRowId,
        ),
        values: editingValues,
      })
    : { fieldErrors: {}, message: "", values: editingValues };
  const groupingProjectedItems = definition.slug === "grouping"
    ? lineItems.map((item) =>
        item.id === editingRowId
          ? { ...item, values: calculateGroupingRow(editingValues) }
          : item,
      )
    : lineItems;
  const groupingDraftHasLeaves =
    definition.slug === "grouping" && Boolean(draftValues.noOfLeaves?.trim());
  const groupingLeavesForAvailable = definition.slug === "grouping"
    ? calculateTotalGroupedLeaves(groupingProjectedItems) +
      (!editingRowId && groupingDraftHasLeaves
        ? sumGroupingOutputLeaves([{ values: draftValues }])
        : 0)
    : 0;
  const splicingCommittedLeaves = definition.slug === "splicing"
    ? calculateTotalSplicingLeaves(lineItems)
    : 0;
  const splicingDraftValidation = definition.slug === "splicing"
    ? validateSplicingRow({
        maximumLeaves: getMaximumSplicingLeaves(groupingReferenceLeaves, lineItems),
        values: draftValues,
      })
    : { fieldErrors: {}, message: "", values: draftValues };
  const splicingEditValidation = definition.slug === "splicing" && editingRowId
    ? validateSplicingRow({
        maximumLeaves: getMaximumSplicingLeaves(
          groupingReferenceLeaves,
          lineItems,
          editingRowId,
        ),
        values: editingValues,
      })
    : { fieldErrors: {}, message: "", values: editingValues };
  const splicingProjectedItems = definition.slug === "splicing"
    ? lineItems.map((item) =>
        item.id === editingRowId
          ? { ...item, values: calculateSplicingRow(editingValues) }
          : item,
      )
    : lineItems;
  const splicingDraftHasProcessValues =
    definition.slug === "splicing" &&
    Boolean(draftValues.noOfLeaves?.trim() || draftValues.noOfSheets?.trim());
  const splicingLeavesForAvailable = definition.slug === "splicing"
    ? calculateTotalSplicingLeaves(splicingProjectedItems) +
      (!editingRowId && splicingDraftHasProcessValues
        ? calculateTotalSplicingLeaves([{ values: draftValues }])
        : 0)
    : 0;
  const flutingReferenceSheets = definition.slug === "cnc-fluting"
    ? readFlutingReferenceSheets(
        sourceRow as Record<string, unknown> | undefined,
      )
    : 0;
  const flutingCommittedSheets = definition.slug === "cnc-fluting"
    ? calculateTotalFlutedSheets(lineItems)
    : 0;
  const flutingDraftValidation = definition.slug === "cnc-fluting"
    ? validateFlutingRow({
        maximumSheets: getMaximumFlutingSheets(
          flutingReferenceSheets,
          lineItems,
        ),
        values: draftValues,
      })
    : { fieldErrors: {}, message: "", values: draftValues };
  const flutingEditValidation =
    definition.slug === "cnc-fluting" && editingRowId
      ? validateFlutingRow({
          maximumSheets: getMaximumFlutingSheets(
            flutingReferenceSheets,
            lineItems,
            editingRowId,
          ),
          values: editingValues,
        })
      : { fieldErrors: {}, message: "", values: editingValues };
  const flutingProjectedItems = definition.slug === "cnc-fluting"
    ? lineItems.map((item) =>
        item.id === editingRowId
          ? { ...item, values: calculateFlutingRow(editingValues) }
          : item,
      )
    : lineItems;
  const flutingDraftHasSheets =
    definition.slug === "cnc-fluting" &&
    Boolean(draftValues.noOfSheets?.trim());
  const flutingSheetsForAvailable = definition.slug === "cnc-fluting"
    ? calculateTotalFlutedSheets(flutingProjectedItems) +
      (!editingRowId && flutingDraftHasSheets
        ? calculateTotalFlutedSheets([{ values: draftValues }])
        : 0)
    : 0;
  const embossingReferenceSheets = definition.slug === "embossing"
    ? readEmbossingReferenceSheets(
        sourceRow as Record<string, unknown> | undefined,
      )
    : 0;
  const embossingCommittedSheets = definition.slug === "embossing"
    ? calculateTotalEmbossedSheets(lineItems)
    : 0;
  const embossingDraftValidation = definition.slug === "embossing"
    ? validateEmbossingRow({
        maximumSheets: getMaximumEmbossingSheets(
          embossingReferenceSheets,
          lineItems,
        ),
        values: draftValues,
      })
    : { fieldErrors: {}, message: "", values: draftValues };
  const embossingEditValidation =
    definition.slug === "embossing" && editingRowId
      ? validateEmbossingRow({
          maximumSheets: getMaximumEmbossingSheets(
            embossingReferenceSheets,
            lineItems,
            editingRowId,
          ),
          values: editingValues,
        })
      : { fieldErrors: {}, message: "", values: editingValues };
  const embossingProjectedItems = definition.slug === "embossing"
    ? lineItems.map((item) =>
        item.id === editingRowId
          ? { ...item, values: calculateEmbossingRow(editingValues) }
          : item,
      )
    : lineItems;
  const embossingDraftHasSheets =
    definition.slug === "embossing" && Boolean(draftValues.noOfSheets?.trim());
  const embossingSheetsForAvailable = definition.slug === "embossing"
    ? calculateTotalEmbossedSheets(embossingProjectedItems) +
      (!editingRowId && embossingDraftHasSheets
        ? calculateTotalEmbossedSheets([{ values: draftValues }])
        : 0)
    : 0;
  const groupingOutputLeaves = usesReferenceLeafLimit
    ? sumGroupingOutputLeaves(
        lineItems.map((item) => ({
          values: leafValuesForLimit(
            definition.slug,
            item.id === editingRowId ? editingValues : item.values,
          ),
        })),
      ) +
      sumGroupingOutputLeaves([
        { values: leafValuesForLimit(definition.slug, draftValues) },
      ])
    : 0;
  const groupingAvailableLeaves = usesReferenceLeafLimit
    ? definition.slug === "grouping"
      ? Math.max(0, groupingReferenceLeaves - groupingLeavesForAvailable)
      : definition.slug === "splicing"
        ? Math.max(0, groupingReferenceLeaves - splicingLeavesForAvailable)
      : sumGroupingOutputLeaves([
        { values: { noOfLeaves: rejectAvailableValues.noOfLeaves ?? "" } },
      ])
    : 0;
  const groupingLeafLimitMessage = usesReferenceLeafLimit
    ? definition.slug === "grouping"
      ? ""
      : getGroupingLeafLimitMessage({
        availableLeaves: groupingAvailableLeaves,
        outputLeaves: groupingOutputLeaves,
        referenceLeaves: groupingReferenceLeaves,
      })
    : "";
  const groupingOutputLeafInvalid =
    groupingLeafLimitMessage !== "" &&
    (groupingOutputLeaves > groupingReferenceLeaves ||
      (groupingOutputLeaves > 0 &&
        groupingOutputLeaves + groupingAvailableLeaves > groupingReferenceLeaves));
  const groupingAvailableLeafInvalid =
    groupingLeafLimitMessage !== "" &&
    (groupingAvailableLeaves > groupingReferenceLeaves ||
      (groupingAvailableLeaves > 0 &&
        groupingOutputLeaves + groupingAvailableLeaves > groupingReferenceLeaves));

  useEffect(() => {
    if (definition.slug !== "grouping") return;
    const calculated = calculateGroupingAvailableDetails({
      sourceAvailableLeaves: groupingReferenceLeaves,
      sourceRow: sourceRow as Record<string, unknown> | undefined,
      totalGroupedLeaves: groupingLeavesForAvailable,
    });
    setRejectAvailableValues((current) => ({
      ...current,
      ...calculated,
      remark: current.remark,
    }));
  }, [
    definition.slug,
    groupingLeavesForAvailable,
    groupingReferenceLeaves,
    sourceRow,
  ]);
  useEffect(() => {
    if (definition.slug !== "splicing") return;
    const calculated = calculateSplicingAvailableDetails({
      sourceAvailableLeaves: groupingReferenceLeaves,
      sourceRow: sourceRow as Record<string, unknown> | undefined,
      totalLeavesUsed: splicingLeavesForAvailable,
    });
    setRejectAvailableValues((current) => ({
      ...current,
      ...calculated,
      remark: current.remark,
    }));
  }, [
    definition.slug,
    groupingReferenceLeaves,
    sourceRow,
    splicingLeavesForAvailable,
  ]);
  useEffect(() => {
    if (definition.slug !== "cnc-fluting") return;
    const calculated = calculateFlutingAvailableDetails({
      sourceAvailableSheets: flutingReferenceSheets,
      sourceRow: sourceRow as Record<string, unknown> | undefined,
      totalFlutedSheets: flutingSheetsForAvailable,
    });
    setRejectAvailableValues((current) => ({
      ...current,
      ...calculated,
      remark: current.remark,
    }));
  }, [
    definition.slug,
    flutingReferenceSheets,
    flutingSheetsForAvailable,
    sourceRow,
  ]);
  useEffect(() => {
    if (definition.slug !== "embossing") return;
    const calculated = calculateEmbossingAvailableDetails({
      sourceAvailableSheets: embossingReferenceSheets,
      sourceRow: sourceRow as Record<string, unknown> | undefined,
      totalEmbossedSheets: embossingSheetsForAvailable,
    });
    setRejectAvailableValues((current) => ({
      ...current,
      ...calculated,
      remark: current.remark,
    }));
  }, [
    definition.slug,
    embossingReferenceSheets,
    embossingSheetsForAvailable,
    sourceRow,
  ]);
  const draftProjectedOverflow = useMemo(() => {
    if (
      definition.slug === "splicing" ||
      definition.slug === "embossing" ||
      !quantityConfig ||
      originalQuantity <= 0 ||
      allValuesEmpty(draftValues)
    ) {
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

    if (definition.slug === "grouping" && groupingDraftValidation.message) {
      setDraftSubmitAttempted(true);
      setGroupingSubmitError(groupingDraftValidation.message);
      return;
    }

    if (definition.slug === "splicing" && splicingDraftValidation.message) {
      setDraftSubmitAttempted(true);
      setSplicingSubmitError(splicingDraftValidation.message);
      return;
    }

    if (definition.slug === "cnc-fluting" && flutingDraftValidation.message) {
      setDraftSubmitAttempted(true);
      setFlutingSubmitError(flutingDraftValidation.message);
      return;
    }

    if (definition.slug === "embossing" && embossingDraftValidation.message) {
      setDraftSubmitAttempted(true);
      setEmbossingSubmitError(embossingDraftValidation.message);
      return;
    }

    if (definition.slug === "slicing") {
      const validation = validateSlicingRow({
        committing: true,
        otherConsumedCbm: slicingConsumedCbm,
        sourceRow: slicingSource,
        values: draftValues,
      });
      if (validation.message) {
        setDraftSubmitAttempted(true);
        setSlicingSubmitError(validation.message);
        return;
      }
    }

    if (usesReferenceLeafLimit && groupingLeafLimitMessage) {
      setDraftSubmitAttempted(true);
      return;
    }

    if (definition.slug === "sawing") {
      if (!sawingSource || sawingStockUnavailable) {
        setDraftSubmitAttempted(true);
        setSawingSubmitError("No CBM is available for Sawing.");
        return;
      }

      const lockedDraft = lockSawingProcessDetailValues(
        draftValues,
        sourceRow as Record<string, unknown> | undefined,
      );
      const availabilityError = getSawingProcessDetailError({
        committing: true,
        otherProcessedCbm: sawingProcessedCbm,
        source: sawingSource,
        values: lockedDraft,
      });
      if (availabilityError) {
        setDraftValues(lockedDraft);
        setDraftSubmitAttempted(true);
        setSawingSubmitError(availabilityError);
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

    if (
      definition.slug !== "splicing" &&
      definition.slug !== "cnc-fluting" &&
      definition.slug !== "embossing" &&
      overflow
    ) {
      setDraftSubmitAttempted(true);
      return;
    }

    const valuesToAdd =
      definition.slug === "sawing"
        ? lockSawingProcessDetailValues(
            draftValues,
            sourceRow as Record<string, unknown> | undefined,
          )
        : definition.slug === "slicing"
          ? applySlicingDerivedAreas(draftValues)
        : definition.slug === "grouping"
          ? calculateGroupingRow(draftValues)
        : definition.slug === "splicing"
          ? calculateSplicingRow(draftValues)
        : definition.slug === "cnc-fluting"
          ? calculateFlutingRow(draftValues)
        : definition.slug === "embossing"
          ? calculateEmbossingRow(draftValues)
        : draftValues;
    const nextId = `${definition.slug}-line-item-${nextRowId.current}`;
    nextRowId.current += 1;

    const nextLineItems = [
      ...lineItems,
      {
        id: nextId,
        values: { ...valuesToAdd },
      },
    ];
    setLineItems(nextLineItems);
    setSawingSubmitError("");
    setSlicingSubmitError("");
    setGroupingSubmitError("");
    setSplicingSubmitError("");
    setFlutingSubmitError("");
    setEmbossingSubmitError("");

    if (definition.slug === "sawing" && sawingSource) {
      const clearedValues = lockSawingProcessDetailValues(
        {
          ...createEmptyLineItemValues(lineItemFields),
          logNo: valuesToAdd.logNo || "",
          batchNoCode: valuesToAdd.batchNoCode || "",
          thickness: "",
        },
        sourceRow as Record<string, unknown> | undefined,
      );
      clearedValues.cbm = "";
      clearedValues.cbf = "";
      setDraftValues(clearedValues);
    } else if (definition.slug === "slicing") {
      setDraftValues(buildDefaultSlicingLineItemValues(lineItemFields, sourceRow));
    } else if (definition.slug === "grouping") {
      setDraftValues(buildDefaultGroupingLineItemValues(lineItemFields, sourceRow));
    } else if (definition.slug === "splicing") {
      setDraftValues(buildDefaultSplicingLineItemValues(lineItemFields, sourceRow));
    } else if (definition.slug === "cnc-fluting") {
      setDraftValues(buildDefaultFlutingLineItemValues(lineItemFields, sourceRow));
    } else if (definition.slug === "embossing") {
      setDraftValues(buildDefaultEmbossingLineItemValues(lineItemFields, sourceRow));
    } else {
      setDraftValues(buildDefaultLineItemValues(lineItemFields, sourceRow));
    }
    setDraftSubmitAttempted(false);
  };

  const handleDeleteLineItem = (rowId: string) => {
    setLineItems((current) => current.filter((row) => row.id !== rowId));
    setSawingSubmitError("");
    setSlicingSubmitError("");
    setGroupingSubmitError("");
    setSplicingSubmitError("");
    setFlutingSubmitError("");
    setEmbossingSubmitError("");

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
    setGroupingSubmitError("");
    setSplicingSubmitError("");
    setFlutingSubmitError("");
    setEmbossingSubmitError("");
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

    if (definition.slug === "grouping" && groupingEditValidation.message) {
      setEditingSubmitAttempted(true);
      setGroupingSubmitError(groupingEditValidation.message);
      return;
    }

    if (definition.slug === "splicing" && splicingEditValidation.message) {
      setEditingSubmitAttempted(true);
      setSplicingSubmitError(splicingEditValidation.message);
      return;
    }

    if (definition.slug === "cnc-fluting" && flutingEditValidation.message) {
      setEditingSubmitAttempted(true);
      setFlutingSubmitError(flutingEditValidation.message);
      return;
    }

    if (definition.slug === "embossing" && embossingEditValidation.message) {
      setEditingSubmitAttempted(true);
      setEmbossingSubmitError(embossingEditValidation.message);
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

    if (
      (definition.slug !== "splicing" &&
        definition.slug !== "cnc-fluting" &&
        definition.slug !== "embossing" &&
        overflow) ||
      (usesReferenceLeafLimit && groupingLeafLimitMessage)
    ) {
      setEditingSubmitAttempted(true);
      return;
    }

    if (definition.slug === "slicing") {
      const validation = validateSlicingRow({
        committing: true,
        otherConsumedCbm: calculateTotalSlicingConsumption(
          lineItems.filter((row) => row.id !== rowId),
        ),
        sourceRow: slicingSource,
        values: editingValues,
      });
      if (validation.message) {
        setEditingSubmitAttempted(true);
        setSlicingSubmitError(validation.message);
        return;
      }

      const calculatedEdit = applySlicingDerivedAreas(editingValues);
      setLineItems((current) =>
        current.map((row) =>
          row.id === rowId
            ? { ...row, values: { ...calculatedEdit } }
            : row,
        ),
      );
      setEditingRowId(null);
      setEditingValues(createEmptyLineItemValues(lineItemFields));
      setEditingSubmitAttempted(false);
      setSlicingSubmitError("");
      return;
    }

    if (definition.slug === "sawing") {
      if (!sawingSource || sawingStockUnavailable) {
        setEditingSubmitAttempted(true);
        setSawingSubmitError("No CBM is available for Sawing.");
        return;
      }

      const lockedEdit = lockSawingProcessDetailValues(
        editingValues,
        sourceRow as Record<string, unknown> | undefined,
      );
      const availabilityError = getSawingProcessDetailError({
        committing: true,
        otherProcessedCbm: sumSawingLineCbm(
          lineItems.filter((row) => row.id !== rowId),
          sawingSource,
        ),
        source: sawingSource,
        values: lockedEdit,
      });
      if (availabilityError) {
        setEditingValues(lockedEdit);
        setEditingSubmitAttempted(true);
        setSawingSubmitError(availabilityError);
        return;
      }

      setLineItems((current) =>
        current.map((row) =>
          row.id === rowId
            ? {
              ...row,
              values: { ...lockedEdit },
            }
            : row,
        ),
      );
      setEditingRowId(null);
      setEditingValues(createEmptyLineItemValues(lineItemFields));
      setEditingSubmitAttempted(false);
      setSawingSubmitError("");
      return;
    }

    setLineItems((current) =>
      current.map((row) =>
        row.id === rowId
          ? {
            ...row,
            values: definition.slug === "grouping"
              ? { ...calculateGroupingRow(editingValues) }
              : definition.slug === "splicing"
                ? { ...calculateSplicingRow(editingValues) }
              : definition.slug === "cnc-fluting"
                ? { ...calculateFlutingRow(editingValues) }
              : definition.slug === "embossing"
                ? { ...calculateEmbossingRow(editingValues) }
              : { ...editingValues },
          }
          : row,
      ),
    );
    setEditingRowId(null);
    setEditingValues(createEmptyLineItemValues(lineItemFields));
    setEditingSubmitAttempted(false);
    setGroupingSubmitError("");
    setSplicingSubmitError("");
    setFlutingSubmitError("");
    setEmbossingSubmitError("");
  };

  const pressingOrderItemOptions = useMemo(() => {
    const order = orderRecords.find((entry) => entry.orderNo === pressingOrderNo);
    if (!order) {
      return [] as string[];
    }

    return getOrderLineItems(order.id).map((_, index) =>
      `OI-${String(index + 1).padStart(3, "0")}`,
    );
  }, [orderRecords, pressingOrderNo]);

  const [leaveConfirmation, setLeaveConfirmation] = useState<{
    open: boolean;
    title: string;
    description: string;
    action: () => void;
  }>({
    open: false,
    title: "",
    description: "",
    action: () => {},
  });

  const [saveConfirmationOpen, setSaveConfirmationOpen] = useState(false);

  const handleBack = () => {
    setLeaveConfirmation({
      open: true,
      title: isProcessEdit ? "Discard Changes?" : "Discard Process Creation?",
      description: isProcessEdit
        ? "Are you sure you want to go back? Any unsaved changes will be lost."
        : "Are you sure you want to go back? Any unsaved output details will be lost.",
      action: () => navigate(listPath),
    });
  };

  const handleCancel = () => {
    setLeaveConfirmation({
      open: true,
      title: isProcessEdit ? "Cancel Edit?" : "Cancel Process Creation?",
      description: "Are you sure you want to cancel? Any unsaved changes will be discarded.",
      action: () => navigate(listPath),
    });
  };

  const executeSaveProcess = async () => {
    const workItemId =
      locationState?.workItemId ||
      (typeof sourceRow?.workItemId === "string"
        ? sourceRow.workItemId
        : undefined);

    const sampleNo =
      locationState?.sampleNo ||
      (typeof sourceRow?.sampleNo === "string"
        ? sourceRow.sampleNo
        : undefined);

    if (sampleNo) {
      markSampleProcessDone(sampleNo, definition.slug);
    }

    if (definition.slug === "sawing") {
      saveSawingCreateProcess({
        formValues,
        lineItems,
        locationState: locationState as Record<string, any> | null,
        navigate,
        rejectAvailableValues,
        sourceRow: sourceRow as Record<string, any> | undefined,
        workItemId,
      });
      return;
    }

    if (definition.slug === "slicing") {
      persistSlicingProcess();
      return;
    }

    navigate(listPath);
  };

  const persistSlicingProcess = () => {
    if (isSlicingEdit && slicingEditContext) {
      saveSlicingEditProcess({
        formValues,
        lineItems,
        navigate,
        originalRows: slicingEditContext.rows,
        sourceRow: slicingEditContext.sourceRow,
      });
      return;
    }

    const workItemId =
      locationState?.workItemId ||
      (typeof sourceRow?.workItemId === "string" ? sourceRow.workItemId : undefined);
    saveSlicingCreateProcess({
      formValues,
      lineItems,
      navigate,
      rejectAvailableValues,
      sourceRow: sourceRow as Record<string, unknown> | undefined,
      workItemId,
    });
  };

  if (isSlicingEdit && slicingEditContext?.blockReason) {
    return (
      <FactoryPageShell
        backNav={{
          label: `Back to ${definition.title}`,
          to: listPath,
          onBack: () => navigate(listPath),
        }}
        breadcrumbs={[
          { label: "Factory", to: "/factory" },
          { label: definition.title, to: listPath },
          { label: pageLabel },
        ]}
        title={pageLabel}
      >
        <Alert severity="warning">{slicingEditContext.blockReason}</Alert>
      </FactoryPageShell>
    );
  }

  if (isSlicingEdit && !slicingEditContext) {
    return (
      <FactoryPageShell
        backNav={{
          label: `Back to ${definition.title}`,
          to: listPath,
          onBack: () => navigate(listPath),
        }}
        breadcrumbs={[
          { label: "Factory", to: "/factory" },
          { label: definition.title, to: listPath },
          { label: pageLabel },
        ]}
        title={pageLabel}
      >
        <Alert severity="warning">The selected Slicing record was not found.</Alert>
      </FactoryPageShell>
    );
  }

  if (isMarquetryEdit && !marquetryEditContext) {
    return (
      <FactoryPageShell
        backNav={{
          label: `Back to ${definition.title}`,
          to: listPath,
          onBack: () => navigate(listPath),
        }}
        breadcrumbs={[
          { label: "Factory", to: "/factory" },
          { label: definition.title, to: listPath },
          { label: pageLabel },
        ]}
        title={pageLabel}
      >
        <Alert severity="warning">The selected Marquetry record was not found.</Alert>
      </FactoryPageShell>
    );
  }

  if (isSplicingEdit && !splicingEditRow) {
    return (
      <FactoryPageShell
        backNav={{
          label: `Back to ${definition.title}`,
          to: listPath,
          onBack: () => navigate(listPath),
        }}
        breadcrumbs={[
          { label: "Factory", to: "/factory" },
          { label: definition.title, to: listPath },
          { label: pageLabel },
        ]}
        title={pageLabel}
      >
        <Alert severity="warning">The selected Splicing record was not found.</Alert>
      </FactoryPageShell>
    );
  }

  if (isGroupingEdit && groupingEditBlockReason) {
    return (
      <FactoryPageShell
        backNav={{
          label: `Back to ${definition.title}`,
          to: listPath,
          onBack: () => navigate(listPath),
        }}
        breadcrumbs={[
          { label: "Factory", to: "/factory" },
          { label: definition.title, to: listPath },
          { label: pageLabel },
        ]}
        title={pageLabel}
      >
        <Alert severity="warning">{groupingEditBlockReason}</Alert>
      </FactoryPageShell>
    );
  }

  if (isGroupingEdit && !groupingEditRow) {
    return (
      <FactoryPageShell
        backNav={{
          label: `Back to ${definition.title}`,
          to: listPath,
          onBack: () => navigate(listPath),
        }}
        breadcrumbs={[
          { label: "Factory", to: "/factory" },
          { label: definition.title, to: listPath },
          { label: pageLabel },
        ]}
        title={pageLabel}
      >
        <Alert severity="warning">The selected Grouping record was not found.</Alert>
      </FactoryPageShell>
    );
  }

  if (isMappedOutputEdit && !mappedOutputEditContext) {
    return (
      <FactoryPageShell
        backNav={{
          label: `Back to ${definition.title}`,
          to: listPath,
          onBack: () => navigate(listPath),
        }}
        breadcrumbs={[
          { label: "Factory", to: "/factory" },
          { label: definition.title, to: listPath },
          { label: pageLabel },
        ]}
        title={pageLabel}
      >
        <Alert severity="warning">
          The selected {definition.title} record was not found.
        </Alert>
      </FactoryPageShell>
    );
  }

  return (
    <FactoryPageShell
      backNav={{
        label: `Back to ${definition.title}`,
        to: listPath,
        onBack: handleBack,
      }}
      breadcrumbs={[
        { label: "Factory", to: "/factory" },
        { label: definition.title, to: listPath },
        { label: pageLabel },
      ]}
      title={pageLabel}
    >
      <Stack
        sx={(currentTheme) => ({
          gap: currentTheme.spacing(2),
        })}
      >
        {usesOrderSelection ? (
          <MarquetryOrderDetails
            hasSubmitted={hasSubmitted}
            onChange={setMarquetryOrderDetails}
            orderRecords={orderRecords}
            value={marquetryOrderDetails}
          />
        ) : null}

        {definition.slug === "pressing" ? (
          <PressingPurposeChoice
            onChange={(nextPurpose) => {
              setPressingPurpose(nextPurpose);
              if (nextPurpose !== "Order") {
                setPressingOrderNo("");
                setPressingOrderItemNo("");
              }
              if (nextPurpose !== "Sample Sheet") {
                setPressingSampleNo("");
              }
            }}
            onOrderItemNoChange={setPressingOrderItemNo}
            onOrderNoChange={(nextOrderNo) => {
              setPressingOrderNo(nextOrderNo);
              setPressingOrderItemNo("");
            }}
            onSampleNoChange={setPressingSampleNo}
            orderItemNo={pressingOrderItemNo}
            orderItemOptions={pressingOrderItemOptions}
            orderNo={pressingOrderNo}
            orderOptions={orderRecords.map((entry) => entry.orderNo)}
            orderRecords={orderRecords}
            sampleNo={pressingSampleNo}
            sampleOptions={sampleSheetRecords.map((sample) => sample.sampleNo)}
            showError={hasSubmitted}
            value={pressingPurpose}
          />
        ) : null}

        {definition.slug === "pressing" || definition.slug === "marquetry" ? null : (
          <FactorySourceOverviewPanel items={sourceOverviewItems} />
        )}

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
          <FactoryCreateSectionTitle title="Output Details" />
          {definition.slug === "marquetry" ? (
            <MarquetryIssuedSelection
              columns={marquetrySelectionColumns}
              onSelectedIdsChange={handleMarquetrySelectedIdsChange}
              rows={marquetryIssuedRows}
              selectedIds={selectedMarquetryIds}
              showError={hasSubmitted && selectedMarquetryRows.length === 0}
            />
          ) : definition.slug === "pressing" ? (
            <PressingIssuedSelection
              columns={pressingSelectionColumns}
              onSelectedIdsChange={setSelectedPressingIds}
              rows={visiblePressingIssuedRows}
              selectedIds={selectedPressingIds}
              showError={hasSubmitted && selectedPressingRows.length === 0}
            />
          ) : (
          <>
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
                          required={
                            isLineItemColumnRequired(column) ||
                            (definition.slug === "grouping" &&
                              (column.key === "itemName" ||
                                column.key === "length" ||
                                column.key === "width" ||
                                column.key === "noOfLeaves")) ||
                            (definition.slug === "splicing" &&
                              (column.key === "itemName" ||
                                column.key === "length" ||
                                column.key === "width" ||
                                column.key === "noOfLeaves" ||
                                column.key === "noOfSheets")) ||
                            (definition.slug === "cnc-fluting" &&
                              (column.key === "itemName" ||
                                column.key === "length" ||
                                column.key === "width" ||
                                column.key === "height" ||
                                column.key === "noOfSheets")) ||
                            (definition.slug === "embossing" &&
                              (column.key === "itemName" ||
                                column.key === "length" ||
                                column.key === "width" ||
                                column.key === "height" ||
                                column.key === "noOfSheets")) ||
                            (definition.slug === "slicing" &&
                              (column.key === "thickness" ||
                                column.key === "height" ||
                                column.key === "noOfLeaves"))
                          }
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
                          onChange: (value) => {
                            if (definition.slug === "slicing") {
                              setSlicingSubmitError("");
                            }
                            if (definition.slug === "grouping") {
                              setGroupingSubmitError("");
                            }
                            if (definition.slug === "splicing") {
                              setSplicingSubmitError("");
                            }
                            if (definition.slug === "cnc-fluting") {
                              setFlutingSubmitError("");
                            }
                            if (definition.slug === "embossing") {
                              setEmbossingSubmitError("");
                            }
                            setDraftValues((current) =>
                              definition.slug === "grouping"
                                ? calculateGroupingRow(
                                    applyFactoryLineItemValueChange(
                                      current,
                                      column.key,
                                      value,
                                      definition.slug,
                                    ),
                                  )
                                : definition.slug === "splicing"
                                  ? calculateSplicingRow(
                                      applyFactoryLineItemValueChange(
                                        current,
                                        column.key,
                                        value,
                                        definition.slug,
                                      ),
                                    )
                                : definition.slug === "cnc-fluting"
                                  ? calculateFlutingRow(
                                      applyFactoryLineItemValueChange(
                                        current,
                                        column.key,
                                        value,
                                        definition.slug,
                                      ),
                                    )
                                : definition.slug === "embossing"
                                  ? calculateEmbossingRow(
                                      applyFactoryLineItemValueChange(
                                        current,
                                        column.key,
                                        value,
                                        definition.slug,
                                      ),
                                    )
                                : applySawingVolumeCalculation(
                                  definition.slug,
                                  applyFactoryLineItemValueChange(
                                  current,
                                  column.key,
                                  value,
                                  definition.slug,
                                ),
                                ),
                            );
                          },
                          theme,
                          value: draftValues[column.key] ?? "",
                          errorText: draftSubmitAttempted
                            ? definition.slug === "grouping"
                              ? groupingDraftValidation.fieldErrors[column.key] ||
                                getFieldValidationError(column, draftValues)
                              : definition.slug === "splicing"
                                ? splicingDraftValidation.fieldErrors[column.key] ||
                                  getFieldValidationError(column, draftValues)
                              : definition.slug === "cnc-fluting"
                                ? flutingDraftValidation.fieldErrors[column.key] ||
                                  getFieldValidationError(column, draftValues)
                              : definition.slug === "embossing"
                                ? embossingDraftValidation.fieldErrors[column.key] ||
                                  getFieldValidationError(column, draftValues)
                              : definition.slug === "slicing"
                              ? slicingDraftValidation.fieldErrors[column.key] ||
                                getFieldValidationError(column, draftValues)
                              : getFieldValidationError(column, draftValues)
                            : "",
                          invalid:
                            (usesReferenceLeafLimit &&
                              column.key === "noOfLeaves" &&
                              groupingOutputLeafInvalid) ||
                            (definition.slug === "sawing" &&
                              (column.key === "cbm" || column.key === "width") &&
                              sawingDraftError.includes("CBM")) ||
                            (definition.slug === "slicing" &&
                              Boolean(slicingDraftValidation.fieldErrors[column.key])) ||
                            (definition.slug === "cnc-fluting" &&
                              Boolean(flutingDraftValidation.fieldErrors[column.key])) ||
                            (definition.slug === "embossing" &&
                              Boolean(embossingDraftValidation.fieldErrors[column.key])),
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
            {(definition.slug === "sawing" &&
              (sawingStockUnavailable ||
                sawingSubmitError ||
                sawingDraftError)) ? (
              <Typography
                sx={(currentTheme) => ({
                  color: currentTheme.palette.error.main,
                  flex: "1 1 220px",
                  fontSize: "0.8125rem",
                  fontWeight: 500,
                  minWidth: 0,
                  whiteSpace: "normal",
                })}
              >
                {sawingStockUnavailable
                  ? "No CBM is available for Sawing."
                  : sawingSubmitError || sawingDraftError}
              </Typography>
            ) : definition.slug === "slicing" &&
              (slicingStockUnavailable ||
                slicingSubmitError ||
                slicingDraftValidation.message) ? (
              <Typography
                sx={(currentTheme) => ({
                  color: currentTheme.palette.error.main,
                  flex: "1 1 220px",
                  fontSize: "0.8125rem",
                  fontWeight: 500,
                  minWidth: 0,
                  whiteSpace: "normal",
                })}
              >
                {slicingStockUnavailable
                  ? "No CBM is available for Slicing."
                  : slicingSubmitError || slicingDraftValidation.message}
              </Typography>
            ) : definition.slug === "grouping" &&
              (groupingReferenceLeaves <= 0 ||
                groupingCommittedLeaves >= groupingReferenceLeaves ||
                groupingSubmitError ||
                (draftSubmitAttempted && groupingDraftValidation.message)) ? (
              <Typography
                sx={(currentTheme) => ({
                  color: currentTheme.palette.error.main,
                  flex: "1 1 220px",
                  fontSize: "0.8125rem",
                  fontWeight: 500,
                  minWidth: 0,
                  whiteSpace: "normal",
                })}
              >
                {groupingReferenceLeaves <= 0 ||
                groupingCommittedLeaves >= groupingReferenceLeaves
                  ? "No leaves are available for Grouping."
                  : groupingSubmitError || groupingDraftValidation.message}
              </Typography>
            ) : definition.slug === "splicing" &&
              (groupingReferenceLeaves <= 0 ||
                splicingCommittedLeaves >= groupingReferenceLeaves ||
                splicingSubmitError ||
                (draftSubmitAttempted && splicingDraftValidation.message)) ? (
              <Typography
                sx={(currentTheme) => ({
                  color: currentTheme.palette.error.main,
                  flex: "1 1 220px",
                  fontSize: "0.8125rem",
                  fontWeight: 500,
                  minWidth: 0,
                  whiteSpace: "normal",
                })}
              >
                {groupingReferenceLeaves <= 0 ||
                splicingCommittedLeaves >= groupingReferenceLeaves
                  ? "No leaves are available for Splicing."
                  : splicingSubmitError || splicingDraftValidation.message}
              </Typography>
            ) : definition.slug === "cnc-fluting" &&
              (flutingReferenceSheets <= 0 ||
                flutingCommittedSheets >= flutingReferenceSheets ||
                flutingSubmitError ||
                (draftSubmitAttempted && flutingDraftValidation.message)) ? (
              <Typography
                sx={(currentTheme) => ({
                  color: currentTheme.palette.error.main,
                  flex: "1 1 220px",
                  fontSize: "0.8125rem",
                  fontWeight: 500,
                  minWidth: 0,
                  whiteSpace: "normal",
                })}
              >
                {flutingReferenceSheets <= 0 ||
                flutingCommittedSheets >= flutingReferenceSheets
                  ? "No sheets are available for Fluting."
                  : flutingSubmitError || flutingDraftValidation.message}
              </Typography>
            ) : definition.slug === "embossing" &&
              (embossingReferenceSheets <= 0 ||
                embossingCommittedSheets >= embossingReferenceSheets ||
                embossingSubmitError ||
                (draftSubmitAttempted && embossingDraftValidation.message)) ? (
              <Typography
                sx={(currentTheme) => ({
                  color: currentTheme.palette.error.main,
                  flex: "1 1 220px",
                  fontSize: "0.8125rem",
                  fontWeight: 500,
                  minWidth: 0,
                  whiteSpace: "normal",
                })}
              >
                {embossingReferenceSheets <= 0 ||
                embossingCommittedSheets >= embossingReferenceSheets
                  ? "No sheets are available for Embossing."
                  : embossingSubmitError || embossingDraftValidation.message}
              </Typography>
            ) : usesReferenceLeafLimit && groupingOutputLeafInvalid ? (
              <Typography
                sx={(currentTheme) => ({
                  color: currentTheme.palette.error.main,
                  flex: "1 1 220px",
                  fontSize: "0.8125rem",
                  fontWeight: 500,
                  minWidth: 0,
                  whiteSpace: "normal",
                })}
              >
                {groupingLeafLimitMessage}
              </Typography>
            ) : draftSubmitAttempted && draftProjectedOverflow ? (
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
              disabled={
                sawingStockUnavailable ||
                slicingStockUnavailable ||
                slicingFullyConsumed ||
                (definition.slug === "grouping" &&
                  (groupingReferenceLeaves <= 0 ||
                    groupingCommittedLeaves >= groupingReferenceLeaves)) ||
                (definition.slug === "splicing" &&
                  (groupingReferenceLeaves <= 0 ||
                    splicingCommittedLeaves >= groupingReferenceLeaves)) ||
                (definition.slug === "cnc-fluting" &&
                  (flutingReferenceSheets <= 0 ||
                    flutingCommittedSheets >= flutingReferenceSheets)) ||
                (definition.slug === "embossing" &&
                  (embossingReferenceSheets <= 0 ||
                    embossingCommittedSheets >= embossingReferenceSheets))
              }
              onClick={handleAddLineItem}
              startIcon={<Plus size={15} strokeWidth={2} />}
              sx={(currentTheme) => formInlineActionButtonSx(currentTheme)}
              variant="contained"
            >
              Add Item
            </Button>
          </Box>
          </>
          )}
        </Stack>

        {definition.slug === "marquetry" ? (
          <MarquetrySelectedItems
            drafts={marquetryDrafts}
            onDraftChange={(rowId, patch) =>
              setMarquetryDrafts((current) => ({
                ...current,
                [rowId]: {
                  leavesUsed: current[rowId]?.leavesUsed ?? "",
                  remark: current[rowId]?.remark ?? "",
                  ...patch,
                },
              }))
            }
            onRemove={(rowId) =>
              handleMarquetrySelectedIdsChange(
                selectedMarquetryIds.filter((id) => id !== rowId),
              )
            }
            rows={selectedMarquetryRows}
            showErrors={hasSubmitted}
          />
        ) : null}

        {definition.slug !== "marquetry" && lineItems.length > 0 ? (
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
                            required={
                              isLineItemColumnRequired(column) ||
                              (definition.slug === "grouping" &&
                                (column.key === "itemName" ||
                                  column.key === "length" ||
                                  column.key === "width" ||
                                  column.key === "noOfLeaves")) ||
                              (definition.slug === "splicing" &&
                                (column.key === "itemName" ||
                                  column.key === "length" ||
                                  column.key === "width" ||
                                  column.key === "noOfLeaves" ||
                                  column.key === "noOfSheets")) ||
                              (definition.slug === "cnc-fluting" &&
                                (column.key === "itemName" ||
                                  column.key === "length" ||
                                  column.key === "width" ||
                                  column.key === "height" ||
                                  column.key === "noOfSheets")) ||
                              (definition.slug === "embossing" &&
                                (column.key === "itemName" ||
                                  column.key === "length" ||
                                  column.key === "width" ||
                                  column.key === "height" ||
                                  column.key === "noOfSheets")) ||
                              (definition.slug === "slicing" &&
                                (column.key === "thickness" ||
                                  column.key === "height" ||
                                  column.key === "noOfLeaves"))
                            }
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
                                  onChange: (value) => {
                                    if (definition.slug === "slicing") {
                                      setSlicingSubmitError("");
                                    }
                                    if (definition.slug === "grouping") {
                                      setGroupingSubmitError("");
                                    }
                                    if (definition.slug === "splicing") {
                                      setSplicingSubmitError("");
                                    }
                                    if (definition.slug === "cnc-fluting") {
                                      setFlutingSubmitError("");
                                    }
                                    if (definition.slug === "embossing") {
                                      setEmbossingSubmitError("");
                                    }
                                    setEditingValues((current) =>
                                      definition.slug === "grouping"
                                        ? calculateGroupingRow(
                                            applyFactoryLineItemValueChange(
                                              current,
                                              column.key,
                                              value,
                                              definition.slug,
                                            ),
                                          )
                                        : definition.slug === "splicing"
                                          ? calculateSplicingRow(
                                              applyFactoryLineItemValueChange(
                                                current,
                                                column.key,
                                                value,
                                                definition.slug,
                                              ),
                                            )
                                        : definition.slug === "cnc-fluting"
                                          ? calculateFlutingRow(
                                              applyFactoryLineItemValueChange(
                                                current,
                                                column.key,
                                                value,
                                                definition.slug,
                                              ),
                                            )
                                        : definition.slug === "embossing"
                                          ? calculateEmbossingRow(
                                              applyFactoryLineItemValueChange(
                                                current,
                                                column.key,
                                                value,
                                                definition.slug,
                                              ),
                                            )
                                        : applySawingVolumeCalculation(
                                          definition.slug,
                                          applyFactoryLineItemValueChange(
                                          current,
                                          column.key,
                                          value,
                                          definition.slug,
                                        ),
                                        ),
                                    );
                                  },
                                  theme,
                                  value: editingValues[column.key] ?? "",
                                  errorText: editingSubmitAttempted
                                    ? definition.slug === "grouping"
                                      ? groupingEditValidation.fieldErrors[column.key] ||
                                        getFieldValidationError(column, editingValues)
                                      : definition.slug === "splicing"
                                        ? splicingEditValidation.fieldErrors[column.key] ||
                                          getFieldValidationError(column, editingValues)
                                      : definition.slug === "cnc-fluting"
                                        ? flutingEditValidation.fieldErrors[column.key] ||
                                          getFieldValidationError(column, editingValues)
                                      : definition.slug === "embossing"
                                        ? embossingEditValidation.fieldErrors[column.key] ||
                                          getFieldValidationError(column, editingValues)
                                      : definition.slug === "slicing"
                                      ? slicingEditValidation.fieldErrors[column.key] ||
                                        getFieldValidationError(column, editingValues)
                                      : getFieldValidationError(column, editingValues)
                                    : "",
                                  invalid:
                                    (usesReferenceLeafLimit &&
                                      column.key === "noOfLeaves" &&
                                      groupingOutputLeafInvalid) ||
                                    (definition.slug === "sawing" &&
                                      (column.key === "cbm" || column.key === "width") &&
                                      sawingEditError.includes("CBM")) ||
                                    (definition.slug === "slicing" &&
                                      Boolean(slicingEditValidation.fieldErrors[column.key])) ||
                                    (definition.slug === "cnc-fluting" &&
                                      Boolean(flutingEditValidation.fieldErrors[column.key])) ||
                                    (definition.slug === "embossing" &&
                                      Boolean(embossingEditValidation.fieldErrors[column.key])),
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
            {definition.slug === "sawing" && sawingEditError.includes("CBM") ? (
              <Typography
                sx={(currentTheme) => ({
                  color: currentTheme.palette.error.main,
                  fontSize: "0.8125rem",
                  fontWeight: 500,
                  whiteSpace: "normal",
                })}
              >
                {sawingEditError}
              </Typography>
            ) : definition.slug === "slicing" && slicingEditValidation.message ? (
              <Typography
                sx={(currentTheme) => ({
                  color: currentTheme.palette.error.main,
                  fontSize: "0.8125rem",
                  fontWeight: 500,
                  whiteSpace: "normal",
                })}
              >
                {slicingEditValidation.message}
              </Typography>
            ) : definition.slug === "grouping" &&
              editingRowId &&
              groupingEditValidation.message ? (
              <Typography
                sx={(currentTheme) => ({
                  color: currentTheme.palette.error.main,
                  fontSize: "0.8125rem",
                  fontWeight: 500,
                  whiteSpace: "normal",
                })}
              >
                {groupingEditValidation.message}
              </Typography>
            ) : definition.slug === "splicing" &&
              editingRowId &&
              splicingEditValidation.message ? (
              <Typography
                sx={(currentTheme) => ({
                  color: currentTheme.palette.error.main,
                  fontSize: "0.8125rem",
                  fontWeight: 500,
                  whiteSpace: "normal",
                })}
              >
                {splicingEditValidation.message}
              </Typography>
            ) : definition.slug === "cnc-fluting" &&
              editingRowId &&
              flutingEditValidation.message ? (
              <Typography
                sx={(currentTheme) => ({
                  color: currentTheme.palette.error.main,
                  fontSize: "0.8125rem",
                  fontWeight: 500,
                  whiteSpace: "normal",
                })}
              >
                {flutingEditValidation.message}
              </Typography>
            ) : definition.slug === "embossing" &&
              editingRowId &&
              embossingEditValidation.message ? (
              <Typography
                sx={(currentTheme) => ({
                  color: currentTheme.palette.error.main,
                  fontSize: "0.8125rem",
                  fontWeight: 500,
                  whiteSpace: "normal",
                })}
              >
                {embossingEditValidation.message}
              </Typography>
            ) : null}
            </Box>
          </Stack>
        ) : null}

        {(
          <RejectAvailableDetailsTable
            disabledType={
              definition.slug === "sawing" ||
              definition.slug === "slicing" ||
              definition.slug === "grouping" ||
              definition.slug === "splicing" ||
              definition.slug === "cnc-fluting" ||
              definition.slug === "embossing"
            }
            title={
              definition.slug === "sawing" ||
              definition.slug === "slicing" ||
              definition.slug === "grouping" ||
              definition.slug === "splicing" ||
              definition.slug === "cnc-fluting" ||
              definition.slug === "embossing"
                ? "Available Details"
                : undefined
            }
            volumeMode={definition.slug === "sawing" || definition.slug === "slicing"}
            useHeight={definition.slug === "sawing" || definition.slug === "slicing"}
            editableDerived={definition.slug === "sawing"}
            lockMeasuredFields={
              definition.slug === "slicing" ||
              definition.slug === "grouping" ||
              definition.slug === "splicing" ||
              definition.slug === "cnc-fluting" ||
              definition.slug === "embossing"
            }
            hideAmount={
              definition.slug === "sawing" ||
              definition.slug === "slicing" ||
              definition.slug === "grouping" ||
              definition.slug === "splicing" ||
              definition.slug === "cnc-fluting" ||
              definition.slug === "embossing" ||
              definition.slug === "pressing" ||
              definition.slug === "finishing"
            }
            showLeafCount={usesReferenceLeafLimit}
            showSheetCount={
              definition.slug === "cnc-fluting" || definition.slug === "embossing"
            }
            fieldIssues={{
              ...getVisibleRejectAvailableValidationIssues(
                rejectAvailableValidationErrors,
                rejectAvailableSubmitAttempted,
              ),
              ...(groupingAvailableLeafInvalid
                ? {
                    noOfLeaves: {
                      message: groupingLeafLimitMessage,
                      severity: "error" as const,
                    },
                  }
                : {}),
            }}
            onChange={(key, value) => {
              if (
                (definition.slug === "grouping" ||
                  definition.slug === "splicing" ||
                  definition.slug === "cnc-fluting" ||
                  definition.slug === "embossing") &&
                key !== "remark"
              ) {
                return;
              }
              setRejectAvailableValues((current) =>
                getNextRejectAvailableValues(
                  current,
                  key,
                  value,
                  definition.slug === "sawing" || definition.slug === "slicing",
                  definition.slug === "sawing" || definition.slug === "slicing",
                ),
              );
            }}
            values={rejectAvailableValues}
          />
        )}

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
            onClick={handleCancel}
            sx={recordFormActionButtonSx}
          >
            Cancel
          </Button>

          <Button
            type="button"
            variant="contained"
            disableElevation
            disabled={
              sawingStockUnavailable ||
              slicingStockUnavailable ||
              (definition.slug === "grouping" && groupingReferenceLeaves <= 0) ||
              (definition.slug === "splicing" && groupingReferenceLeaves <= 0) ||
              (definition.slug === "cnc-fluting" && flutingReferenceSheets <= 0) ||
              (definition.slug === "embossing" && embossingReferenceSheets <= 0)
            }
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
              const slicingDraftHasValues =
                definition.slug === "slicing" &&
                Boolean(
                  draftValues.thickness?.trim() ||
                    draftValues.height?.trim() ||
                    draftValues.noOfLeaves?.trim() ||
                    draftValues.noOfSheets?.trim(),
                );
              const draftErrors = getLineItemValidationErrors(
                lineItemColumns,
                draftValues,
              );
              const editingErrors = getLineItemValidationErrors(
                lineItemColumns,
                editingValues,
              );
              const lineItemsInvalid =
                definition.slug === "marquetry"
                  ? selectedMarquetryRows.length === 0 ||
                    selectedMarquetryRows.some((row) =>
                      Boolean(
                        getMarquetryLeavesUsedError(
                          marquetryDrafts[String(row.id)]?.leavesUsed ?? "",
                          row.availableLeaves,
                          true,
                        ),
                      ),
                    )
                  : definition.slug === "pressing"
                    ? selectedPressingRows.length === 0
                  : lineItems.length === 0 ||
                    ((definition.slug === "slicing"
                      ? slicingDraftHasValues
                      : draftHasValues) && hasValidationErrors(draftErrors)) ||
                    Boolean(editingRowId && hasValidationErrors(editingErrors));
              const quantityInvalid =
                definition.slug !== "splicing" &&
                definition.slug !== "cnc-fluting" &&
                definition.slug !== "embossing" &&
                !isSplicingEdit &&
                Boolean(quantityOverflowError);
              const rejectAvailableInvalid =
                hasRejectAvailableValidationErrors(rejectAvailableValidationErrors) ||
                Boolean(groupingLeafLimitMessage);
              const orderDetailsInvalid =
                usesOrderSelection &&
                isMarquetryOrderDetailsInvalid(marquetryOrderDetails);
              const pressingPurposeInvalid =
                definition.slug === "pressing" &&
                (pressingPurpose === "" ||
                  (pressingPurpose === "Order" &&
                    (!pressingOrderNo || !pressingOrderItemNo)) ||
                  (pressingPurpose === "Sample Sheet" && !pressingSampleNo));

              const sawingRowsForSubmit =
                definition.slug === "sawing" && sawingSource
                  ? lineItems.map((row) =>
                      row.id === editingRowId
                        ? {
                            ...row,
                            values: lockSawingProcessDetailValues(
                              editingValues,
                              sourceRow as Record<string, unknown> | undefined,
                            ),
                          }
                        : row,
                    )
                  : lineItems;
              const sawingValidationError =
                definition.slug === "sawing" && sawingSource
                  ? getSawingCreateSubmitError(sawingSource, sawingRowsForSubmit) ||
                    (draftValues.thickness?.trim()
                      ? getSawingProcessDetailError({
                          committing: true,
                          otherProcessedCbm: sumSawingLineCbm(
                            sawingRowsForSubmit,
                            sawingSource,
                          ),
                          source: sawingSource,
                          values: draftValues,
                        })
                      : "")
                  : "";
              const slicingPendingDraftError =
                definition.slug === "slicing" && slicingDraftHasValues
                  ? validateSlicingRow({
                      committing: true,
                      otherConsumedCbm: slicingConsumedCbm,
                      sourceRow: slicingSource,
                      values: draftValues,
                    }).message
                  : "";
              const slicingValidationError =
                definition.slug === "slicing"
                  ? slicingPendingDraftError ||
                    (editingRowId
                      ? "Save or cancel the edited Process Detail row before saving."
                      : getSlicingCreateSubmitError(
                          slicingSource,
                          lineItems,
                          rejectAvailableValues,
                        ))
                  : "";
              const groupingValidationError =
                definition.slug === "grouping"
                  ? editingRowId
                    ? "Save or cancel the edited Process Detail row before saving."
                    : groupingDraftHasLeaves
                      ? "Add the current Process Detail item before saving."
                      : validateGroupingForm({
                          availableValues: rejectAvailableValues,
                          items: lineItems,
                          sourceAvailableLeaves: groupingReferenceLeaves,
                          sourceRow: sourceRow as Record<string, unknown> | undefined,
                        })
                  : "";
              const splicingValidationError =
                definition.slug === "splicing"
                  ? editingRowId
                    ? "Save or cancel the edited Process Detail row before saving."
                    : splicingDraftHasProcessValues
                      ? "Add the current Process Detail item before saving."
                      : validateSplicingForm({
                          availableValues: rejectAvailableValues,
                          items: lineItems,
                          sourceAvailableLeaves: groupingReferenceLeaves,
                          sourceRow: sourceRow as Record<string, unknown> | undefined,
                        })
                  : "";
              const flutingValidationError =
                definition.slug === "cnc-fluting"
                  ? editingRowId
                    ? "Save or cancel the edited Process Detail row before saving."
                    : flutingDraftHasSheets
                      ? "Add the current Process Detail item before saving."
                      : validateFlutingForm({
                          availableValues: rejectAvailableValues,
                          items: lineItems,
                          sourceAvailableSheets: flutingReferenceSheets,
                          sourceRow: sourceRow as Record<string, unknown> | undefined,
                        })
                  : "";
              const embossingValidationError =
                definition.slug === "embossing"
                  ? editingRowId
                    ? "Save or cancel the edited Process Detail row before saving."
                    : embossingDraftHasSheets
                      ? "Add the current Process Detail item before saving."
                      : validateEmbossingForm({
                          availableValues: rejectAvailableValues,
                          items: lineItems,
                          sourceAvailableSheets: embossingReferenceSheets,
                          sourceRow: sourceRow as Record<string, unknown> | undefined,
                        })
                  : "";

              if (
                lineItemsInvalid ||
                sawingValidationError ||
                slicingValidationError ||
                groupingValidationError ||
                splicingValidationError ||
                flutingValidationError ||
                embossingValidationError
              ) {
                setDraftSubmitAttempted(
                  lineItems.length === 0 ||
                    draftHasValues ||
                    Boolean(sawingValidationError) ||
                    Boolean(slicingValidationError),
                );
                setEditingSubmitAttempted(Boolean(editingRowId));
                if (sawingValidationError) {
                  setSawingSubmitError(sawingValidationError);
                }
                if (slicingValidationError) {
                  setSlicingSubmitError(slicingValidationError);
                }
                if (groupingValidationError) {
                  setGroupingSubmitError(groupingValidationError);
                }
                if (splicingValidationError) {
                  setSplicingSubmitError(splicingValidationError);
                }
                if (flutingValidationError) {
                  setFlutingSubmitError(flutingValidationError);
                }
                if (embossingValidationError) {
                  setEmbossingSubmitError(embossingValidationError);
                }
              }

              if (rejectAvailableInvalid) {
                setRejectAvailableSubmitAttempted(true);
              }

              if (
                hasRequiredFieldErrors(metadataFields, formValues) ||
                lineItemsInvalid ||
                Boolean(sawingValidationError) ||
                Boolean(slicingValidationError) ||
                Boolean(groupingValidationError) ||
                Boolean(splicingValidationError) ||
                Boolean(flutingValidationError) ||
                Boolean(embossingValidationError) ||
                quantityInvalid ||
                rejectAvailableInvalid ||
                orderDetailsInvalid ||
                pressingPurposeInvalid
              ) {
                return;
              }

              if (!isProcessEdit && quantityConfig && originalQuantity > 0) {
                appendFactoryProcessRun({
                  stageSlug: definition.slug,
                  sourceKey: sourceAllocationKey,
                  processedNow: currentProcessedQuantity,
                  wastageNow: 0,
                  pendingBalance: Math.max(0, balanceSummary.balanceQuantity),
                  remark: "",
                });
              }

              if (isSplicingEdit && splicingEditRow) {
                const workItemId =
                  (typeof splicingEditRow.workItemId === "string" &&
                    splicingEditRow.workItemId) ||
                  (String(splicingEditRow.id).startsWith("factory-work-")
                    ? String(splicingEditRow.id)
                    : "");
                const primaryLine = lineItems[0];
                const calculatedPrimaryLine = primaryLine
                  ? calculateSplicingRow(primaryLine.values)
                  : undefined;
                if (workItemId) {
                  completeFactoryIssuedWork(workItemId, {
                    ...(splicingEditRow as Record<string, unknown>),
                    ...formValues,
                    ...(calculatedPrimaryLine ?? {}),
                    ...(calculatedPrimaryLine ? { values: calculatedPrimaryLine } : {}),
                    listingState: "done",
                  });
                }
                navigate(listPath);
                return;
              }

              if (isMappedOutputSlug(definition.slug)) {
                const mappedWorkItemId =
                  locationState?.workItemId ||
                  (typeof sourceRow?.workItemId === "string"
                    ? sourceRow.workItemId
                    : undefined);
                const mappedSampleNo =
                  locationState?.sampleNo ||
                  (typeof sourceRow?.sampleNo === "string" ? sourceRow.sampleNo : undefined);

                if (!isMappedOutputEdit && mappedSampleNo) {
                  markSampleProcessDone(mappedSampleNo, definition.slug);
                }

                saveMappedOutputProcess({
                  formValues,
                  isEdit: isMappedOutputEdit,
                  lineItems:
                    definition.slug === "cnc-fluting"
                      ? lineItems.map((item) => ({
                          ...item,
                          values: calculateFlutingRow(item.values),
                        }))
                      : definition.slug === "embossing"
                        ? lineItems.map((item) => ({
                            ...item,
                            values: calculateEmbossingRow(item.values),
                          }))
                      : lineItems,
                  listPath: isMappedOutputEdit ? listPath : `${paths.list}?tab=done`,
                  navigate,
                  originalRows: mappedOutputEditContext?.rows ?? [],
                  slug: definition.slug,
                  sourceRow,
                  title: definition.title,
                  workItemId: mappedWorkItemId,
                });
                return;
              }

              if (definition.slug === "grouping") {
                if (isGroupingEdit && groupingEditRow) {
                  const workItemId =
                    (typeof groupingEditRow.workItemId === "string" &&
                      groupingEditRow.workItemId) ||
                    (String(groupingEditRow.id).startsWith("factory-work-")
                      ? String(groupingEditRow.id)
                      : "");
                  const primaryLine = lineItems[0];
                  const calculatedPrimaryLine = primaryLine
                    ? calculateGroupingRow(primaryLine.values)
                    : undefined;
                  const existingGroupNo =
                    getExistingGroupNo(groupingEditRow as Record<string, unknown>) ||
                    (typeof groupingEditRow.groupNo === "string" ? groupingEditRow.groupNo : "");
                  const updatedSnapshot: Record<string, unknown> = {
                    ...(groupingEditRow as Record<string, unknown>),
                    ...formValues,
                    ...(calculatedPrimaryLine ?? {}),
                    ...(existingGroupNo ? { groupNo: existingGroupNo } : {}),
                    listingState: "done",
                  };
                  if (workItemId) {
                    completeFactoryIssuedWork(workItemId, updatedSnapshot);
                  } else {
                    const issued = issueFactoryWork({
                      destinationProcess: "Grouping",
                      sourceProcess: "Grouping",
                      sourceRow: {
                        ...(updatedSnapshot as FactoryRecord),
                        id: String(groupingEditRow.id),
                      },
                      sourceSlug: "grouping",
                    });
                    completeFactoryIssuedWork(issued.id, updatedSnapshot);
                  }
                  navigate(listPath);
                  return;
                }

                const groupingWorkItemId =
                  locationState?.workItemId ||
                  (typeof sourceRow?.workItemId === "string"
                    ? sourceRow.workItemId
                    : undefined);
                const groupNo =
                  getExistingGroupNo(sourceRow as Record<string, unknown> | undefined) ||
                  allocateNextGroupNo();
                const groupedSource = {
                  ...(sourceRow as Record<string, unknown> | undefined),
                  groupNo,
                };

                lineItems.forEach((lineItem, index) => {
                  const calculatedLineValues = calculateGroupingRow(lineItem.values);
                  const resultSnapshot: Record<string, unknown> = {
                    ...(sourceRow ?? {}),
                    ...formValues,
                    ...calculatedLineValues,
                    groupNo,
                    listingState: "done",
                  };
                  applyGroupingCreateSnapshot(resultSnapshot, groupedSource);

                  if (index === 0 && groupingWorkItemId) {
                    completeFactoryIssuedWork(groupingWorkItemId, resultSnapshot);
                    return;
                  }

                  const { workItemId: _groupingWorkItemId, ...issuedSourceFields } =
                    resultSnapshot;
                  const issued = issueFactoryWork({
                    destinationProcess: "Grouping",
                    sourceProcess: "Grouping",
                    sourceRow: {
                      ...(issuedSourceFields as FactoryRecord),
                      id: `grouping-line-${lineItem.id}`,
                    },
                    sourceSlug: "grouping",
                  });
                  completeFactoryIssuedWork(issued.id, resultSnapshot);
                });
                navigate(paths.list);
                return;
              }

              if (definition.slug === "marquetry") {
                const processId =
                  marquetryEditContext?.processId || `marquetry-${Date.now()}`;
                const previousIds = new Set(
                  (marquetryEditContext?.rows ?? []).map((row) => String(row.id)),
                );
                const nextIds = new Set(
                  selectedMarquetryRows.map((row) => String(row.id)),
                );

                if (isMarquetryEdit) {
                  previousIds.forEach((id) => {
                    if (!nextIds.has(id)) {
                      reopenMarquetryIssuedWork(id);
                    }
                  });
                }

                selectedMarquetryRows.forEach((row) => {
                  const selectedWorkItemId = readMarquetryWorkItemId(row);
                  if (!selectedWorkItemId) {
                    return;
                  }
                  const draft = marquetryDrafts[String(row.id)] ?? {
                    leavesUsed: "",
                    remark: "",
                  };
                  const usedArea = calculateMarquetryUsedArea(
                    row.length,
                    row.width,
                    draft.leavesUsed,
                  );
                  applyMarquetryProcessResult(selectedWorkItemId, {
                    ...(row as Record<string, unknown>),
                    ...formValues,
                    ...(usesOrderSelection ? marquetryOrderDetails : {}),
                    leavesUsed: draft.leavesUsed,
                    remark: draft.remark,
                    sqfUsed: usedArea.sqf,
                    sqmUsed: usedArea.sqm,
                    listingState: "done",
                    marquetryProcessId: processId,
                  });
                });
                navigate(isMarquetryEdit ? listPath : paths.list);
                return;
              }

              if (definition.slug === "pressing") {
                const pressingForSample = pressingPurpose === "Sample Sheet";
                const pressingOrder = orderRecords.find(
                  (entry) => entry.orderNo === pressingOrderNo,
                );

                selectedPressingRows.forEach((row) => {
                  const resultSnapshot: Record<string, unknown> = {
                    ...(row as Record<string, unknown>),
                    ...formValues,
                    for: pressingForSample ? "Sample" : "Order",
                    forLabel: pressingForSample ? "Sample" : "Order",
                    listingState: "done",
                    pressingFor: pressingPurpose,
                    purpose: pressingForSample ? "SAMPLE" : "ORDER",
                  };

                  if (pressingForSample) {
                    resultSnapshot.sampleNo = pressingSampleNo;
                  }

                  if (pressingOrder && pressingPurpose === "Order") {
                    resultSnapshot.orderNo = pressingOrder.orderNo;
                    resultSnapshot.orderDate = pressingOrder.orderDate;
                    resultSnapshot.customerName = pressingOrder.customerName;
                    resultSnapshot.orderItemNo = pressingOrderItemNo;
                  }

                  const selectedWorkItemId =
                    typeof row.workItemId === "string"
                      ? row.workItemId
                      : String(row.id).startsWith("factory-work-")
                        ? String(row.id)
                        : "";

                  if (selectedWorkItemId) {
                    completeFactoryIssuedWork(selectedWorkItemId, resultSnapshot);
                    return;
                  }

                  const issued = issueFactoryWork({
                    destinationProcess: "Pressing",
                    sourceProcess: "Pressing",
                    sourceRow: row,
                    sourceSlug: "pressing",
                  });
                  completeFactoryIssuedWork(issued.id, resultSnapshot);
                });

                if (pressingOrder && pressingPurpose === "Order") {
                  if (pressingOrder.status === "Draft" || pressingOrder.status === "Confirmed") {
                    updateOrderRecord(pressingOrder.id, { status: "In Production" });
                  }
                }

                navigate(paths.list);
                return;
              }

              const workItemId =
                locationState?.workItemId ||
                (typeof sourceRow?.workItemId === "string"
                  ? sourceRow.workItemId
                  : undefined);

              if (workItemId) {
                const primaryLineItem = lineItems[0];
                const splicingPrimaryValues =
                  definition.slug === "splicing" && primaryLineItem
                    ? calculateSplicingRow(primaryLineItem.values)
                    : undefined;
                const resultSnapshot: Record<string, unknown> = {
                  ...(sourceRow ?? {}),
                  ...formValues,
                  ...(usesOrderSelection ? marquetryOrderDetails : {}),
                  ...(splicingPrimaryValues
                    ? {
                        ...splicingPrimaryValues,
                        values: splicingPrimaryValues,
                      }
                    : primaryLineItem
                    ? Object.fromEntries(
                      Object.entries(primaryLineItem).filter(
                        ([key]) => key !== "id",
                      ),
                    )
                    : {}),
                };

                if (definition.slug === "grouping") {
                  applyGroupingCreateSnapshot(
                    resultSnapshot,
                    sourceRow as Record<string, unknown> | undefined,
                  );
                } else {
                  const carriedGroupNo = getExistingGroupNo(
                    sourceRow as Record<string, unknown> | undefined,
                  );
                  if (carriedGroupNo) {
                    resultSnapshot.groupNo = carriedGroupNo;
                  }
                }

                if (definition.slug === "pressing") {
                  const pressingForSample = pressingPurpose === "Sample Sheet";
                  const pressingOrder = orderRecords.find(
                    (entry) => entry.orderNo === pressingOrderNo,
                  );
                  const pressingLine =
                    pressingOrder && pressingPurpose === "Order"
                      ? getPressingOrderLine(pressingOrder, pressingOrderItemNo)
                      : null;
                  resultSnapshot.for = pressingForSample ? "Sample" : "Order";
                  resultSnapshot.forLabel = pressingForSample ? "Sample" : "Order";
                  resultSnapshot.purpose = pressingForSample ? "SAMPLE" : "ORDER";
                  resultSnapshot.pressingFor = pressingPurpose;
                  if (pressingForSample) {
                    resultSnapshot.sampleNo = pressingSampleNo;
                  }
                  if (pressingOrder && pressingLine) {
                    resultSnapshot.orderNo = pressingOrder.orderNo;
                    resultSnapshot.orderDate = pressingOrder.orderDate;
                    resultSnapshot.customerName = pressingOrder.customerName;
                    resultSnapshot.orderItemNo = pressingOrderItemNo;
                    resultSnapshot.itemName =
                      pressingLine.itemName || pressingLine.salesItemName;
                    resultSnapshot.itemSubCategory = pressingLine.subCategory;
                    resultSnapshot.grade = pressingLine.grade;
                    resultSnapshot.length = pressingLine.length;
                    resultSnapshot.width = pressingLine.width;
                    resultSnapshot.thickness = pressingLine.thickness;
                    resultSnapshot.noOfSheets = pressingLine.quantitySheets;

                    if (pressingOrder.status === "Draft" || pressingOrder.status === "Confirmed") {
                      updateOrderRecord(pressingOrder.id, { status: "In Production" });
                    }
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

              if (!isProcessEdit && sampleNo) {
                markSampleProcessDone(sampleNo, definition.slug);
              }

              if (definition.slug === "sawing") {
                saveSawingCreateProcess({
                  formValues,
                  lineItems,
                  locationState: locationState as Record<string, any> | null,
                  navigate,
                  rejectAvailableValues,
                  sourceRow: sourceRow as Record<string, any> | undefined,
                  workItemId,
                });
                return;
              }

              if (definition.slug === "slicing") {
                persistSlicingProcess();
                return;
              }

              navigate(listPath);
            }}
          >
            {isProcessEdit ? "Update" : "Save Process"}
          </Button>
        </Box>
      </Stack>

      <ConfirmationDialog
        cancelLabel="Stay on Page"
        confirmLabel="Leave"
        description={leaveConfirmation.description}
        onClose={() => setLeaveConfirmation((current) => ({ ...current, open: false }))}
        onConfirm={() => {
          const action = leaveConfirmation.action;
          setLeaveConfirmation((current) => ({ ...current, open: false }));
          action();
        }}
        open={leaveConfirmation.open}
        title={leaveConfirmation.title}
        tone="default"
      />
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
      ...(slug === "cnc-fluting" || slug === "embossing"
        ? { required: true }
        : {}),
    },
  ];

  // Group No. is assigned only in Grouping; later processes show it read-only when present.
  if (slug === "grouping") {
    prependGroupingGroupNoField(headerFields);
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
    return slicingCreateSourceColumns;
  }

  if (slug === "drying") {
    return dryingCreateSourceColumns;
  }

  if (slug === "grouping") {
    return groupingCreateSourceColumns;
  }

  if (slug === "splicing") {
    return splicingCreateSourceColumns;
  }

  if (slug === "cnc-fluting") {
    return cncFlutingCreateSourceColumns;
  }

  if (slug === "embossing") {
    return embossingCreateSourceColumns;
  }

  if (slug === "sawing") {
    return sourceColumnDefinitions.map((column) =>
      column.key === "batchNo" ? { ...column, label: "Log No." } : column,
    );
  }

  return sourceColumnDefinitions.filter((column) => {
    if (slug === "drying" && column.key === "remark") {
      return false;
    }

    if (slug === "grouping" && groupingHiddenSourceKeys.has(column.key)) {
      return false;
    }

    if (slug === "marquetry" && marquetryHiddenSourceKeys.has(column.key)) {
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

function buildMarquetryOrderOverviewItems(
  orderRecords: readonly OrderRecord[],
  details: MarquetryOrderDetailsValue,
) {
  const order =
    orderRecords.find((entry) => entry.orderNo === details.orderNo) ??
    orderRecords[0];
  const lineItems = order ? getOrderLineItems(order.id) : [];
  const itemIndex = Math.max(0, Number(details.orderItemNo || "1") - 1);
  const line = lineItems[itemIndex] ?? lineItems[0];
  const text = (value: unknown) => formatSourceValue(value) || "-";

  return [
    { label: "Order No", value: text(order?.orderNo) },
    { label: "Order Date", value: text(order?.orderDate) },
    { label: "Customer Name", value: text(order?.customerName) },
    { label: "Order Item No", value: details.orderItemNo || "1" },
    { label: "Item Name", value: text(line?.itemName ?? order?.itemName) },
    { label: "Sub Category", value: text(line?.subCategory ?? order?.subCategory) },
    { label: "Grade", value: text(line?.grade ?? order?.grade) },
    { label: "Length", value: text(line?.length ?? order?.length) },
    { label: "Width", value: text(line?.width ?? order?.width) },
    { label: "Thickness", value: text(line?.thickness ?? order?.thickness) },
    { label: "No of Sheets", value: text(line?.quantitySheets ?? order?.quantitySheets) },
    { label: "SQM", value: text(line?.sqm ?? order?.sqm) },
    { label: "SQF", value: text(line?.totalSqm ?? order?.totalSqm) },
  ];
}

function buildSourceOverviewItems(
  sourceRow: SourceRow | undefined,
  columns: readonly SourceColumnDefinition[],
  omitEmpty = false,
) {
  const items: Array<{ label: string; value: string }> = [];

  columns.forEach((column) => {
    const rawValue = getSourceValue(sourceRow, column.keys);
    let value = formatSourceValue(rawValue);

    if (!value || value.trim() === "") {
      if (omitEmpty) {
        return;
      }
      value = "-";
    }

    items.push({
      label: sourceOverviewLabelOverrides[column.key] ?? column.label,
      value,
    });
  });

  return items;
}



function buildLineItemFields(
  slug: string,
  fields: readonly MasterFieldDefinition[],
  sourceRow?: SourceRow,
) {
  if (slug === "sawing") {
    return dedupeFields(fields.filter((field) => !metadataKeys.has(field.key)));
  }

  const presetFields = slug === "drying" ? dryingCreateLineItemFields : undefined;

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
        ...(slug === "drying" ? ["itemName"] : []),
        "itemSubCategory",
        "ratePerSqf",
        "amount",
      ]);
      if (slug === "slicing") {
        processExcludedKeys.add("subCategory");
        processExcludedKeys.add("logCode");
        processExcludedKeys.add("logNo");
        processExcludedKeys.add("grade");
        processExcludedKeys.add("storageSrNo");
        processExcludedKeys.add("createdBy");
        processExcludedKeys.add("createdAt");
        processExcludedKeys.add("updatedBy");
        processExcludedKeys.add("updatedAt");
      }
      return ordered.filter((field) => !processExcludedKeys.has(field.key));
    }

    if (slug === "grouping") {
      const processExcludedKeys = new Set([
        "bundleNumber",
        "noOfBundle",
        "palletNo",
        "palletNumber",
        "ratePerSqf",
        "amount",
      ]);
      return ordered.filter((field) => !processExcludedKeys.has(field.key));
    }

    if (
      slug === "splicing" ||
      slug === "pressing" ||
      slug === "cnc-fluting" ||
      slug === "embossing" ||
      slug === "finishing"
    ) {
      const processExcludedKeys = new Set(["ratePerSqf", "amount", "consumedAmount"]);
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
  if (slug === "cnc-fluting") {
    return orderCncFlutingCreateFields(fields);
  }

  if (slug === "embossing") {
    return orderEmbossingCreateFields(fields);
  }

  if (slug === "grouping") {
    return orderGroupingCreateFields(fields);
  }

  if (slug === "splicing") {
    return orderSplicingCreateFields(fields);
  }

  if (slug === "slicing") {
    return orderSlicingCreateFields(fields);
  }

  return [...fields];
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

function buildDefaultSlicingLineItemValues(
  fields: readonly MasterFieldDefinition[],
  sourceRow?: SourceRow,
) {
  return applySlicingDerivedAreas({
    ...buildDefaultLineItemValues(fields, sourceRow),
    height: "",
    thickness: "",
    noOfLeaves: "",
    noOfSheets: "",
    cbm: "",
    cbf: "",
    sqm: "",
    sqf: "",
  });
}

function buildDefaultGroupingLineItemValues(
  fields: readonly MasterFieldDefinition[],
  sourceRow?: SourceRow,
) {
  const defaults = buildDefaultLineItemValues(fields, sourceRow);
  return calculateGroupingRow({
    ...defaults,
    length: normalizeGroupingSourceDimension(sourceRow?.length ?? defaults.length),
    width: normalizeGroupingSourceDimension(sourceRow?.width ?? defaults.width),
    height: normalizeGroupingSourceDimension(
      sourceRow?.height ?? sourceRow?.thickness ?? defaults.height,
    ),
    noOfLeaves: "",
    sqm: "",
    sqf: "",
  });
}

function buildDefaultSplicingLineItemValues(
  fields: readonly MasterFieldDefinition[],
  sourceRow?: SourceRow,
) {
  return calculateSplicingRow({
    ...buildDefaultLineItemValues(fields, sourceRow),
    noOfLeaves: "",
    noOfSheets: "",
    sqm: "",
    sqf: "",
  });
}

function buildDefaultFlutingLineItemValues(
  fields: readonly MasterFieldDefinition[],
  sourceRow?: SourceRow,
) {
  const defaults = buildDefaultLineItemValues(fields, sourceRow);
  return calculateFlutingRow({
    ...defaults,
    color: getPreferredFieldValue(sourceRow, "cutColor") || defaults.color || "",
    length: normalizeFlutingSourceDimension(sourceRow?.length ?? defaults.length),
    width: normalizeFlutingSourceDimension(sourceRow?.width ?? defaults.width),
    height: normalizeFlutingSourceDimension(
      sourceRow?.height ?? sourceRow?.thickness ?? defaults.height,
    ),
    noOfSheets: "",
    sqm: "",
    sqf: "",
  });
}

function buildDefaultEmbossingLineItemValues(
  fields: readonly MasterFieldDefinition[],
  sourceRow?: SourceRow,
) {
  const defaults = buildDefaultLineItemValues(fields, sourceRow);
  return calculateEmbossingRow({
    ...defaults,
    color: getPreferredFieldValue(sourceRow, "cutColor") || defaults.color || "",
    length: normalizeEmbossingSourceDimension(
      sourceRow?.length ?? defaults.length,
    ),
    width: normalizeEmbossingSourceDimension(sourceRow?.width ?? defaults.width),
    height: normalizeEmbossingSourceDimension(
      sourceRow?.height ?? sourceRow?.thickness ?? defaults.height,
    ),
    noOfSheets: "",
    sqm: "",
    sqf: "",
  });
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

function mapFieldToColumn(
  field: MasterFieldDefinition,
  slug?: string,
): LineItemColumnDefinition {
  return {
    key: field.key,
    label: field.label,
    minWidth:
      field.key === "itemName" && (slug === "grouping" || slug === "slicing")
        ? 220
        : field.key === "groupPhoto"
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
  invalid = false,
  onChange,
  theme,
  value,
}: {
  column: LineItemColumnDefinition;
  errorText?: string;
  invalid?: boolean;
  onChange: (value: string) => void;
  theme: Theme;
  value: string;
}) {
  const hasError = Boolean(errorText) || invalid;
  if (column.readOnly) {
    return renderReadOnlyCell(value, theme);
  }

  if (column.type === "select") {
    return (
      <ErpSelectField
        helperText={errorText}
        onChange={onChange}
        options={column.options ?? []}
        state={hasError ? "error" : "default"}
        value={value}
      />
    );
  }

  if (column.type === "file") {
    return (
      <TextField
        error={hasError}
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
        sx={getCompactFieldSx(theme, hasError ? "error" : "default")}
      />
    );
  }

  return (
    <TextField
      error={hasError}
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
      sx={getCompactFieldSx(theme, hasError ? "error" : "default")}
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
function renderReadOnlyCell(value: string, theme: Theme, invalid = false) {
  return (
    <Typography
      variant="body2"
      color={invalid ? "error" : "text.primary"}
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
