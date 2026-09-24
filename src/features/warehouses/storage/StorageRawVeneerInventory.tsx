import { EnterpriseDataTable } from "../../../components/data-display/EnterpriseDataTable";
import type { StorageInventoryPanelProps } from "./types";

/**
 * Storage Raw Veneer inventory panel.
 * Keep this file isolated so API/columns work can merge independently.
 */
export function StorageRawVeneerInventory({
  section,
}: StorageInventoryPanelProps) {
  const emptyLabel =
    section === "history"
      ? "No raw veneer history records are available."
      : "No raw veneer inventory records are available.";

  return (
    <EnterpriseDataTable
      columns={[]}
      rows={[]}
      defaultRowsPerPage={10}
      emptyStateLabel={emptyLabel}
    />
  );
}
