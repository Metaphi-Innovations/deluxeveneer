import { EnterpriseDataTable } from "../../../components/data-display/EnterpriseDataTable";
import type { StorageInventoryPanelProps } from "./types";

/**
 * Storage MDF inventory panel.
 * Keep this file isolated so API/columns work can merge independently.
 */
export function StorageMdfInventory({ section }: StorageInventoryPanelProps) {
  const emptyLabel =
    section === "history"
      ? "No MDF history records are available."
      : "No MDF inventory records are available.";

  return (
    <EnterpriseDataTable
      columns={[]}
      rows={[]}
      defaultRowsPerPage={10}
      emptyStateLabel={emptyLabel}
    />
  );
}
