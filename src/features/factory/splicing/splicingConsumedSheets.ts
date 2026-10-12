import type { FactoryRecord } from "../shared/types";

function leafCount(value: unknown) {
  if (typeof value === "number" && Number.isFinite(value)) {
    return Math.max(0, Math.floor(value));
  }

  if (typeof value === "string" && value.trim()) {
    const parsed = Number(value.replace(/[^\d.]/g, ""));
    if (Number.isFinite(parsed)) {
      return Math.max(0, Math.floor(parsed));
    }
  }

  return 0;
}

export function readSplicingAvailableLeaves(row: FactoryRecord) {
  return (
    leafCount(row.availableNoOfLeaves) ||
    leafCount(row.noOfLeaves) ||
    leafCount(row.issuedLeafCount) ||
    leafCount(row.totalLeaves)
  );
}

export function getSplicingConsumedQtyError(available: number, consumed: string) {
  const value = consumed.trim();

  if (!value) {
    return "Enter consumed qty.";
  }

  if (!/^\d+$/.test(value)) {
    return "Enter a whole number.";
  }

  const qty = Number(value);

  if (qty < 1) {
    return "Enter at least 1.";
  }

  if (qty > available) {
    return "Consumed qty cannot exceed available no of leaves.";
  }

  return "";
}
