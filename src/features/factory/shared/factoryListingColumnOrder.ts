import type { EnterpriseTableColumn } from "../../../components/data-display/EnterpriseDataTable";
import type { FactoryRecord } from "./types";

const measurementKeyOrder = [
  "length",
  "width",
  "thickness",
  "thickess",
  "height",
  "noOfSheets",
  "issuedNoOfSheets",
  "outputNoOfSheets",
  "receivedNoOfSheets",
  "receivedSheets",
  "availableNoOfSheets",
  "availableSheets",
  "noOfLeaves",
  "issuedNoOfLeaves",
  "receivedNoOfLeaves",
  "receivedLeaves",
  "availableNoOfLeaves",
  "availableLeaves",
  "sqm",
  "totalSqm",
  "totalSqMeter",
  "issuedSqm",
  "outputSqm",
  "receivedSqm",
  "availableSqm",
  "sqf",
  "totalSqf",
  "issuedSqf",
  "outputSqf",
  "receivedSqf",
  "availableSqf",
] as const;

const measurementKeyRank = new Map<string, number>(
  measurementKeyOrder.map((key, index) => [key, index]),
);

/** Keeps descriptive/audit columns first and places dimensions, quantities and areas last. */
export function orderFactoryListingMeasureColumns<Row extends FactoryRecord>(
  columns: readonly EnterpriseTableColumn<Row>[],
): readonly EnterpriseTableColumn<Row>[] {
  const details: EnterpriseTableColumn<Row>[] = [];
  const trailing: EnterpriseTableColumn<Row>[] = [];
  const measures: Array<{ column: EnterpriseTableColumn<Row>; index: number; rank: number }> = [];

  columns.forEach((column, index) => {
    if (column.key === "inspectionImage") {
      trailing.push(column);
      return;
    }
    const rank = measurementKeyRank.get(column.key);
    if (rank === undefined) {
      details.push(column);
      return;
    }
    measures.push({ column, index, rank });
  });

  measures.sort((left, right) => left.rank - right.rank || left.index - right.index);
  return [...details, ...measures.map(({ column }) => column), ...trailing];
}
