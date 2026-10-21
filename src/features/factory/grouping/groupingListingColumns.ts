import type { EnterpriseTableColumn } from "../../../components/data-display/EnterpriseDataTable";
import { withAvailableFactoryMeasureColumns } from "../shared/factoryAvailableMeasures";
import type { FactoryProcessTab } from "../shared/factoryUtils";
import type { FactoryRecord } from "../shared/types";

const issuedOmittedKeys = new Set([
  "amount",
  "currency",
  "factoryCode",
  "groupNo",
  "groupPhoto",
  "groupingDate",
  "inwardDate",
  "inwardItemCode",
  "issueTo",
  "logNo",
  "noOfLeaves",
  "storageSrNo",
  "totalAmount",
]);

const issuedColumnOrder = [
  "issuedDate",
  "itemName",
  "subCategory",
  "grade",
  "length",
  "width",
  "height",
  "receivedNoOfLeaves",
  "availableNoOfLeaves",
  "sqm",
  "sqf",
  "remark",
  "createdBy",
  "createdAt",
  "updatedBy",
  "updatedAt",
] as const;

const issuedExtraLabels: Record<string, string> = {
  availableNoOfLeaves: "Available Leaves",
  itemName: "Item Name",
  receivedNoOfLeaves: "Received Leaves",
  subCategory: "Sub Category",
};

function formatGroupingDate(value: unknown) {
  const date = value instanceof Date ? value : typeof value === "string" && value.trim() ? new Date(value) : null;
  if (!date || Number.isNaN(date.getTime())) return "-";
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

function groupingIssuedColumns<Row extends FactoryRecord>(
  sourceColumns: readonly EnterpriseTableColumn<Row>[],
): EnterpriseTableColumn<Row>[] {
  const byKey = new Map(sourceColumns.map((column) => [column.key, column]));
  const used = new Set<string>();
  const columns: EnterpriseTableColumn<Row>[] = [];

  for (const key of issuedColumnOrder) {
    used.add(key);
    const existing = byKey.get(key);
    if (existing) {
      columns.push(existing);
      continue;
    }

    const label = issuedExtraLabels[key];
    if (!label) continue;
    columns.push({
      key,
      label,
    });
  }

  for (const column of sourceColumns) {
    if (used.has(column.key) || issuedOmittedKeys.has(column.key)) continue;
    columns.push(column);
  }

  return withAvailableFactoryMeasureColumns(columns);
}

const groupingDoneLeafColumns: readonly EnterpriseTableColumn<FactoryRecord>[] = [
  { key: "receivedNoOfLeaves", label: "Received No of Leaves" },
  { key: "availableNoOfLeaves", label: "Available No of Leaves" },
];

const groupingDoneHiddenKeys = new Set([
  "amount",
  "availableNoOfLeaves",
  "availableSheets",
  "issueTo",
  "logNo",
  "noOfLeaves",
  "noOfSheets",
  "receivedNoOfLeaves",
  "storageSrNo",
]);


function groupingDoneColumns<Row extends FactoryRecord>(
  sourceColumns: readonly EnterpriseTableColumn<Row>[],
): readonly EnterpriseTableColumn<Row>[] {
  let columns = sourceColumns.filter(
    (column) => !groupingDoneHiddenKeys.has(column.key),
  );
  const identityColumns: readonly EnterpriseTableColumn<Row>[] = [
    { key: "itemName", label: "Item Name" },
    { key: "subCategory", label: "Sub Category" },
  ];
  const withoutIdentity = columns.filter(
    (column) => !identityColumns.some((extra) => extra.key === column.key),
  );
  const identityAt = withoutIdentity.findIndex((column) => column.key === "issuedDate");
  columns =
    identityAt === -1
      ? [...identityColumns, ...withoutIdentity]
      : [
          ...withoutIdentity.slice(0, identityAt + 1),
          ...identityColumns,
          ...withoutIdentity.slice(identityAt + 1),
        ];

  const leafColumns = groupingDoneLeafColumns as readonly EnterpriseTableColumn<Row>[];
  const leafAt = columns.findIndex((column) => column.key === "sqm");

  if (leafAt === -1) {
    return [...columns, ...leafColumns];
  }

  return [
    ...columns.slice(0, leafAt),
    ...leafColumns,
    ...columns.slice(leafAt),
  ];
}

export function applyGroupingListingColumns<Row extends FactoryRecord>(
  sourceColumns: readonly EnterpriseTableColumn<Row>[],
  activeTab: FactoryProcessTab,
): readonly EnterpriseTableColumn<Row>[] {
  if (activeTab === "issued") {
    return groupingIssuedColumns(sourceColumns);
  }

  if (activeTab === "done" || activeTab === "history" || activeTab === "rejected") {
    let baseColumns = withAvailableFactoryMeasureColumns(groupingDoneColumns(sourceColumns));
    if (activeTab === "rejected") {
      baseColumns = baseColumns.map((column) =>
        column.key === "issuedDate"
          ? {
              ...column,
              label: "Rejected Date",
              renderCell: (row: Row) =>
                formatGroupingDate(row.rejectedDate ?? row.processDate ?? row.issuedDate),
            }
          : column,
      );
    }
    if (activeTab === "history") {
      const orderColumns: readonly EnterpriseTableColumn<Row>[] = [
        { key: "issuedFor", label: "Issued For" },
        { key: "orderType", label: "Order Type" },
        { key: "orderNo", label: "Order No." },
        { key: "orderItemNo", label: "Order Item No." },
        { key: "customerName", label: "Customer Name" },
        { key: "orderDate", label: "Order Date" },
      ];
      const missingOrderColumns = orderColumns.filter(
        (orderColumn) =>
          !baseColumns.some((column) => column.key === orderColumn.key),
      );
      const insertAfterKey = "groupPhoto";
      const index = baseColumns.findIndex(
        (column) => column.key === insertAfterKey,
      );

      return index === -1
        ? [...missingOrderColumns, ...baseColumns]
        : [
            ...baseColumns.slice(0, index + 1),
            ...missingOrderColumns,
            ...baseColumns.slice(index + 1),
          ];
    }
    return baseColumns;
  }

  return sourceColumns;
}

