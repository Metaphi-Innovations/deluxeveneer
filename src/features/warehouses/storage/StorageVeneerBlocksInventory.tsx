import { EnterpriseDataTable } from "../../../components/data-display/EnterpriseDataTable";
import type { StorageInventoryPanelProps } from "./types";

/**
 * Storage Veneer Blocks inventory panel.
 * Keep this file isolated so API/columns work can merge independently.
 */
export function StorageVeneerBlocksInventory({
  section,
}: StorageInventoryPanelProps) {
  const emptyLabel =
    section === "history"
      ? "No veneer blocks history records are available."
      : "No veneer blocks inventory records are available.";

  return (
    <EnterpriseDataTable
      columns={[]}
      rows={[]}
      defaultRowsPerPage={10}
      emptyStateLabel={emptyLabel}
    />
  );
}
