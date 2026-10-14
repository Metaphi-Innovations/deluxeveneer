import type { MasterFieldValue } from "../../masters/shared";

import { completeFactoryIssuedWork } from "../shared/factoryIssuedWorkStore";
import {
  createEmptyRejectAvailableValues,
  type RejectAvailableValues,
} from "../shared/RejectAvailableDetailsTable";
import {
  addSawingDoneItems,
  replaceSawingDoneItems,
  updateSawingIssuedAvailability,
} from "./sawingFrontendStore";

export const sawingProcessDate = {
  key: "processDate",
  label: "Sawing Date",
  aliases: ["issueDate", "issuedDate"],
} as const;

type SawingCreateLineItem = {
  id?: string;
  values: Record<string, string>;
};

type LineItemRecord = SawingCreateLineItem;

export const SAWING_CBM_EPSILON = 0.000001;

export function numericField(value: unknown) {
  const parsed = Number(String(value ?? "").replace(/[^\d.]/g, ""));
  return Number.isFinite(parsed) ? parsed : 0;
}

export type SawingSourceMeasures = {
  sourceAvailableCbm: number;
  sourceHeight: number;
  sourceLength: number;
  sourceReceivedCbm: number;
  sourceWidth: number;
};

export function readSawingSourceMeasures(
  sourceRow: Record<string, unknown> | undefined,
): SawingSourceMeasures {
  return {
    sourceLength: numericField(sourceRow?.length),
    sourceWidth: numericField(sourceRow?.width),
    sourceHeight: numericField(sourceRow?.height ?? sourceRow?.thickness),
    sourceReceivedCbm: numericField(sourceRow?.receivedCbm),
    sourceAvailableCbm: numericField(sourceRow?.availableCbm),
  };
}

