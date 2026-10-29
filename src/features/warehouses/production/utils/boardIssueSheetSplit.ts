import type { BoardIssueEligibleInventoryItem } from "../api/productionWarehouseApi";

function roundArea(value: number) {
  return Math.round(value * 1000) / 1000;
}

export function splitBoardIssueQuantities(input: {
  availableSheets: number;
  issueSheets: number;
  totalSqm: number;
  totalSqf: number;
}) {
  const ratio =
    input.availableSheets > 0 ? input.issueSheets / input.availableSheets : 0;
  const issuedSqm = roundArea(input.totalSqm * ratio);
  const issuedSqf = roundArea(input.totalSqf * ratio);
  return {
    remainingSheets: input.availableSheets - input.issueSheets,
    issuedSqm,
    issuedSqf,
    remainingSqm: roundArea(input.totalSqm - issuedSqm),
    remainingSqf: roundArea(input.totalSqf - issuedSqf),
  };
}

export function previewBoardIssueLine(
  pallet: BoardIssueEligibleInventoryItem,
  issueSheets: number,
) {
  return splitBoardIssueQuantities({
    availableSheets: pallet.availableSheets,
    issueSheets,
    totalSqm: pallet.availableSqm,
    totalSqf: pallet.availableSqf,
  });
}
