import { Navigate } from "react-router";

import { InventoryForm, plywoodDefinition } from "../../shared";

export function PlywoodListPage() {
  return (
    <Navigate
      replace
      to="/warehouse-b?section=inventory&inventory=plywood"
    />
  );
}

export function AddPlywoodPage() {
  return <InventoryForm definition={plywoodDefinition} mode="add" />;
}

export function EditPlywoodPage() {
  return <InventoryForm definition={plywoodDefinition} mode="edit" />;
}

export function ViewPlywoodPage() {
  return <InventoryForm definition={plywoodDefinition} mode="view" />;
}
