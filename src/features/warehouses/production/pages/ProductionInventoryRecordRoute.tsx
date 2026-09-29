import { Alert } from "@mui/material";
import { useParams, useSearchParams } from "react-router";

import { InventoryPageShell } from "../../../inventory/shared/InventoryPageShell";
import { getInventoryPaths } from "../../../inventory/shared/inventoryUtils";
import { canAccessPermission } from "../../../permissions";
import { getDynamicWarehousePermissionKey } from "../../../shared/warehousePermission";
import { isProductionInventorySearch } from "../productionInventoryPaths";
import { ProductionInventoryRecordPage } from "./ProductionInventoryRecordPage";

type ProductionInventorySlug = "raw-veneer" | "plywood" | "mdf";

interface ProductionInventoryRecordRouteProps {
  mode: "view" | "edit";
  inventorySlug: ProductionInventorySlug;
}

/**
 * Renders production view/edit when the URL is production-scoped.
 * Returns null when the caller should fall through to inward/legacy forms.
 */
export function ProductionInventoryRecordRoute({
  mode,
  inventorySlug,
}: ProductionInventoryRecordRouteProps) {
  const params = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const recordId = params.id?.trim() || "";
  const warehouseId = searchParams.get("warehouseId")?.trim() || "";
  const warehouseName =
    searchParams.get("warehouseName")?.trim() || "Warehouse";
  const returnTo = searchParams.get("returnTo");

  if (!recordId || !isProductionInventorySearch(searchParams)) {
    return null;
  }

  const listPath =
    returnTo?.startsWith("/")
      ? returnTo
      : warehouseId
        ? `/warehouses/${warehouseId}?inventory=${inventorySlug}`
        : `/warehouse-c?section=inventory&inventory=${inventorySlug}`;
  const warehouseRootPath = warehouseId
    ? `/warehouses/${warehouseId}`
    : "/warehouse-c";

  if (warehouseId) {
    const warehousePermissionKey =
      getDynamicWarehousePermissionKey(warehouseId);
    const canOpen =
      (mode === "view" &&
        canAccessPermission(warehousePermissionKey, "view")) ||
      (mode === "edit" &&
        canAccessPermission(warehousePermissionKey, "edit"));

    if (!canOpen) {
      return (
        <InventoryPageShell
          breadcrumbs={[
            { label: "Warehouses" },
            { label: warehouseName, to: warehouseRootPath },
            { label: mode === "edit" ? "Edit" : "View" },
          ]}
          title={
            mode === "edit" ? "Edit Production Stock" : "View Production Stock"
          }
        >
          <Alert severity="warning">
            You do not have permission to {mode} this production record.
          </Alert>
        </InventoryPageShell>
      );
    }
  }

  const editUrl = new URL(
    getInventoryPaths(inventorySlug, "issued", "warehouse-c").edit(recordId),
    window.location.origin,
  );
  editUrl.searchParams.set("warehouse", "warehouse-c");
  if (warehouseId) editUrl.searchParams.set("warehouseId", warehouseId);
  editUrl.searchParams.set("warehouseName", warehouseName);
  editUrl.searchParams.set("returnTo", listPath);
  editUrl.searchParams.set("source", "production");
  const editPath = `${editUrl.pathname}?${editUrl.searchParams.toString()}`;

  return (
    <ProductionInventoryRecordPage
      inventoryId={recordId}
      inventorySlug={inventorySlug}
      listPath={listPath}
      mode={mode}
      warehouseId={warehouseId}
      warehouseName={warehouseName}
      warehouseRootPath={warehouseRootPath}
      {...(mode === "view" ? { editPath } : {})}
    />
  );
}
