import {
  formatSQF,
  formatSQM,
  parseNumericValue,
  SQM_TO_SQF,
} from "../../shared/numberFormat";
import { availableFactoryMeasures } from "../shared/factoryAvailableMeasures";
import { calculateSlicingSqmValue } from "../shared/slicingAreaCalculation";
import type { FactoryRecord } from "../shared/types";

export type PressingUsageDraft = {
  qtyToUse: string;
  remark: string;
};

const availableKeys = [
  "availableQty",
  "availableSheets",
  "availableLeaves",
  "availableNoOfLeaves",
  "availableUnits",
  "avSheets",
] as const;

const receivedKeys = [
  "receivedQty",
  "receivedSheets",
  "receivedNoOfLeaves",
  "originalSheets",
  "noOfSheets",
  "totalNoOfSheets",
] as const;

export function pressingText(value: unknown) {
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
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
    return value.trim();
  }

  return "";
}

export function firstPressingText(
  row: FactoryRecord,
  keys: readonly string[],
) {
  for (const key of keys) {
    const value = pressingText(row[key]);
    if (value) {
      return value;
    }
  }

  return "";
}

export function getPressingAvailableQuantity(row: FactoryRecord) {
  const availableText = firstPressingText(row, availableKeys);
  if (availableText) {
    return parseNumericValue(availableText) ?? 0;
  }

  return parseNumericValue(firstPressingText(row, ["noOfSheets", "issuedNoOfSheets"])) ?? 0;
}

export function isPressingSourceEligible(row: FactoryRecord) {
  const status = `${pressingText(row.status)} ${pressingText(row.currentStatus)}`.toLowerCase();
  if (status.includes("cancel") || status.includes("released")) {
    return false;
  }

  return getPressingAvailableQuantity(row) > 0;
}

export function isPressingOrderActive(status: string) {
  const normalized = status.trim().toLowerCase();
  return normalized !== "cancelled" && normalized !== "inactive" && normalized !== "released";
}

export function mapPressingIssuedListingRow(row: FactoryRecord): FactoryRecord {
  const available = getPressingAvailableQuantity(row);
  const receivedQty = firstPressingText(row, receivedKeys);
  const received = parseNumericValue(receivedQty) ?? available;

  return {
    ...row,
    issueSrNo: firstPressingText(row, ["issueSrNo", "issueNo"]) || String(row.id),
    itemSubCategory: firstPressingText(row, ["itemSubCategory", "subCategory"]),
    cutColor: firstPressingText(row, ["cutColor", "color"]),
    receivedQty,
    availableQty: String(available),
    ...availableFactoryMeasures(row, received, available),
  };
}

export function sanitizePressingDecimal(value: string) {
  const cleaned = value.replace(/[^\d.]/gu, "");
  const [whole, ...fraction] = cleaned.split(".");
  if (fraction.length === 0) {
    return whole ?? "";
  }

  return `${whole ?? ""}.${fraction.join("")}`;
}

export function sanitizePressingInteger(value: string) {
  return value.replace(/\D/gu, "");
}

export function getPressingQtyError(
  qty: string,
  available: unknown,
  showEmptyError: boolean,
  label: "Qty to use" | "Sheets to use",
) {
  const trimmed = qty.trim();
  if (!trimmed) {
    return showEmptyError ? `${label} must be greater than 0.` : "";
  }

  if (!/^\d+(\.\d+)?$/u.test(trimmed)) {
    return "Enter a valid number.";
  }

  const value = Number(trimmed);
  if (value <= 0) {
    return `${label} must be greater than 0.`;
  }

  const availableValue = parseNumericValue(available) ?? 0;
  if (value > availableValue) {
    return label === "Sheets to use"
      ? "Sheets to use cannot exceed available sheets."
      : "Qty to use cannot exceed available quantity.";
  }

  return "";
}

export function calculatePressingUsedArea(
  length: unknown,
  width: unknown,
  quantity: string,
) {
  const sqmValue = calculateSlicingSqmValue(length, width, quantity);
  if (sqmValue <= 0) {
    return { sqf: "", sqm: "" };
  }

  return {
    sqm: formatSQM(sqmValue),
    sqf: formatSQF(sqmValue * SQM_TO_SQF),
  };
}

export function sumPressingDraftQuantity(
  rowIds: readonly string[],
  drafts: Readonly<Record<string, PressingUsageDraft>>,
) {
  return rowIds.reduce((total, id) => {
    const value = Number(drafts[id]?.qtyToUse ?? "");
    return Number.isFinite(value) && value > 0 ? total + value : total;
  }, 0);
}
