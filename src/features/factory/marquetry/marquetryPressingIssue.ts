import { parseNumericValue, SQM_TO_SQF } from "../../shared/numberFormat";
import { isSampleFactoryRow } from "../shared/sampleSheetIdentityStore";
import type { FactoryRecord } from "../shared/types";

function leafCount(value: unknown) {
  return Math.max(0, Math.floor(parseNumericValue(value) ?? 0));
}

/**
 * Marquetry Done output qty lives on `noOfLeaves`. Input stock may still leave
 * stale `availableLeaves` on the snapshot — prefer output leaves for Pressing.
 */
export function getMarquetryPressingAvailableLeaves(row: FactoryRecord) {
  const outputLeaves = leafCount(row.noOfLeaves);
  if (outputLeaves > 0) {
    return outputLeaves;
  }

  return leafCount(
    row.availableNoOfLeaves ?? row.availableLeaves ?? row.receivedNoOfLeaves,
  );
}

export function buildMarquetryPressingIssueRow<Row extends FactoryRecord>(
  row: Row,
): Row | null {
  const availableLeaves = getMarquetryPressingAvailableLeaves(row);
  if (availableLeaves <= 0) {
    return null;
  }

  const isSample = isSampleFactoryRow(row);
  if (
    !isSample &&
    (!String(row.orderNo ?? "").trim() ||
      !String(row.orderItemNo ?? "").trim())
  ) {
    return null;
  }

  const receivedLeaves = Math.max(
    availableLeaves,
    leafCount(row.receivedNoOfLeaves ?? row.noOfLeaves),
  );
  const receivedSqm = parseNumericValue(row.sqm) ?? 0;
  const receivedSqf = parseNumericValue(row.sqf) ?? receivedSqm * SQM_TO_SQF;
  const ratio = receivedLeaves > 0 ? availableLeaves / receivedLeaves : 1;
  const issuedSqm = receivedSqm > 0 ? receivedSqm * ratio : 0;
  const issuedSqf = receivedSqf > 0 ? receivedSqf * ratio : 0;
  const sqmText = issuedSqm > 0 ? issuedSqm.toFixed(3) : String(row.sqm ?? "0");
  const sqfText = issuedSqf > 0 ? issuedSqf.toFixed(3) : String(row.sqf ?? "0");
  const leavesText = String(availableLeaves);

  return {
    ...row,
    productType:
      typeof row.productType === "string" && row.productType.trim()
        ? row.productType
        : "Marquetry",
    noOfLeaves: leavesText,
    noOfSheets: leavesText,
    issuedLeafCount: leavesText,
    issuedNoOfSheets: leavesText,
    receivedNoOfLeaves: leavesText,
    receivedLeaves: leavesText,
    receivedSheets: leavesText,
    availableNoOfLeaves: leavesText,
    availableLeaves: leavesText,
    availableSheets: leavesText,
    sourceAvailableLeaves: leavesText,
    sourceAvailableSheets: leavesText,
    sqm: sqmText,
    sqf: sqfText,
    receivedSqm: sqmText,
    receivedSqf: sqfText,
    availableSqm: sqmText,
    availableSqf: sqfText,
    totalSqm: sqmText,
    totalSqf: sqfText,
  } as Row;
}
