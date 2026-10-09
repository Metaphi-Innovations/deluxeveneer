import {
  getAvailableGroupedSheets,
  getOriginalGroupedSheets,
} from "../shared/groupedStockIssueStore";
import type { FactoryRecord } from "../shared/types";

export function mapGroupingListingRow<Row extends FactoryRecord>(
  row: Row,
  activeTab: string,
): Row {
  const available = getAvailableGroupedSheets(row);
  const original = getOriginalGroupedSheets(row);
  const currentIssueTo = row.issueTo || row.for || "Order";

  return {
    ...row,
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
