import {
  EnterpriseDataTable,
  type EnterpriseTableAction,
  type EnterpriseTableColumn,
  type EnterpriseTableSortConfig,
} from "../../../../components/data-display/EnterpriseDataTable";
import type { InventoryProcessTab } from "../../../inventory/shared/inventoryUtils";
import type { InventoryRecord } from "../../../inventory/shared/types";
import type { WarehouseBRawVeneerTab } from "../../shared/warehouseTableData";

export function WarehouseBInventoryTable({
  actions,
  activeInventory,
  activeProcessTab,
  activeRawVeneerTab,
  canEdit,
  canView,
  columns,
  emptyTitle,
  initialSort,
  onSelectionChange,
  rows,
  selectionResetKey,
}: {
  actions: ReadonlyArray<EnterpriseTableAction<InventoryRecord>>;
  activeInventory: string;
  activeProcessTab: InventoryProcessTab;
  activeRawVeneerTab: WarehouseBRawVeneerTab;
  canEdit: boolean;
  canView: boolean;
  columns: readonly EnterpriseTableColumn<InventoryRecord>[];
  emptyTitle: string;
  initialSort?: EnterpriseTableSortConfig<InventoryRecord>;
  onSelectionChange: (rows: InventoryRecord[]) => void;
  rows: readonly InventoryRecord[];
  selectionResetKey: number;
}) {
  return (
    <EnterpriseDataTable
      key={`${activeInventory}-${activeRawVeneerTab}-${activeProcessTab}`}
      actions={actions}
      columns={columns}
      defaultRowsPerPage={10}
      emptyStateLabel={`No ${emptyTitle.toLowerCase()} records are available for this tab.`}
      onSelectionChange={onSelectionChange}
      rows={canView ? rows : []}
      selectionResetKey={selectionResetKey}
      selectable={activeProcessTab !== "history" && canEdit}
      {...(initialSort ? { initialSort } : {})}
    />
  );
}
