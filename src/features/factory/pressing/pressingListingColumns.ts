import type { EnterpriseTableColumn } from "../../../components/data-display/EnterpriseDataTable";
import { withAvailableFactoryMeasureColumns } from "../shared/factoryAvailableMeasures";
import { isSampleFactoryRow } from "../shared/sampleSheetIdentityStore";
import type { FactoryProcessTab } from "../shared/factoryUtils";
import type { FactoryRecord } from "../shared/types";

function pressingProductTypeLabel(row: FactoryRecord) {
  if (isSampleFactoryRow(row)) {
    return "-";
  }

  const value = String(
    row.productType || row.finishedType || row.orderType || "",
  ).trim();
  if (!value || value.toLowerCase().includes("sample")) {
    return "-";
  }

  return value;
}

const pressingHiddenKeys = new Set([
  "amount",
  "color",
  "colour",
  "consumedAmount",
  "cut",
  "cutColor",
  "issuedFrom",
  "issuedFor",
  "rate",
  "ratePerSqf",
  "processColor",
  "warehouseName",
]);

function withPressingLotAndBatchColumns<Row extends FactoryRecord>(
  columns: readonly EnterpriseTableColumn<Row>[],
): EnterpriseTableColumn<Row>[] {
  const extras: readonly EnterpriseTableColumn<Row>[] = [
    {
      key: "logNo",
      label: "Lot No",
      renderCell: (row: Row) =>
        String(
          (row as Record<string, unknown>).logNo ||
            (row as Record<string, unknown>).logCode ||
            "-",
        ),
    },
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
  ];
  const withoutExtras = columns.filter(
    (column) => !extras.some((extra) => extra.key === column.key),
  );
  const insertAfterKey = withoutExtras.some(
    (column) => column.key === "itemSubCategory",
  )
    ? "itemSubCategory"
    : withoutExtras.some((column) => column.key === "itemName")
      ? "itemName"
      : null;

  if (!insertAfterKey) {
    return [...extras, ...withoutExtras];
  }

  const insertAt = withoutExtras.findIndex(
    (column) => column.key === insertAfterKey,
  );
  return [
    ...withoutExtras.slice(0, insertAt + 1),
    ...extras,
    ...withoutExtras.slice(insertAt + 1),
  ];
}

function withPressingProductTypeColumn<Row extends FactoryRecord>(
  columns: readonly EnterpriseTableColumn<Row>[],
): readonly EnterpriseTableColumn<Row>[] {
  const productTypeColumn: EnterpriseTableColumn<Row> = {
    key: "productType",
    label: "Product Type",
    renderCell: (row: Row) => pressingProductTypeLabel(row),
  };
  const withoutProductType = columns.filter(
    (column) =>
      column.key !== productTypeColumn.key &&
      column.key !== "finishedType" &&
      column.key !== "orderType",
  );
  const insertAfterKey = withoutProductType.some((column) => column.key === "for")
    ? "for"
    : withoutProductType.some((column) => column.key === "groupNo")
      ? "groupNo"
      : null;

  if (!insertAfterKey) {
    return [productTypeColumn, ...withoutProductType];
  }

  const insertAt = withoutProductType.findIndex(
    (column) => column.key === insertAfterKey,
  );
  return [
    ...withoutProductType.slice(0, insertAt + 1),
    productTypeColumn,
    ...withoutProductType.slice(insertAt + 1),
  ];
}

export function applyPressingListingColumns<Row extends FactoryRecord>(
  columns: readonly EnterpriseTableColumn<Row>[],
  activeTab: FactoryProcessTab,
): readonly EnterpriseTableColumn<Row>[] {
  const visibleColumns = withPressingProductTypeColumn(
    withPressingLotAndBatchColumns(
      columns.filter(
        (column) =>
          !pressingHiddenKeys.has(column.key) &&
          column.key !== "storageSrNo" &&
          column.key !== "storageSerialNumber",
      ),
    ),
  );
  const pressingIdColumn: EnterpriseTableColumn<Row> = {
    key: "pressingId",
    label: "Pressing ID",
    renderCell: (row) => {
      const value = row.pressingId ?? row.pressingProcessId ?? row.id;
      return value === null ||
        value === undefined ||
        String(value).trim() === ""
        ? "-"
        : String(value);
    },
  };

  const withReceivedAndAvailable = (
    targetColumns: readonly EnterpriseTableColumn<Row>[],
  ) => {
    const withReceivedSheets = targetColumns.map((column) =>
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
  };

  if (activeTab === "issued") {
    return withReceivedAndAvailable(
      visibleColumns.filter((column) => column.key !== "pressingId"),
    );
  }

  if (activeTab !== "done" && activeTab !== "history") {
    return visibleColumns.filter((column) => column.key !== "pressingId");
  }

  const withPressingId = visibleColumns.some(
    (column) => column.key === "pressingId",
  )
    ? visibleColumns.map((column) =>
        column.key === "pressingId" ? pressingIdColumn : column,
      )
    : [pressingIdColumn, ...visibleColumns];

  if (activeTab === "done") {
    return withReceivedAndAvailable(withPressingId);
  }

  return withPressingId;
}
