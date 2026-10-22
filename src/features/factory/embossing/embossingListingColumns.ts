import type { EnterpriseTableColumn } from "../../../components/data-display/EnterpriseDataTable";
import { withAvailableFactoryMeasureColumns } from "../shared/factoryAvailableMeasures";
import type { FactoryProcessTab } from "../shared/factoryUtils";
import type { FactoryRecord } from "../shared/types";

const embossingHiddenKeys = new Set([
  "warehouseName",
  "issuedFrom",
  "issuedFor",
  "amount",
  "bundleNo",
  "bundleNumber",
  "palletNo",
  "palletNumber",
  "ratePerSqf",
]);

export function applyEmbossingListingColumns<Row extends FactoryRecord>(
  columns: readonly EnterpriseTableColumn<Row>[],
  activeTab: FactoryProcessTab,
): readonly EnterpriseTableColumn<Row>[] {
  const visibleColumns = columns.filter(
    (column) =>
      !embossingHiddenKeys.has(column.key) &&
      column.key !== "storageSrNo" &&
      column.key !== "storageSerialNumber",
  );

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
