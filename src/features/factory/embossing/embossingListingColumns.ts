import type { EnterpriseTableColumn } from "../../../components/data-display/EnterpriseDataTable";
import { withAvailableFactoryMeasureColumns } from "../shared/factoryAvailableMeasures";
import type { FactoryProcessTab } from "../shared/factoryUtils";
import type { FactoryRecord } from "../shared/types";

const embossingHiddenOutsideHistory = new Set(["warehouseName"]);
const embossingHiddenKeys = new Set([
  "amount",
  "issuedFrom",
  "issuedFor",
  "ratePerSqf",
]);

function readEmbossingIdentityValue(
  row: FactoryRecord,
  keys: readonly string[],
) {
  const record = row as Record<string, unknown>;
  for (const key of keys) {
    const value = String(record[key] ?? "").trim();
    if (value && value !== "-") {
      return value;
    }
  }

  const selectedBase = record.selectedBaseMaterial;
  const bases = Array.isArray(selectedBase)
    ? selectedBase
    : selectedBase && typeof selectedBase === "object"
      ? [selectedBase]
      : [];
  const primaryBase = bases[0] as Record<string, unknown> | undefined;
  if (!primaryBase) {
    return "-";
  }

  for (const key of keys) {
    const value = String(primaryBase[key] ?? "").trim();
    if (value && value !== "-") {
      return value;
    }
  }
  return "-";
}

function withEmbossingIdentityColumns<Row extends FactoryRecord>(
  columns: readonly EnterpriseTableColumn<Row>[],
): readonly EnterpriseTableColumn<Row>[] {
  const extras: readonly EnterpriseTableColumn<Row>[] = [
    {
      key: "logNo",
      label: "Lot No",
      renderCell: (row: Row) =>
        readEmbossingIdentityValue(row, ["logNo", "logCode"]),
    },
    {
      key: "batchNo",
      label: "Batch No",
      renderCell: (row: Row) =>
        readEmbossingIdentityValue(row, ["batchNo", "batchNoCode"]),
    },
    {
      key: "bundleNumber",
      label: "Bundle No",
      renderCell: (row: Row) =>
        readEmbossingIdentityValue(row, ["bundleNumber", "bundleNo"]),
    },
    {
      key: "palletNo",
      label: "Pallet No",
      renderCell: (row: Row) =>
        readEmbossingIdentityValue(row, ["palletNo", "palletNumber"]),
    },
  ];
  const withoutExtras = columns.filter(
    (column) =>
      !extras.some((extra) => extra.key === column.key) &&
      column.key !== "bundleNo" &&
      column.key !== "palletNumber" &&
      column.key !== "logCode",
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

function withEmbossingReceivedAvailableColumns<Row extends FactoryRecord>(
  columns: readonly EnterpriseTableColumn<Row>[],
): readonly EnterpriseTableColumn<Row>[] {
  const withReceivedSheets = columns.map((column) =>
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

export function applyEmbossingListingColumns<Row extends FactoryRecord>(
  columns: readonly EnterpriseTableColumn<Row>[],
  activeTab: FactoryProcessTab,
): readonly EnterpriseTableColumn<Row>[] {
  const visibleColumns = withEmbossingIdentityColumns(
    columns.filter((column) => {
      if (column.key === "storageSrNo" || column.key === "storageSerialNumber") {
        return false;
      }

      if (embossingHiddenKeys.has(column.key)) {
        return false;
      }

      if (activeTab === "history" || activeTab === "rejected") {
        return true;
      }

      return !embossingHiddenOutsideHistory.has(column.key);
    }),
  );

  if (
    activeTab === "issued" ||
    activeTab === "done" ||
    activeTab === "history" ||
    activeTab === "rejected"
  ) {
    if (activeTab === "issued" || activeTab === "done") {
      return withEmbossingReceivedAvailableColumns(visibleColumns);
    }
    return visibleColumns;
  }

  return visibleColumns;
}
