import type { MasterFieldDefinition } from "../../masters/shared";
import {
  formatSQF,
  formatSQM,
  parseNumericValue,
  SQM_TO_SQF,
} from "../../shared/numberFormat";
import { resolveSlicingDimensionMetres } from "../shared/slicingAreaCalculation";

export const cncFlutingProcessDate = {
  key: "cncDate",
  label: "Fluting Date",
} as const;

const financialFieldKeys = new Set([
  "rate",
  "ratePerSqf",
  "amount",
  "gst",
  "gstPercentage",
  "cgst",
  "sgst",
  "igst",
  "totalAmount",
  "consumedAmount",
]);

const flutingFieldOrder = [
  "itemName",
  "designCode",
  "logNo",
  "length",
  "width",
  "height",
  "noOfSheets",
  "sqm",
  "sqf",
  "color",
  "grade",
  "remark",
] as const;

export function orderCncFlutingCreateFields(
  fields: readonly MasterFieldDefinition[],
) {
  const normalized = fields
    .filter(
      (field) =>
        !financialFieldKeys.has(field.key) &&
        field.key !== "itemSubCategory" &&
        field.key !== "noOfLeaves" &&
        field.key !== "issuedNoOfSheets" &&
        field.key !== "outputNoOfSheets",
    )
    .map((field) => {
      if (
        ["itemName", "length", "width", "height", "thickness", "sqm", "sqf"].includes(
          field.key,
        )
      ) {
        return { ...field, readOnly: true };
      }
      if (field.key === "color") {
        return { ...field, label: "Cut Color" };
      }
      return field;
    });

  if (!normalized.some((field) => field.key === "noOfSheets")) {
    normalized.push({
      key: "noOfSheets",
      label: "No. of Sheets",
      type: "text",
    });
  }

  const order = new Map<string, number>(
    flutingFieldOrder.map((key, index) => [key, index]),
  );
  return normalized
    .map((field, index) => ({ field, index }))
    .sort(
      (left, right) =>
        (order.get(left.field.key) ?? flutingFieldOrder.length + left.index) -
        (order.get(right.field.key) ?? flutingFieldOrder.length + right.index),
    )
    .map(({ field }) => field);
}

function readPositiveWholeSheets(value: unknown) {
  const text = String(value ?? "").trim();
  if (!/^\d+$/u.test(text)) return 0;
  const parsed = Number(text);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : 0;
}

function readNonNegativeWholeSheets(value: unknown) {
  const text = String(value ?? "").trim();
  if (!/^\d+$/u.test(text)) return null;
  const parsed = Number(text);
  return Number.isInteger(parsed) && parsed >= 0 ? parsed : null;
}

function readSourceWholeSheets(value: unknown) {
  const parsed = parseNumericValue(value);
  return parsed !== null && Number.isInteger(parsed) && parsed >= 0
    ? parsed
    : null;
}

export function readFlutingReferenceSheets(
  sourceRow: Record<string, unknown> | undefined,
) {
  if (!sourceRow) return 0;
  for (const key of [
    "sourceAvailableSheets",
    "availableNoOfSheets",
    "availableSheets",
    "currentAvailableSheets",
    "issuedNoOfSheets",
    "noOfSheets",
    "outputNoOfSheets",
    "receivedNoOfSheets",
    "receivedSheets",
  ]) {
    if (!(key in sourceRow)) continue;
    const sheets = readSourceWholeSheets(sourceRow[key]);
    if (sheets !== null) return sheets;
  }
  return 0;
}

/** Resolve the existing metre/mm source conventions, including legacy bare mm values. */
export function resolveFlutingDimensionMetres(value: unknown) {
  const raw = String(value ?? "").trim().toLowerCase();
  const resolved = resolveSlicingDimensionMetres(value);
  if (!resolved) return 0;
  const hasExplicitUnit = /(?:mm|cm|mtr|metre|meter|\bm\b)/u.test(raw);
  return !hasExplicitUnit && resolved > 50 ? resolved / 1000 : resolved;
}

