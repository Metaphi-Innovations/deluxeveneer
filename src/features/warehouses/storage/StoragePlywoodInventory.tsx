import { EnterpriseDataTable } from "../../../components/data-display/EnterpriseDataTable";
import type { StorageInventoryPanelProps } from "./types";

/**
 * Storage Plywood inventory panel.
 * Keep this file isolated so API/columns work can merge independently.
 */
export function StoragePlywoodInventory({
  section,
}: StorageInventoryPanelProps) {
  const emptyLabel =
    section === "history"
      ? "No plywood history records are available."
      : "No plywood inventory records are available.";

  return (
    <EnterpriseDataTable
      columns={[]}
      rows={[]}
      defaultRowsPerPage={10}
      emptyStateLabel={emptyLabel}
    />
  );
}
