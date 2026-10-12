import type { MasterFieldValue } from "../../masters/shared";

import { completeFactoryIssuedWork } from "../shared/factoryIssuedWorkStore";
import {
  createEmptyRejectAvailableValues,
  type RejectAvailableValues,
} from "../shared/RejectAvailableDetailsTable";
import {
  addSawingDoneItems,
  getSawingAvailableCbm,
  updateSawingIssuedAvailability,
} from "./sawingFrontendStore";

export const sawingProcessDate = {
  key: "processDate",
  label: "Sawing Date",
  aliases: ["issueDate", "issuedDate"],
} as const;

type SawingCreateLineItem = {
  values: Record<string, string>;
};

type LineItemRecord = SawingCreateLineItem;

export function numericField(value: unknown) {
  const parsed = Number(String(value ?? "").replace(/[^\d.]/g, ""));
  return Number.isFinite(parsed) ? parsed : 0;
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

export function buildSawingAvailableValues(
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
    cbm: cbm.toFixed(6).replace(/\.?0+$/u, "") || "0",
    cbf: cbf.toFixed(4).replace(/\.?0+$/u, "") || "0",
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
