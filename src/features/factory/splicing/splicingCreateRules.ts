import { formatSQF, formatSQM, parseNumericValue, SQM_TO_SQF } from "../../shared/numberFormat";
import type { MasterFieldDefinition } from "../../masters/shared";
import {
  calculateSlicingSqmValue,
  resolveSlicingDimensionMetres,
} from "../shared/slicingAreaCalculation";

function readWholeLeafCount(value: unknown) {
  const text = String(value ?? "").trim();
  if (!/^\d+$/u.test(text)) return 0;
  const parsed = Number(text);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : 0;
}

function readNonNegativeWholeLeafCount(value: unknown) {
  const text = String(value ?? "").trim();
  if (!/^\d+$/u.test(text)) return null;
  const parsed = Number(text);
  return Number.isInteger(parsed) && parsed >= 0 ? parsed : null;
}

export function readSplicingReferenceLeaves(
  sourceRow: Record<string, unknown> | undefined,
) {
  if (!sourceRow) return 0;
  for (const key of [
    "sourceAvailableLeaves",
    "availableLeaves",
    "availableNoOfLeaves",
    "noOfLeaves",
    "issuedLeafCount",
    "receivedNoOfLeaves",
  ]) {
    if (!(key in sourceRow)) continue;
    const leaves = readNonNegativeWholeLeafCount(sourceRow[key]);
    if (leaves !== null) return leaves;
  }
  return 0;
}

export function calculateSplicingRow<T extends Record<string, string>>(values: T): T {
  const sqm = calculateSlicingSqmValue(
    values.length,
    values.width,
    values.noOfSheets,
  );
  return {
    ...values,
    sqm: sqm > 0 ? formatSQM(sqm) : "",
    sqf: sqm > 0 ? formatSQF(sqm * SQM_TO_SQF) : "",
  };
}

export function calculateTotalSplicingLeaves(
  items: readonly { values: Record<string, string> }[],
) {
  return items.reduce(
    (total, item) => total + readWholeLeafCount(item.values.noOfSheets),
    0,
  );
}

export function getMaximumSplicingLeaves(
  sourceAvailableLeaves: number,
  items: readonly { id: string; values: Record<string, string> }[],
  currentRowId?: string,
) {
  return Math.max(
    0,
    sourceAvailableLeaves -
      calculateTotalSplicingLeaves(items.filter((item) => item.id !== currentRowId)),
  );
}

/**
 * Available Details uses decimal-only controls, while issued Grouping records
 * can carry display units (for example, `2825 mm`). Keep the unit-aware source
 * value for area calculations and expose only its numeric magnitude to the
 * read-only controls.
 */
export function normalizeSplicingSourceDimension(value: unknown) {
  const parsed = parseNumericValue(value);
  return parsed !== null && parsed >= 0 ? String(parsed) : "";
}

export function calculateSplicingAvailableDetails({
  sourceAvailableLeaves,
  sourceRow,
  totalLeavesUsed,
}: {
  sourceAvailableLeaves: number;
  sourceRow: Record<string, unknown> | undefined;
  totalLeavesUsed: number;
}) {
  const availableLeaves = Math.max(0, sourceAvailableLeaves - totalLeavesUsed);
  const sourceLength = sourceRow?.length ?? "";
  const sourceWidth = sourceRow?.width ?? "";
  const sourceThickness = sourceRow?.thickness ?? sourceRow?.height ?? "";
  const sqm = calculateSlicingSqmValue(
    sourceLength,
    sourceWidth,
    availableLeaves,
  );
  return {
    amount: "",
    length: normalizeSplicingSourceDimension(sourceLength),
    noOfLeaves: String(availableLeaves),
    sqf: sqm > 0 ? formatSQF(sqm * SQM_TO_SQF) : "0",
    sqm: sqm > 0 ? formatSQM(sqm) : "0",
    thickness: normalizeSplicingSourceDimension(sourceThickness),
    type: "Available",
    width: normalizeSplicingSourceDimension(sourceWidth),
  };
}

