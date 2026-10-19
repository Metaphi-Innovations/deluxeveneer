import type { EnterpriseTableColumn } from "../../../components/data-display/EnterpriseDataTable";
import type { FactoryProcessTab } from "../shared/factoryUtils";
import type { FactoryRecord } from "../shared/types";

const embossingHiddenKeys = new Set([
  "warehouseName",
  "issuedFrom",
  "issuedFor",
  "amount",
  "ratePerSqf",
]);

export function applyEmbossingListingColumns<Row extends FactoryRecord>(
  columns: readonly EnterpriseTableColumn<Row>[],
  _activeTab: FactoryProcessTab,
): readonly EnterpriseTableColumn<Row>[] {
  const visibleColumns = columns.filter(
    (column) =>
      !embossingHiddenKeys.has(column.key) &&
      column.key !== "storageSrNo" &&
      column.key !== "storageSerialNumber",
  );

  return visibleColumns;
}
