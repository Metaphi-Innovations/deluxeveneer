import type { MasterFieldDefinition, MasterFieldValue } from "../../masters/shared";

import { insertFactoryCreateField } from "../shared/factoryCreateFieldOrder";

import { completeFactoryIssuedWork } from "../shared/factoryIssuedWorkStore";
import {
  createEmptyRejectAvailableValues,
  type RejectAvailableValues,
} from "../shared/RejectAvailableDetailsTable";
import {
  applySlicingDerivedAreas,
  calculateSlicingRemainder,
  formatSlicingDecimal,
  measureSlicingSlice,
  resolveSlicingDimensionMetres,
  slicingStockCbm,
} from "../shared/slicingAreaCalculation";
import { formatSawingNumber, numericField } from "../sawing/sawingCreateRules";
import {
  addSlicingDoneItems,
  replaceSlicingDoneItems,
  updateSlicingIssuedAvailability,
} from "./slicingFrontendStore";

export function orderSlicingCreateFields(fields: readonly MasterFieldDefinition[]) {
  return insertFactoryCreateField(fields, "color", (withoutColor) => {
    const palletIndex = withoutColor.findIndex((field) => field.key === "palletNo");
    return palletIndex >= 0 ? palletIndex + 1 : withoutColor.length;
  });
}

export const slicingProcessDate = {
  key: "slicingDate",
  label: "Slicing Date",
} as const;

export const slicingCreateSourceColumns = [
      { key: "storageSrNo", keys: ["storageSrNo", "storageSerialNumber"], label: "Storage Sr No.", minWidth: 160 },
      { key: "issueDate", keys: ["issueDate", "issuedDate", "processDate", "date"], label: "Issue Date", minWidth: 130 },
      { key: "itemName", keys: ["itemName", "productName"], label: "Item Name", minWidth: 220 },
      { key: "length", keys: ["length"], label: "Length", minWidth: 120 },
      { key: "width", keys: ["width"], label: "Width", minWidth: 120 },
      { key: "height", keys: ["height", "thickness"], label: "Height", minWidth: 120 },
      { key: "receivedCbm", keys: ["receivedCbm", "cbm"], label: "Received CBM", minWidth: 140 },
      { key: "availableCbm", keys: ["availableCbm", "receivedCbm", "cbm"], label: "Available CBM", minWidth: 140 },
      { key: "remark", keys: ["remark"], label: "Remark", minWidth: 200 },
      { key: "createdBy", keys: ["createdBy"], label: "Created", minWidth: 140 },
      { key: "updatedBy", keys: ["updatedBy"], label: "Updated", minWidth: 140 },
];

type SlicingCreateLineItem = {
  values: Record<string, string>;
};

type LineItemRecord = SlicingCreateLineItem;

export const SLICING_CBM_EPSILON = 0.000001;

export type SlicingRowValidation = {
  fieldErrors: Record<string, string>;
  maximumLeaves: number;
  message: string;
};

export function calculateSlicingRow(values: Record<string, string>) {
  return measureSlicingSlice(values);
}

export function calculateTotalSlicingConsumption(
  lineItems: readonly LineItemRecord[],
) {
  return lineItems.reduce(
    (total, item) => total + calculateSlicingRow(item.values).cbm,
    0,
  );
}

export function getMaximumSlicingLeaves(
  values: Record<string, string>,
  currentRemainingCbm: number,
) {
  const perLeaf = measureSlicingSlice({ ...values, noOfLeaves: "1" }).cbm;
  if (perLeaf <= 0 || currentRemainingCbm <= 0) return 0;
  return Math.max(
    0,
    Math.floor((currentRemainingCbm + SLICING_CBM_EPSILON) / perLeaf),
  );
}

export function getMaximumSlicingThickness(
  values: Record<string, string>,
  currentRemainingCbm: number,
) {
  const length = resolveSlicingDimensionMetres(values.length);
  const width = resolveSlicingDimensionMetres(values.width);
  const leaves = Number(values.noOfLeaves ?? values.noOfSheets ?? 0);
  if (length <= 0 || width <= 0 || !Number.isInteger(leaves) || leaves <= 0) {
    return 0;
  }
  return Math.max(0, currentRemainingCbm) / (length * width * leaves);
}

