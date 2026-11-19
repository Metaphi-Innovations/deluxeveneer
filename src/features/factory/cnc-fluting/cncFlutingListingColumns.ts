import type { EnterpriseTableColumn } from "../../../components/data-display/EnterpriseDataTable";
import { withAvailableFactoryMeasureColumns } from "../shared/factoryAvailableMeasures";
import type { FactoryProcessTab } from "../shared/factoryUtils";
import type { FactoryRecord } from "../shared/types";

const flutingAlwaysHiddenKeys = new Set(["warehouseName"]);
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

const flutingAvailableKeys = new Set([
  "availableSheets",
  "availableSqm",
  "availableSqf",
  "availableLeaves",
  "availableNoOfLeaves",
  "availableQty",
]);

function readFlutingSheetQty(row: FactoryRecord, keys: readonly string[]) {
  for (const key of keys) {
    const raw = String((row as Record<string, unknown>)[key] ?? "").trim();
    if (!raw || raw === "-") {
      continue;
    }
    return raw;
  }
  return "0";
}

function readFlutingMeasure(row: FactoryRecord, keys: readonly string[]) {
  for (const key of keys) {
    const raw = String((row as Record<string, unknown>)[key] ?? "").trim();
    if (!raw || raw === "-") {
      continue;
    }
    return raw;
  }
  return "0";
}

function withFlutingMeasureRenderers<Row extends FactoryRecord>(
  columns: readonly EnterpriseTableColumn<Row>[],
): readonly EnterpriseTableColumn<Row>[] {
  return columns.map((column) => {
    if (column.key === "receivedSheets" || column.key === "noOfSheets") {
      return {
        ...column,
        key: "receivedSheets",
        label:
          column.key === "receivedSheets" || column.label === "Received Sheets"
            ? "Received Sheets"
            : column.label,
        renderCell: (row: Row) =>
          readFlutingSheetQty(row, [
            "receivedSheets",
            "flutedSheets",
            "outputNoOfSheets",
            "noOfSheets",
            "issuedNoOfSheets",
          ]),
      };
    }

    if (column.key === "availableSheets") {
      return {
        ...column,
        renderCell: (row: Row) =>
          readFlutingSheetQty(row, [
            "availableSheets",
            "receivedSheets",
            "flutedSheets",
            "outputNoOfSheets",
            "noOfSheets",
          ]),
      };
    }

    if (column.key === "sqm" || column.key === "receivedSqm") {
      return {
        ...column,
        renderCell: (row: Row) =>
          readFlutingMeasure(row, ["receivedSqm", "sqm", "outputSqm", "totalSqm"]),
      };
    }

    if (column.key === "availableSqm") {
      return {
        ...column,
        renderCell: (row: Row) =>
          readFlutingMeasure(row, [
            "availableSqm",
            "receivedSqm",
            "sqm",
            "outputSqm",
          ]),
      };
    }

    if (column.key === "sqf" || column.key === "receivedSqf") {
      return {
        ...column,
        renderCell: (row: Row) =>
          readFlutingMeasure(row, ["receivedSqf", "sqf", "outputSqf", "totalSqf"]),
      };
    }

    if (column.key === "availableSqf") {
      return {
        ...column,
        renderCell: (row: Row) =>
          readFlutingMeasure(row, [
            "availableSqf",
            "receivedSqf",
            "sqf",
            "outputSqf",
          ]),
      };
    }

    return column;
  });
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
  const withAvailableSheets =
    receivedIndex === -1
      ? withReceivedSheets
      : [
          ...withReceivedSheets.slice(0, receivedIndex + 1),
          {
            key: "availableSheets",
            label: "Available Sheets",
          } as EnterpriseTableColumn<Row>,
          ...withReceivedSheets.slice(receivedIndex + 1),
        ];

  return withFlutingMeasureRenderers(
    withAvailableFactoryMeasureColumns(withAvailableSheets),
  );
}

