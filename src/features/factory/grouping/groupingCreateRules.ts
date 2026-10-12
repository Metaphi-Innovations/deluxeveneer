import type { MasterFieldDefinition } from "../../masters/shared";

import { insertFactoryCreateField } from "../shared/factoryCreateFieldOrder";
import { allocateNextGroupNo, getExistingGroupNo } from "../shared/groupNoStore";

export const groupingProcessDate = {
  key: "groupingDate",
  label: "Grouping Date",
} as const;

export const groupingCreateSourceColumns = [
  { key: "storageSrNo", keys: ["storageSrNo", "storageSerialNumber"], label: "Storage Sr No", minWidth: 160 },
  { key: "itemName", keys: ["itemName", "productName"], label: "Item Name", minWidth: 170 },
  { key: "subCategory", keys: ["subCategory", "itemSubCategory"], label: "Sub Category", minWidth: 160 },
  { key: "length", keys: ["length"], label: "Length", minWidth: 120 },
  { key: "width", keys: ["width"], label: "Width", minWidth: 120 },
  { key: "thickness", keys: ["thickness", "height"], label: "Thickness", minWidth: 120 },
  { key: "noOfLeaves", keys: ["noOfLeaves", "issuedLeafCount"], label: "No of Leaves", minWidth: 140 },
  { key: "sqm", keys: ["sqm", "totalSqm"], label: "SQM", minWidth: 120 },
  { key: "sqf", keys: ["sqf", "totalSqf"], label: "SQF", minWidth: 120 },
  { key: "grade", keys: ["grade"], label: "Grade", minWidth: 120 },
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
