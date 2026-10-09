import {
  getAvailableGroupedSheets,
  getOriginalGroupedSheets,
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
  const available = getAvailableGroupedSheets(row);
  const original = getOriginalGroupedSheets(row);
  const currentIssueTo = row.issueTo || row.for || "Order";
  const issuedIdentity =
    activeTab === "issued" ? groupingIssuedIdentityFields(row) : {};

  return {
    ...row,
    ...issuedIdentity,
    groupPhoto:
      row.groupPhoto ||
      "https://images.unsplash.com/photo-1546484475-7f7bd55792da?auto=format&fit=crop&w=400&q=80",
    issueTo: currentIssueTo,
    availableSheets: activeTab === "done" ? String(available) : row.availableSheets,
    noOfSheets: activeTab === "done" ? String(original) : row.noOfSheets,
    for: currentIssueTo,
    forLabel: currentIssueTo,
  } as Row;
}
