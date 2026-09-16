import { Navigate } from "react-router";

import { InventoryForm, veneerBlocksDefinition } from "../../shared";

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
  return <InventoryForm definition={veneerBlocksDefinition} mode="edit" />;
}

export function ViewVeneerBlocksPage() {
  return <InventoryForm definition={veneerBlocksDefinition} mode="view" />;
}
