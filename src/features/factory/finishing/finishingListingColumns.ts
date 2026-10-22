import type { EnterpriseTableColumn } from "../../../components/data-display/EnterpriseDataTable";
import { withAvailableFactoryMeasureColumns } from "../shared/factoryAvailableMeasures";
import type { FactoryProcessTab } from "../shared/factoryUtils";
import type { FactoryRecord } from "../shared/types";

const finishingHiddenOutsideHistory = new Set(["warehouseName", "issuedFor"]);
const finishingHiddenKeys = new Set([
  "amount",
  "bundleNo",
  "bundleNumber",
  "palletNo",
  "palletNumber",
  "rate",
  "ratePerSqf",
]);

const finishingIssuedCodeColumns: readonly EnterpriseTableColumn<FactoryRecord>[] =
  [
    { key: "designCode", label: "Design Code" },
    { key: "structureCode", label: "Structure Code" },
  ];

export function applyFinishingListingColumns<Row extends FactoryRecord>(
  columns: readonly EnterpriseTableColumn<Row>[],
  activeTab: FactoryProcessTab,
): readonly EnterpriseTableColumn<Row>[] {
  const visible = columns.filter((column) => {
    if (column.key === "storageSrNo" || column.key === "storageSerialNumber") {
      return false;
    }

    if (finishingHiddenKeys.has(column.key)) {
      return false;
    }

    if (activeTab === "history") {
      return true;
    }

    return !finishingHiddenOutsideHistory.has(column.key);
  });

  if (activeTab === "issued") {
    const withCodes = insertColumnsAfter(
      visible,
      "itemSubCategory",
      finishingIssuedCodeColumns,
    );
    const withReceivedSheets = withCodes.map((column) =>
      column.key === "noOfSheets"
        ? { ...column, key: "receivedSheets", label: "Received Sheets" }
        : column,
    );
    const withAvailableSheets = insertColumnsAfter(
      withReceivedSheets,
      "receivedSheets",
      [{ key: "availableSheets", label: "Available Sheets" }],
    );
    return withAvailableFactoryMeasureColumns(withAvailableSheets);
  }

  if (activeTab === "done") {
    const withFinishingType = insertColumnsAfter(visible, "itemSubCategory", [
      { key: "finishingType", label: "Finishing Type" },
    ]);
    const withReceivedSheets = withFinishingType.map((column) => {
      if (column.key === "noOfSheets") {
        return { ...column, key: "receivedSheets", label: "Received Sheets" };
      }
      return column;
    });
    const withAvailableSheets = insertColumnsAfter(
      withReceivedSheets,
      "receivedSheets",
      [{ key: "availableSheets", label: "Available Sheets" }],
    );
    return withAvailableFactoryMeasureColumns(withAvailableSheets);
  }

  return insertColumnsAfter(visible, "itemSubCategory", [
    { key: "finishingType", label: "Finishing Type" },
  ]);
}

function insertColumnsAfter<Row extends FactoryRecord>(
  columns: readonly EnterpriseTableColumn<Row>[],
  afterKey: string,
  extras: readonly EnterpriseTableColumn<FactoryRecord>[],
): EnterpriseTableColumn<Row>[] {
  const existing = new Set(columns.map((column) => column.key));
  const missing = extras.filter(
    (column) => !existing.has(column.key),
  ) as EnterpriseTableColumn<Row>[];

  if (missing.length === 0) {
    return [...columns];
  }

  const itemIndex = columns.findIndex((column) => column.key === afterKey);
  const insertAt = itemIndex >= 0 ? itemIndex + 1 : columns.length;

  return [
    ...columns.slice(0, insertAt),
    ...missing,
    ...columns.slice(insertAt),
  ];
}
