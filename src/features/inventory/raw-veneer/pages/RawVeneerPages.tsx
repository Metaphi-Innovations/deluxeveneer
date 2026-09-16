import { Navigate } from "react-router";

import { InventoryForm, rawVeneerDefinition } from "../../shared";

export function RawVeneerListPage() {
  return (
    <Navigate
      replace
      to="/warehouse-b?section=inventory&inventory=raw-veneer"
    />
  );
}

export function AddRawVeneerPage() {
  return <InventoryForm definition={rawVeneerDefinition} mode="add" />;
}

export function EditRawVeneerPage() {
  return <InventoryForm definition={rawVeneerDefinition} mode="edit" />;
}

export function ViewRawVeneerPage() {
  return <InventoryForm definition={rawVeneerDefinition} mode="view" />;
}
