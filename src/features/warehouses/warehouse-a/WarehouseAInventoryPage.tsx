import { useState } from "react";
import { Button, Dialog, DialogActions, DialogContent, DialogTitle, Stack, Typography } from "@mui/material";
import { useSearchParams } from "react-router";

import { ModuleProcessTabs } from "../../../components/navigation/ModuleProcessTabs";
import { MasterPageShell } from "../../masters/shared";
import { canAccessPermission } from "../../permissions";
import { warehouseAInventoryConfigs, type WarehouseInventoryRow } from "../shared/warehouseTableData";
import { deleteWarehouseAInwardRow } from "../shared/warehouseAInwardStore";
import { markWarehouseQcPass } from "../shared/warehouseQcStore";
import { WarehouseAStockTable } from "./WarehouseAStockTable";
import { WarehouseQcPassDialog } from "./WarehouseQcPassDialog";
import {
  getActiveWarehouseAInventory,
  warehouseATabs,
} from "./warehouseAInventory";

export function WarehouseAInventoryPage() {
  return <WarehouseAInventoryModulePage />;
}

interface WarehouseAInventoryModulePageProps {
  warehouseName?: string;
  warehouseRootPath?: string;
}

export function WarehouseAInventoryModulePage({
  warehouseName = "Warehouse A",
  warehouseRootPath = "/warehouse-a",
}: WarehouseAInventoryModulePageProps = {}) {
  const [searchParams, setSearchParams] = useSearchParams();
  const [qcPassRow, setQcPassRow] = useState<WarehouseInventoryRow | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<WarehouseInventoryRow | null>(null);
  const activeInventory = getActiveWarehouseAInventory(searchParams.get("inventory"));
  const activeConfig = warehouseAInventoryConfigs[activeInventory];
  const canCreate = canAccessPermission("warehouseA", "create");
  const canEdit = canAccessPermission("warehouseA", "edit");
  const canView = canAccessPermission("warehouseA", "view");

  return (
    <MasterPageShell
      breadcrumbs={[{ label: warehouseName }, { label: activeConfig.title }]}
      title={warehouseName}
    >
      <Stack
        sx={(theme) => ({
          gap: theme.spacing(2),
        })}
      >
        <ModuleProcessTabs
          onChange={(value) => {
            setSearchParams({ inventory: value }, { replace: true });
          }}
          tabs={warehouseATabs}
          value={activeInventory}
        />

        <WarehouseAStockTable
          activeInventory={activeInventory}
          canCreate={canCreate}
          canEdit={canEdit}
          canView={canView}
          onQcPass={setQcPassRow}
          warehouseRootPath={warehouseRootPath}
        />
      </Stack>

      <WarehouseQcPassDialog
        onClose={() => setQcPassRow(null)}
        onSubmit={({ fileName, remark }) => {
          if (!qcPassRow) {
            return;
          }

          markWarehouseQcPass(qcPassRow, { fileName, remark });
          setQcPassRow(null);
        }}
        open={Boolean(qcPassRow)}
      />

      <Dialog
        open={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          <Typography variant="body2">
            Are you sure you want to delete inward record{" "}
            <strong>{deleteTarget?.invoiceNo || deleteTarget?.inwardSrNo || "selected record"}</strong>?
            This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setDeleteTarget(null)} variant="outlined">
            Cancel
          </Button>
          <Button
            onClick={() => {
              if (deleteTarget) {
                deleteWarehouseAInwardRow(deleteTarget.id);
                deleteWarehouseAInwardRow(deleteTarget.inventoryRecordId);
                setDeleteTarget(null);
              }
            }}
            color="error"
            variant="contained"
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </MasterPageShell>
  );
}