export function formatSawingNumber(value: number, digits: number) {
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

export function lineSawingCbm(
  values: Record<string, string>,
  source: SawingSourceMeasures,
) {
  const length = numericField(values.length) || source.sourceLength;
  const widthText = String(values.width ?? "").trim();
  const width = widthText ? numericField(widthText) : source.sourceWidth;
  const thickness = numericField(values.thickness || values.height);
  return volumeFromDimensions(length, width, thickness);
}

export function sumSawingLineCbm(
  lineItems: readonly LineItemRecord[],
  source: SawingSourceMeasures,
) {
  return lineItems.reduce(
    (sum, item) => sum + lineSawingCbm(item.values, source),
    0,
  );
}

function formatAvailableCbmMessage(value: number) {
  return (value > 0 ? value : 0).toFixed(3);
}

export function getSawingProcessDetailError({
  committing = false,
  otherProcessedCbm,
  source,
  values,
}: {
  committing?: boolean;
  otherProcessedCbm: number;
  source: SawingSourceMeasures;
  values: Record<string, string>;
}) {
  if (source.sourceAvailableCbm <= SAWING_CBM_EPSILON) {
    return "No CBM is available for Sawing.";
  }

  const thicknessText = (values.thickness ?? "").trim();
  if (!thicknessText) {
    return committing ? "Thickness is required and must be greater than 0." : "";
  }

  const thickness = numericField(thicknessText);
  if (!(thickness > 0)) {
    return "Thickness is required and must be greater than 0.";
  }

  const widthText = (values.width ?? "").trim();
  if (!widthText || !(numericField(widthText) > 0)) {
    return "Width is required and must be greater than 0.";
  }

  if (!(source.sourceLength > 0)) {
    return "Source length is required to calculate sawing quantity.";
  }

  const rowCbm = lineSawingCbm(values, source);
  if (!(rowCbm > 0)) {
    return "Calculated CBM must be greater than 0.";
  }

  const remainingCbm = source.sourceAvailableCbm - otherProcessedCbm;
  const availableLabel = formatAvailableCbmMessage(remainingCbm);

  if (otherProcessedCbm + rowCbm - source.sourceAvailableCbm > SAWING_CBM_EPSILON) {
    return `Sawing quantity exceeds available CBM. Available CBM: ${availableLabel}`;
  }

  return "";
}

export function getSawingAvailableCbmIssue(
  slug: string,
  availableCbm: string | undefined,
  source: SawingSourceMeasures | null,
  outputCbm: number,
) {
  if (slug !== "sawing" || !source) {
    return {};
  }

  const enteredText = (availableCbm ?? "").trim();
  if (!enteredText) {
    return {};
  }

  const entered = numericField(enteredText);
  const sourceCbm = source.sourceAvailableCbm;
  const output = outputCbm > 0 ? outputCbm : 0;
  const remaining = Math.max(0, sourceCbm - output);
  if (entered - remaining <= SAWING_CBM_EPSILON) {
    return {};
  }

  return {
    cbm: {
      message: `Available CBM cannot exceed ${remaining.toFixed(3)}. Source CBM is ${sourceCbm.toFixed(3)} and selected output details use ${output.toFixed(3)}.`,
      severity: "warning" as const,
    },
  };
}

export function getSawingCreateSubmitError(
  source: SawingSourceMeasures,
  lineItems: readonly LineItemRecord[],
) {
  if (source.sourceAvailableCbm <= SAWING_CBM_EPSILON) {
    return "No CBM is available for Sawing.";
  }

  if (lineItems.length === 0) {
    return "Add at least one output detail before creating sawing.";
  }

  for (const item of lineItems) {
    const otherProcessedCbm = sumSawingLineCbm(
      lineItems.filter((row) => row.id !== item.id),
      source,
    );
    const error = getSawingProcessDetailError({
      committing: true,
      otherProcessedCbm,
      source,
      values: item.values,
    });
    if (error) {
      return error;
    }
  }

  const totalProcessedCbm = sumSawingLineCbm(lineItems, source);
  const remainingCbm = source.sourceAvailableCbm - totalProcessedCbm;
  if (
    totalProcessedCbm - source.sourceAvailableCbm > SAWING_CBM_EPSILON ||
    remainingCbm < -SAWING_CBM_EPSILON
  ) {
    return `Sawing quantity exceeds available CBM. Available CBM: ${formatAvailableCbmMessage(remainingCbm)}`;
  }

  return "";
}

function isPlainSawingMeasure(value: string | undefined) {
  return /^\d+(?:\.\d+)?$/u.test(String(value ?? "").trim());
}

export function lockSawingProcessDetailValues(
  values: Record<string, string>,
  sourceRow: Record<string, unknown> | undefined,
) {
  const source = readSawingSourceMeasures(sourceRow);
  return calculateSawingVolumeValues({
    ...values,
    ...(source.sourceLength > 0
      ? { length: formatSawingNumber(source.sourceLength, 3) }
      : {}),
    ...(source.sourceWidth > 0 && !isPlainSawingMeasure(values.width)
      ? { width: formatSawingNumber(source.sourceWidth, 3) }
      : {}),
  });
}

export function buildSawingAvailableValues(
  sourceRow: Record<string, unknown> | undefined,
  lineItems: readonly LineItemRecord[],
): RejectAvailableValues {
  const empty = createEmptyRejectAvailableValues();
  const source = readSawingSourceMeasures(sourceRow);
  const processedCbm = sumSawingLineCbm(lineItems, source);
  let remainingCbm = source.sourceAvailableCbm - processedCbm;
  if (Math.abs(remainingCbm) <= SAWING_CBM_EPSILON || remainingCbm < 0) {
    remainingCbm = 0;
  }

  const height =
    source.sourceLength > 0 && source.sourceWidth > 0
      ? heightFromAvailableVolume(source.sourceLength, source.sourceWidth, remainingCbm)
      : 0;

  return {
    ...empty,
    type: "Available",
    length: source.sourceLength > 0 ? formatSawingNumber(source.sourceLength, 3) : "",
    width: source.sourceWidth > 0 ? formatSawingNumber(source.sourceWidth, 3) : "",
    height: formatSawingNumber(height, 3),
    thickness: "",
    cbm: remainingCbm.toFixed(3),
    cbf: (remainingCbm * 35.3147).toFixed(3),
  };
}

function readEditedAvailableNumber(value: string | undefined) {
  const parsed = Number.parseFloat(value ?? "");
  return Number.isFinite(parsed) ? parsed : undefined;
}

function heightFromAvailableVolume(length: number, width: number, cbm: number) {
  if (length <= 0 || width <= 0 || cbm <= 0) return 0;
  return (cbm * sawingVolumeDivisor(length, width, 0)) / (length * width);
}

function positiveDimension(value: unknown) {
  const parsed = numericField(value);
  return parsed > 0 ? parsed : 0;
}

export function calculateSawingVolumeValues(values: Record<string, string>) {
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
    cbm: cbm.toFixed(3),
    cbf: cbf.toFixed(3),
    availableCbm: availCbm ? availCbm.toFixed(6).replace(/\.?0+$/u, "") : (recCbmVal > 0 ? "0" : (values.availableCbm ?? "")),
    ...(amount ? { amount } : {}),
  };
}

