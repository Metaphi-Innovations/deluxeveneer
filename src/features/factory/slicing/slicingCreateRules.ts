import type { MasterFieldValue } from "../../masters/shared";

import { completeFactoryIssuedWork } from "../shared/factoryIssuedWorkStore";
import {
  createEmptyRejectAvailableValues,
  type RejectAvailableValues,
} from "../shared/RejectAvailableDetailsTable";
import {
  calculateSlicingRemainder,
  formatSlicingDecimal,
  measureSlicingSlice,
  slicingStockCbm,
} from "../shared/slicingAreaCalculation";
import { formatSawingNumber, numericField } from "../sawing/sawingCreateRules";
import {
  addSlicingDoneItems,
  updateSlicingIssuedAvailability,
} from "./slicingFrontendStore";

export const slicingProcessDate = {
  key: "slicingDate",
  label: "Slicing Date",
} as const;

export const slicingCreateSourceColumns = [
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

type SlicingCreateLineItem = {
  values: Record<string, string>;
};

type LineItemRecord = SlicingCreateLineItem;

export function slicingSliceFitsStock(
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

export function buildSlicingAvailableValues(
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
