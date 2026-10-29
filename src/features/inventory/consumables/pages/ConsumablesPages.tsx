import { Navigate } from "react-router";

import { InventoryForm } from "../../shared";
import { consumablesDefinition } from "../consumablesDefinition";

export function ConsumablesListPage() {
  return <Navigate replace to="/dashboard" />;
}

export function AddConsumablesPage() {
  return <InventoryForm definition={consumablesDefinition} mode="add" />;
}

export function EditConsumablesPage() {
  return <Navigate replace to="/dashboard" />;
}

export function ViewConsumablesPage() {
  return <Navigate replace to="/dashboard" />;
}
