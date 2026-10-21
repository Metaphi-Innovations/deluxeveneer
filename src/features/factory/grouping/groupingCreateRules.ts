import type { MasterFieldDefinition } from "../../masters/shared";
import { formatSQF, formatSQM, parseNumericValue, SQM_TO_SQF } from "../../shared/numberFormat";

import { insertFactoryCreateField } from "../shared/factoryCreateFieldOrder";
import { allocateNextGroupNo, getExistingGroupNo } from "../shared/groupNoStore";
import {
  calculateSlicingSqmValue,
  resolveSlicingDimensionMetres,
} from "../shared/slicingAreaCalculation";

export const groupingProcessDate = {
  key: "groupingDate",
  label: "Grouping Date",
} as const;

export const groupingCreateSourceColumns = [
  { key: "storageSrNo", keys: ["storageSrNo", "storageSerialNumber"], label: "Storage Sr No", minWidth: 160 },
  { key: "itemName", keys: ["itemName", "productName"], label: "Item Name", minWidth: 220 },
  { key: "length", keys: ["length"], label: "Length", minWidth: 120 },
  { key: "width", keys: ["width"], label: "Width", minWidth: 120 },
  { key: "thickness", keys: ["thickness", "height"], label: "Thickness", minWidth: 120 },
  { key: "noOfLeaves", keys: ["noOfLeaves", "issuedLeafCount"], label: "No of Leaves", minWidth: 140 },
  { key: "sqm", keys: ["sqm", "totalSqm"], label: "SQM", minWidth: 120 },
  { key: "sqf", keys: ["sqf", "totalSqf"], label: "SQF", minWidth: 120 },
  { key: "remark", keys: ["remark"], label: "Remark", minWidth: 200 },
];

export const groupingHiddenSourceKeys = new Set([
  "orderNo",
  "orderItemNo",
  "supplierName",
  "orderDate",
]);

export function prependGroupingGroupNoField(headerFields: MasterFieldDefinition[]) {
  headerFields.unshift({
    key: "groupNo",
    label: "Group No.",
    type: "text",
    readOnly: true,
  });
}

export function orderGroupingCreateFields(fields: readonly MasterFieldDefinition[]) {
  const groupingFields = fields
    .filter(
      (field) =>
        field.key !== "itemSubCategory" &&
        field.key !== "subCategory" &&
        field.key !== "grade",
    )
    .map((field) =>
      field.key === "itemName"
        ? { ...field, readOnly: true }
        : field,
    );
  const groupNoField = groupingFields.find((field) => field.key === "groupNo");
  const withoutGroupNo = groupNoField
    ? groupingFields.filter((field) => field !== groupNoField)
    : groupingFields;

  const colorField = withoutGroupNo.find(
    (field) => field.key === "color" || field.key === "colour",
  );
  const withoutColor = colorField
    ? withoutGroupNo.filter((field) => field !== colorField)
    : withoutGroupNo;
  const logNoIndex = withoutColor.findIndex((field) => field.key === "logNo");
  const orderedFields = colorField && logNoIndex >= 0
    ? [
        ...withoutColor.slice(0, logNoIndex),
        colorField,
        ...withoutColor.slice(logNoIndex),
      ]
    : withoutColor;

  const withPhoto = insertFactoryCreateField(orderedFields, "groupPhoto", (withoutSpecialField) =>
    withoutSpecialField.findIndex((field) => field.key === "remark"),
  );

  return groupNoField ? [groupNoField, ...withPhoto] : withPhoto;
}


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

function readFirstLeafCount(
  sourceRow: Record<string, unknown> | undefined,
  keys: readonly string[],
) {
  if (!sourceRow) return 0;
  for (const key of keys) {
    if (!(key in sourceRow)) continue;
    const leaves = readNonNegativeWholeLeafCount(sourceRow[key]);
    if (leaves !== null) return leaves;
  }
  return 0;
}

