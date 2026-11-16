import { Navigate, useParams, useSearchParams } from "react-router";

import { ApiInwardEditForm } from "../../../warehouses/pages/ApiInwardEditForm";
import { ApiInwardViewForm } from "../../../warehouses/pages/ApiInwardViewForm";
import { InventoryForm } from "../../shared";
import { consumablesDefinition } from "../consumablesDefinition";

export function ConsumablesListPage() {
  return <Navigate replace to="/warehouses/consumables" />;
}

export function AddConsumablesPage() {
  return <InventoryForm definition={consumablesDefinition} mode="add" />;
}

export function EditConsumablesPage() {
  return <ConsumablesRecordPage mode="edit" />;
}

export function ViewConsumablesPage() {
  return <ConsumablesRecordPage mode="view" />;
}

function ConsumablesRecordPage({ mode }: { mode: "view" | "edit" }) {
  const params = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const warehouseId =
    searchParams.get("warehouseId")?.trim() ||
    "d5c832f8-11d6-408d-a5fa-e3b185b52d7e";
  const warehouseName =
    searchParams.get("warehouseName")?.trim() || "Consumables Warehouse";
  const returnTo = searchParams.get("returnTo");
  const recordId = params.id?.trim() || "";

  if (recordId) {
    const listPath =
      returnTo?.startsWith("/") ? returnTo : "/warehouses/consumables";
    const warehouseRootPath = "/warehouses/consumables";

    if (mode === "view") {
      const editUrl = new URL(
        `/inventory/consumables/edit/${recordId}`,
        window.location.origin,
      );
      editUrl.searchParams.set("warehouseId", warehouseId);
      editUrl.searchParams.set("warehouseName", warehouseName);
      editUrl.searchParams.set("returnTo", listPath);
      const editPath = `${editUrl.pathname}?${editUrl.searchParams.toString()}`;

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

  return <Navigate replace to="/warehouses/consumables" />;
}