export function calculateFlutingRow<T extends Record<string, string>>(values: T): T {
  const sheets = readPositiveWholeSheets(values.noOfSheets);
  const length = resolveFlutingDimensionMetres(values.length);
  const width = resolveFlutingDimensionMetres(values.width);
  const sqm = length > 0 && width > 0 && sheets > 0
    ? length * width * sheets
    : 0;
  return {
    ...values,
    sqm: sqm > 0 ? formatSQM(sqm) : "",
    sqf: sqm > 0 ? formatSQF(sqm * SQM_TO_SQF) : "",
  };
}

export function calculateTotalFlutedSheets(
  items: readonly { values: Record<string, string> }[],
) {
  return items.reduce(
    (total, item) => total + readPositiveWholeSheets(item.values.noOfSheets),
    0,
  );
}

export function getMaximumFlutingSheets(
  sourceAvailableSheets: number,
  items: readonly { id: string; values: Record<string, string> }[],
  currentRowId?: string,
) {
  return Math.max(
    0,
    sourceAvailableSheets -
      calculateTotalFlutedSheets(
        items.filter((item) => item.id !== currentRowId),
      ),
  );
}

export function normalizeFlutingSourceDimension(value: unknown) {
  const parsed = parseNumericValue(value);
  return parsed !== null && parsed >= 0 ? String(parsed) : "";
}

export function calculateFlutingAvailableDetails({
  sourceAvailableSheets,
  sourceRow,
  totalFlutedSheets,
}: {
  sourceAvailableSheets: number;
  sourceRow: Record<string, unknown> | undefined;
  totalFlutedSheets: number;
}) {
  const availableSheets = Math.max(
    0,
    sourceAvailableSheets - totalFlutedSheets,
  );
  const sourceLength = sourceRow?.length ?? "";
  const sourceWidth = sourceRow?.width ?? "";
  const sourceThickness = sourceRow?.height ?? sourceRow?.thickness ?? "";
  const sqm =
    resolveFlutingDimensionMetres(sourceLength) *
    resolveFlutingDimensionMetres(sourceWidth) *
    availableSheets;

  return {
    amount: "",
    length: normalizeFlutingSourceDimension(sourceLength),
    noOfSheets: String(availableSheets),
    sqf: sqm > 0 ? formatSQF(sqm * SQM_TO_SQF) : "0",
    sqm: sqm > 0 ? formatSQM(sqm) : "0",
    thickness: normalizeFlutingSourceDimension(sourceThickness),
    type: "Available",
    width: normalizeFlutingSourceDimension(sourceWidth),
  };
}

export function validateFlutingRow({
  maximumSheets,
  values,
}: {
  maximumSheets: number;
  values: Record<string, string>;
}) {
  const calculatedValues = calculateFlutingRow(values);
  const fieldErrors: Record<string, string> = {};
  const sheetsText = String(values.noOfSheets ?? "").trim();
  const sheets = readPositiveWholeSheets(sheetsText);
  const thicknessValue = values.height ?? values.thickness ?? "";
  const thickness = parseNumericValue(thicknessValue);

  if (!String(values.itemName ?? "").trim()) {
    fieldErrors.itemName = "Item Name is required.";
  }
  if (resolveFlutingDimensionMetres(values.length) <= 0) {
    fieldErrors.length = "Length must be greater than 0.";
  }
  if (resolveFlutingDimensionMetres(values.width) <= 0) {
    fieldErrors.width = "Width must be greater than 0.";
  }
  if (thickness === null || thickness <= 0) {
    fieldErrors.height = "Thickness must be greater than 0.";
  }
  if (!sheetsText) {
    fieldErrors.noOfSheets = "No. of Sheets is required.";
  } else if (!/^\d+$/u.test(sheetsText)) {
    fieldErrors.noOfSheets = "No. of Sheets must be a whole number.";
  } else if (sheets <= 0) {
    fieldErrors.noOfSheets = "No. of Sheets must be greater than 0.";
  } else if (sheets > maximumSheets) {
    fieldErrors.noOfSheets = `Only ${maximumSheets} sheets are available for this Fluting item.`;
  }

  const sqm = parseNumericValue(calculatedValues.sqm) ?? 0;
  const sqf = parseNumericValue(calculatedValues.sqf);
  if (
    sqm <= 0 &&
    !fieldErrors.length &&
    !fieldErrors.width &&
    !fieldErrors.noOfSheets
  ) {
    fieldErrors.sqm = "Calculated SQM must be greater than 0.";
  }
  if (sqf !== null && sqf < 0) {
    fieldErrors.sqf = "Calculated SQF cannot be negative.";
  }

  return {
    fieldErrors,
    message: Object.values(fieldErrors)[0] ?? "",
    values: calculatedValues,
  };
}