export function validateSplicingRow({
  maximumLeaves,
  values,
}: {
  maximumLeaves: number;
  values: Record<string, string>;
}) {
  const calculatedValues = calculateSplicingRow(values);
  const fieldErrors: Record<string, string> = {};
  const sheetsText = String(values.noOfSheets ?? "").trim();
  const sheets = readWholeLeafCount(sheetsText);

  if (!String(values.itemName ?? "").trim()) {
    fieldErrors.itemName = "Item Name is required.";
  }
  if (resolveSlicingDimensionMetres(values.length) <= 0) {
    fieldErrors.length = "Length must be greater than 0.";
  }
  if (resolveSlicingDimensionMetres(values.width) <= 0) {
    fieldErrors.width = "Width must be greater than 0.";
  }
  if (!sheetsText) {
    fieldErrors.noOfSheets = "No. of Sheets is required.";
  } else if (!/^\d+$/u.test(sheetsText)) {
    fieldErrors.noOfSheets = "No. of Sheets must be a whole number.";
  } else if (sheets <= 0) {
    fieldErrors.noOfSheets = "No. of Sheets must be greater than 0.";
  } else if (sheets > maximumLeaves) {
    fieldErrors.noOfSheets = `Only ${maximumLeaves} sheets are available for this Splicing item.`;
  }

  const sqm = parseNumericValue(calculatedValues.sqm) ?? 0;
  const sqf = parseNumericValue(calculatedValues.sqf);
  if (sqm <= 0 && !fieldErrors.length && !fieldErrors.width && !fieldErrors.noOfSheets) {
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

export function validateSplicingForm({
  availableValues,
  items,
  sourceAvailableLeaves,
  sourceRow,
}: {
  availableValues: Record<string, string | undefined>;
  items: readonly { id: string; values: Record<string, string> }[];
  sourceAvailableLeaves: number;
  sourceRow: Record<string, unknown> | undefined;
}) {
  if (sourceAvailableLeaves <= 0) return "No sheets are available for Splicing.";
  if (items.length === 0) return "Add at least one Process Detail item before saving.";

  for (const item of items) {
    const validation = validateSplicingRow({
      maximumLeaves: getMaximumSplicingLeaves(sourceAvailableLeaves, items, item.id),
      values: item.values,
    });
    if (validation.message) return validation.message;
  }

  const totalSheetsUsed = calculateTotalSplicingLeaves(items);
  if (totalSheetsUsed > sourceAvailableLeaves) {
    return `Splicing quantity exceeds available sheets. Available Sheets: ${Math.max(
      0,
      sourceAvailableLeaves -
        (totalSheetsUsed - readWholeLeafCount(items.at(-1)?.values.noOfSheets)),
    )}`;
  }
  return "";
}

export const splicingProcessDate = {
  key: "splicingDate",
  label: "Splicing Date",
} as const;

export const splicingApplyingTypeOptions = [
  "MACHINE SPLICING",
  "HAND",
  "END TAPING",
] as const;

export function orderSplicingCreateFields(
  fields: readonly MasterFieldDefinition[],
) {
  const editableKeys = new Set([
    "length",
    "width",
    "thickness",
    "noOfSheets",
  ]);
  const visibleFields = fields
    .filter(
      (field) =>
        field.key !== "noOfLeaves" &&
        field.key !== "itemSubCategory" &&
        field.key !== "subCategory" &&
        field.key !== "grade" &&
        field.key !== "rate" &&
        field.key !== "ratePerSqf" &&
        field.key !== "amount" &&
        field.key !== "gst" &&
        field.key !== "gstPercentage" &&
        field.key !== "cgst" &&
        field.key !== "sgst" &&
        field.key !== "igst",
    )
    .map((field) => ({
      ...field,
      readOnly: !editableKeys.has(field.key),
    }));
  const colorField = visibleFields.find(
    (field) => field.key === "color" || field.key === "colour",
  );
  const withoutColor = colorField
    ? visibleFields.filter((field) => field !== colorField)
    : visibleFields;
  const logNoIndex = withoutColor.findIndex((field) => field.key === "logNo");
  const colorOrdered = colorField && logNoIndex >= 0
    ? [
        ...withoutColor.slice(0, logNoIndex),
        colorField,
        ...withoutColor.slice(logNoIndex),
      ]
    : withoutColor;
  const sheetsField = colorOrdered.find((field) => field.key === "noOfSheets");
  if (!sheetsField) return colorOrdered;
  const withoutSheets = colorOrdered.filter((field) => field !== sheetsField);
  const remarkIndex = withoutSheets.findIndex((field) => field.key === "remark");
  const insertionIndex = remarkIndex >= 0 ? remarkIndex : withoutSheets.length;
  return [
    ...withoutSheets.slice(0, insertionIndex),
    sheetsField,
    ...withoutSheets.slice(insertionIndex),
  ];
}

export const splicingCreateSourceColumns = [
  { key: "storageSrNo", keys: ["storageSrNo", "storageSerialNumber"], label: "Storage Sr No.", minWidth: 160 },
  { key: "issuedDate", keys: ["issuedDate", "issueDate"], label: "Issued Date", minWidth: 140 },
  { key: "groupNo", keys: ["groupNo"], label: "Group No.", minWidth: 140 },
  { key: "groupingDate", keys: ["groupingDate"], label: "Grouping Date", minWidth: 140 },
  { key: "issuedFor", keys: ["issuedFor", "productType"], label: "Issue For", minWidth: 140 },
  { key: "orderDate", keys: ["orderDate"], label: "Order Date", minWidth: 140 },
  { key: "customerName", keys: ["customerName"], label: "Customer Name", minWidth: 170 },
  { key: "orderNo", keys: ["orderNo"], label: "Order No", minWidth: 140 },
  { key: "orderItemNo", keys: ["orderItemNo"], label: "Order Item No", minWidth: 140 },
  { key: "itemName", keys: ["itemName", "productName"], label: "Item Name", minWidth: 170 },
  { key: "itemSubCategory", keys: ["itemSubCategory", "subCategory"], label: "Sub Category", minWidth: 160 },
  { key: "logNo", keys: ["logNo", "logCode", "batchNo"], label: "Log No.", minWidth: 140 },
  { key: "bundleNumber", keys: ["bundleNumber", "noOfBundle"], label: "Bundle No.", minWidth: 140 },
  { key: "palletNo", keys: ["palletNo", "palletNumber"], label: "Pallet No.", minWidth: 140 },
  { key: "color", keys: ["color", "colour", "processColour"], label: "Color", minWidth: 120 },
  { key: "grade", keys: ["grade"], label: "Grade", minWidth: 120 },
  { key: "length", keys: ["length"], label: "Length", minWidth: 120 },
  { key: "width", keys: ["width"], label: "Width", minWidth: 120 },
  { key: "thickness", keys: ["thickness", "height"], label: "Thickness", minWidth: 120 },
  { key: "receivedNoOfLeaves", keys: ["receivedNoOfLeaves", "noOfLeaves", "issuedLeafCount"], label: "Received No of Leaves", minWidth: 180 },
  { key: "availableNoOfLeaves", keys: ["availableNoOfLeaves"], label: "Available No of Leaves", minWidth: 180 },
  { key: "sqm", keys: ["availableSqm", "sqm", "totalSqm"], label: "SQM", minWidth: 120 },
  { key: "sqf", keys: ["availableSqf", "sqf", "totalSqf"], label: "SQF", minWidth: 120 },
  { key: "remark", keys: ["remark"], label: "Remark", minWidth: 200 },
] as const;
