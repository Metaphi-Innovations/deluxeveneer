import type { EnterpriseTableColumn } from "../../../components/data-display/EnterpriseDataTable";
import type { FactoryRecord } from "../shared/types";

const pressingHiddenKeys = new Set([
  "amount",
  "consumedAmount",
  "issuedFrom",
  "rate",
  "ratePerSqf",
  "warehouseName",
]);

export function applyPressingListingColumns<Row extends FactoryRecord>(
  columns: readonly EnterpriseTableColumn<Row>[],
): readonly EnterpriseTableColumn<Row>[] {
  return columns.filter((column) => !pressingHiddenKeys.has(column.key));
}
