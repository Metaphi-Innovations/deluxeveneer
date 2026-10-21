import type { EnterpriseTableColumn } from "../../../components/data-display/EnterpriseDataTable";
import type { FactoryProcessTab } from "../shared/factoryUtils";
import type { FactoryRecord } from "../shared/types";

const pressingHiddenKeys = new Set([
  "amount",
  "color",
  "colour",
  "consumedAmount",
  "cut",
  "cutColor",
  "issuedFrom",
  "issuedFor",
  "rate",
  "ratePerSqf",
  "processColor",
  "warehouseName",
]);

export function applyPressingListingColumns<Row extends FactoryRecord>(
  columns: readonly EnterpriseTableColumn<Row>[],
  activeTab: FactoryProcessTab,
): readonly EnterpriseTableColumn<Row>[] {
  const visibleColumns = columns.filter(
    (column) =>
      !pressingHiddenKeys.has(column.key) &&
      column.key !== "storageSrNo" &&
      column.key !== "storageSerialNumber",
  );
  const pressingIdColumn: EnterpriseTableColumn<Row> = {
    key: "pressingId",
    label: "Pressing ID",
    renderCell: (row) => {
      const value = row.pressingId ?? row.pressingProcessId ?? row.id;
      return value === null || value === undefined || String(value).trim() === ""
        ? "-"
        : String(value);
    },
  };

  if (activeTab !== "done" && activeTab !== "history") {
    return visibleColumns.filter((column) => column.key !== "pressingId");
  }

  if (visibleColumns.some((column) => column.key === "pressingId")) {
    return visibleColumns.map((column) =>
      column.key === "pressingId" ? pressingIdColumn : column,
    );
  }

  return [
    pressingIdColumn,
    ...visibleColumns,
  ];
}
