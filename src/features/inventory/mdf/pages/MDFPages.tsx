import { Alert } from "@mui/material";
import { Navigate, useParams, useSearchParams } from "react-router";

import { canAccessPermission } from "../../../permissions";
import { getDynamicWarehousePermissionKey } from "../../../shared/warehousePermission";
import { ApiInwardEditForm } from "../../../warehouses/pages/ApiInwardEditForm";
import { ApiInwardViewForm } from "../../../warehouses/pages/ApiInwardViewForm";
import { isProductionInventorySearch } from "../../../warehouses/production/productionInventoryPaths";
import { ProductionInventoryRecordRoute } from "../../../warehouses/production/pages/ProductionInventoryRecordRoute";
import { InventoryForm, InventoryPageShell } from "../../shared";
import { mdfDefinition } from "../mdfDefinition";
import { getInventoryPaths } from "../../shared/inventoryUtils";

export function MDFListPage() {
  return (
    <Navigate replace to="/warehouse-b?section=inventory&inventory=mdf" />
  );
}

export function AddMDFPage() {
  return <InventoryForm definition={mdfDefinition} mode="add" />;
}

export function EditMDFPage() {
  return <MDFRecordPage mode="edit" />;
}

export function ViewMDFPage() {
  return <MDFRecordPage mode="view" />;
}

function MDFRecordPage({ mode }: { mode: "view" | "edit" }) {
  const params = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const warehouseId = searchParams.get("warehouseId")?.trim() || "";
  const warehouseName =
    searchParams.get("warehouseName")?.trim() || "Warehouse";
  const returnTo = searchParams.get("returnTo");
  const recordId = params.id?.trim() || "";

  if (recordId && isProductionInventorySearch(searchParams)) {
    return (
      <ProductionInventoryRecordRoute mode={mode} inventorySlug="mdf" />
    );
  }

  if (warehouseId && recordId) {
    const warehousePermissionKey =
      getDynamicWarehousePermissionKey(warehouseId);
    const canOpen =
      (mode === "view" &&
        canAccessPermission(warehousePermissionKey, "view")) ||
      (mode === "edit" &&
        canAccessPermission(warehousePermissionKey, "edit"));

    const listPath = returnTo?.startsWith("/")
      ? returnTo
      : `/warehouses/${warehouseId}?section=inventory&inventory=mdf`;
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
      getInventoryPaths("mdf", "issued", "warehouse-a").edit(recordId),
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
          inwardId={recordId}
          listPath={listPath}
          warehouseId={warehouseId}
          warehouseName={warehouseName}
          warehouseRootPath={warehouseRootPath}
        />
      );
    }

    return (
      <ApiInwardEditForm
        inwardId={recordId}
        listPath={listPath}
        warehouseId={warehouseId}
        warehouseName={warehouseName}
        warehouseRootPath={warehouseRootPath}
      />
    );
  }

  return <InventoryForm definition={mdfDefinition} mode={mode} />;
}
