import type { MasterFieldDefinition } from "../../masters/shared";

import { insertFactoryCreateField } from "../shared/factoryCreateFieldOrder";
import { allocateNextGroupNo, getExistingGroupNo } from "../shared/groupNoStore";

export const groupingProcessDate = {
  key: "groupingDate",
  label: "Grouping Date",
} as const;

export const groupingCreateSourceColumns = [
  { key: "storageSrNo", keys: ["storageSrNo", "storageSerialNumber"], label: "Storage Sr No", minWidth: 160 },
  { key: "itemName", keys: ["itemName", "productName"], label: "Item Name", minWidth: 220 },
  { key: "length", keys: ["length"], label: "Length", minWidth: 120 },
  { key: "width", keys: ["width"], label: "Width", minWidth: 120 },
  { key: "thickness", keys: ["thickness", "height"], label: "Thickness", minWidth: 120 },
  { key: "noOfLeaves", keys: ["noOfLeaves", "issuedLeafCount"], label: "No of Leaves", minWidth: 140 },
  { key: "sqm", keys: ["sqm", "totalSqm"], label: "SQM", minWidth: 120 },
  { key: "sqf", keys: ["sqf", "totalSqf"], label: "SQF", minWidth: 120 },
  { key: "remark", keys: ["remark"], label: "Remark", minWidth: 200 },
];

export const groupingHiddenSourceKeys = new Set([
  "orderNo",
  "orderItemNo",
  "supplierName",
  "orderDate",
]);

export function prependGroupingGroupNoField(headerFields: MasterFieldDefinition[]) {
  headerFields.unshift({
    key: "groupNo",
    label: "Group No.",
    type: "text",
    readOnly: true,
  });
}

export function orderGroupingCreateFields(fields: readonly MasterFieldDefinition[]) {
  return insertFactoryCreateField(fields, "groupPhoto", (withoutSpecialField) =>
    withoutSpecialField.findIndex((field) => field.key === "remark"),
  );
}

function readWholeLeafCount(value: unknown) {
  const text = String(value ?? "").trim();
  if (!/^\d+$/u.test(text)) return 0;
  const parsed = Number(text);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : 0;
}

export function readGroupingReferenceLeaves(
  sourceRow: Record<string, unknown> | undefined,
) {
  if (!sourceRow) return 0;
  for (const key of ["noOfLeaves", "issuedLeafCount", "availableLeaves", "noOfSheets"]) {
    const leaves = readWholeLeafCount(sourceRow[key]);
    if (leaves > 0) return leaves;
  }
  return 0;
}

export function sumGroupingOutputLeaves(
  items: readonly { values: Record<string, string> }[],
) {
  return items.reduce(
    (total, item) => total + readWholeLeafCount(item.values.noOfLeaves),
    0,
  );
}

export function getGroupingLeafLimitMessage({
  availableLeaves,
  outputLeaves,
  referenceLeaves,
}: {
  availableLeaves: number;
  outputLeaves: number;
  referenceLeaves: number;
}) {
  const limitLabel = `reference No of Leaves (${referenceLeaves})`;
  if (outputLeaves > referenceLeaves || availableLeaves > referenceLeaves) {
    return `No of Leaves cannot be more than the ${limitLabel}.`;
  }
  if (outputLeaves + availableLeaves > referenceLeaves) {
    return `Output No of Leaves and Available Details together cannot be more than the ${limitLabel}.`;
  }
  return "";
}

export function applyGroupingCreateSnapshot(
  resultSnapshot: Record<string, unknown>,
  sourceRow: Record<string, unknown> | undefined,
) {
  resultSnapshot.groupNo = getExistingGroupNo(sourceRow) || allocateNextGroupNo();
  // Grouping is stock/process — do not carry order/customer onto the batch.
  delete resultSnapshot.orderNo;
  delete resultSnapshot.orderDate;
  delete resultSnapshot.orderItemNo;
  delete resultSnapshot.customerName;
  delete resultSnapshot.productName;
}
