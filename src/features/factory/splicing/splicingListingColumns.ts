import type { EnterpriseTableColumn } from "../../../components/data-display/EnterpriseDataTable";
import { withAvailableFactoryMeasureColumns } from "../shared/factoryAvailableMeasures";
import { resolveSplicingIssuePurpose } from "../shared/sampleSheetIdentityStore";
import type { FactoryProcessTab } from "../shared/factoryUtils";
import type { FactoryRecord } from "../shared/types";

function splicingProductTypeLabel(row: FactoryRecord) {
  if (resolveSplicingIssuePurpose(row) === "Sample") {
    return "-";
  }

  const value = String(
    row.productType || row.finishedType || row.orderType || row.issuedFor || "",
  ).trim();
  if (!value || value.toLowerCase().includes("sample")) {
    return "-";
  }

  return value;
}

const splicingDoneOrderColumns: readonly EnterpriseTableColumn<FactoryRecord>[] = [
  { key: "orderDate", label: "Order Date" },
  { key: "customerName", label: "Customer Name" },
  { key: "orderNo", label: "Order No" },
  { key: "orderItemNo", label: "Order Item No" },
];

const splicingDoneOrderKeys = new Set(
  splicingDoneOrderColumns.map((column) => column.key),
);

const splicingDoneHiddenKeys = new Set([
  "groupPhoto",
  "issuedDate",
  "storageSrNo",
]);

function formatSplicingDate(value: unknown) {
  const date = value instanceof Date ? value : typeof value === "string" && value.trim() ? new Date(value) : null;
  if (!date || Number.isNaN(date.getTime())) return "-";
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

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

function withSplicingBatchNoAndColorColumns<Row extends FactoryRecord>(
  columns: readonly EnterpriseTableColumn<Row>[],
): readonly EnterpriseTableColumn<Row>[] {
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
      key: "color",
      label: "Color",
      renderCell: (row: Row) =>
        String(
          (row as Record<string, unknown>).color ||
            (row as Record<string, unknown>).colour ||
            "-",
        ),
    },
  ];
  const withoutExtras = columns.filter(
    (column) => !extras.some((extra) => extra.key === column.key),
  );
  const insertAfterKey = withoutExtras.some((column) => column.key === "itemSubCategory")
    ? "itemSubCategory"
    : "itemName";
  const insertAt = withoutExtras.findIndex((column) => column.key === insertAfterKey);

  if (insertAt === -1) {
    return [...extras, ...withoutExtras];
  }

  return [
    ...withoutExtras.slice(0, insertAt + 1),
    ...extras,
    ...withoutExtras.slice(insertAt + 1),
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

function withIssuedPurposeAndProductTypeColumns<Row extends FactoryRecord>(
  columns: readonly EnterpriseTableColumn<Row>[],
): readonly EnterpriseTableColumn<Row>[] {
  const purposeColumn: EnterpriseTableColumn<Row> = {
    key: "issuePurpose",
    label: "Issued For",
  };
  const productTypeColumn: EnterpriseTableColumn<Row> = {
    key: "productType",
    label: "Product Type",
    renderCell: (row: Row) => splicingProductTypeLabel(row),
  };
  const withoutPurpose = columns.filter(
    (column) =>
      column.key !== purposeColumn.key &&
      column.key !== productTypeColumn.key &&
      column.key !== "finishedType" &&
      column.key !== "orderType",
  );
  const groupNoIndex = withoutPurpose.findIndex(
    (column) => column.key === "groupNo",
  );

  if (groupNoIndex === -1) {
    return [purposeColumn, productTypeColumn, ...withoutPurpose];
  }

  return [
    ...withoutPurpose.slice(0, groupNoIndex + 1),
    purposeColumn,
    productTypeColumn,
    ...withoutPurpose.slice(groupNoIndex + 1),
  ];
}

export function applySplicingListingColumns<Row extends FactoryRecord>(
  columns: readonly EnterpriseTableColumn<Row>[],
  activeTab: FactoryProcessTab,
): readonly EnterpriseTableColumn<Row>[] {
  const withoutSharedHiddenColumns = columns.filter(
    (column) => column.key !== "storageSrNo" && column.key !== "groupingDate",
  );
  const withBatchAndColor = withSplicingBatchNoAndColorColumns(
    withoutSharedHiddenColumns,
  );
  const withIssuedPurpose = withIssuedPurposeAndProductTypeColumns(
    withBatchAndColor,
  );

  if (activeTab === "issued") {
    return withAvailableFactoryMeasureColumns(
      withOrderColumnsBeforeItem(
        withSplicingIssuedLeafColumns(withIssuedPurpose),
      ),
    );
  }

  if (activeTab !== "done") {
    return activeTab === "rejected"
      ? withIssuedPurpose.map((column) =>
          column.key === "issuedDate"
            ? {
                ...column,
                label: "Rejected Date",
                renderCell: (row: Row) =>
                  formatSplicingDate(
                    row.rejectedDate ??
                      row.rejectedAt ??
                      row.processDate ??
                      row.issuedDate,
                  ),
              }
            : column,
        )
      : withIssuedPurpose;
  }

  const withoutHiddenColumns = withIssuedPurpose.filter(
    (column) => !splicingDoneHiddenKeys.has(column.key),
  );

  return withOrderColumnsBeforeItem(withoutHiddenColumns);
}
