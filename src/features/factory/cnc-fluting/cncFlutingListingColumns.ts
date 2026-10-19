import type { EnterpriseTableColumn } from "../../../components/data-display/EnterpriseDataTable";
import type { FactoryProcessTab } from "../shared/factoryUtils";
import type { FactoryRecord } from "../shared/types";

const flutingHiddenOutsideHistory = new Set(["warehouseName"]);
const flutingHiddenKeys = new Set([
  "amount",
  "issuedFrom",
  "issuedFor",
  "rate",
  "ratePerSqf",
]);

export function applyCncFlutingListingColumns<Row extends FactoryRecord>(
  columns: readonly EnterpriseTableColumn<Row>[],
  activeTab: FactoryProcessTab,
): readonly EnterpriseTableColumn<Row>[] {
  const visibleColumns = columns.filter((column) => {
    if (column.key === "storageSrNo" || column.key === "storageSerialNumber") {
      return false;
    }

    if (flutingHiddenKeys.has(column.key)) {
      return false;
    }

    if (activeTab === "history") {
      return true;
    }

    return !flutingHiddenOutsideHistory.has(column.key);
  });

  return visibleColumns;
}
