import type { EnterpriseTableColumn } from "../../../components/data-display/EnterpriseDataTable";
import type { FactoryRecord } from "../shared/types";

const pressingHiddenKeys = new Set([
  "amount",
  "consumedAmount",
  "issuedFrom",
  "issuedFor",
  "rate",
  "ratePerSqf",
  "warehouseName",
]);

export function applyPressingListingColumns<Row extends FactoryRecord>(
  columns: readonly EnterpriseTableColumn<Row>[],
): readonly EnterpriseTableColumn<Row>[] {
  const visibleColumns = columns.filter(
    (column) => !pressingHiddenKeys.has(column.key),
  );

  if (visibleColumns.some((column) => column.key === "storageSrNo")) {
    return visibleColumns;
  }

  return [
    { key: "storageSrNo", label: "Storage Sr No." },
    ...visibleColumns,
  ];
}
