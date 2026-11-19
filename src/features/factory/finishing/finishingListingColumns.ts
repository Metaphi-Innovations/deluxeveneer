import type { EnterpriseTableColumn } from "../../../components/data-display/EnterpriseDataTable";
import { withAvailableFactoryMeasureColumns } from "../shared/factoryAvailableMeasures";
import type { FactoryProcessTab } from "../shared/factoryUtils";
import type { FactoryRecord } from "../shared/types";

const finishingHiddenOutsideHistory = new Set(["warehouseName", "issuedFor"]);
const finishingHiddenKeys = new Set([
  "amount",
  "rate",
  "ratePerSqf",
]);

const finishingIssuedCodeColumns: readonly EnterpriseTableColumn<FactoryRecord>[] =
  [
    { key: "designCode", label: "Design Code" },
    { key: "structureCode", label: "Structure Code" },
  ];

function readFinishingIdentityValue(
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

function withFinishingIdentityColumns<Row extends FactoryRecord>(
  columns: readonly EnterpriseTableColumn<Row>[],
): readonly EnterpriseTableColumn<Row>[] {
  const extras: readonly EnterpriseTableColumn<Row>[] = [
    {
      key: "logNo",
      label: "Lot No",
      renderCell: (row: Row) =>
        readFinishingIdentityValue(row, ["logNo", "logCode"]),
    },
    {
      key: "batchNo",
      label: "Batch No",
      renderCell: (row: Row) =>
        readFinishingIdentityValue(row, ["batchNo", "batchNoCode"]),
    },
    {
      key: "bundleNumber",
      label: "Bundle No",
      renderCell: (row: Row) =>
        readFinishingIdentityValue(row, ["bundleNumber", "bundleNo"]),
    },
    {
      key: "palletNo",
      label: "Pallet No",
      renderCell: (row: Row) =>
        readFinishingIdentityValue(row, ["palletNo", "palletNumber"]),
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

export function applyFinishingListingColumns<Row extends FactoryRecord>(
  columns: readonly EnterpriseTableColumn<Row>[],
  activeTab: FactoryProcessTab,
): readonly EnterpriseTableColumn<Row>[] {
  const visible = withFinishingIdentityColumns(
    columns.filter((column) => {
      if (column.key === "storageSrNo" || column.key === "storageSerialNumber") {
        return false;
      }

      if (finishingHiddenKeys.has(column.key)) {
        return false;
      }

      if (activeTab === "history" || activeTab === "rejected") {
        return true;
      }

      return !finishingHiddenOutsideHistory.has(column.key);
    }),
  );

  if (activeTab === "issued") {
    const withCodes = insertColumnsAfter(
      visible,
      "palletNo",
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
    const withFinishingType = insertColumnsAfter(visible, "palletNo", [
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

  if (activeTab === "history" || activeTab === "rejected") {
    return insertColumnsAfter(visible, "palletNo", [
      { key: "finishingType", label: "Finishing Type" },
    ]);
  }

  return visible;
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