export function validateSlicingRow({
  committing = false,
  otherConsumedCbm,
  sourceRow,
  values,
}: {
  committing?: boolean;
  otherConsumedCbm: number;
  sourceRow: Record<string, unknown> | undefined;
  values: Record<string, string>;
}): SlicingRowValidation {
  const fieldErrors: Record<string, string> = {};
  const sourceAvailableCbm = slicingStockCbm(sourceRow);
  const length = resolveSlicingDimensionMetres(values.length);
  const width = resolveSlicingDimensionMetres(values.width);
  const thicknessKey = "height" in values ? "height" : "thickness";
  const thicknessText = String(values.height || values.thickness || "").trim();
  const thickness = resolveSlicingDimensionMetres(thicknessText);
  const leavesText = String(values.noOfLeaves ?? values.noOfSheets ?? "").trim();
  const leaves = Number(leavesText);

  if (sourceAvailableCbm <= SLICING_CBM_EPSILON) {
    return {
      fieldErrors,
      maximumLeaves: 0,
      message: "No CBM is available for Slicing.",
    };
  }

  if (length <= 0) fieldErrors.length = "Length is required and must be greater than 0.";
  if (width <= 0) fieldErrors.width = "Width is required and must be greater than 0.";
  if (!thicknessText || thickness <= 0) {
    fieldErrors[thicknessKey] = "Thickness is required and must be greater than 0.";
  }
  if (!leavesText) {
    fieldErrors.noOfLeaves = "No. of Leaves is required.";
  } else if (!Number.isInteger(leaves) || leaves <= 0) {
    fieldErrors.noOfLeaves = "No. of Leaves must be a whole number greater than 0.";
  }

  if (Object.keys(fieldErrors).length > 0) {
    return {
      fieldErrors,
      maximumLeaves: 0,
      message: committing ? Object.values(fieldErrors)[0] ?? "Enter valid slicing details." : "",
    };
  }

  const measured = calculateSlicingRow(values);
  if (measured.sqm <= 0) fieldErrors.sqm = "Calculated SQM must be greater than 0.";
  if (measured.cbm <= 0) fieldErrors.cbm = "Calculated consumed CBM must be greater than 0.";

  const currentRemainingCbm = Math.max(0, sourceAvailableCbm - otherConsumedCbm);
  const maximumLeaves = getMaximumSlicingLeaves(values, currentRemainingCbm);
  if (leaves > maximumLeaves) {
    const maximumThickness = getMaximumSlicingThickness(
      values,
      currentRemainingCbm,
    );
    if (
      maximumLeaves === 0 ||
      (maximumThickness > 0 &&
        thickness - maximumThickness > SLICING_CBM_EPSILON &&
        leaves === 1)
    ) {
      fieldErrors[thicknessKey] = "Thickness and leaf quantity exceed the available veneer block.";
      return {
        fieldErrors,
        maximumLeaves,
        message: "Thickness and leaf quantity exceed the available veneer block.",
      };
    }

    const message =
      `Number of leaves exceeds the available source material. Maximum leaves available at this thickness: ${maximumLeaves}.`;
    fieldErrors.noOfLeaves = message;
    return { fieldErrors, maximumLeaves, message };
  }

  if (otherConsumedCbm + measured.cbm - sourceAvailableCbm > SLICING_CBM_EPSILON) {
    const message =
      `Slicing quantity exceeds available CBM. Available CBM: ${currentRemainingCbm.toFixed(3)}`;
    fieldErrors[thicknessKey] = message;
    return { fieldErrors, maximumLeaves, message };
  }

  return {
    fieldErrors,
    maximumLeaves,
    message: Object.values(fieldErrors)[0] ?? "",
  };
}

export function slicingSliceFitsStock(
  values: Record<string, string>,
  sourceRow: Record<string, unknown> | undefined,
  otherItems: readonly LineItemRecord[],
) {
  return !validateSlicingRow({
    committing: true,
    otherConsumedCbm: calculateTotalSlicingConsumption(otherItems),
    sourceRow,
    values,
  }).message;
}

