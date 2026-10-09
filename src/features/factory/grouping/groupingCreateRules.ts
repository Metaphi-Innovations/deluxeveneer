import type { MasterFieldDefinition } from "../../masters/shared";

import { insertFactoryCreateField } from "../shared/factoryCreateFieldOrder";
import { allocateNextGroupNo, getExistingGroupNo } from "../shared/groupNoStore";

export const groupingProcessDate = {
  key: "groupingDate",
  label: "Grouping Date",
} as const;

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
