import {
  formatSQM,
  parseNumericValue,
  SQM_TO_SQF,
} from "../../shared/numberFormat";
import type { FactoryIssuedWorkRecord } from "../../factory/shared/factoryIssuedWorkStore";

type AreaSource = {
  length?: unknown;
  noOfLeaves?: unknown;
  sqf?: unknown;
  sqm?: unknown;
  width?: unknown;
};

export function parseLeafCount(value: unknown) {
  const parsed = parseNumericValue(value);
  if (parsed === null || parsed <= 0) {
    return 0;
  }
  return Math.floor(parsed);
}

export function groupingIssuedLeavesBySource(
  issues: readonly FactoryIssuedWorkRecord[],
  warehouseName: string,
) {
  const issued = new Map<string, number>();
  for (const item of issues) {
    if (item.destinationSlug !== "grouping" || item.sourceSlug !== warehouseName) {
      continue;
    }
    const leaves = parseLeafCount(
      item.sourceSnapshot.issuedLeafCount ??
        item.sourceSnapshot.groupingIssuedLeaves ??
        item.sourceSnapshot.noOfLeaves,
    );
    issued.set(item.sourceRowId, (issued.get(item.sourceRowId) ?? 0) + leaves);
  }
  return issued;
}

export function areaBaseline(row: AreaSource) {
  const receivedLeaves = parseLeafCount(row.noOfLeaves);
  let sqm = parseNumericValue(row.sqm) ?? 0;
  if (sqm <= 0) {
    const length = parseNumericValue(row.length);
    const width = parseNumericValue(row.width);
    if (
      length !== null &&
      width !== null &&
      length > 0 &&
      width > 0 &&
      receivedLeaves > 0
    ) {
      sqm = length * width * receivedLeaves;
    }
  }

  let sqf = parseNumericValue(row.sqf) ?? 0;
  if (sqf <= 0 && sqm > 0) {
    sqf = sqm * SQM_TO_SQF;
  }

  return { receivedLeaves, sqf, sqm };
}

function scaleArea(receivedArea: number, receivedLeaves: number, leaves: number) {
  if (receivedLeaves <= 0 || leaves <= 0 || receivedArea <= 0) {
    return 0;
  }
  return (receivedArea * leaves) / receivedLeaves;
}

function formatArea(value: number) {
  return value <= 0 ? "0" : formatSQM(value);
}

export function withGroupingAvailability<
  Row extends AreaSource & { id: string; noOfLeaves: string; sqf: string; sqm: string },
>(
  row: Row,
  issuedLeavesByRowId: ReadonlyMap<string, number>,
): Row & {
  availableNoOfLeaves: string;
  availableSqf: string;
  availableSqm: string;
  receivedNoOfLeaves: string;
  receivedSqf: string;
  receivedSqm: string;
} {
  const issuedLeaves = issuedLeavesByRowId.get(String(row.id)) ?? 0;
  const { receivedLeaves, sqf, sqm } = areaBaseline(row);
  const availableLeaves = Math.max(0, receivedLeaves - issuedLeaves);
  if (issuedLeaves <= 0) {
    return {
      ...row,
      receivedNoOfLeaves: row.noOfLeaves,
      availableNoOfLeaves: row.noOfLeaves,
      receivedSqm: row.sqm,
      availableSqm: row.sqm,
      receivedSqf: row.sqf,
      availableSqf: row.sqf,
    };
  }

  return {
    ...row,
    receivedNoOfLeaves: row.noOfLeaves,
    availableNoOfLeaves: String(availableLeaves),
    receivedSqm: row.sqm,
    availableSqm: formatArea(scaleArea(sqm, receivedLeaves, availableLeaves)),
    receivedSqf: row.sqf,
    availableSqf: formatArea(scaleArea(sqf, receivedLeaves, availableLeaves)),
  };
}

export function groupingIssuedSliceAreas(row: AreaSource, issuedLeaves: number) {
  const { receivedLeaves, sqf, sqm } = areaBaseline(row);
  return {
    sqf: formatArea(scaleArea(sqf, receivedLeaves, issuedLeaves)),
    sqm: formatArea(scaleArea(sqm, receivedLeaves, issuedLeaves)),
  };
}
