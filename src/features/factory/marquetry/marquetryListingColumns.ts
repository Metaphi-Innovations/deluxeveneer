import type { EnterpriseTableColumn } from "../../../components/data-display/EnterpriseDataTable";
import type { FactoryProcessTab } from "../shared/factoryUtils";
import type { FactoryRecord } from "../shared/types";

const marquetryWarehouseOmittedKeys = new Set([
  "amount",
  "customerName",
  "for",
  "issuedFor",
  "orderDate",
  "orderItemNo",
  "orderNo",
]);

export function applyMarquetryListingColumns<Row extends FactoryRecord>(
  columns: readonly EnterpriseTableColumn<Row>[],
  activeTab: FactoryProcessTab,
): EnterpriseTableColumn<Row>[] {
  const withoutStorageNo = columns.filter(
    (column) => column.key !== "storageSrNo" && column.key !== "storageSerialNumber",
  );
  const issuedDateIndex = withoutStorageNo.findIndex(
    (column) => column.key === "issuedDate" || column.key === "issueDate",
  );
  const withGroupNo = withoutStorageNo.some((column) => column.key === "groupNo")
    ? withoutStorageNo
    : issuedDateIndex === -1
      ? [{ key: "groupNo", label: "Group No" }, ...withoutStorageNo]
      : [
          ...withoutStorageNo.slice(0, issuedDateIndex + 1),
          { key: "groupNo", label: "Group No" },
          ...withoutStorageNo.slice(issuedDateIndex + 1),
        ];

  if (activeTab === "done") {
    return withGroupNo.filter(
      (column) =>
        column.key !== "issuedDate" &&
        column.key !== "issueDate" &&
        column.key !== "issuedFor" &&
        column.key !== "amount",
    );
  }

  if (activeTab === "history" || activeTab === "rejected") {
    return withGroupNo.filter(
      (column) =>
        column.key !== "issuedFor" &&
        column.key !== "amount",
    );
  }

  if (activeTab !== "issued") {
    return withGroupNo;
  }

  return withGroupNo.filter((column) => !marquetryWarehouseOmittedKeys.has(column.key));
}