export function readGroupingSourceLeaves(
  sourceRow: Record<string, unknown> | undefined,
) {
  const receivedLeaves = readFirstLeafCount(sourceRow, [
    "sourceReceivedLeaves",
    "receivedNoOfLeaves",
    "receivedLeaves",
    "issuedLeafCount",
    "noOfLeaves",
    "noOfSheets",
  ]);
  const availableLeaves = readFirstLeafCount(sourceRow, [
    "sourceAvailableLeaves",
    "availableLeaves",
    // The issued Raw Veneer snapshot uses noOfLeaves for the quantity made
    // available to Grouping. availableNoOfLeaves belongs to the warehouse row.
    "noOfLeaves",
    "issuedLeafCount",
    "availableNoOfLeaves",
    "noOfSheets",
  ]);

  return { availableLeaves, receivedLeaves };
}

export function readGroupingReferenceLeaves(
  sourceRow: Record<string, unknown> | undefined,
) {
  return readGroupingSourceLeaves(sourceRow).availableLeaves;
}

export function sumGroupingOutputLeaves(
  items: readonly { values: Record<string, string> }[],
) {
  return items.reduce(
    (total, item) => total + readWholeLeafCount(item.values.noOfLeaves),
    0,
  );
}

export function calculateGroupingRow<T extends Record<string, string>>(values: T): T {
  const sqm = calculateSlicingSqmValue(
    values.length,
    values.width,
    values.noOfLeaves,
  );

  return {
    ...values,
    sqm: sqm > 0 ? formatSQM(sqm) : "",
    sqf: sqm > 0 ? formatSQF(sqm * SQM_TO_SQF) : "",
  };
}

/**
 * Raw Veneer inward stores its dimensions in metres. Some legacy issued
 * snapshots carry an incorrect `mm` display suffix on that metre magnitude;
 * remove the suffix when prefilling Grouping without changing user-entered
 * unit-aware values later in the form.
 */
export function normalizeGroupingSourceDimension(value: unknown) {
  const parsed = parseNumericValue(value);
  return parsed !== null && parsed > 0 ? String(parsed) : "";
}

export function calculateTotalGroupedLeaves(
  items: readonly { values: Record<string, string> }[],
) {
  return sumGroupingOutputLeaves(items);
}

export function getMaximumGroupingLeaves(
  sourceAvailableLeaves: number,
  items: readonly { id: string; values: Record<string, string> }[],
  currentRowId?: string,
) {
  const leavesUsedByOtherRows = calculateTotalGroupedLeaves(
    items.filter((item) => item.id !== currentRowId),
  );
  return Math.max(0, sourceAvailableLeaves - leavesUsedByOtherRows);
}

export function calculateGroupingAvailableDetails({
  sourceAvailableLeaves,
  sourceRow,
  totalGroupedLeaves,
}: {
  sourceAvailableLeaves: number;
  sourceRow: Record<string, unknown> | undefined;
  totalGroupedLeaves: number;
}) {
  const availableLeaves = Math.max(0, sourceAvailableLeaves - totalGroupedLeaves);
  const length = normalizeGroupingSourceDimension(sourceRow?.length);
  const width = normalizeGroupingSourceDimension(sourceRow?.width);
  const thickness = normalizeGroupingSourceDimension(
    sourceRow?.thickness ?? sourceRow?.height,
  );
  const sqm = calculateSlicingSqmValue(length, width, availableLeaves);

  return {
    amount: "",
    length,
    noOfLeaves: String(availableLeaves),
    sqf: sqm > 0 ? formatSQF(sqm * SQM_TO_SQF) : "0",
    sqm: sqm > 0 ? formatSQM(sqm) : "0",
    thickness,
    type: "Available",
    width,
  };
}

export type GroupingRowValidation = {
  fieldErrors: Record<string, string>;
  message: string;
  values: Record<string, string>;
};

