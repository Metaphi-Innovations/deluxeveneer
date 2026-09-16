import { Navigate } from "react-router";

import { InventoryForm, consumablesDefinition } from "../../shared";

export function ConsumablesListPage() {
  return (
    <Navigate
      replace
      to="/warehouse-a?inventory=consumables"
    />
  );
}

export function AddConsumablesPage() {
  return <InventoryForm definition={consumablesDefinition} mode="add" />;
}

export function EditConsumablesPage() {
  return <InventoryForm definition={consumablesDefinition} mode="edit" />;
}

export function ViewConsumablesPage() {
  return <InventoryForm definition={consumablesDefinition} mode="view" />;
}
