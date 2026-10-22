import type { EnterpriseTableColumn } from "../../../components/data-display/EnterpriseDataTable";
import { withAvailableFactoryMeasureColumns } from "../shared/factoryAvailableMeasures";
import type { FactoryProcessTab } from "../shared/factoryUtils";
import type { FactoryRecord } from "../shared/types";

const flutingHiddenOutsideHistory = new Set(["warehouseName"]);
const flutingHiddenKeys = new Set([
  "amount",
  "bundleNo",
  "bundleNumber",
  "issuedFrom",
  "issuedFor",
  "palletNo",
  "palletNumber",
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

  if (activeTab !== "issued" && activeTab !== "done") {
    return visibleColumns;
  }

  const withReceivedSheets = visibleColumns.map((column) =>
    column.key === "noOfSheets"
      ? { ...column, key: "receivedSheets", label: "Received Sheets" }
      : column,
  );
  const receivedIndex = withReceivedSheets.findIndex(
    (column) => column.key === "receivedSheets",
  );
  const withAvailableSheets = [
    ...withReceivedSheets.slice(0, receivedIndex + 1),
    {
      key: "availableSheets",
      label: "Available Sheets",
    } as EnterpriseTableColumn<Row>,
    ...withReceivedSheets.slice(receivedIndex + 1),
  ];

  return withAvailableFactoryMeasureColumns(withAvailableSheets);
}