export function buildSlicingAvailableValues(
  sourceRow: Record<string, unknown> | undefined,
  lineItems: readonly LineItemRecord[],
): RejectAvailableValues {
  const empty = createEmptyRejectAvailableValues();
  const remainder = calculateSlicingRemainder(
    sourceRow,
    lineItems.map((item) => item.values),
  );

  return {
    ...empty,
    type: "Available",
    length: formatSlicingDecimal(remainder.length, 6),
    width: formatSlicingDecimal(remainder.width, 6),
    height: formatSlicingDecimal(remainder.height, 6),
    thickness: formatSlicingDecimal(remainder.height, 6),
    cbm: formatSlicingDecimal(remainder.cbm, 6),
    cbf: formatSlicingDecimal(remainder.cbf, 4),
    sqm: formatSlicingDecimal(remainder.sqm, 3),
    sqf: formatSlicingDecimal(remainder.sqf, 3),
  };
}

export function getSlicingCreateSubmitError(
  sourceRow: Record<string, unknown> | undefined,
  lineItems: readonly LineItemRecord[],
  availableValues: RejectAvailableValues,
) {
  const sourceAvailableCbm = slicingStockCbm(sourceRow);
  if (sourceAvailableCbm <= SLICING_CBM_EPSILON) {
    return "No CBM is available for Slicing.";
  }
  if (lineItems.length === 0) {
    return "Add at least one output detail before saving.";
  }

  for (const item of lineItems) {
    const validation = validateSlicingRow({
      committing: true,
      otherConsumedCbm: calculateTotalSlicingConsumption(
        lineItems.filter((row) => row !== item),
      ),
      sourceRow,
      values: item.values,
    });
    if (validation.message) return validation.message;
  }

  const totalConsumedCbm = calculateTotalSlicingConsumption(lineItems);
  if (totalConsumedCbm - sourceAvailableCbm > SLICING_CBM_EPSILON) {
    return `Slicing quantity exceeds available CBM. Available CBM: ${Math.max(0, sourceAvailableCbm - totalConsumedCbm).toFixed(3)}`;
  }

  const expected = buildSlicingAvailableValues(sourceRow, lineItems);
  const comparableKeys = ["length", "width", "height", "cbm"] as const;
  const availableMatches = comparableKeys.every((key) => {
    const actual = numericField(availableValues[key]);
    const calculated = numericField(expected[key]);
    return Math.abs(actual - calculated) <= SLICING_CBM_EPSILON;
  });
  if (!availableMatches) {
    return "Available Details do not match the calculated remaining source material.";
  }

  return "";
}