export function validateFlutingForm({
  availableValues,
  items,
  sourceAvailableSheets,
  sourceRow,
}: {
  availableValues: Record<string, string | undefined>;
  items: readonly { id: string; values: Record<string, string> }[];
  sourceAvailableSheets: number;
  sourceRow: Record<string, unknown> | undefined;
}) {
  if (sourceAvailableSheets <= 0) {
    return "No sheets are available for Fluting.";
  }
  if (items.length === 0) {
    return "Add at least one Process Detail item before saving.";
  }

  for (const item of items) {
    const validation = validateFlutingRow({
      maximumSheets: getMaximumFlutingSheets(
        sourceAvailableSheets,
        items,
        item.id,
      ),
      values: item.values,
    });
    if (validation.message) return validation.message;
  }

  const totalFlutedSheets = calculateTotalFlutedSheets(items);
  if (totalFlutedSheets > sourceAvailableSheets) {
    return `Fluting quantity exceeds available sheets. Available Sheets: ${Math.max(
      0,
      sourceAvailableSheets -
        (totalFlutedSheets -
          readPositiveWholeSheets(items.at(-1)?.values.noOfSheets)),
    )}`;
  }

  const expected = calculateFlutingAvailableDetails({
    sourceAvailableSheets,
    sourceRow,
    totalFlutedSheets,
  });
  const actualSheets = readNonNegativeWholeSheets(availableValues.noOfSheets);
  const actualSqm = parseNumericValue(availableValues.sqm);
  const actualSqf = parseNumericValue(availableValues.sqf);
  if (
    actualSheets !== Number(expected.noOfSheets) ||
    actualSqm === null ||
    actualSqf === null ||
    Math.abs(actualSqm - (parseNumericValue(expected.sqm) ?? 0)) > 0.001 ||
    Math.abs(actualSqf - (parseNumericValue(expected.sqf) ?? 0)) > 0.001
  ) {
    return "Available Details do not match the calculated remaining sheets.";
  }
  return "";
}

export const cncFlutingCreateSourceColumns = [
  { key: "sourceSrNo", keys: ["sourceSrNo", "processSrNo", "storageSrNo", "storageSerialNumber", "issueSrNo"], label: "Source Sr No", minWidth: 160 },
  { key: "itemName", keys: ["itemName", "productName"], label: "Item Name", minWidth: 180 },
  { key: "itemSubCategory", keys: ["itemSubCategory", "subCategory"], label: "Item Sub Category", minWidth: 170 },
  { key: "orderNo", keys: ["orderNo"], label: "Order No", minWidth: 140 },
  { key: "orderItemNo", keys: ["orderItemNo"], label: "Order Item No", minWidth: 140 },
  { key: "length", keys: ["length"], label: "Length", minWidth: 120 },
  { key: "width", keys: ["width"], label: "Width", minWidth: 120 },
  { key: "thickness", keys: ["height", "thickness", "thickess"], label: "Thickness", minWidth: 120 },
  { key: "cutColor", keys: ["cutColor", "color", "colour", "processColour"], label: "Cut Color", minWidth: 130 },
  { key: "grade", keys: ["grade"], label: "Grade", minWidth: 120 },
  { key: "receivedSheets", keys: ["receivedNoOfSheets", "receivedSheets", "issuedNoOfSheets", "noOfSheets"], label: "Received Sheets", minWidth: 150 },
  { key: "availableSheets", keys: ["sourceAvailableSheets", "availableNoOfSheets", "availableSheets", "currentAvailableSheets", "issuedNoOfSheets", "noOfSheets"], label: "Available Sheets", minWidth: 150 },
  { key: "sqm", keys: ["availableSqm", "sqm", "issuedSqm", "outputSqm", "totalSqm"], label: "SQM", minWidth: 120 },
  { key: "sqf", keys: ["availableSqf", "sqf", "issuedSqf", "outputSqf", "totalSqf"], label: "SQF", minWidth: 120 },
  { key: "remark", keys: ["remark", "issueRemark"], label: "Remark", minWidth: 200 },
] as const;
