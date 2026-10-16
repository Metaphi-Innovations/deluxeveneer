import { availableFactoryMeasures } from "../shared/factoryAvailableMeasures";
import {
  getAvailableGroupedSheets,
  getReceivedGroupedLeaves,
} from "../shared/groupedStockIssueStore";
import type { FactoryRecord } from "../shared/types";

function textValue(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : "";
}

function groupingIssuedIdentityFields<Row extends FactoryRecord>(row: Row) {
  const itemName = textValue(row.itemName) || textValue(row.productName);
  const subCategory = textValue(row.subCategory) || textValue(row.itemSubCategory);
  const thickness = textValue(row.thickness) || textValue(row.height);
  const height = textValue(row.height) || thickness;
  const factoryCode = textValue(row.factoryCode);
  const currency = textValue(row.currency);

  return {
    ...(itemName ? { itemName } : {}),
    ...(subCategory ? { subCategory, itemSubCategory: subCategory } : {}),
    ...(thickness ? { thickness } : {}),
    ...(height ? { height } : {}),
    ...(factoryCode ? { factoryCode } : {}),
    ...(currency ? { currency } : {}),
  };
}

export function mapGroupingListingRow<Row extends FactoryRecord>(
  row: Row,
  activeTab: string,
): Row {
  const currentIssueTo = row.issueTo || row.for || "Order";
  const issuedIdentity =
    activeTab === "issued" ? groupingIssuedIdentityFields(row) : {};
  const showLeafBalance =
    activeTab === "done" || activeTab === "history" || activeTab === "rejected";
  const receivedLeaves = showLeafBalance ? getReceivedGroupedLeaves(row) : 0;
  const availableLeaves = showLeafBalance ? getAvailableGroupedSheets(row) : 0;

  return {
    ...row,
    ...issuedIdentity,
    groupPhoto:
      row.groupPhoto ||
      "https://images.unsplash.com/photo-1546484475-7f7bd55792da?auto=format&fit=crop&w=400&q=80",
    issueTo: currentIssueTo,
    ...(showLeafBalance
      ? {
          receivedNoOfLeaves: String(receivedLeaves),
          availableNoOfLeaves: String(availableLeaves),
          ...availableFactoryMeasures(row, receivedLeaves, availableLeaves),
        }
      : {}),
    for: currentIssueTo,
    forLabel: currentIssueTo,
  } as Row;
}