function withFlutingDoneColumns<Row extends FactoryRecord>(
  columns: readonly EnterpriseTableColumn<Row>[],
): readonly EnterpriseTableColumn<Row>[] {
  const withoutAvailable = columns.filter(
    (column) => !flutingAvailableKeys.has(column.key),
  );
  const withReceivedSheets = withoutAvailable.map((column) =>
    column.key === "noOfSheets" || column.key === "receivedSheets"
      ? {
          ...column,
          key: "receivedSheets",
          label: "Received Sheets",
        }
      : column.key === "sqm"
        ? { ...column, label: "SQM" }
        : column.key === "sqf"
          ? { ...column, label: "SQF" }
          : column,
  );
  const withoutDamaged = withReceivedSheets.filter(
    (column) =>
      column.key !== "damagedSheets" &&
      column.key !== "flutingDamagedSheets" &&
      column.key !== "damagedQty",
  );
  const hasReceived = withoutDamaged.some(
    (column) => column.key === "receivedSheets",
  );
  const withReceivedColumn = hasReceived
    ? withoutDamaged
    : [
        ...withoutDamaged,
        {
          key: "receivedSheets",
          label: "Received Sheets",
        } as EnterpriseTableColumn<Row>,
      ];
  const withMeasureRenderers = withFlutingMeasureRenderers(withReceivedColumn);

  const damagedColumn: EnterpriseTableColumn<Row> = {
    key: "damagedSheets",
    label: "Damaged Qty",
    renderCell: (row: Row) =>
      readFlutingSheetQty(row, [
        "damagedSheets",
        "flutingDamagedSheets",
        "damagedQty",
      ]),
  };

  // Place Damaged Qty immediately after SQF (measure order also ranks it there).
  const sqfIndex = withMeasureRenderers.findIndex(
    (column) =>
      column.key === "sqf" ||
      column.key === "availableSqf" ||
      column.key === "receivedSqf",
  );
  if (sqfIndex === -1) {
    return [...withMeasureRenderers, damagedColumn];
  }

  return [
    ...withMeasureRenderers.slice(0, sqfIndex + 1),
    damagedColumn,
    ...withMeasureRenderers.slice(sqfIndex + 1),
  ];
}

function withFlutingHistoryDamageColumn<Row extends FactoryRecord>(
  columns: readonly EnterpriseTableColumn<Row>[],
): readonly EnterpriseTableColumn<Row>[] {
  const withoutDamage = columns.filter(
    (column) =>
      column.key !== "damagedSheets" &&
      column.key !== "flutingDamagedSheets" &&
      column.key !== "damagedQty",
  );
  const damageColumn: EnterpriseTableColumn<Row> = {
    key: "damagedSheets",
    label: "Damaged Qty",
    renderCell: (row: Row) =>
      readFlutingSheetQty(row, [
        "damagedSheets",
        "flutingDamagedSheets",
        "damagedQty",
      ]),
  };
  const sqfIndex = withoutDamage.findIndex(
    (column) => column.key === "sqf" || column.key === "receivedSqf",
  );
  return sqfIndex < 0
    ? [...withoutDamage, damageColumn]
    : [
        ...withoutDamage.slice(0, sqfIndex + 1),
        damageColumn,
        ...withoutDamage.slice(sqfIndex + 1),
      ];
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

        if (
          activeTab === "done" &&
          flutingAvailableKeys.has(column.key)
        ) {
          return false;
        }

        return !flutingAlwaysHiddenKeys.has(column.key);
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
    if (activeTab === "issued") {
      return withFlutingReceivedAvailableColumns(visibleColumns);
    }
    if (activeTab === "done") {
      return withFlutingDoneColumns(visibleColumns);
    }
    if (activeTab === "history") {
      return withFlutingHistoryDamageColumn(visibleColumns);
    }
    return visibleColumns;
  }

  return visibleColumns;
}