export function applySawingVolumeCalculation(
  slug: string,
  values: Record<string, string>,
) {
  return slug === "sawing" ? calculateSawingVolumeValues(values) : values;
}

export function saveSawingCreateProcess({
  formValues,
  lineItems,
  locationState,
  navigate,
  rejectAvailableValues,
  sourceRow,
  workItemId,
}: {
  formValues: Record<string, MasterFieldValue>;
  lineItems: readonly SawingCreateLineItem[];
  locationState: Record<string, any> | null;
  navigate: (path: string) => void;
  rejectAvailableValues: RejectAvailableValues;
  sourceRow: Record<string, any> | undefined;
  workItemId: string | undefined;
}) {
const sawingSource = sourceRow as Record<string, any> | undefined;
const locState = locationState as Record<string, any> | null;
const issueItemId = locState?.issueItemId || sawingSource?.id;
const issueId = locState?.issueId || sawingSource?.issueId;
const storageWarehouseId = locState?.storageWarehouseId || sawingSource?.storageWarehouseId;

const sourceMeasures = readSawingSourceMeasures(sawingSource);
const processedItemsPayload = lineItems.map((item) => {
  const vals = item.values;
  const t = numericField(vals.thickness || vals.height);
  const width = numericField(vals.width) || sourceMeasures.sourceWidth;
  const cbmVal = lineSawingCbm(vals, sourceMeasures);
  const cbfVal = cbmVal * 35.3147;
  const rateVal = Number.parseFloat(vals.ratePerSqf || vals.ratePerCbf || "0");
  const amtVal = Number.parseFloat(vals.amount || "0");
  return {
    batchNo: vals.logNo || vals.batchNo || sawingSource?.batchNo || sawingSource?.logNo || "",
    length: sourceMeasures.sourceLength,
    width,
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
const remainingCbm = Math.max(0, sourceMeasures.sourceAvailableCbm - totalSawedCbm);
const editedLength = readEditedAvailableNumber(rejectAvailableValues.length);
const editedWidth = readEditedAvailableNumber(rejectAvailableValues.width);
const editedHeight = readEditedAvailableNumber(rejectAvailableValues.height);
const editedCbm = readEditedAvailableNumber(rejectAvailableValues.cbm);
const editedCbf = readEditedAvailableNumber(rejectAvailableValues.cbf);
const availableLength = editedLength ?? sourceMeasures.sourceLength;
const availableWidth = editedWidth ?? sourceMeasures.sourceWidth;
const storedRemainingCbm = editedCbm ?? remainingCbm;
const availableHeight =
  editedHeight ??
  heightFromAvailableVolume(availableLength, availableWidth, storedRemainingCbm);
updateSawingIssuedAvailability(
  [itemKey, sawingSource?.id, sawingSource?.storageSrNo],
  {
    length: formatSawingNumber(availableLength, 3),
    width: formatSawingNumber(availableWidth, 3),
    height: formatSawingNumber(availableHeight, 3),
    availableCbm: storedRemainingCbm,
    availableCbf:
      editedCbf !== undefined
        ? formatSawingNumber(editedCbf, 3)
        : formatSawingNumber(storedRemainingCbm * 35.3147, 3),
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
const sawingRunId = `sawing-run-${Date.now()}`;
const newDoneItems = processedItemsPayload.map((p, idx) => ({
  id: `done-${sawingRunId}-${idx}`,
  doneId: `done-${sawingRunId}-${idx}`,
  processRunId: sawingRunId,
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
  itemKey ? { [itemKey]: storedRemainingCbm } : undefined,
);

navigate("/factory/sawing?tab=done");
return;
}

export function saveSawingEditProcess({
  formValues,
  lineItems,
  navigate,
  originalRows,
  rejectAvailableValues,
  sourceRow,
}: {
  formValues: Record<string, MasterFieldValue>;
  lineItems: readonly SawingCreateLineItem[];
  navigate: (path: string) => void;
  originalRows: readonly Record<string, any>[];
  rejectAvailableValues: RejectAvailableValues;
  sourceRow: Record<string, any>;
}) {
  const sourceMeasures = readSawingSourceMeasures(sourceRow);
  const timestamp = Date.now();
  const processRunId =
    String(originalRows[0]?.processRunId ?? "") || `sawing-edit-${timestamp}`;
  const processDate = formValues.processDate
    ? formValues.processDate instanceof Date
      ? formValues.processDate.toISOString().slice(0, 10)
      : String(formValues.processDate).slice(0, 10)
    : String(originalRows[0]?.sawingDate ?? originalRows[0]?.processDate ?? "")
        .slice(0, 10);

  const replacementRows = lineItems.map((item, index) => {
    const original =
      originalRows.find((row) => String(row.id) === String(item.id)) ??
      originalRows[0] ??
      sourceRow;
    const values = item.values;
    const cbm = lineSawingCbm(values, sourceMeasures);

    return {
      ...original,
      ...formValues,
      id: `saw-edit-${timestamp}-${index}`,
      doneId: `saw-edit-${timestamp}-${index}`,
      processRunId,
      processDate,
      sawingDate: processDate,
      batchNoCode: values.batchNoCode || values.logNo || original.batchNoCode,
      length: sourceMeasures.sourceLength,
      width: numericField(values.width) || sourceMeasures.sourceWidth,
      thickness: numericField(values.thickness || values.height),
      height: numericField(values.thickness || values.height),
      cbm,
      cbf: cbm * 35.3147,
      remark: values.remark || original.remark || "-",
      updatedBy: "Admin",
      listingState: "done",
    };
  });

  const processedCbm = replacementRows.reduce(
    (total, row) => total + (Number(row.cbm) || 0),
    0,
  );
  const remainingCbm = Math.max(
    0,
    sourceMeasures.sourceAvailableCbm - processedCbm,
  );
  const editedLength = readEditedAvailableNumber(rejectAvailableValues.length);
  const editedWidth = readEditedAvailableNumber(rejectAvailableValues.width);
  const editedHeight = readEditedAvailableNumber(rejectAvailableValues.height);
  const editedCbm = readEditedAvailableNumber(rejectAvailableValues.cbm);
  const editedCbf = readEditedAvailableNumber(rejectAvailableValues.cbf);
  const availableLength = editedLength ?? sourceMeasures.sourceLength;
  const availableWidth = editedWidth ?? sourceMeasures.sourceWidth;
  const storedRemainingCbm = editedCbm ?? remainingCbm;
  const availableHeight =
    editedHeight ??
    heightFromAvailableVolume(
      availableLength,
      availableWidth,
      storedRemainingCbm,
    );
  const sourceKey = String(
    sourceRow.sourceIssueId ||
      originalRows[0]?.sourceIssueId ||
      sourceRow.id ||
      sourceRow.storageSrNo ||
      "",
  );
  const aliases = [
    sourceKey,
    sourceRow.id,
    sourceRow.storageSrNo,
    originalRows[0]?.sourceIssueId,
  ];

  updateSawingIssuedAvailability(aliases, {
    length: formatSawingNumber(availableLength, 3),
    width: formatSawingNumber(availableWidth, 3),
    height: formatSawingNumber(availableHeight, 3),
    availableCbm: storedRemainingCbm,
    availableCbf:
      editedCbf !== undefined
        ? formatSawingNumber(editedCbf, 3)
        : formatSawingNumber(storedRemainingCbm * 35.3147, 3),
  });
  replaceSawingDoneItems(
    originalRows,
    replacementRows,
    sourceKey ? { [sourceKey]: storedRemainingCbm } : undefined,
  );
  navigate("/factory/sawing?tab=done");
}
