import type { EnterpriseTableColumn } from "../../../components/data-display/EnterpriseDataTable";
import type { FactoryProcessTab } from "../shared/factoryUtils";
import type { FactoryRecord } from "../shared/types";

const marquetryWarehouseOmittedKeys = new Set([
  "amount",
  "customerName",
  "for",
  "groupNo",
  "issuedFor",
  "orderDate",
  "orderItemNo",
  "orderNo",
]);

export function applyMarquetryListingColumns<Row extends FactoryRecord>(
  columns: readonly EnterpriseTableColumn<Row>[],
  activeTab: FactoryProcessTab,
): EnterpriseTableColumn<Row>[] {
  if (activeTab === "done" || activeTab === "history" || activeTab === "rejected") {
    return columns.filter(
      (column) =>
        column.key !== "groupNo" &&
        column.key !== "issuedFor" &&
        column.key !== "amount",
    );
  }

  if (activeTab !== "issued") {
    return columns.filter((column) => column.key !== "groupNo");
  }

  return columns.filter((column) => !marquetryWarehouseOmittedKeys.has(column.key));
}
