import type { EnterpriseTableColumn } from "../../../components/data-display/EnterpriseDataTable";
import { withAvailableFactoryMeasureColumns } from "../shared/factoryAvailableMeasures";
import type { FactoryProcessTab } from "../shared/factoryUtils";
import type { FactoryRecord } from "../shared/types";

const marquetryWarehouseOmittedKeys = new Set([
  "amount",
  "customerName",
  "for",
  "groupNo",
  "issuedFor",
  "noOfSheets",
  "orderDate",
  "orderItemNo",
  "orderNo",
]);

function withMarquetryBatchAndLeafColumns<Row extends FactoryRecord>(
  columns: readonly EnterpriseTableColumn<Row>[],
): EnterpriseTableColumn<Row>[] {
  const withoutGroupAndSheets = columns.filter(
    (column) =>
      column.key !== "groupNo" &&
      column.key !== "noOfSheets" &&
      column.key !== "batchNo" &&
      column.key !== "receivedNoOfLeaves" &&
      column.key !== "availableNoOfLeaves" &&
      column.key !== "receivedLeaves" &&
      column.key !== "availableLeaves",
  );

  const extras: readonly EnterpriseTableColumn<Row>[] = [
    {
      key: "batchNo",
      label: "Batch No",
      renderCell: (row: Row) =>
        String(
          (row as Record<string, unknown>).batchNo ||
            (row as Record<string, unknown>).batchNoCode ||
            "-",
        ),
    },
    {
      key: "receivedNoOfLeaves",
      label: "Received No. of Leaves",
      renderCell: (row: Row) =>
        String(
          (row as Record<string, unknown>).receivedNoOfLeaves ||
            (row as Record<string, unknown>).receivedLeaves ||
            (row as Record<string, unknown>).noOfLeaves ||
            "-",
        ),
    },
    {
      key: "availableNoOfLeaves",
      label: "Available No. of Leaves",
      renderCell: (row: Row) =>
        String(
          (row as Record<string, unknown>).availableNoOfLeaves ||
            (row as Record<string, unknown>).availableLeaves ||
            (row as Record<string, unknown>).receivedNoOfLeaves ||
            (row as Record<string, unknown>).noOfLeaves ||
            "-",
        ),
    },
  ];

  const insertAfterKey = withoutGroupAndSheets.some(
    (column) => column.key === "itemSubCategory",
  )
    ? "itemSubCategory"
    : withoutGroupAndSheets.some((column) => column.key === "itemName")
      ? "itemName"
      : null;

  if (!insertAfterKey) {
    return withAvailableFactoryMeasureColumns([...extras, ...withoutGroupAndSheets]);
  }

  const insertAt = withoutGroupAndSheets.findIndex(
    (column) => column.key === insertAfterKey,
  );

  return withAvailableFactoryMeasureColumns([
    ...withoutGroupAndSheets.slice(0, insertAt + 1),
    ...extras,
    ...withoutGroupAndSheets.slice(insertAt + 1),
  ]);
}

export function applyMarquetryListingColumns<Row extends FactoryRecord>(
  columns: readonly EnterpriseTableColumn<Row>[],
  activeTab: FactoryProcessTab,
): EnterpriseTableColumn<Row>[] {
  const withoutStorageNo = columns.filter(
    (column) => column.key !== "storageSrNo" && column.key !== "storageSerialNumber",
  );
  const withBatchAndLeaves = withMarquetryBatchAndLeafColumns(withoutStorageNo);

  if (activeTab === "done") {
    return withBatchAndLeaves.filter(
      (column) =>
        column.key !== "issuedDate" &&
        column.key !== "issueDate" &&
        column.key !== "issuedFor" &&
        column.key !== "amount" &&
        !marquetryWarehouseOmittedKeys.has(column.key),
    );
  }

  if (activeTab === "history" || activeTab === "rejected") {
    return withBatchAndLeaves.filter(
      (column) =>
        column.key !== "issuedFor" &&
        column.key !== "amount" &&
        !marquetryWarehouseOmittedKeys.has(column.key),
    );
  }

  if (activeTab !== "issued") {
    return withBatchAndLeaves;
  }

  return withBatchAndLeaves.filter(
    (column) => !marquetryWarehouseOmittedKeys.has(column.key),
  );
}
