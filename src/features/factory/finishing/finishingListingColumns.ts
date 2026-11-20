import type { EnterpriseTableColumn } from "../../../components/data-display/EnterpriseDataTable";
import { withAvailableFactoryMeasureColumns } from "../shared/factoryAvailableMeasures";
import type { FactoryProcessTab } from "../shared/factoryUtils";
import type { FactoryRecord } from "../shared/types";

const finishingHiddenKeys = new Set([
  "amount",
  "designCode",
  "for",
  "forLabel",
  "issuedFrom",
  "rate",
  "ratePerSqf",
]);

const finishingIssuedCodeColumns: readonly EnterpriseTableColumn<FactoryRecord>[] =
  [{ key: "structureCode", label: "Structure Code" }];

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

function isFinishingSampleRow(row: FactoryRecord) {
  if (row.isSample === true) {
    return true;
  }
  if (typeof row.sampleNo === "string" && row.sampleNo.trim()) {
    return true;
  }
  const markers = [
    row.purpose,
    row.issuePurpose,
    row.for,
    row.forLabel,
    row.pressingFor,
    row.orderType,
  ]
    .map((value) => String(value ?? "").trim().toLowerCase())
    .filter(Boolean);
  return markers.some(
    (value) => value === "sample" || value.includes("sample"),
  );
}

function getFinishingProductRouteLabel(row: FactoryRecord) {
  const candidates = [
    row.finishedType,
    row.productType,
    row.orderType,
    row.sampleProcessType,
    row.purpose,
    row.issuePurpose,
    row.issuedFrom,
    row.sourceProcess,
  ];

  for (const candidate of candidates) {
    const normalized = String(candidate ?? "").trim().toLowerCase();
    if (
      !normalized ||
      normalized === "-" ||
      normalized === "packing" ||
      normalized === "sample" ||
      normalized === "sample sheet" ||
      normalized === "order"
    ) {
      continue;
    }
    if (normalized.includes("marquetry")) {
      return "Marquetry";
    }
    if (normalized.includes("flut")) {
      return "Fluting";
    }
    if (normalized.includes("emboss")) {
      return "Embossing";
    }
    if (normalized.includes("decor")) {
      return "Decorative";
    }
  }

  return "";
}

/** Issued For: Fluting | Embossing | Decorative | Marquetry, or Sample Sheet [- route]. */
export function getFinishingIssuedForLabel(row: FactoryRecord) {
  const route = getFinishingProductRouteLabel(row);
  if (isFinishingSampleRow(row)) {
    return route ? `Sample Sheet - ${route}` : "Sample Sheet";
  }
  return route || "-";
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

function withFinishingIssuedForColumn<Row extends FactoryRecord>(
  columns: readonly EnterpriseTableColumn<Row>[],
): readonly EnterpriseTableColumn<Row>[] {
  return columns.map((column) =>
    column.key === "issuedFor"
      ? {
          ...column,
          label: "Issued For",
          renderCell: (row: Row) => getFinishingIssuedForLabel(row),
        }
      : column,
  );
}

export function applyFinishingListingColumns<Row extends FactoryRecord>(
  columns: readonly EnterpriseTableColumn<Row>[],
  activeTab: FactoryProcessTab,
): readonly EnterpriseTableColumn<Row>[] {
  const visible = withFinishingIssuedForColumn(
    withFinishingIdentityColumns(
      columns.filter((column) => {
        if (column.key === "storageSrNo" || column.key === "storageSerialNumber") {
          return false;
        }

        if (finishingHiddenKeys.has(column.key)) {
          return false;
        }

        if (column.key === "warehouseName") {
          return false;
        }

        return true;
      }),
    ),
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
    const receivedColumns = withReceivedSheets.map((column) =>
      column.key === "sqm"
        ? { ...column, label: "Received SQM" }
        : column.key === "sqf"
          ? { ...column, label: "Received SQF" }
          : column,
    );
    return insertColumnsAfter(receivedColumns, "receivedSheets", [
      {
        key: "damagedSheets",
        label: "Damage Qty",
        renderCell: (row: FactoryRecord) =>
          String(row.finishingDamagedSheets ?? row.damagedSheets ?? "0"),
      },
    ]);
  }

  if (activeTab === "history" || activeTab === "rejected") {
    const withFinishingType = insertColumnsAfter(visible, "palletNo", [
      { key: "finishingType", label: "Finishing Type" },
    ]);
    if (activeTab === "history") {
      return insertColumnsAfter(withFinishingType, "noOfSheets", [
        {
          key: "damagedSheets",
          label: "Damage Qty",
          renderCell: (row: FactoryRecord) =>
            String(row.finishingDamagedSheets ?? row.damagedSheets ?? "0"),
        },
      ]);
    }
    return withFinishingType;
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