export function saveSlicingCreateProcess({
  formValues,
  lineItems,
  navigate,
  rejectAvailableValues,
  sourceRow,
  workItemId,
}: {
  formValues: Record<string, MasterFieldValue>;
  lineItems: readonly SlicingCreateLineItem[];
  navigate: (path: string) => void;
  rejectAvailableValues: RejectAvailableValues;
  sourceRow: Record<string, unknown> | undefined;
  workItemId: string | undefined;
}) {
const slicingSource = (sourceRow ?? {}) as Record<string, unknown>;
const calculatedAvailable = buildSlicingAvailableValues(sourceRow, lineItems);
const remainingCbm = Math.max(0, numericField(calculatedAvailable.cbm));
const remainingHeight = numericField(calculatedAvailable.height);
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
const processRunId = `slicing-run-${Date.now()}`;

addSlicingDoneItems(
  lineItems.map((item, index) => {
    const vals = applySlicingDerivedAreas(item.values);
    const sqm = vals.sqm || vals.totalSqMeter || "";
    return {
      id: `slicing-done-${Date.now()}-${index}`,
      listingState: "done",
      processRunId,
      sourceIssueId: slicingSource.id ?? slicingSource.sourceIssueId ?? "",
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
      color: vals.color || slicingSource.color || "",
      length: vals.length || "",
      width: vals.width || "",
      thickness: vals.thickness || vals.height || "",
      noOfLeaves: vals.noOfLeaves || vals.noOfSheets || "",
      receivedLeaves: vals.noOfLeaves || vals.noOfSheets || "",
      availableLeaves: vals.noOfLeaves || vals.noOfSheets || "",
      cbm: vals.cbm || "",
      cbf: vals.cbf || "",
      receivedCbm: slicingSource.receivedCbm ?? slicingSource.availableCbm ?? slicingSource.cbm ?? "",
      sourceLength: slicingSource.length ?? "",
      sourceWidth: slicingSource.width ?? "",
      sourceHeight: slicingSource.height ?? slicingSource.thickness ?? "",
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

export function saveSlicingEditProcess({
  formValues,
  lineItems,
  navigate,
  originalRows,
  sourceRow,
}: {
  formValues: Record<string, MasterFieldValue>;
  lineItems: readonly (SlicingCreateLineItem & { id?: string })[];
  navigate: (path: string) => void;
  originalRows: readonly Record<string, any>[];
  sourceRow: Record<string, any>;
}) {
  const timestamp = Date.now();
  const processRunId =
    String(originalRows[0]?.processRunId ?? "") || `slicing-edit-${timestamp}`;
  const dateValue = formValues.slicingDate ?? formValues.processDate;
  const slicingDate =
    dateValue instanceof Date && !Number.isNaN(dateValue.getTime())
      ? `${dateValue.getFullYear()}-${String(dateValue.getMonth() + 1).padStart(2, "0")}-${String(dateValue.getDate()).padStart(2, "0")}`
      : String(dateValue ?? originalRows[0]?.slicingDate ?? originalRows[0]?.issueDate ?? "")
          .slice(0, 10);

  const replacementRows = lineItems.map((item, index) => {
    const original =
      originalRows.find((row) => String(row.id) === String(item.id)) ??
      originalRows[index] ??
      originalRows[0] ??
      sourceRow;
    const values = applySlicingDerivedAreas(item.values);
    const receivedLeaves = Math.max(0, Math.floor(Number(values.noOfLeaves) || 0));
    const originallyReceived = Math.max(
      0,
      Math.floor(Number(original.receivedLeaves ?? original.noOfLeaves) || 0),
    );
    const originallyAvailable = Math.max(
      0,
      Math.floor(Number(original.availableLeaves ?? originallyReceived) || 0),
    );
    const alreadyIssued = Math.max(0, originallyReceived - originallyAvailable);
    const availableLeaves = Math.max(0, receivedLeaves - alreadyIssued);

    return {
      ...original,
      ...formValues,
      ...values,
      id: `slicing-edit-${timestamp}-${index}`,
      processRunId,
      listingState: "done",
      slicingDate,
      issueDate: slicingDate,
      receivedLeaves: String(receivedLeaves),
      availableLeaves: String(availableLeaves),
      noOfLeaves: String(receivedLeaves),
      totalSqMeter: values.sqm || values.totalSqMeter || "",
      receivedCbm: sourceRow.receivedCbm ?? sourceRow.availableCbm ?? sourceRow.cbm ?? "",
      sourceLength: sourceRow.length ?? "",
      sourceWidth: sourceRow.width ?? "",
      sourceHeight: sourceRow.height ?? sourceRow.thickness ?? "",
      updatedBy: "Admin",
    };
  });

  const calculatedAvailable = buildSlicingAvailableValues(sourceRow, lineItems);
  const remainingCbm = Math.max(0, numericField(calculatedAvailable.cbm));
  const aliases = [
    sourceRow.id,
    sourceRow.sourceIssueId,
    sourceRow.issueId,
    sourceRow.storageSrNo,
    ...originalRows.flatMap((row) => [row.sourceIssueId, row.issueId, row.storageSrNo]),
  ]
    .filter((value) => value !== undefined && value !== null && String(value).trim())
    .map(String);

  updateSlicingIssuedAvailability(aliases, {
    availableCbm: Number(formatSawingNumber(remainingCbm, 6)) || 0,
    height: calculatedAvailable.height || "0",
    length: String(sourceRow.length ?? ""),
    width: String(sourceRow.width ?? ""),
  });
  replaceSlicingDoneItems(originalRows, replacementRows);
  navigate("/factory/slicing?tab=done");
}
