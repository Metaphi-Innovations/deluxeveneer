import { useMemo } from "react";
import { Eye, Pencil } from "lucide-react";
import { useNavigate } from "react-router";

import {
  EnterpriseDataTable,
  type EnterpriseTableAction,
} from "../../../components/data-display/EnterpriseDataTable";
import { getInventoryPaths } from "../../inventory/shared";
import { MasterPageShell } from "../../masters/shared";
import {
  canAccessPermission,
  getWarehousePermissionKey,
} from "../../permissions";
import {
  warehouseTableConfigs,
  type WarehouseInventoryRow,
  type WarehousePageId,
} from "../shared/warehouseTableData";

interface WarehouseListingPageProps {
  warehouseId: Exclude<WarehousePageId, "warehouse-b">;
}

export function WarehouseListingPage({
  warehouseId,
}: WarehouseListingPageProps) {
  const navigate = useNavigate();
  const config = warehouseTableConfigs[warehouseId];
  const permissionKey = getWarehousePermissionKey(warehouseId);
  const canEdit = canAccessPermission(permissionKey, "edit");
  const canView = canAccessPermission(permissionKey, "view");

  const rowActions = useMemo<
    ReadonlyArray<EnterpriseTableAction<WarehouseInventoryRow>>
  >(
    () => [
      ...(canView
        ? [
            {
              id: "view",
              label: "View",
              icon: Eye,
              onSelect: (row: WarehouseInventoryRow) =>
                navigate(
                  getInventoryPaths(row.inventorySlug, "issued", warehouseId).view(
                    row.inventoryRecordId,
                  ),
                ),
            },
          ]
        : []),
      ...(canEdit
        ? [
            {
              id: "edit",
              label: "Edit",
              icon: Pencil,
              onSelect: (row: WarehouseInventoryRow) =>
                navigate(
                  getInventoryPaths(row.inventorySlug, "issued", warehouseId).edit(
                    row.inventoryRecordId,
                  ),
                ),
            },
          ]
        : []),
    ],
    [canEdit, canView, navigate, warehouseId],
  );

  return (
    <MasterPageShell
      breadcrumbs={[{ label: config.title }]}
      title={config.title}
    >
      <EnterpriseDataTable
        actions={rowActions}
        columns={config.columns}
        defaultRowsPerPage={10}
        initialSort={{ key: "inwardDate", direction: "desc" }}
        rows={canView ? config.rows : []}
      />
    </MasterPageShell>
  );
}
