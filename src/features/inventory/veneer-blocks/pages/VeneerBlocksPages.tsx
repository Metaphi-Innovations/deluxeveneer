import { Alert } from "@mui/material";
import { Navigate, useParams, useSearchParams } from "react-router";

import { canAccessPermission } from "../../../permissions";
import { getDynamicWarehousePermissionKey } from "../../../shared/warehousePermission";
import { ApiInwardEditForm } from "../../../warehouses/pages/ApiInwardEditForm";
import { ApiInwardViewForm } from "../../../warehouses/pages/ApiInwardViewForm";
import { InventoryForm, InventoryPageShell, veneerBlocksDefinition } from "../../shared";
import { getInventoryPaths } from "../../shared/inventoryUtils";

export function VeneerBlocksListPage() {
  return (
    <Navigate
      replace
      to="/warehouse-b?section=inventory&inventory=veneer-blocks"
    />
  );
}

export function AddVeneerBlocksPage() {
  return <InventoryForm definition={veneerBlocksDefinition} mode="add" />;
}

export function EditVeneerBlocksPage() {
  return <VeneerBlocksRecordPage mode="edit" />;
}

export function ViewVeneerBlocksPage() {
  return <VeneerBlocksRecordPage mode="view" />;
}

function VeneerBlocksRecordPage({ mode }: { mode: "view" | "edit" }) {
  const params = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const warehouseId = searchParams.get("warehouseId")?.trim() || "";
  const warehouseName =
    searchParams.get("warehouseName")?.trim() || "Warehouse";
  const returnTo = searchParams.get("returnTo");
  const inwardId = params.id?.trim() || "";

  if (warehouseId && inwardId) {
    const warehousePermissionKey = getDynamicWarehousePermissionKey(warehouseId);
    const canOpen =
      (mode === "view" && canAccessPermission(warehousePermissionKey, "view")) ||
      (mode === "edit" && canAccessPermission(warehousePermissionKey, "edit"));

    const listPath =
      returnTo?.startsWith("/") ?
        returnTo
      : `/warehouses/${warehouseId}?section=inventory&inventory=veneer-blocks`;
    const warehouseRootPath = `/warehouses/${warehouseId}`;

    if (!canOpen) {
      return (
        <InventoryPageShell
          breadcrumbs={[
            { label: "Warehouses" },
            { label: warehouseName, to: warehouseRootPath },
            { label: mode === "edit" ? "Edit" : "View" },
          ]}
          title={mode === "edit" ? "Edit Stock" : "View Stock"}
        >
          <Alert severity="warning">
            You do not have permission to {mode} this inward record.
          </Alert>
        </InventoryPageShell>
      );
    }

    const editUrl = new URL(
      getInventoryPaths("veneer-blocks", "issued", "warehouse-a").edit(inwardId),
      window.location.origin,
    );
    editUrl.searchParams.set("warehouse", "warehouse-a");
    editUrl.searchParams.set("warehouseId", warehouseId);
    editUrl.searchParams.set("warehouseName", warehouseName);
    editUrl.searchParams.set("returnTo", listPath);
    const editPath = `${editUrl.pathname}?${editUrl.searchParams.toString()}`;

    if (mode === "view") {
      return (
        <ApiInwardViewForm
          editPath={editPath}
          inwardId={inwardId}
          listPath={listPath}
          warehouseId={warehouseId}
          warehouseName={warehouseName}
          warehouseRootPath={warehouseRootPath}
        />
      );
    }

    return (
      <ApiInwardEditForm
        inwardId={inwardId}
        listPath={listPath}
        warehouseId={warehouseId}
        warehouseName={warehouseName}
        warehouseRootPath={warehouseRootPath}
      />
    );
  }

  return <InventoryForm definition={veneerBlocksDefinition} mode={mode} />;
}
