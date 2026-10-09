import {
  EnterpriseDataTable,
  type EnterpriseTableAction,
  type EnterpriseTableColumn,
} from "../../../../components/data-display/EnterpriseDataTable";
import type { WarehouseInventoryRow } from "../../shared/warehouseTableData";

export function WarehouseBInspectionTable({
  actions,
  activeInspectionTab,
  canView,
  columns,
  rows,
}: {
  actions: ReadonlyArray<EnterpriseTableAction<WarehouseInventoryRow>>;
  activeInspectionTab: "pending" | "done";
  canView: boolean;
  columns: readonly EnterpriseTableColumn<WarehouseInventoryRow>[];
  rows: readonly WarehouseInventoryRow[];
}) {
  return (
    <EnterpriseDataTable
      key={`warehouse-b-inspection-${activeInspectionTab}`}
      actions={actions}
      columns={columns}
      defaultRowsPerPage={10}
      initialSort={{ key: "inwardDate", direction: "desc" }}
      rows={
        activeInspectionTab === "pending"
          ? canView
            ? rows
            : []
          : canView
            ? rows
            : []
      }
    />
  );
}