export function validateGroupingRow({
  maximumLeaves,
  values,
}: {
  maximumLeaves: number;
  values: Record<string, string>;
}): GroupingRowValidation {
  const calculatedValues = calculateGroupingRow(values);
  const fieldErrors: Record<string, string> = {};
  const leavesText = String(values.noOfLeaves ?? "").trim();
  const leaves = readWholeLeafCount(leavesText);

  if (!String(values.groupNo ?? "").trim()) {
    fieldErrors.groupNo = "Group No. is required.";
  }
  if (!String(values.itemName ?? "").trim()) {
    fieldErrors.itemName = "Item Name is required.";
  }
  if (resolveSlicingDimensionMetres(values.length) <= 0) {
    fieldErrors.length = "Length must be greater than 0.";
  }
  if (resolveSlicingDimensionMetres(values.width) <= 0) {
    fieldErrors.width = "Width must be greater than 0.";
  }
  if (!leavesText) {
    fieldErrors.noOfLeaves = "No. of Leaves is required.";
  } else if (!/^\d+$/u.test(leavesText)) {
    fieldErrors.noOfLeaves = "No. of Leaves must be a whole number.";
  } else if (leaves <= 0) {
    fieldErrors.noOfLeaves = "No. of Leaves must be greater than 0.";
  } else if (leaves > maximumLeaves) {
    fieldErrors.noOfLeaves = `Only ${maximumLeaves} leaves are available for this Grouping item.`;
  }

  const sqm = parseNumericValue(calculatedValues.sqm) ?? 0;
  const sqf = parseNumericValue(calculatedValues.sqf);
  if (sqm <= 0 && !fieldErrors.length && !fieldErrors.width && !fieldErrors.noOfLeaves) {
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

export function validateGroupingForm({
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
  if (sourceAvailableLeaves <= 0) {
    return "No leaves are available for Grouping.";
  }
  if (items.length === 0) {
    return "Add at least one Process Detail item before saving.";
  }

  for (const item of items) {
    const validation = validateGroupingRow({
      maximumLeaves: getMaximumGroupingLeaves(sourceAvailableLeaves, items, item.id),
      values: item.values,
    });
    if (validation.message) return validation.message;
  }

  const totalGroupedLeaves = calculateTotalGroupedLeaves(items);
  if (totalGroupedLeaves > sourceAvailableLeaves) {
    return `Grouping quantity exceeds available leaves. Available Leaves: ${Math.max(
      0,
      sourceAvailableLeaves - (totalGroupedLeaves - readWholeLeafCount(items.at(-1)?.values.noOfLeaves)),
    )}`;
  }

  const expected = calculateGroupingAvailableDetails({
    sourceAvailableLeaves,
    sourceRow,
    totalGroupedLeaves,
  });
  const actualLeaves = readNonNegativeWholeLeafCount(availableValues.noOfLeaves);
  const actualSqm = parseNumericValue(availableValues.sqm);
  const actualSqf = parseNumericValue(availableValues.sqf);
  const expectedSqm = parseNumericValue(expected.sqm) ?? 0;
  const expectedSqf = parseNumericValue(expected.sqf) ?? 0;
  if (
    actualLeaves !== Number(expected.noOfLeaves) ||
    actualSqm === null ||
    actualSqf === null ||
    Math.abs(actualSqm - expectedSqm) > 0.001 ||
    Math.abs(actualSqf - expectedSqf) > 0.001
  ) {
    return "Available Details do not match the calculated remaining leaves.";
  }

  return "";
}

export function getGroupingLeafLimitMessage({
  availableLeaves,
  outputLeaves,
  referenceLeaves,
}: {
  availableLeaves: number;
  outputLeaves: number;
  referenceLeaves: number;
}) {
  const limitLabel = `reference No of Leaves (${referenceLeaves})`;
  if (outputLeaves > referenceLeaves || availableLeaves > referenceLeaves) {
    return `No of Leaves cannot be more than the ${limitLabel}.`;
  }
  if (outputLeaves + availableLeaves > referenceLeaves) {
    return `Output No of Leaves and Available Details together cannot be more than the ${limitLabel}.`;
  }
  return "";
}

export function applyGroupingCreateSnapshot(
  resultSnapshot: Record<string, unknown>,
  sourceRow: Record<string, unknown> | undefined,
) {
  resultSnapshot.groupNo =
    (typeof resultSnapshot.groupNo === "string" && resultSnapshot.groupNo.trim()) ||
    getExistingGroupNo(sourceRow) ||
    allocateNextGroupNo();
  // Grouping is stock/process — do not carry order/customer onto the batch.
  delete resultSnapshot.orderNo;
  delete resultSnapshot.orderDate;
  delete resultSnapshot.orderItemNo;
  delete resultSnapshot.customerName;
  delete resultSnapshot.productName;
}

