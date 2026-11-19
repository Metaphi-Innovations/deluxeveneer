import type { EnterpriseTableColumn } from "../../../components/data-display/EnterpriseDataTable";
import { withAvailableFactoryMeasureColumns } from "../shared/factoryAvailableMeasures";
import type { FactoryProcessTab } from "../shared/factoryUtils";
import type { FactoryRecord } from "../shared/types";

const flutingHiddenOutsideHistory = new Set(["warehouseName"]);
const flutingHiddenKeys = new Set([
  "amount",
  "issuedFrom",
  "issuedFor",
  "rate",
  "ratePerSqf",
]);

function readFlutingIdentityValue(
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

function withFlutingIdentityColumns<Row extends FactoryRecord>(
  columns: readonly EnterpriseTableColumn<Row>[],
): readonly EnterpriseTableColumn<Row>[] {
  const extras: readonly EnterpriseTableColumn<Row>[] = [
    {
      key: "logNo",
      label: "Lot No",
      renderCell: (row: Row) => readFlutingIdentityValue(row, ["logNo", "logCode"]),
    },
    {
      key: "batchNo",
      label: "Batch No",
      renderCell: (row: Row) =>
        readFlutingIdentityValue(row, ["batchNo", "batchNoCode"]),
    },
    {
      key: "bundleNumber",
      label: "Bundle No",
      renderCell: (row: Row) =>
        readFlutingIdentityValue(row, ["bundleNumber", "bundleNo"]),
    },
    {
      key: "palletNo",
      label: "Pallet No",
      renderCell: (row: Row) =>
        readFlutingIdentityValue(row, ["palletNo", "palletNumber"]),
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

function withFlutingReceivedAvailableColumns<Row extends FactoryRecord>(
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

export function applyCncFlutingListingColumns<Row extends FactoryRecord>(
  columns: readonly EnterpriseTableColumn<Row>[],
  activeTab: FactoryProcessTab,
): readonly EnterpriseTableColumn<Row>[] {
  const visibleColumns = withFlutingIdentityColumns(
    columns
      .filter((column) => {
        if (column.key === "storageSrNo" || column.key === "storageSerialNumber") {
          return false;
        }

        if (column.key === "designCode") {
          return false;
        }

        if (flutingHiddenKeys.has(column.key)) {
          return false;
        }

        if (activeTab === "history" || activeTab === "rejected") {
          return true;
        }

        return !flutingHiddenOutsideHistory.has(column.key);
      })
      .map((column) =>
        column.key === "structureCode" || column.key === "structuredCode"
          ? {
              ...column,
              key: "structureCode",
              label: "Structured Code",
              renderCell: (row: Row) =>
                String(
                  (row as Record<string, unknown>).structureCode ||
                    (row as Record<string, unknown>).structuredCode ||
                    (row as Record<string, unknown>).designCode ||
                    "-",
                ),
            }
          : column,
      ),
  );

  // Issued / Done / History / Rejected all keep Lot, Batch, Bundle, Pallet.
  if (
    activeTab === "issued" ||
    activeTab === "done" ||
    activeTab === "history" ||
    activeTab === "rejected"
  ) {
    if (activeTab === "issued" || activeTab === "done") {
      return withFlutingReceivedAvailableColumns(visibleColumns);
    }
    return visibleColumns;
  }

  return visibleColumns;
}
