import type { FactoryIssuedWorkRecord } from "../shared/factoryIssuedWorkStore";
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

function receivedLeafCount(row: FactoryRecord) {
  return (
    leafCount(row.receivedNoOfLeaves) ||
    leafCount(row.noOfLeaves) ||
    leafCount(row.issuedLeafCount) ||
    leafCount(row.totalLeaves)
  );
}

export function mapSplicingIssuedListingRow<Row extends FactoryRecord>(
  row: Row,
  issuedWork: readonly FactoryIssuedWorkRecord[],
): Row {
  const received = receivedLeafCount(row);
  const rowIds = new Set(
    [String(row.id), typeof row.workItemId === "string" ? row.workItemId : ""].filter(
      Boolean,
    ),
  );
  const issuedOut = issuedWork.reduce((total, item) => {
    if (item.sourceSlug !== "splicing" || !rowIds.has(item.sourceRowId)) {
      return total;
    }

    const issuedLeaves =
      leafCount(item.sourceSnapshot.consumedLeaves) ||
      leafCount(item.sourceSnapshot.issuedLeafCount);

    return total + issuedLeaves;
  }, 0);

  return {
    ...row,
    receivedNoOfLeaves: String(received),
    availableNoOfLeaves: String(Math.max(0, received - issuedOut)),
  };
}
