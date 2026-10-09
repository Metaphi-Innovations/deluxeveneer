import type { EnterpriseTableColumn } from "../../../components/data-display/EnterpriseDataTable";
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
  "totalAmount",
]);

const issuedColumnOrder = [
  "storageSrNo",
  "issuedDate",
  "itemName",
  "subCategory",
  "grade",
  "length",
  "width",
  "height",
  "noOfLeaves",
  "sqm",
  "sqf",
  "remark",
  "createdBy",
  "createdAt",
  "updatedBy",
  "updatedAt",
] as const;

const issuedExtraLabels: Record<string, string> = {
  itemName: "Item Name",
  subCategory: "Sub Category",
};

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

  return columns;
}

function groupingDoneColumns<Row extends FactoryRecord>(
  sourceColumns: readonly EnterpriseTableColumn<Row>[],
): readonly EnterpriseTableColumn<Row>[] {
  let columns = sourceColumns.filter(
    (column) =>
      column.key !== "issueTo" &&
      column.key !== "logNo" &&
      column.key !== "amount",
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
  const availableSheetsColumn: EnterpriseTableColumn<Row> = {
    key: "availableSheets",
    label: "Available Sheets",
  };
  const insertAt = columns.findIndex((entry) => entry.key === "remark");
  if (insertAt === -1) {
    return [...columns, availableSheetsColumn];
  }
  return [
    ...columns.slice(0, insertAt),
    availableSheetsColumn,
    ...columns.slice(insertAt),
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
    return groupingDoneColumns(sourceColumns);
  }

  return sourceColumns;
}
