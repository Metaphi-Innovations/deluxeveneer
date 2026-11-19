import { availableFactoryMeasures } from "../shared/factoryAvailableMeasures";
import {
  getAvailableGroupedSheets,
  getGroupedStockIssuesForRow,
  getReceivedGroupedLeaves,
} from "../shared/groupedStockIssueStore";
import type { FactoryRecord } from "../shared/types";

function textValue(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : "";
}

function groupingBatchNo<Row extends FactoryRecord>(row: Row) {
  const sourceBatch =
    textValue(row.batchNo) ||
    textValue(row.batchNoCode) ||
    textValue(row.logCode) ||
    textValue(row.logNo);

  if (sourceBatch) return sourceBatch;

  const identity =
    textValue(row.storageSrNo) ||
    textValue(row.sourceRowId) ||
    textValue(row.workItemId) ||
    String(row.id ?? "");
  const numericParts = identity.match(/\d+/g);
  const numericSuffix = numericParts?.[numericParts.length - 1];

  if (numericSuffix) {
    return `BATCH-GRP-${numericSuffix.slice(-4).padStart(4, "0")}`;
  }

  let checksum = 0;
  for (const character of identity) {
    checksum = (checksum * 31 + character.charCodeAt(0)) % 10000;
  }
  return `BATCH-GRP-${String(checksum || 1).padStart(4, "0")}`;
}

function groupingIssuedIdentityFields<Row extends FactoryRecord>(row: Row) {
  const itemName = textValue(row.itemName) || textValue(row.productName);
  const subCategory = textValue(row.subCategory) || textValue(row.itemSubCategory);
  const thickness = textValue(row.thickness) || textValue(row.height);
  const height = textValue(row.height) || thickness;
  const factoryCode = textValue(row.factoryCode);
  const currency = textValue(row.currency);

  return {
    ...(itemName ? { itemName } : {}),
    ...(subCategory ? { subCategory, itemSubCategory: subCategory } : {}),
    ...(thickness ? { thickness } : {}),
    ...(height ? { height } : {}),
    ...(factoryCode ? { factoryCode } : {}),
    ...(currency ? { currency } : {}),
  };
}

function resolveGroupingIssuedFor<Row extends FactoryRecord>(row: Row): string {
  const issues = getGroupedStockIssuesForRow(String(row.id));
  if (issues.length > 0) {
    const latest = issues[issues.length - 1];
    if (latest) {
      return latest.purpose === "sample-sheet" ? "Sample" : "Order";
    }
  }

  const rawCandidates = [
    typeof row.issuedFor === "string" ? row.issuedFor : "",
    typeof row.issueTo === "string" ? row.issueTo : "",
    typeof row.for === "string" ? row.for : "",
    typeof row.forLabel === "string" ? row.forLabel : "",
    typeof row.purpose === "string" ? row.purpose : "",
  ];

  for (const candidate of rawCandidates) {
    if (!candidate.trim()) continue;
    const lower = candidate.toLowerCase();
    if (lower.includes("sample")) {
      return "Sample";
    }
    if (lower.includes("order") || lower.includes("splicing")) {
      return "Order";
    }
  }

  return "Order";
}

export function mapGroupingListingRow<Row extends FactoryRecord>(
  row: Row,
  activeTab: string,
): Row {
  const currentIssueTo = row.issueTo || row.for || "Order";
  const issuedIdentity = groupingIssuedIdentityFields(row);
  const showLeafBalance =
    activeTab === "issued" ||
    activeTab === "done" ||
    activeTab === "history" ||
    activeTab === "rejected";
  const receivedLeaves = showLeafBalance ? getReceivedGroupedLeaves(row) : 0;
  const balanceRow =
    activeTab === "history" && row.groupingRef
      ? ({ ...row, id: String(row.groupingRef) } as Row)
      : row;
  const availableLeaves = showLeafBalance
    ? getAvailableGroupedSheets(balanceRow)
    : 0;
  const issuedFor = resolveGroupingIssuedFor(row);
  const batchNo = groupingBatchNo(row);

  return {
    ...row,
    ...issuedIdentity,
    batchNo,
    groupPhoto:
      row.groupPhoto ||
      "https://images.unsplash.com/photo-1546484475-7f7bd55792da?auto=format&fit=crop&w=400&q=80",
    issueTo: currentIssueTo,
    issuedFor,
    ...(showLeafBalance
      ? {
          receivedNoOfLeaves: String(receivedLeaves),
          availableNoOfLeaves: String(availableLeaves),
          ...availableFactoryMeasures(row, receivedLeaves, availableLeaves),
        }
      : {}),
    for: currentIssueTo,
    forLabel: currentIssueTo,
  } as Row;
}

