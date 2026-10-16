import type { EnterpriseTableColumn } from "../../../components/data-display/EnterpriseDataTable";
import { parseNumericValue } from "../../shared/numberFormat";
import { formatSlicingDecimal } from "./slicingAreaCalculation";
import type { FactoryRecord } from "./types";

const availableCountKeys = new Set([
  "availableLeaves",
  "availableNoOfLeaves",
  "availableQty",
  "availableSheets",
]);

const measureColumns = [
  { availableKey: "availableSqm", availableLabel: "Available SQM", receivedLabel: "Received SQM", sourceKey: "sqm" },
  { availableKey: "availableSqm", availableLabel: "Available SQM", receivedLabel: "Received SQM", sourceKey: "totalSqMeter" },
  { availableKey: "availableSqf", availableLabel: "Available SQF", receivedLabel: "Received SQF", sourceKey: "sqf" },
  { availableKey: "availableCbm", availableLabel: "Available CBM", receivedLabel: "Received CBM", sourceKey: "cbm" },
  { availableKey: "availableCbf", availableLabel: "Available CBF", receivedLabel: "Received CBF", sourceKey: "cbf" },
] as const;

export function withAvailableFactoryMeasureColumns<Row extends FactoryRecord>(
  columns: readonly EnterpriseTableColumn<Row>[],
): EnterpriseTableColumn<Row>[] {
  if (!columns.some((column) => availableCountKeys.has(column.key))) {
    return [...columns];
  }

  const present = new Set(columns.map((column) => column.key));
  let next = [...columns];

  for (const measure of measureColumns) {
    if (!present.has(measure.sourceKey)) {
      continue;
    }

    const index = next.findIndex((column) => column.key === measure.sourceKey);
    const sourceColumn = index >= 0 ? next[index] : undefined;
    if (!sourceColumn) {
      continue;
    }

    next[index] = { ...sourceColumn, label: measure.receivedLabel };

    if (present.has(measure.availableKey)) {
      continue;
    }

    next = [
      ...next.slice(0, index + 1),
      { key: measure.availableKey, label: measure.availableLabel },
      ...next.slice(index + 1),
    ];
    present.add(measure.availableKey);
  }

  return next;
}

function measureNumber(value: unknown) {
  const parsed = parseNumericValue(value);
  return parsed !== null && parsed > 0 ? parsed : 0;
}

function formatMeasure(value: number) {
  return value > 0 ? formatSlicingDecimal(value, 3) : "0";
}

export function availableFactoryMeasures(
  row: Record<string, unknown>,
  receivedCount: number,
  availableCount: number,
) {
  const ratio = receivedCount > 0 ? Math.max(0, availableCount) / receivedCount : 0;
  const measures: Record<string, string> = {};
  const sources: Array<[string, unknown]> = [
    ["availableSqm", row.sqm ?? row.totalSqMeter],
    ["availableSqf", row.sqf],
    ["availableCbm", row.cbm],
    ["availableCbf", row.cbf],
  ];

  for (const [key, source] of sources) {
    if (source === undefined || source === null || String(source).trim() === "") {
      continue;
    }

    measures[key] = formatMeasure(measureNumber(source) * ratio);
  }

  return measures;
}
