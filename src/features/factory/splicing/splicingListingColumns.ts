import type { EnterpriseTableColumn } from "../../../components/data-display/EnterpriseDataTable";
import { withAvailableFactoryMeasureColumns } from "../shared/factoryAvailableMeasures";
import type { FactoryProcessTab } from "../shared/factoryUtils";
import type { FactoryRecord } from "../shared/types";

const splicingDoneOrderColumns: readonly EnterpriseTableColumn<FactoryRecord>[] = [
  { key: "issuedFor", label: "Issue For" },
  { key: "orderDate", label: "Order Date" },
  { key: "customerName", label: "Customer Name" },
  { key: "orderNo", label: "Order No" },
  { key: "orderItemNo", label: "Order Item No" },
];

const splicingDoneOrderKeys = new Set(
  splicingDoneOrderColumns.map((column) => column.key),
);

const splicingDoneHiddenKeys = new Set([
  "groupNo",
  "groupPhoto",
  "groupingDate",
]);

const splicingIssuedLeafColumns: readonly EnterpriseTableColumn<FactoryRecord>[] = [
  { key: "receivedNoOfLeaves", label: "Received No of Leaves" },
  { key: "availableNoOfLeaves", label: "Available No of Leaves" },
];

const splicingIssuedHiddenKeys = new Set([
  "availableNoOfLeaves",
  "noOfSheets",
  "receivedNoOfLeaves",
]);

function withOrderColumnsBeforeItem<Row extends FactoryRecord>(
  columns: readonly EnterpriseTableColumn<Row>[],
): readonly EnterpriseTableColumn<Row>[] {
  const withoutOrderColumns = columns.filter(
    (column) => !splicingDoneOrderKeys.has(column.key),
  );
  const orderColumns = splicingDoneOrderColumns as readonly EnterpriseTableColumn<Row>[];
  const insertAt = withoutOrderColumns.findIndex((column) => column.key === "itemName");

  if (insertAt === -1) {
    return [...withoutOrderColumns, ...orderColumns];
  }

  return [
    ...withoutOrderColumns.slice(0, insertAt),
    ...orderColumns,
    ...withoutOrderColumns.slice(insertAt),
  ];
}

function withSplicingIssuedLeafColumns<Row extends FactoryRecord>(
  columns: readonly EnterpriseTableColumn<Row>[],
): readonly EnterpriseTableColumn<Row>[] {
  const withoutSheetColumns = columns.filter(
    (column) => !splicingIssuedHiddenKeys.has(column.key),
  );
  const leafColumns = splicingIssuedLeafColumns as readonly EnterpriseTableColumn<Row>[];
  const insertAt = withoutSheetColumns.findIndex((column) => column.key === "sqm");

  if (insertAt === -1) {
    return [...withoutSheetColumns, ...leafColumns];
  }

  return [
    ...withoutSheetColumns.slice(0, insertAt),
    ...leafColumns,
    ...withoutSheetColumns.slice(insertAt),
  ];
}

export function applySplicingListingColumns<Row extends FactoryRecord>(
  columns: readonly EnterpriseTableColumn<Row>[],
  activeTab: FactoryProcessTab,
): readonly EnterpriseTableColumn<Row>[] {
  if (activeTab === "issued") {
    return withAvailableFactoryMeasureColumns(
      withOrderColumnsBeforeItem(withSplicingIssuedLeafColumns(columns)),
    );
  }

  if (activeTab !== "done") {
    return columns;
  }

  const withoutHiddenColumns = columns.filter(
    (column) => !splicingDoneHiddenKeys.has(column.key),
  );

  return withOrderColumnsBeforeItem(withoutHiddenColumns);
}
